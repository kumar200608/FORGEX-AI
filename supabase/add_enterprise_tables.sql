-- ==============================================================================
-- FieldSync — Enterprise Tables SQL Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/gpslfqjgkwlrhonrmhxp/sql)
--
-- Creates the 5 missing enterprise tables:
--   1. public.invoices
--   2. public.digital_signatures
--   3. public.work_evidence
--   4. public.asset_scan_events
--   5. public.sla_policies
-- With Row Level Security (RLS) policies and performance indexes.
-- ==============================================================================

-- ── 1. Invoices & UPI Billing ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspection_title TEXT,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Client',
  customer_email TEXT,
  customer_phone TEXT,
  technician_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  technician_name TEXT,
  labour_charges NUMERIC(10, 2) DEFAULT 0,
  parts_charges NUMERIC(10, 2) DEFAULT 0,
  travel_charges NUMERIC(10, 2) DEFAULT 0,
  other_charges NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  tax_percent NUMERIC(5, 2) DEFAULT 18,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  grand_total NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  qr_payload TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Digital Signatures ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  signer_name TEXT NOT NULL DEFAULT 'Authorized Signatory',
  signer_role TEXT NOT NULL DEFAULT 'TECHNICIAN',
  signature_data_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  declaration_text TEXT DEFAULT 'Compliance verification certified.',
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Before / After Work Evidence ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('BEFORE', 'AFTER')),
  title TEXT NOT NULL DEFAULT 'Work Evidence',
  description TEXT,
  photo_url TEXT,
  captured_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  captured_by_name TEXT DEFAULT 'Technician',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Asset QR Scan Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asset_scan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  scanned_code TEXT NOT NULL,
  expected_code TEXT NOT NULL,
  is_match BOOLEAN DEFAULT TRUE,
  scanned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scanner_name TEXT DEFAULT 'Staff Member',
  device_id TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. SLA Policies ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sla_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority TEXT NOT NULL,
  category TEXT DEFAULT 'ALL',
  response_minutes INT NOT NULL DEFAULT 60,
  resolution_minutes INT NOT NULL DEFAULT 240,
  escalation_1_minutes INT NOT NULL DEFAULT 120,
  escalation_2_minutes INT NOT NULL DEFAULT 180,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default SLA Policies if empty
INSERT INTO public.sla_policies (priority, category, response_minutes, resolution_minutes, escalation_1_minutes, escalation_2_minutes)
VALUES
  ('CRITICAL', 'ALL', 30, 120, 45, 90),
  ('HIGH', 'ALL', 60, 240, 120, 180),
  ('MEDIUM', 'ALL', 120, 480, 240, 360),
  ('LOW', 'ALL', 240, 1440, 480, 720)
ON CONFLICT DO NOTHING;

-- ── 6. Enable Row Level Security (RLS) ────────────────────────────────────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

-- ── 7. RLS Policies (Allow authenticated & anon read/write for sync) ───────────
DO $$
BEGIN
  -- invoices
  DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices;
  CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

  -- digital_signatures
  DROP POLICY IF EXISTS "Allow all access to digital_signatures" ON public.digital_signatures;
  CREATE POLICY "Allow all access to digital_signatures" ON public.digital_signatures FOR ALL USING (true) WITH CHECK (true);

  -- work_evidence
  DROP POLICY IF EXISTS "Allow all access to work_evidence" ON public.work_evidence;
  CREATE POLICY "Allow all access to work_evidence" ON public.work_evidence FOR ALL USING (true) WITH CHECK (true);

  -- asset_scan_events
  DROP POLICY IF EXISTS "Allow all access to asset_scan_events" ON public.asset_scan_events;
  CREATE POLICY "Allow all access to asset_scan_events" ON public.asset_scan_events FOR ALL USING (true) WITH CHECK (true);

  -- sla_policies
  DROP POLICY IF EXISTS "Allow all access to sla_policies" ON public.sla_policies;
  CREATE POLICY "Allow all access to sla_policies" ON public.sla_policies FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ── 8. Indexes for Fast Sync Lookups ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_inspection ON public.invoices(inspection_id);
CREATE INDEX IF NOT EXISTS idx_signatures_inspection ON public.digital_signatures(inspection_id);
CREATE INDEX IF NOT EXISTS idx_evidence_inspection ON public.work_evidence(inspection_id);
CREATE INDEX IF NOT EXISTS idx_scans_inspection ON public.asset_scan_events(inspection_id);
CREATE INDEX IF NOT EXISTS idx_sla_priority ON public.sla_policies(priority);
