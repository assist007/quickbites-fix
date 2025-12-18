-- Create trigger to notify admins when a new message is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender's name from profile
  SELECT COALESCE(full_name, username) INTO sender_name 
  FROM public.profiles WHERE id = NEW.user_id;
  
  IF sender_name IS NULL THEN
    SELECT email INTO sender_name FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- Insert notification for each admin
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_record.user_id,
      'new_message',
      'New Customer Message',
      COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
      jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on messages table for INSERT
DROP TRIGGER IF EXISTS on_new_message_notify_admins ON public.messages;
CREATE TRIGGER on_new_message_notify_admins
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_message();