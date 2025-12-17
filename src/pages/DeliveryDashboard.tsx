import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDeliveryCheck } from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MapPin, Phone, Package, CheckCircle2 } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: Json;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  phone: string | null;
}

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasRole: isDelivery, loading: deliveryLoading } = useDeliveryCheck();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    delivered: 0,
  });

  useEffect(() => {
    if (!authLoading && !deliveryLoading) {
      if (!user) {
        navigate('/');
        return;
      }
      if (!isDelivery) {
        toast.error('Access denied. Delivery personnel only.');
        navigate('/');
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, deliveryLoading, isDelivery, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_person_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      const assigned = data?.filter((o) => o.status === 'out_for_delivery').length || 0;
      const delivered = data?.filter((o) => o.status === 'delivered').length || 0;
      setStats({ assigned, delivered });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Notify admin about delivery
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          type: 'delivery_completed',
          title: 'Order Delivered',
          message: `Order ${orderId.slice(0, 8)} has been marked as delivered`,
          data: { order_id: orderId },
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast.success('Order marked as delivered');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  if (authLoading || deliveryLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === 'out_for_delivery');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Delivery Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Deliveries</h2>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active deliveries assigned
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeOrders.map((order) => {
              const items = order.items as unknown as OrderItem[];
              return (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge>Order #{order.id.slice(0, 8)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm">
                          {Array.isArray(items)
                            ? items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                            : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {order.delivery_address || 'No address'}
                        </div>
                        {order.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {order.phone}
                          </div>
                        )}
                      </div>
                      <Button onClick={() => markAsDelivered(order.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Deliveries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Completed Deliveries</h2>
        {completedOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No completed deliveries
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedOrders.slice(0, 5).map((order) => (
              <Card key={order.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Order #{order.id.slice(0, 8)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Delivered
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
