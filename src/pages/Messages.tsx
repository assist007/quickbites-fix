import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, Plus, ArrowLeft, Trash2, Filter } from "lucide-react";
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
  sender_role?: string | null;
  recipient_name?: string | null;
  recipient_role?: string | null;
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-destructive text-destructive-foreground';
    case 'employee':
      return 'bg-blue-500 text-white';
    case 'user':
    default:
      return 'bg-green-500 text-white';
  }
};

interface StaffMember {
  user_id: string;
  full_name: string | null;
}


const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole: isEmployee, loading: roleLoading } = useRoleCheck('employee');
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [admins, setAdmins] = useState<StaffMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
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
    if (roleLoading) return;

    fetchMessages();
    fetchStaff();

    // Subscribe to sent messages
    const sentChannel = supabase
      .channel(`user-sent-messages:${user.id}`)
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

    // Subscribe to received messages (direct)
    const receivedDirectChannel = supabase
      .channel(`user-received-messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    // Subscribe to received messages (employees group inbox)
    const receivedAllEmployeesChannel = isEmployee
      ? supabase
          .channel(`user-received-all-employees:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `recipient_type=eq.all_employees`,
            },
            () => {
              fetchMessages();
            }
          )
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(sentChannel);
      supabase.removeChannel(receivedDirectChannel);
      if (receivedAllEmployeesChannel) supabase.removeChannel(receivedAllEmployeesChannel);
    };
  }, [user, authLoading, roleLoading, isEmployee, navigate]);

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

      // Get recipient info for sent messages
      if (sentData && sentData.length > 0) {
        const recipientIds = [...new Set(sentData.map(m => m.recipient_id).filter(Boolean))];
        
        let profiles: { id: string; full_name: string | null }[] = [];
        let roles: { user_id: string; role: string }[] = [];
        
        if (recipientIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", recipientIds);
          profiles = profilesData || [];

          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", recipientIds);
          roles = rolesData || [];
        }

        const sentWithRecipientInfo = sentData.map(msg => ({
          ...msg,
          recipient_name: msg.recipient_id 
            ? profiles.find(p => p.id === msg.recipient_id)?.full_name || "Unknown"
            : msg.recipient_type === 'admin' ? 'All Admins' : msg.recipient_type === 'all_employees' ? 'All Employees' : 'Unknown',
          recipient_role: msg.recipient_id 
            ? roles.find(r => r.user_id === msg.recipient_id)?.role || 'user'
            : msg.recipient_type === 'admin' ? 'admin' : msg.recipient_type === 'all_employees' ? 'employee' : 'user'
        }));
        setSentMessages(sentWithRecipientInfo as Message[]);
      } else {
        setSentMessages([]);
      }

      // Fetch received messages
      // For employees, also fetch messages sent to 'all_employees'
      let receivedQuery = supabase
        .from("messages")
        .select("id, user_id, subject, message, reply, is_read, created_at, replied_at, product_id, recipient_type, recipient_id")
        .order("created_at", { ascending: false });

      // Build the filter based on user role
      if (isEmployee) {
        // Employee sees messages sent directly to them OR to all_employees
        receivedQuery = receivedQuery.or(`recipient_id.eq.${user.id},recipient_type.eq.all_employees`);
      } else {
        // Regular users only see messages sent directly to them
        receivedQuery = receivedQuery.eq("recipient_id", user.id);
      }

      const { data: receivedData, error: receivedError } = await receivedQuery;

      if (receivedError) throw receivedError;

      // Get sender names and roles for received messages
      if (receivedData && receivedData.length > 0) {
        const senderIds = [...new Set(receivedData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", senderIds);

        const messagesWithSenderInfo = receivedData.map(msg => {
          const roleRecord = roles?.find(r => r.user_id === msg.user_id);
          // Determine role - check if sender is in user_roles, default to 'user'
          let senderRole = 'user';
          if (roleRecord) {
            senderRole = roleRecord.role;
          }
          return {
            ...msg,
            sender_name: profiles?.find(p => p.id === msg.user_id)?.full_name || "Unknown",
            sender_role: senderRole
          };
        });
        setReceivedMessages(messagesWithSenderInfo as Message[]);
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
         newMessage.recipientType === "specific_admin") && !newMessage.recipientId) {
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

  const sendReply = async (messageId: string) => {
    if (!replyText.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          reply: replyText,
          replied_by: user.id,
          replied_at: new Date().toISOString(),
          is_read: false
        })
        .eq('id', messageId);

      if (error) throw error;

      // Notify the original sender
      const message = receivedMessages.find(m => m.id === messageId);
      if (message) {
        await supabase.from('notifications').insert({
          user_id: message.user_id,
          type: 'message_reply',
          title: 'New Reply to Your Message',
          message: `Your message "${message.subject}" has been answered.`,
          data: { message_id: messageId }
        });
      }

      toast.success("Reply sent successfully");
      setReplyText("");
      setReplyingTo(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
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
            <h1 className="text-3xl font-bold">Messages</h1>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Badge variant="secondary">
                      {roleFilter === "all" 
                        ? receivedMessages.length 
                        : receivedMessages.filter(m => m.sender_role?.toLowerCase() === roleFilter.toLowerCase()).length}
                    </Badge>
                    Received Messages
                  </h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  {receivedMessages
                    .filter(msg => roleFilter === "all" || (msg.sender_role?.toLowerCase() === roleFilter.toLowerCase()))
                    .map((msg) => (
                    <Card key={msg.id} className="border-primary/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{msg.subject}</CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">From:</span>
                              <span className="text-sm font-bold">{msg.sender_name || "Unknown"}</span>
                              <Badge className={`text-xs capitalize ${getRoleBadgeColor(msg.sender_role || 'user')}`}>
                                {msg.sender_role}
                              </Badge>
                            </div>
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
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        
                        {msg.reply ? (
                          <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Your Reply:</p>
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
                        ) : replyingTo === msg.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => sendReply(msg.id)}
                                disabled={sending || !replyText.trim()}
                                className="gradient-hero text-primary-foreground"
                              >
                                {sending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Reply
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button onClick={() => setReplyingTo(msg.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        )}
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
                          <div>
                            <CardTitle className="text-lg">{msg.subject}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">To:</span>
                              <span className="text-sm font-bold">{msg.recipient_name || "Unknown"}</span>
                              <Badge className={`text-xs capitalize ${getRoleBadgeColor(msg.recipient_role || 'user')}`}>
                                {msg.recipient_role}
                              </Badge>
                            </div>
                          </div>
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