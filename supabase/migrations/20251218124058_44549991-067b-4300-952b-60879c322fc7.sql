-- Add recipient fields to messages table
ALTER TABLE public.messages 
ADD COLUMN recipient_type text DEFAULT 'admin' CHECK (recipient_type IN ('admin', 'employee', 'all_employees')),
ADD COLUMN recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update the notify function to handle recipient selection
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  staff_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender's name from profile
  SELECT COALESCE(full_name, username) INTO sender_name 
  FROM public.profiles WHERE id = NEW.user_id;
  
  IF sender_name IS NULL THEN
    SELECT email INTO sender_name FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- Notify based on recipient_type
  IF NEW.recipient_type = 'admin' THEN
    -- Notify all admins
    FOR staff_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        staff_record.user_id,
        'new_message',
        'New Customer Message',
        COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
        jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
      );
    END LOOP;
  ELSIF NEW.recipient_type = 'employee' AND NEW.recipient_id IS NOT NULL THEN
    -- Notify specific employee
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.recipient_id,
      'new_message',
      'New Customer Message',
      COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
      jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
    );
  ELSIF NEW.recipient_type = 'all_employees' THEN
    -- Notify all employees
    FOR staff_record IN 
      SELECT user_id FROM public.user_roles WHERE role = 'employee'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        staff_record.user_id,
        'new_message',
        'New Customer Message',
        COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
        jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_new_message_notify_admins ON public.messages;
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;

CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();