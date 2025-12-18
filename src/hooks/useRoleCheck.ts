import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user' | 'employee';

export const useRoleCheck = (role: AppRole) => {
  const { user, loading: authLoading } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: role,
        });

        if (error) throw error;
        setHasRole(!!data);
      } catch (error) {
        console.error(`Error checking ${role} role:`, error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkRole();
    }
  }, [user, authLoading, role]);

  return { hasRole, loading: authLoading || loading };
};

export const useEmployeeCheck = () => useRoleCheck('employee');
