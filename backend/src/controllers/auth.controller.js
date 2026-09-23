const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../utils/response.util');
const { auditLog } = require('../utils/auditLogger');

const register = async (req, res) => {
  try {
    const { name, email, password, publicKey } = req.body;

    if (!name || !email || !password || !publicKey) {
      return sendError(res, 'Missing required fields', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Email already in use', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        publicKey
      }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey
      }
    }, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Missing email or password', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await auditLog({ action: 'LOGIN_FAILED', metadata: { email } });
      return sendError(res, 'Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await auditLog({ userId: user.id, action: 'LOGIN_FAILED' });
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    await auditLog({ userId: user.id, action: 'LOGIN_SUCCESS' });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey
      }
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 'Login failed', 500);
  }
};

const me = async (req, res) => {
  try {
    const { id, name, email, publicKey } = req.user;
    return sendSuccess(res, { id, name, email, publicKey });
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to fetch user', 500);
  }
};

module.exports = { register, login, me };
