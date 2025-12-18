-- Function to notify admins and employees on new order
CREATE OR REPLACE FUNCTION public.notify_staff_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  staff_record RECORD;
  customer_name TEXT;
BEGIN
  -- Get customer name
  SELECT COALESCE(full_name, username) INTO customer_name 
  FROM public.profiles WHERE id = NEW.user_id;
  
  IF customer_name IS NULL THEN
    SELECT email INTO customer_name FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- Notify all admins
  FOR staff_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      staff_record.user_id,
      'new_order',
      'New Order Received',
      COALESCE(customer_name, 'A customer') || ' placed a new order of ৳' || NEW.total_amount,
      jsonb_build_object('order_id', NEW.id, 'user_id', NEW.user_id, 'total', NEW.total_amount)
    );
  END LOOP;
  
  -- Notify all employees
  FOR staff_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'employee'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      staff_record.user_id,
      'new_order',
      'New Order Received',
      COALESCE(customer_name, 'A customer') || ' placed a new order of ৳' || NEW.total_amount,
      jsonb_build_object('order_id', NEW.id, 'user_id', NEW.user_id, 'total', NEW.total_amount)
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Function to notify user on order status change
CREATE OR REPLACE FUNCTION public.notify_user_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  status_message TEXT;
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_message := 'Your order has been confirmed and is being prepared.';
      WHEN 'preparing' THEN status_message := 'Your order is now being prepared.';
      WHEN 'ready' THEN status_message := 'Your order is ready for pickup/delivery.';
      WHEN 'out_for_delivery' THEN status_message := 'Your order is out for delivery.';
      WHEN 'delivered' THEN status_message := 'Your order has been delivered. Enjoy!';
      WHEN 'cancelled' THEN status_message := 'Your order has been cancelled.';
      ELSE status_message := 'Your order status has been updated to: ' || NEW.status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'order_update',
      'Order Status Updated',
      status_message,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
    );
  END IF;
  
  -- Also notify if payment status changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    CASE NEW.payment_status
      WHEN 'verified' THEN status_message := 'Your payment has been verified.';
      WHEN 'failed' THEN status_message := 'Your payment verification failed. Please contact support.';
      ELSE status_message := 'Your payment status has been updated to: ' || NEW.payment_status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'payment_update',
      'Payment Status Updated',
      status_message,
      jsonb_build_object('order_id', NEW.id, 'payment_status', NEW.payment_status)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers
DROP TRIGGER IF EXISTS on_new_order_notify_staff ON public.orders;
CREATE TRIGGER on_new_order_notify_staff
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_staff_on_new_order();

DROP TRIGGER IF EXISTS on_order_update_notify_user ON public.orders;
CREATE TRIGGER on_order_update_notify_user
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_order_update();