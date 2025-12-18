import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, ArrowLeft, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
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

interface Message {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  reply: string | null;
  is_read: boolean;
  created_at: string;
  replied_at: string | null;
  profiles?: { full_name: string | null } | null;
}

const AdminMessages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { hasRole: isEmployee, loading: employeeLoading } = useRoleCheck('employee');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const canAccess = isAdmin || isEmployee;
  const isLoading = authLoading || adminLoading || employeeLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (!isLoading && !canAccess) {
      toast.error("Access denied");
      navigate('/');
      return;
    }
  }, [user, authLoading, canAccess, isLoading, navigate]);

  useEffect(() => {
    if (canAccess) {
      fetchMessages();
    }
  }, [canAccess]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.id === msg.user_id) || null
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
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

      // Notify the user
      const message = messages.find(m => m.id === messageId);
      if (message) {
        await supabase.from('notifications').insert({
          user_id: message.user_id,
          type: 'message_reply',
          title: 'New Reply to Your Message',
          message: `Your question "${message.subject}" has been answered.`,
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  const pendingMessages = messages.filter(m => !m.reply);
  const repliedMessages = messages.filter(m => m.reply);

  return (
    <div className="min-h-screen bg-background py-8 pt-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Customer Messages</h1>
          <Badge variant="secondary" className="ml-2">{pendingMessages.length} pending</Badge>
        </div>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No messages yet</h3>
              <p className="text-muted-foreground">Customer inquiries will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingMessages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Replies</h2>
                <div className="space-y-4">
                  {pendingMessages.map((msg) => (
                    <Card key={msg.id} className="border-warning/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{msg.subject}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {msg.profiles?.full_name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-warning text-warning">
                              Awaiting Reply
                            </Badge>
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
                        <div className="bg-muted/50 rounded-lg p-3 mb-4">
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        
                        {replyingTo === msg.id ? (
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

            {repliedMessages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Replied Messages</h2>
                <div className="space-y-4">
                  {repliedMessages.map((msg) => (
                    <Card key={msg.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{msg.subject}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {msg.profiles?.full_name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-success">Replied</Badge>
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
                                    This will permanently delete this message and its reply.
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
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Your Reply:</p>
                          <p className="text-sm">{msg.reply}</p>
                        </div>
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

export default AdminMessages;