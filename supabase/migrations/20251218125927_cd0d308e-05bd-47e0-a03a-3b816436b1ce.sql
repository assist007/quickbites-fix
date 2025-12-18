-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow admins to delete any message
CREATE POLICY "Admin can delete any message" 
ON public.messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow employees to delete any message
CREATE POLICY "Employee can delete any message" 
ON public.messages 
FOR DELETE 
USING (has_role(auth.uid(), 'employee'::app_role));