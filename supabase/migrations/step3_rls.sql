-- STEP 3: Row Level Security

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
