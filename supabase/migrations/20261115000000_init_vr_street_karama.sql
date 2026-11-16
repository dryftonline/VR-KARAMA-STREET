-- VR STREET KARAMA: COMPLETE DATABASE SCHEMA & SECURITY POLICIES
-- Timezone: Asia/Kolkata
-- Currency: Indian Rupee (INR)

-- 1. Helper function for consistent Asia/Kolkata business date
CREATE OR REPLACE FUNCTION get_business_date(ts timestamptz DEFAULT now())
RETURNS date AS $$
BEGIN
  RETURN (timezone('Asia/Kolkata', ts))::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Transaction Sequence for unique transaction numbers
CREATE SEQUENCE IF NOT EXISTS sales_transaction_seq START WITH 1001;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index on role & active
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- Helper function to check if current user is an Owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'OWNER' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SALES TABLE (Shared Business Ledger)
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number text NOT NULL UNIQUE,
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('CASH', 'UPI')),
  business_date date NOT NULL DEFAULT get_business_date(now()),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_sales_staff_id ON public.sales(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON public.sales(business_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date_method ON public.sales(business_date, payment_method);

-- Trigger to auto-generate transaction number if not provided
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS trigger AS $$
DECLARE
  today_str text;
  seq_val bigint;
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    today_str := to_char(get_business_date(NEW.created_at), 'YYYYMMDD');
    seq_val := nextval('sales_transaction_seq');
    NEW.transaction_number := 'VRK-' || today_str || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  -- Always enforce business_date derived from server time Asia/Kolkata
  NEW.business_date := get_business_date(NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_before_insert ON public.sales;
CREATE TRIGGER trg_sales_before_insert
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_number();

-- 5. STAFF SHIFTS TABLE (Opening & Closing)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_date date NOT NULL DEFAULT get_business_date(now()),
  opening_time timestamptz,
  opening_photo_url text,
  closing_time timestamptz,
  closing_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_shift_date UNIQUE (staff_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_shifts_staff_date ON public.staff_shifts(staff_id, business_date);
CREATE INDEX IF NOT EXISTS idx_shifts_business_date ON public.staff_shifts(business_date);

-- Trigger for shift timestamp update
CREATE OR REPLACE FUNCTION update_shift_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shift_updated_at ON public.staff_shifts;
CREATE TRIGGER trg_shift_updated_at
  BEFORE UPDATE ON public.staff_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_updated_at();

-- 6. NOTIFICATION DEVICES (FCM Device Tokens)
CREATE TABLE IF NOT EXISTS public.notification_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_token text NOT NULL UNIQUE,
  device_type text NOT NULL DEFAULT 'web',
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_devices_owner ON public.notification_devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_notif_devices_active ON public.notification_devices(is_active);

-- 7. NOTIFICATION LOGS (Idempotency & Auditing)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_sale ON public.notification_logs(sale_id);

-- 8. AUDIT LOGS (Transaction corrections & Admin operations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- PROFILES POLICIES
-- -------------------------------------------------------------------------
-- Staff and Owner can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Owners can view all profiles
CREATE POLICY "Owners can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_owner());

-- Only Owners can update profiles (e.g. deactivate staff)
CREATE POLICY "Owners can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Only Owners (or service role) can insert profiles
CREATE POLICY "Owners can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_owner());

-- -------------------------------------------------------------------------
-- SALES POLICIES (Shared Business Ledger Security)
-- -------------------------------------------------------------------------
-- Owners can view all sales across the entire business
CREATE POLICY "Owners can view all sales"
  ON public.sales FOR SELECT
  USING (public.is_owner());

-- Staff can ONLY view their own sales records
CREATE POLICY "Staff can view only own sales"
  ON public.sales FOR SELECT
  USING (staff_id = auth.uid());

-- Authenticated active Staff and Owners can insert sales
-- Staff must insert their own staff_id
CREATE POLICY "Authenticated users can record sales"
  ON public.sales FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND staff_id = auth.uid()
    AND amount > 0
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Staff can NEVER update or delete sales!
-- Only Owners can update sales (e.g. corrections) with server audit
CREATE POLICY "Owners can update sales"
  ON public.sales FOR UPDATE
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Only Owners can delete sales (soft/hard with audit)
CREATE POLICY "Owners can delete sales"
  ON public.sales FOR DELETE
  USING (public.is_owner());

-- -------------------------------------------------------------------------
-- STAFF SHIFTS POLICIES
-- -------------------------------------------------------------------------
-- Owners can view all shifts
CREATE POLICY "Owners can view all shifts"
  ON public.staff_shifts FOR SELECT
  USING (public.is_owner());

-- Staff can view only their own shifts
CREATE POLICY "Staff can view only own shifts"
  ON public.staff_shifts FOR SELECT
  USING (staff_id = auth.uid());

-- Staff can insert their own opening shift
CREATE POLICY "Staff can insert own opening shift"
  ON public.staff_shifts FOR INSERT
  WITH CHECK (
    auth.uid() = staff_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Staff can update their own closing shift
CREATE POLICY "Staff can update own shift closing"
  ON public.staff_shifts FOR UPDATE
  USING (auth.uid() = staff_id)
  WITH CHECK (auth.uid() = staff_id);

-- Owners can also update shifts if necessary
CREATE POLICY "Owners can update shifts"
  ON public.staff_shifts FOR UPDATE
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- -------------------------------------------------------------------------
-- NOTIFICATION DEVICES POLICIES
-- -------------------------------------------------------------------------
-- Only Owners can manage their notification devices
CREATE POLICY "Owners can manage own notification devices"
  ON public.notification_devices FOR ALL
  USING (auth.uid() = owner_id AND public.is_owner())
  WITH CHECK (auth.uid() = owner_id AND public.is_owner());

-- -------------------------------------------------------------------------
-- NOTIFICATION LOGS & AUDIT LOGS POLICIES
-- -------------------------------------------------------------------------
-- Only Owners can view notification logs
CREATE POLICY "Owners can view notification logs"
  ON public.notification_logs FOR SELECT
  USING (public.is_owner());

-- Only Owners can view audit logs
CREATE POLICY "Owners can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_owner());

-- Authenticated users can insert audit logs through functions/APIs
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================================
-- STORAGE BUCKET CONFIGURATION (shift-photos)
-- =========================================================================
-- Insert the private bucket for shift photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shift-photos',
  'shift-photos',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies for shift-photos:
-- 1. Staff can upload photos to their own folder: shift-photos/{staff_id}/*
CREATE POLICY "Staff can upload their own shift photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shift-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Staff can view their own photos
CREATE POLICY "Staff can read their own shift photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shift-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Owners can view all shift photos in the bucket
CREATE POLICY "Owners can read all shift photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shift-photos'
    AND public.is_owner()
  );

-- =========================================================================
-- REALTIME PUBLICATION
-- =========================================================================
-- Enable Supabase Realtime on the sales table for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;

