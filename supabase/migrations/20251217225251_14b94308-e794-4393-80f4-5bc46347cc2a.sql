-- Create products table for menu management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view available products
CREATE POLICY "Anyone can view available products"
ON public.products
FOR SELECT
USING (is_available = true);

-- Admins can do everything with products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Staff can view all products
CREATE POLICY "Staff can view all products"
ON public.products
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Staff can update products
CREATE POLICY "Staff can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add delivery_person_id to orders for assignment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_person_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Policy for delivery personnel to view assigned orders
CREATE POLICY "Delivery can view assigned orders"
ON public.orders
FOR SELECT
USING (
  has_role(auth.uid(), 'delivery_boy') AND delivery_person_id = auth.uid()
);

-- Policy for delivery personnel to update assigned orders
CREATE POLICY "Delivery can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'delivery_boy') AND delivery_person_id = auth.uid()
);

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Staff can update orders
CREATE POLICY "Staff can update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Admins can view all profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));