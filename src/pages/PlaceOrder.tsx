import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Banknote, Check, Smartphone, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BKASH_NUMBER = "01XXXXXXXXX"; // Replace with actual bKash number

const PlaceOrder = () => {
  const { cartItems, foodList, foodLoading, getTotalCartAmount, clearCart } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  const hasAnyCartItems = Object.keys(cartItems).length > 0;
  const cartItemsList = foodList.filter((item) => cartItems[item.id] > 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const copyBkashNumber = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to place an order",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === "bkash" && !transactionId.trim()) {
      toast({
        title: "Transaction ID required",
        description: "Please enter your bKash transaction ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const orderItems = cartItemsList.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: cartItems[item.id],
        image: item.image
      }));

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        items: orderItems,
        total_amount: total,
        delivery_address: `${formData.address}, ${formData.city}`,
        phone: formData.phone,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "pending" : "awaiting_verification",
        transaction_id: paymentMethod === "bkash" ? transactionId : null,
        status: "pending"
      });

      if (error) throw error;

      // Create notification for admin about new order
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: paymentMethod === "bkash" ? "payment_verification" : "new_order",
          title: paymentMethod === "bkash" ? "Payment Verification Required" : "New Order",
          message: paymentMethod === "bkash" 
            ? `New bKash payment received. Transaction ID: ${transactionId}. Amount: ৳${total}`
            : `New order received. Amount: ৳${total}`,
          data: { payment_method: paymentMethod, transaction_id: transactionId, amount: total }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: "Order placed successfully!",
        description: paymentMethod === "bkash" 
          ? "Your payment is being verified. We'll notify you once confirmed."
          : "Thank you for your order. Pay on delivery.",
      });
      
      clearCart();
      navigate("/orders");
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (foodLoading && hasAnyCartItems) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Loading checkout…</h2>
          <p className="text-muted-foreground">Fetching latest products</p>
        </div>
      </main>
    );
  }

  if (!hasAnyCartItems || cartItemsList.length === 0) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out
          </p>
          <Link to="/">
            <Button className="gradient-hero text-primary-foreground">Browse Menu</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 pt-24 md:pt-28">
      <div className="mb-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Delivery Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h2 className="text-xl font-bold mb-6">Delivery Information</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="House #, Road #, Area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Dhaka"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {paymentMethod === "cod" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay when you receive</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "bkash"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {paymentMethod === "bkash" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-[#E2136E]/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-[#E2136E]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">bKash</p>
                    <p className="text-sm text-muted-foreground">Send Money</p>
                  </div>
                </button>
              </div>

              {/* bKash Payment Instructions */}
              {paymentMethod === "bkash" && (
                <div className="bg-[#E2136E]/5 border border-[#E2136E]/20 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-[#E2136E]">bKash Payment Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Open your bKash app</li>
                    <li>Select "Send Money"</li>
                    <li>Enter our bKash number:</li>
                  </ol>
                  
                  <div className="flex items-center gap-2 bg-background rounded-lg p-3 border border-border">
                    <span className="font-mono text-lg font-bold flex-1">{BKASH_NUMBER}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyBkashNumber}
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1 text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <ol start={4} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Send <span className="font-semibold text-foreground">৳{total}</span></li>
                    <li>Enter the Transaction ID below</li>
                  </ol>

                  <div>
                    <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                    <Input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter bKash Transaction ID"
                      className="font-mono"
                      required={paymentMethod === "bkash"}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll receive the Transaction ID in your bKash app after payment
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {cartItemsList.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ৳{item.price} × {cartItems[item.id]}
                      </p>
                    </div>
                    <span className="font-medium">
                      ৳{item.price * cartItems[item.id]}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="border-border mb-4" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>৳{deliveryFee}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-xl">৳{total}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-hero text-primary-foreground"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Placing Order..." : "Place Order"}
              </Button>

              {paymentMethod === "bkash" && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Your order will be confirmed after payment verification
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </main>
  );
};

export default PlaceOrder;