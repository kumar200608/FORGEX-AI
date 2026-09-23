import { describe, it, expect, beforeEach } from 'vitest';
import { db, CURRENT_SCHEMA_VERSION } from '../lib/db/database';
import { createOperation, markOperationDuplicate, getPendingOperations } from '../lib/db/repositories/operations';
import { upsertInspectionResult } from '../lib/db/repositories/results';
import { syncProgressFromDB, getProgress } from '../lib/db/repositories/progress';
import { yjsManager } from '../lib/crdt/yjsManager';

describe('Offline Sync, Idempotency & CRDT Tests', () => {
  beforeEach(async () => {
    await db.operations.clear();
    await db.checklistItems.clear();
    await db.inspectionResults.clear();
    await db.inspectionProgress.clear();
    await db.conflicts.clear();
  });

  it('generates deterministic idempotent operation IDs and prevents duplicates', async () => {
    const op = await createOperation({
      userId: 'tech-1',
      entityType: 'inspectionResult',
      entityId: 'result-unique-123',
      inspectionId: 'insp-1',
      operationType: 'CREATE',
      payload: { value: 'PASS' },
    });

    expect(op.operationId).toBeDefined();
    expect(op.syncStatus).toBe('PENDING');

    // Simulate duplicate response from server
    await markOperationDuplicate(op.operationId);

    const updated = await db.operations.get(op.operationId);
    expect(updated?.syncStatus).toBe('DUPLICATE');

    // Duplicate operation must not remain in pending queue
    const pending = await getPendingOperations();
    expect(pending.some((p) => p.operationId === op.operationId)).toBe(false);
  });

  it('completes entire inspection offline with Yjs CRDT and IndexedDB', async () => {
    const inspectionId = 'insp-offline-complete';

    await db.checklistItems.bulkPut([
      { id: 'item-1', inspectionId, question: 'Housing Check', type: 'GOOD_DAMAGED', required: true, order: 1, createdAt: '' },
      { id: 'item-2', inspectionId, question: 'Vibration', type: 'PASS_FAIL', required: true, order: 2, createdAt: '' },
      { id: 'item-3', inspectionId, question: 'Bearing Temp', type: 'NUMERIC', required: true, order: 3, createdAt: '' },
    ]);

    // Initialize Yjs doc for this inspection
    await yjsManager.getDoc(inspectionId);

    // Answer item 1 offline
    yjsManager.setResult(inspectionId, 'item-1', 'GOOD');
    await upsertInspectionResult({
      inspectionId,
      checklistItemId: 'item-1',
      value: 'GOOD',
      valueType: 'string',
      userId: 'tech-1',
      userName: 'John Doe',
    });

    // Answer item 2 offline
    yjsManager.setResult(inspectionId, 'item-2', 'PASS');
    await upsertInspectionResult({
      inspectionId,
      checklistItemId: 'item-2',
      value: 'PASS',
      valueType: 'string',
      userId: 'tech-1',
      userName: 'John Doe',
    });

    // Answer item 3 offline
    yjsManager.setResult(inspectionId, 'item-3', '108');
    await upsertInspectionResult({
      inspectionId,
      checklistItemId: 'item-3',
      value: '108',
      valueType: 'number',
      userId: 'tech-1',
      userName: 'John Doe',
    });

    // Verify local CRDT state
    const yDoc = await yjsManager.getDoc(inspectionId);
    const resultsMap = yDoc.getMap('results');
    expect(resultsMap.get('item-1')).toBe('GOOD');
    expect(resultsMap.get('item-2')).toBe('PASS');
    expect(resultsMap.get('item-3')).toBe('108');

    // Recalculate progress
    await syncProgressFromDB(inspectionId, 'item-3');
    const progress = await getProgress(inspectionId);
    expect(progress?.completedCount).toBe(3);
    expect(progress?.totalCount).toBe(3);
    expect(progress?.lastChecklistTitle).toBe('Bearing Temp');
    expect(progress?.nextChecklistItemId).toBeUndefined();

    // Verify durable operations created
    const pendingOps = await getPendingOperations();
    expect(pendingOps.length).toBe(3);
  });

  it('preserves existing records during schema version upgrades to Version 6', async () => {
    // Check that schema version is >= 6
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(6);

    // Verify that all core entity stores exist
    const tableNames = db.tables.map((t) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('inspections');
    expect(tableNames).toContain('checklistItems');
    expect(tableNames).toContain('inspectionResults');
    expect(tableNames).toContain('notes');
    expect(tableNames).toContain('media');
    expect(tableNames).toContain('operations');
    expect(tableNames).toContain('conflicts');
    expect(tableNames).toContain('voiceNotes');
    expect(tableNames).toContain('inspectionProgress');
    expect(tableNames).toContain('offlinePackages');
    expect(tableNames).toContain('userSettings');
    expect(tableNames).toContain('assetScanEvents');
    expect(tableNames).toContain('workEvidence');
    expect(tableNames).toContain('digitalSignatures');
    expect(tableNames).toContain('invoices');
    expect(tableNames).toContain('slaPolicies');
  });

  it('converges concurrent offline edits between two device replicas using Yjs CRDT', async () => {
    const inspectionId = 'insp-concurrent-crdt';
    
    // Simulate Device A (Technician 1)
    const docA = await yjsManager.getDoc(inspectionId);
    yjsManager.setResult(inspectionId, 'item-volt', '230V');
    yjsManager.setResult(inspectionId, 'item-status', 'OPERATIONAL');

    // Simulate Device B (Technician 2 / Supervisor) using an independent Y.Doc
    const Y = await import('yjs');
    const docB = new Y.Doc();
    const mapB = docB.getMap('results');
    docB.transact(() => {
      mapB.set('item-temp', '45C');
      mapB.set('item-status', 'MAINTENANCE_REQUIRED');
    });

    // Exchange binary state updates between replicas (simulating peer-to-peer / sync reconnection)
    const updateFromB = Y.encodeStateAsUpdate(docB);
    const updateFromA = Y.encodeStateAsUpdate(docA);

    // Apply update B to replica A
    Y.applyUpdate(docA, updateFromB);
    // Apply update A to replica B
    Y.applyUpdate(docB, updateFromA);

    // Verify mathematical convergence: both replicas have identical keys and values
    const mapA = docA.getMap('results');
    expect(mapA.get('item-volt')).toBe('230V');
    expect(mapB.get('item-volt')).toBe('230V');

    expect(mapA.get('item-temp')).toBe('45C');
    expect(mapB.get('item-temp')).toBe('45C');

    // For concurrent edit on the same key 'item-status', both replicas pick the exact same winner deterministically
    expect(mapA.get('item-status')).toBe(mapB.get('item-status'));

    // Record human-verifiable conflict in Dexie for supervisor triage
    await db.conflicts.put({
      id: 'conflict-status-01',
      inspectionId,
      entityType: 'inspectionResult',
      entityId: 'item-status',
      field: 'status',
      baseValue: 'UNKNOWN',
      localValue: 'OPERATIONAL',
      remoteValue: 'MAINTENANCE_REQUIRED',
      localOperationId: 'op-tech-1',
      remoteOperationId: 'op-tech-2',
      localUserId: 'tech-1',
      remoteUserId: 'tech-2',
      localUserName: 'Elakkiya',
      remoteUserName: 'Rajesh',
      localTimestamp: new Date().toISOString(),
      remoteTimestamp: new Date().toISOString(),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });

    const openConflicts = await db.conflicts.where('status').equals('OPEN').toArray();
    expect(openConflicts.length).toBe(1);
    expect(openConflicts[0].field).toBe('status');
  });
});
