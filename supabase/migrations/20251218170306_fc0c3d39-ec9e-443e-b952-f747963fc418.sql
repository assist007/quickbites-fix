-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Admin or Employee can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Admin or Employee can reply to messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admin can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Employee can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Users can reply to messages sent to them" ON public.messages;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Users can view own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages sent to them" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "Admin can view all messages" 
ON public.messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employee can view relevant messages" 
ON public.messages 
FOR SELECT 
USING (
  has_role(auth.uid(), 'employee'::app_role) 
  AND (
    recipient_id = auth.uid() 
    OR recipient_type = 'all_employees'
  )
);

CREATE POLICY "Users can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin or Employee can reply to messages" 
ON public.messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Users can reply to messages sent to them" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can delete any message" 
ON public.messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employee can delete any message" 
ON public.messages 
FOR DELETE 
USING (has_role(auth.uid(), 'employee'::app_role));