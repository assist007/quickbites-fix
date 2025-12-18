-- Update the trigger function to handle all message recipient types including user-to-user
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
  
  -- Handle based on recipient_type
  IF NEW.recipient_type = 'admin' THEN
    IF NEW.recipient_id IS NOT NULL THEN
      -- Specific admin
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        NEW.recipient_id,
        'new_message',
        'New Message',
        COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
        jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
      );
    ELSE
      -- All admins
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
    END IF;
  ELSIF NEW.recipient_type = 'employee' AND NEW.recipient_id IS NOT NULL THEN
    -- Specific employee
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.recipient_id,
      'new_message',
      'New Message',
      COALESCE(sender_name, 'A user') || ' sent a message: ' || LEFT(NEW.subject, 50),
      jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
    );
  ELSIF NEW.recipient_type = 'all_employees' THEN
    -- All employees
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
  ELSIF NEW.recipient_type = 'user' AND NEW.recipient_id IS NOT NULL THEN
    -- Specific user
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.recipient_id,
      'new_message',
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent you a message: ' || LEFT(NEW.subject, 50),
      jsonb_build_object('message_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;