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
  user_id: string;
  subject: string;
  message: string;
  reply: string | null;
  is_read: boolean;
  created_at: string;
  replied_at: string | null;
  product_id: string | null;
  recipient_type: string | null;
  recipient_id: string | null;
  sender_name?: string | null;
}

interface StaffMember {
  user_id: string;
  full_name: string | null;
}

interface OtherUser {
  id: string;
  full_name: string | null;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [admins, setAdmins] = useState<StaffMember[]>([]);
  const [otherUsers, setOtherUsers] = useState<OtherUser[]>([]);
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
    fetchStaff();

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

  const fetchStaff = async () => {
    if (!user) return;
    
    try {
      // Fetch employees
      const { data: employeeRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "employee");

      if (employeeRoles && employeeRoles.length > 0) {
        const employeeIds = employeeRoles.map(r => r.user_id).filter(id => id !== user.id);
        if (employeeIds.length > 0) {
          const { data: employeeProfiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", employeeIds);

          setEmployees(
            (employeeProfiles || []).map(p => ({
              user_id: p.id,
              full_name: p.full_name
            }))
          );
        }
      }

      // Fetch admins (exclude self)
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map(r => r.user_id).filter(id => id !== user.id);
        if (adminIds.length > 0) {
          const { data: adminProfiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", adminIds);

          setAdmins(
            (adminProfiles || []).map(p => ({
              user_id: p.id,
              full_name: p.full_name
            }))
          );
        }
      }

      // Fetch other users (not admin, not employee, not self)
      const allStaffIds = [
        ...(employeeRoles || []).map(r => r.user_id),
        ...(adminRoles || []).map(r => r.user_id),
        user.id
      ];
      
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (allProfiles) {
        const regularUsers = allProfiles.filter(p => !allStaffIds.includes(p.id));
        setOtherUsers(regularUsers);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      // Fetch sent messages
      const { data: sentData, error: sentError } = await supabase
        .from("messages")
        .select("id, user_id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;
      setSentMessages((sentData || []) as Message[]);

      // Fetch received messages (where current user is the recipient)
      const { data: receivedData, error: receivedError } = await supabase
        .from("messages")
        .select("id, user_id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (receivedError) throw receivedError;

      // Get sender names for received messages
      if (receivedData && receivedData.length > 0) {
        const senderIds = [...new Set(receivedData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        const messagesWithSenderNames = receivedData.map(msg => ({
          ...msg,
          sender_name: profiles?.find(p => p.id === msg.user_id)?.full_name || "Unknown"
        }));
        setReceivedMessages(messagesWithSenderNames as Message[]);
      } else {
        setReceivedMessages([]);
      }
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

    // Validate recipient selection for specific types
    if ((newMessage.recipientType === "employee" || 
         newMessage.recipientType === "specific_admin" || 
         newMessage.recipientType === "user") && !newMessage.recipientId) {
      toast.error("Please select a recipient");
      return;
    }

    setSending(true);
    try {
      const insertData: any = {
        user_id: user.id,
        subject: newMessage.subject,
        message: newMessage.message,
        recipient_type: newMessage.recipientType === "specific_admin" ? "admin" : newMessage.recipientType,
      };

      // Set recipient_id for specific recipients
      if (newMessage.recipientId) {
        insertData.recipient_id = newMessage.recipientId;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
        .select("id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .single();

      if (error) throw error;

      if (data) {
        setSentMessages((prev) => [data as Message, ...prev]);
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

  const deleteMessage = async (messageId: string, isSent: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      if (isSent) {
        setSentMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        setReceivedMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
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
                      recipientId: ""
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">All Admins</SelectItem>
                      {admins.length > 0 && (
                        <SelectItem value="specific_admin">Specific Admin</SelectItem>
                      )}
                      <SelectItem value="all_employees">All Employees</SelectItem>
                      {employees.length > 0 && (
                        <SelectItem value="employee">Specific Employee</SelectItem>
                      )}
                      {otherUsers.length > 0 && (
                        <SelectItem value="user">Other User</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {newMessage.recipientType === "specific_admin" && admins.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Admin</label>
                    <Select
                      value={newMessage.recipientId}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipientId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an admin" />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => (
                          <SelectItem key={admin.user_id} value={admin.user_id}>
                            {admin.full_name || "Unnamed Admin"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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

                {newMessage.recipientType === "user" && otherUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select User</label>
                    <Select
                      value={newMessage.recipientId}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipientId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || "Unnamed User"}
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

        {sentMessages.length === 0 && receivedMessages.length === 0 ? (
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
          <div className="space-y-6">
            {/* Received Messages */}
            {receivedMessages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="secondary">{receivedMessages.length}</Badge>
                  Received Messages
                </h2>
                <div className="space-y-4">
                  {receivedMessages.map((msg) => (
                    <Card key={msg.id} className="border-primary/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{msg.subject}</CardTitle>
                            <p className="text-sm text-muted-foreground">From: {msg.sender_name || "Unknown"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Received</Badge>
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
                                    This will permanently delete this message.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMessage(msg.id, false)}
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
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Messages */}
            {sentMessages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="secondary">{sentMessages.length}</Badge>
                  Sent Messages
                </h2>
                <div className="space-y-4">
                  {sentMessages.map((msg) => (
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
                                    onClick={() => deleteMessage(msg.id, true)}
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
                            <p className="text-xs text-muted-foreground mb-1">Reply:</p>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;