-- Create function to notify admins on new user signup
CREATE OR REPLACE FUNCTION public.notify_admins_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  user_name TEXT;
BEGIN
  -- Get user's name from profile or use email
  SELECT full_name INTO user_name FROM public.profiles WHERE id = NEW.id;
  
  IF user_name IS NULL THEN
    user_name := NEW.email;
  END IF;
  
  -- Insert notification for each admin
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_record.user_id,
      'new_user_signup',
      'New User Signup',
      user_name || ' has signed up and is awaiting review',
      jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_signup();