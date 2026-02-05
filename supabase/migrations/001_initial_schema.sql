-- ============================================
-- P2P Delivery App — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('sender', 'courier', 'both', 'admin')),
  courier_verified BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT,
  stripe_customer_id TEXT,
  push_token TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DELIVERIES TABLE
-- ============================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  courier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Addresses
  pickup_address TEXT NOT NULL,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_latitude DOUBLE PRECISION,
  dropoff_longitude DOUBLE PRECISION,

  -- Package info
  package_description TEXT,
  package_size TEXT CHECK (package_size IN ('Small', 'Medium', 'Large', 'Extra Large')),

  -- Pricing
  offered_price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  courier_payout DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed')
  ),

  -- Proof
  proof_photo_url TEXT,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,

  -- Timestamps
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COURIER LOCATIONS TABLE (real-time GPS)
-- ============================================
CREATE TABLE public.courier_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(courier_id)
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delivery_id, reviewer_id)
);

-- ============================================
-- ID VERIFICATIONS TABLE
-- ============================================
CREATE TABLE public.id_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  id_front_path TEXT,
  id_back_path TEXT,
  selfie_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_deliveries_sender ON public.deliveries(sender_id);
CREATE INDEX idx_deliveries_courier ON public.deliveries(courier_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_courier_locations_courier ON public.courier_locations(courier_id);
CREATE INDEX idx_reviews_delivery ON public.reviews(delivery_id);
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_id_verifications_user ON public.id_verifications(user_id);
CREATE INDEX idx_id_verifications_status ON public.id_verifications(status);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER id_verifications_updated_at
  BEFORE UPDATE ON public.id_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- DELIVERIES policies
CREATE POLICY "Senders can view own deliveries"
  ON public.deliveries FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Couriers can view assigned deliveries"
  ON public.deliveries FOR SELECT
  USING (courier_id = auth.uid());

CREATE POLICY "Couriers can view pending deliveries"
  ON public.deliveries FOR SELECT
  USING (status = 'pending' AND courier_id IS NULL);

CREATE POLICY "Senders can create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Couriers can accept pending deliveries"
  ON public.deliveries FOR UPDATE
  USING (
    (courier_id = auth.uid()) OR
    (status = 'pending' AND courier_id IS NULL)
  );

CREATE POLICY "Senders can cancel own pending deliveries"
  ON public.deliveries FOR UPDATE
  USING (sender_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all deliveries"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- COURIER LOCATIONS policies
CREATE POLICY "Couriers can upsert own location"
  ON public.courier_locations FOR ALL
  USING (courier_id = auth.uid());

CREATE POLICY "Anyone can view courier locations for their deliveries"
  ON public.courier_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries
      WHERE deliveries.courier_id = courier_locations.courier_id
      AND deliveries.sender_id = auth.uid()
      AND deliveries.status IN ('accepted', 'picked_up', 'in_transit')
    )
  );

-- REVIEWS policies
CREATE POLICY "Users can view reviews about them"
  ON public.reviews FOR SELECT
  USING (reviewee_id = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews for completed deliveries"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- ID VERIFICATIONS policies
CREATE POLICY "Users can view own verifications"
  ON public.id_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can submit verifications"
  ON public.id_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all verifications"
  ON public.id_verifications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update verifications"
  ON public.id_verifications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Storage settings or via API:
-- 1. Create bucket: id-verifications (private)
-- 2. Create bucket: delivery-proofs (private)
-- 3. Create bucket: avatars (public)

-- Storage policies (run in SQL editor):
INSERT INTO storage.buckets (id, name, public) VALUES ('id-verifications', 'id-verifications', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proofs', 'delivery-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own ID verifications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'id-verifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own ID verifications"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-verifications' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Authenticated users can upload delivery proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-proofs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view delivery proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'delivery-proofs' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_locations;
