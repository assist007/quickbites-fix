import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, Loader2, ArrowLeft, CheckCircle, XCircle, 
  Clock, Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  delivery_address: string | null;
  profiles?: { full_name: string | null; phone: string | null } | null;
}

const PaymentVerification = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [orders, setOrders] = useState<Order[]>([]);
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
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_method', 'bkash')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data?.map(o => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      const ordersWithProfiles = (data || []).map(order => ({
        ...order,
        profiles: profiles?.find(p => p.id === order.user_id) || null
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: status,
          status: status === 'verified' ? 'confirmed' : 'cancelled'
        })
        .eq('id', orderId);

      if (error) throw error;

      // Notify user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: status === 'verified' ? 'payment_verified' : 'payment_rejected',
        title: status === 'verified' ? 'Payment Verified' : 'Payment Issue',
        message: status === 'verified' 
          ? 'Your bKash payment has been verified. Your order is confirmed!'
          : 'We could not verify your bKash payment. Please contact support.',
        data: { order_id: orderId }
      });

      toast.success(status === 'verified' ? "Payment verified" : "Payment rejected");
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error("Failed to update payment status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'awaiting_verification':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const pendingPayments = orders.filter(o => o.payment_status === 'awaiting_verification');
  const processedPayments = orders.filter(o => o.payment_status !== 'awaiting_verification');

  return (
    <div className="min-h-screen bg-background py-8 pt-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Payment Verification</h1>
          {pendingPayments.length > 0 && (
            <Badge variant="destructive">{pendingPayments.length} pending</Badge>
          )}
        </div>

        {/* Pending Payments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending payments</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{order.profiles?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-[#E2136E]" />
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {order.transaction_id}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">৳{Number(order.total_amount).toFixed(0)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updatePaymentStatus(order.id, order.user_id, 'verified')}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updatePaymentStatus(order.id, order.user_id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
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

        {/* Processed Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {processedPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payment history</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedPayments.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-medium">{order.profiles?.full_name || 'Unknown'}</p>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {order.transaction_id}
                          </code>
                        </TableCell>
                        <TableCell>৳{Number(order.total_amount).toFixed(0)}</TableCell>
                        <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
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

export default PaymentVerification;