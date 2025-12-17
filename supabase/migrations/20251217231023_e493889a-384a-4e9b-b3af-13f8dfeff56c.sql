-- Add payment fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS bkash_number text;

-- Create messages table for product inquiries
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  reply text,
  replied_by uuid,
  replied_at timestamp with time zone,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add is_restricted column to profiles for user restriction
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_restricted boolean DEFAULT false;

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
USING (auth.uid() = user_id);

-- Users can create messages
CREATE POLICY "Users can create messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin and staff can view all messages
CREATE POLICY "Admin can view all messages"
ON public.messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Admin and staff can update messages (reply)
CREATE POLICY "Admin can reply to messages"
ON public.messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;