-- Create orders table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    items jsonb NOT NULL DEFAULT '[]',
    total_amount decimal(10,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    delivery_address text,
    phone text,
    notes text,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;