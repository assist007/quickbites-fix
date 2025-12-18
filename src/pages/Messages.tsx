import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  subject: string;
  message: string;
  reply: string | null;
  is_read: boolean;
  created_at: string;
  replied_at: string | null;
  product_id: string | null;
  recipient_type: string | null;
  recipient_id: string | null;
}

interface Employee {
  user_id: string;
  full_name: string | null;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    message: "",
    recipientType: "admin",
    recipientId: ""
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (!user) return;

    fetchMessages();
    fetchEmployees();

    const channel = supabase
      .channel(`user-messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, navigate]);

  const fetchEmployees = async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "employee");

      if (roleError) throw roleError;

      if (roleData && roleData.length > 0) {
        const userIds = roleData.map(r => r.user_id);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profileError) throw profileError;

        setEmployees(
          (profileData || []).map(p => ({
            user_id: p.id,
            full_name: p.full_name
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newMessage.recipientType === "employee" && !newMessage.recipientId) {
      toast.error("Please select an employee");
      return;
    }

    setSending(true);
    try {
      const insertData: any = {
        user_id: user.id,
        subject: newMessage.subject,
        message: newMessage.message,
        recipient_type: newMessage.recipientType,
      };

      if (newMessage.recipientType === "employee" && newMessage.recipientId) {
        insertData.recipient_id = newMessage.recipientId;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
        .select("id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [data as Message, ...prev]);
      } else {
        fetchMessages();
      }

      toast.success("Message sent successfully");
      setNewMessage({ subject: "", message: "", recipientType: "admin", recipientId: "" });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 pt-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Messages</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-hero text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send a Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Send To</label>
                  <Select
                    value={newMessage.recipientType}
                    onValueChange={(value) => setNewMessage(prev => ({ 
                      ...prev, 
                      recipientType: value,
                      recipientId: value !== "employee" ? "" : prev.recipientId
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="all_employees">All Employees</SelectItem>
                      {employees.length > 0 && (
                        <SelectItem value="employee">Specific Employee</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {newMessage.recipientType === "employee" && employees.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Employee</label>
                    <Select
                      value={newMessage.recipientId}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipientId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.user_id} value={emp.user_id}>
                            {emp.full_name || "Unnamed Employee"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="What's your question about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your message here..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={sending}
                  className="w-full gradient-hero text-primary-foreground"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Have a question about a product? Send us a message!
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Send your first message
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <Card key={msg.id} className={msg.reply && !msg.is_read ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{msg.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      {msg.reply ? (
                        <Badge variant="default" className="bg-success">Replied</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this message and any replies.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMessage(msg.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  
                  {msg.reply && (
                    <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Admin Reply:</p>
                      <p className="text-sm">{msg.reply}</p>
                      {msg.replied_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(msg.replied_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;