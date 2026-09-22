import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db/database';
import { createOperation } from '../lib/db/repositories/operations';
import { upsertInspectionResult } from '../lib/db/repositories/results';
import { createAuditEvent } from '../lib/db/repositories/auditEvents';
import { yjsManager } from '../lib/crdt/yjsManager';
import type {
  Inspection,
  ChecklistItem,
  Asset,
  AssetScanEvent,
  WorkEvidence,
  DigitalSignature,
  Invoice,
} from '@/types/db';

describe('Complete End-to-End Business Workflow Audit & Verification', () => {
  const issueId = 'insp-audit-e2e-001';
  const assetId = 'asset-srv-001';
  const customerId = '00000000-0000-0000-0000-000000000004'; // Bob Abd
  const adminId = '00000000-0000-0000-0000-000000000001'; // Tharun Erodde
  const supervisorId = '00000000-0000-0000-0000-000000000002'; // Abi Kumar
  const technicianId = '00000000-0000-0000-0000-000000000003'; // Elakkiya S

  beforeEach(async () => {
    await db.inspections.clear();
    await db.assets.clear();
    await db.checklistItems.clear();
    await db.inspectionResults.clear();
    await db.notes.clear();
    await db.operations.clear();
    await db.auditEvents.clear();
    await db.assetScanEvents.clear();
    await db.workEvidence.clear();
    await db.digitalSignatures.clear();
    await db.invoices.clear();
  });

  it('executes full business lifecycle from customer complaint to paid settlement', async () => {
    // ── STEP 1: Asset Registration in Authoritative Store ──────────────────
    const asset: Asset = {
      id: assetId,
      name: 'Main Chiller Compressor Unit 1',
      assetCode: 'HVAC-CHILL-01',
      location: 'Basement Mechanical Room B2',
      type: 'COMPRESSOR',
      manufacturer: 'Carrier',
      model: 'AquaForce 30XA',
      installDate: '2023-03-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.assets.put(asset);

    // ── STEP 2: Customer Creates Issue ─────────────────────────────────────
    const now = new Date().toISOString();
    const customerIssue: Inspection = {
      id: issueId,
      title: 'Chiller compressor tripping on high pressure cut-out',
      siteName: 'Main Campus Tower A',
      assetId: asset.id,
      category: 'FACILITY_TECH',
      status: 'PENDING',
      issueStatus: 'NEW',
      priority: 'HIGH',
      workflowStage: 'RAISED',
      reportedBy: 'Bob Abd',
      customerId,
      customerEmail: 'customer@company.com',
      customerPhone: '+91 98765 43210',
      customerNotes: 'AC shutting down repeatedly during afternoon peak hours',
      responseDeadline: new Date(Date.now() + 60 * 60000).toISOString(), // 1h
      resolutionDeadline: new Date(Date.now() + 480 * 60000).toISOString(), // 8h
      escalationLevel: 0,
      assignedTo: [],
      assignedAt: now,
      localVersion: 1,
      serverVersion: 0,
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    await db.inspections.put(customerIssue);

    await createAuditEvent({
      userId: customerId,
      userName: 'Bob Abd',
      inspectionId: issueId,
      entityType: 'INSPECTION',
      entityId: issueId,
      action: 'CREATED',
      field: 'title',
      afterValue: customerIssue.title,
    });

    const retrievedIssue = await db.inspections.get(issueId);
    expect(retrievedIssue?.workflowStage).toBe('RAISED');
    expect(retrievedIssue?.reportedBy).toBe('Bob Abd');

    // ── STEP 3: Admin Receives Issue & Assigns Supervisor + Technician ─────
    const assignedTime = new Date().toISOString();
    await db.inspections.update(issueId, {
      supervisorId,
      supervisorName: 'Abi Kumar',
      assignedTo: [technicianId],
      assignedAt: assignedTime,
      workflowStage: 'ASSIGNED',
      status: 'ASSIGNED',
      updatedAt: assignedTime,
      syncStatus: 'PENDING',
    });

    await createAuditEvent({
      userId: adminId,
      userName: 'Tharun Erodde',
      inspectionId: issueId,
      entityType: 'INSPECTION',
      entityId: issueId,
      action: 'ASSIGNED',
      afterValue: `Supervisor: Abi Kumar, Technician: Elakkiya S`,
    });

    const assignedIssue = await db.inspections.get(issueId);
    expect(assignedIssue?.supervisorId).toBe(supervisorId);
    expect(assignedIssue?.assignedTo).toContain(technicianId);
    expect(assignedIssue?.workflowStage).toBe('ASSIGNED');

    // ── STEP 4: Technician Scans Asset QR ──────────────────────────────────
    const scanTime = new Date().toISOString();
    const scanEvent: AssetScanEvent = {
      id: 'scan-001',
      assetId,
      inspectionId: issueId,
      scannedCode: 'HVAC-CHILL-01',
      expectedCode: 'HVAC-CHILL-01',
      isMatch: true,
      scannedBy: technicianId,
      scannerName: 'Elakkiya S',
      deviceId: 'device-tech-01',
      scannedAt: scanTime,
      syncStatus: 'PENDING',
    };
    await db.assetScanEvents.put(scanEvent);

    await db.inspections.update(issueId, {
      assetVerifiedAt: scanTime,
      assetVerifiedBy: technicianId,
      assetVerifiedCode: 'HVAC-CHILL-01',
      workflowStage: 'FIELD_WORK',
      status: 'IN_PROGRESS',
      updatedAt: scanTime,
    });

    const verifiedInsp = await db.inspections.get(issueId);
    expect(verifiedInsp?.assetVerifiedCode).toBe('HVAC-CHILL-01');
    expect(verifiedInsp?.workflowStage).toBe('FIELD_WORK');

    // ── STEP 5: Before Evidence Capture ────────────────────────────────────
    const beforeEvidence: WorkEvidence = {
      id: 'ev-before-01',
      inspectionId: issueId,
      stage: 'BEFORE',
      title: 'Condenser coils clogged with debris',
      description: 'Heavy dust and scale deposit on heat exchanger fins',
      photoUrl: 'https://res.cloudinary.com/lt6lmhj9/image/upload/v1/evidence/before.jpg',
      capturedBy: technicianId,
      capturedByName: 'Elakkiya S',
      capturedAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };
    await db.workEvidence.put(beforeEvidence);

    // ── STEP 6: Checklist Execution & CRDT Convergence ─────────────────────
    const checklistItems: ChecklistItem[] = [
      { id: 'item-suction', inspectionId: issueId, question: 'Suction pressure (PSI)', type: 'NUMERIC', required: true, order: 1, createdAt: now },
      { id: 'item-oil', inspectionId: issueId, question: 'Compressor oil level & clarity', type: 'GOOD_DAMAGED', required: true, order: 2, createdAt: now },
      { id: 'item-fan', inspectionId: issueId, question: 'Condenser fan rotation & amps', type: 'PASS_FAIL', required: true, order: 3, createdAt: now },
    ];
    await db.checklistItems.bulkPut(checklistItems);

    // Initialize Yjs CRDT doc
    await yjsManager.getDoc(issueId);

    // Record results locally
    await upsertInspectionResult({
      inspectionId: issueId,
      checklistItemId: 'item-suction',
      value: '68',
      valueType: 'NUMERIC',
      userId: technicianId,
      userName: 'Elakkiya S',
    });
    yjsManager.setResult(issueId, 'item-suction', '68');

    await upsertInspectionResult({
      inspectionId: issueId,
      checklistItemId: 'item-oil',
      value: 'GOOD',
      valueType: 'GOOD_DAMAGED',
      userId: technicianId,
      userName: 'Elakkiya S',
    });
    yjsManager.setResult(issueId, 'item-oil', 'GOOD');

    await upsertInspectionResult({
      inspectionId: issueId,
      checklistItemId: 'item-fan',
      value: 'PASS',
      valueType: 'PASS_FAIL',
      userId: technicianId,
      userName: 'Elakkiya S',
    });
    yjsManager.setResult(issueId, 'item-fan', 'PASS');

    // ── STEP 7: After Evidence Capture ─────────────────────────────────────
    const afterEvidence: WorkEvidence = {
      id: 'ev-after-01',
      inspectionId: issueId,
      stage: 'AFTER',
      title: 'Condenser coils chemically descaled & power washed',
      description: 'Airflow normalized and operating pressures within Carrier specifications',
      photoUrl: 'https://res.cloudinary.com/lt6lmhj9/image/upload/v1/evidence/after.jpg',
      capturedBy: technicianId,
      capturedByName: 'Elakkiya S',
      capturedAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };
    await db.workEvidence.put(afterEvidence);

    const allEvidence = await db.workEvidence.where('inspectionId').equals(issueId).toArray();
    expect(allEvidence.filter(e => e.stage === 'BEFORE').length).toBe(1);
    expect(allEvidence.filter(e => e.stage === 'AFTER').length).toBe(1);

    // ── STEP 8: Technician Completes Work & Signs ──────────────────────────
    const techCompletedTime = new Date().toISOString();
    await db.inspections.update(issueId, {
      workflowStage: 'AWAITING_VERIFICATION',
      status: 'PENDING_VERIFICATION',
      technicianCompletedAt: techCompletedTime,
      updatedAt: techCompletedTime,
    });

    const techSignature: DigitalSignature = {
      id: 'sig-tech-01',
      inspectionId: issueId,
      signerId: technicianId,
      signerName: 'Elakkiya S',
      signerRole: 'TECHNICIAN',
      signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: techCompletedTime,
      declarationText: 'Certified that condenser coil descaling was performed to Carrier OEM standards.',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      syncStatus: 'PENDING',
    };
    await db.digitalSignatures.put(techSignature);

    // ── STEP 9: Supervisor Verifies Work & Approves ─────────────────────────
    const verifyTime = new Date().toISOString();
    await db.inspections.update(issueId, {
      workflowStage: 'RESOLVED',
      status: 'RESOLVED',
      verifiedBy: supervisorId,
      verifiedByName: 'Abi Kumar',
      verifiedAt: verifyTime,
      resolutionSummary: 'Verified condenser coil heat transfer rate and normal amp draw. High pressure fault cleared.',
      updatedAt: verifyTime,
    });

    const supSignature: DigitalSignature = {
      id: 'sig-sup-01',
      inspectionId: issueId,
      signerId: supervisorId,
      signerName: 'Abi Kumar',
      signerRole: 'SUPERVISOR',
      signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: verifyTime,
      declarationText: 'Quality assurance inspected and verified. Work conforms to engineering specs.',
      checksum: 'f4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899',
      syncStatus: 'PENDING',
    };
    await db.digitalSignatures.put(supSignature);

    const verifiedOrder = await db.inspections.get(issueId);
    expect(verifiedOrder?.workflowStage).toBe('RESOLVED');
    expect(verifiedOrder?.verifiedByName).toBe('Abi Kumar');

    // ── STEP 10: Technician Generates Invoice with Charges ──────────────────
    const invoiceNumber = 'FS-2026-9901';
    const labour = 1500;
    const parts = 850;
    const travel = 200;
    const other = 0;
    const discount = 50;
    const subtotal = labour + parts + travel + other - discount; // 2500
    const taxAmount = (subtotal * 18) / 100; // 450
    const grandTotal = subtotal + taxAmount; // 2950

    const qrPayload = `upi://pay?pa=fieldsync@icici&pn=FieldSync&am=${grandTotal.toFixed(2)}&cu=INR&tn=Invoice-${invoiceNumber}`;

    const newInvoice: Invoice = {
      id: 'inv-e2e-001',
      invoiceNumber,
      inspectionId: issueId,
      inspectionTitle: customerIssue.title,
      customerId,
      customerName: 'Bob Abd',
      customerEmail: 'customer@company.com',
      technicianId,
      technicianName: 'Elakkiya S',
      labourCharges: labour,
      partsCharges: parts,
      travelCharges: travel,
      otherCharges: other,
      discount,
      taxPercent: 18,
      taxAmount,
      subtotal,
      grandTotal,
      status: 'PAYMENT_PENDING',
      qrPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };
    await db.invoices.put(newInvoice);

    // ── STEP 11: Technician Shows QR & Customer Pays ───────────────────────
    const paymentRef = 'UPI-TXN-98471928341';
    const paidTime = new Date().toISOString();

    await db.invoices.update(newInvoice.id, {
      status: 'PAID',
      paymentReference: paymentRef,
      paymentMethod: 'UPI_QR',
      paidAt: paidTime,
      updatedAt: paidTime,
      syncStatus: 'PENDING',
    });

    await createAuditEvent({
      userId: customerId,
      userName: 'Bob Abd',
      inspectionId: issueId,
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      action: 'UPDATED',
      field: 'status',
      afterValue: `PAID (Ref: ${paymentRef}) confirmed by Bob Abd`,
    });

    // ── STEP 12: Complete Assertions on End State ───────────────────────────
    const settledInvoice = await db.invoices.get(newInvoice.id);
    expect(settledInvoice?.status).toBe('PAID');
    expect(settledInvoice?.paymentReference).toBe(paymentRef);
    expect(settledInvoice?.grandTotal).toBe(2950);

    const auditTrail = await db.auditEvents.where('inspectionId').equals(issueId).toArray();
    expect(auditTrail.length).toBeGreaterThanOrEqual(3);

    const storedSigs = await db.digitalSignatures.where('inspectionId').equals(issueId).toArray();
    expect(storedSigs.length).toBe(2);
    expect(storedSigs.some(s => s.signerRole === 'TECHNICIAN')).toBe(true);
    expect(storedSigs.some(s => s.signerRole === 'SUPERVISOR')).toBe(true);
  });
});
