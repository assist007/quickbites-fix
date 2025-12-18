import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, Loader2, ArrowLeft, Shield, ShieldAlert, Trash2, 
  Ban, CheckCircle, UserCog
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  is_restricted: boolean;
  created_at: string;
  roles: string[];
}

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (!adminLoading && !isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate('/');
      return;
    }
  }, [user, authLoading, isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: 'employee') => {
    // Prevent self-modification
    if (userId === user?.id) {
      toast.error("You cannot modify your own roles");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }]);

      if (error) throw error;

      toast.success(`Role ${role} assigned successfully`);
      fetchUsers();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("User already has this role");
      } else {
        console.error('Error assigning role:', error);
        toast.error("Failed to assign role");
      }
    }
  };

  const removeRole = async (userId: string, role: string) => {
    // Prevent self-modification
    if (userId === user?.id) {
      toast.error("You cannot modify your own roles");
      return;
    }

    // Prevent removing admin role from anyone
    if (role === 'admin') {
      toast.error("Admin role cannot be removed");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'employee' | 'user' | 'moderator');

      if (error) throw error;

      toast.success(`Role ${role} removed`);
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error("Failed to remove role");
    }
  };

  const toggleRestriction = async (userId: string, currentStatus: boolean) => {
    // Prevent self-restriction
    if (userId === user?.id) {
      toast.error("You cannot restrict yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_restricted: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(currentStatus ? "User unrestricted" : "User restricted");
      fetchUsers();
    } catch (error) {
      console.error('Error toggling restriction:', error);
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete user");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'employee': return 'default';
      default: return 'outline';
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 pt-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <UserCog className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className={u.is_restricted ? "opacity-50" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{u.phone || 'No phone'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <Badge variant="outline">User</Badge>
                            ) : (
                              u.roles.map(role => {
                                const canRemove = u.id !== user?.id && role !== 'admin';
                                return (
                                  <Badge 
                                    key={role} 
                                    variant={getRoleBadgeVariant(role)}
                                    className={canRemove ? "cursor-pointer" : ""}
                                    onClick={() => {
                                      if (canRemove) {
                                        removeRole(u.id, role);
                                      }
                                    }}
                                  >
                                    {role.replace('_', ' ')}
                                    {canRemove ? ' ×' : ''}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.is_restricted ? (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="h-3 w-3" />
                              Restricted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-success border-success">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Don't show role modification for current admin user */}
                            {u.id !== user?.id && !u.roles.includes('admin') && (
                              <Select onValueChange={(role) => assignRole(u.id, role as 'employee')}>
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Add role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      Employee
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {u.id === user?.id && (
                              <span className="text-xs text-muted-foreground">Cannot modify own roles</span>
                            )}

                            {u.id !== user?.id && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleRestriction(u.id, u.is_restricted)}
                                title={u.is_restricted ? "Unrestrict" : "Restrict"}
                              >
                                {u.is_restricted ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                  <Ban className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            )}

                            {u.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {u.full_name || 'this user'} and all their data.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(u.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserManagement;