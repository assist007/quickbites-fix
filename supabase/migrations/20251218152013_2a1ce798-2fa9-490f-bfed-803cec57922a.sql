-- Allow users to reply to messages sent to them
CREATE POLICY "Users can reply to messages sent to them" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);