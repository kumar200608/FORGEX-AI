const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

let userA, userB, tokenA, tokenB, noteAId;

beforeAll(async () => {
  // Clear DB
  await prisma.auditLog.deleteMany();
  await prisma.keyEnvelope.deleteMany();
  await prisma.noteAccess.deleteMany();
  await prisma.noteIndex.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  // Create User A
  userA = await prisma.user.create({
    data: {
      name: 'User A',
      email: 'a@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      publicKey: 'PUB_KEY_A'
    }
  });
  tokenA = jwt.sign({ userId: userA.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1d' });

  // Create User B
  userB = await prisma.user.create({
    data: {
      name: 'User B',
      email: 'b@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      publicKey: 'PUB_KEY_B'
    }
  });
  tokenB = jwt.sign({ userId: userB.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1d' });

  // Create Note A
  const noteRes = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      ciphertext: 'enc_a',
      iv: 'iv_a',
      encryptedNoteKey: 'env_a'
    });
  noteAId = noteRes.body.data.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Security Requirements', () => {
  
  it('A. User A cannot access User B private note (and vice versa)', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    
    expect(res.status).toBe(404);
  });

  it('B. User B cannot modify User A note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ ciphertext: 'enc_hack' });
    
    expect(res.status).toBe(404);
  });

  it('C. User B cannot delete User A note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    
    expect(res.status).toBe(404);
  });

  it('D. Sharing grants intended access', async () => {
    // Share note A with User B
    const shareRes = await request(app)
      .post(`/api/notes/${noteAId}/share`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientUserId: userB.id,
        role: 'viewer',
        encryptedNoteKey: 'env_a_for_b'
      });
    expect(shareRes.status).toBe(201);

    // User B should now access it
    const getRes = await request(app)
      .get(`/api/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(200);
  });

  it('E. Revocation removes access', async () => {
    // Revoke B
    await request(app)
      .delete(`/api/notes/${noteAId}/share/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // B cannot access
    const res = await request(app)
      .get(`/api/notes/${noteAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('F. Invalid JWT is rejected', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('G. Expired JWT is rejected', async () => {
    const expiredToken = jwt.sign({ userId: userA.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '0s' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('H. Invalid input is rejected', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ciphertext: '' }); // missing iv and empty ciphertext
    
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('I. Login rate limiting works', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app).post('/api/auth/login').send({ email: 'fake@fake.com', password: '123' });
    }
    const res = await request(app).post('/api/auth/login').send({ email: 'fake@fake.com', password: '123' });
    expect(res.status).toBe(429);
  });

  it('J. Blind-index search works without plaintext', async () => {
    // Add index
    await request(app)
      .post(`/api/notes/search/index/${noteAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ blindIndex: 'hmac_hash_123' });
    
    // Search
    const searchRes = await request(app)
      .post('/api/notes/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ blindIndex: 'hmac_hash_123' });
    
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].id).toBe(noteAId);
  });

  it('Check key rotation bumps version and replaces owner envelope', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteAId}/rotate-key`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        ciphertext: 'new_enc_a',
        iv: 'new_iv',
        encryptedNoteKey: 'new_env_a'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.encryptionKeyVersion).toBe(2);
    expect(res.body.data.ciphertext).toBe('new_enc_a');
  });
});
