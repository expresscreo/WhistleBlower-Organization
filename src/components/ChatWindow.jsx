import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Users, MessageSquare, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Message from '@/components/Message';
import MessageInput from '@/components/MessageInput';
import { cn } from '@/lib/utils';

const ChatWindow = ({
  reportId,
  currentUser,
  participants = [],
  messages = [],
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onNewMessage,
  onRefreshMessages,
  isLoading = false,
  className = "",
  showParticipants = true,
  enableMentions = false,
  enableEmojis = false,
  EmojiPicker = null
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const messageInputRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !showScrollButton) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!reportId) return;

    const channel = supabase
      .channel(`chat_window_${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_updates',
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          const newUpdate = payload.new;
          if (newUpdate.message) {
            // Check if message is from another user
            if (newUpdate.updated_by !== currentUser?.id) {
              setNewMessageCount(prev => prev + 1);
              
              const senderName = newUpdate.updated_by ? 'Admin' : 'Reporter';
              toast({
                title: 'New message received',
                description: `You have a new message from ${senderName}`,
                duration: 3000,
              });
            }
          }
          if (onNewMessage) onNewMessage(newUpdate);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'report_updates',
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          if (onRefreshMessages) onRefreshMessages();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId, currentUser, onNewMessage, onRefreshMessages, toast]);

  // Handle scroll detection
  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    setShowScrollButton(!isAtBottom);
    
    if (isAtBottom && newMessageCount > 0) {
      setNewMessageCount(0);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setNewMessageCount(0);
    }
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const messageData = {
        report_id: reportId,
        message: newMessage.trim(),
        updated_by: currentUser?.id || null,
        is_read_by_admin: false,
        is_read_by_reporter: false,
      };
      
      if (replyToMessage) {
        messageData.reply_to_message_id = replyToMessage.id;
      }
      
      if (onSendMessage) {
        await onSendMessage(messageData);
      } else {
        // Default send implementation
        const { error } = await supabase
          .from('report_updates')
          .insert(messageData);
          
        if (error) throw error;
      }
      
      setNewMessage('');
      setReplyToMessage(null);
      
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply
  const handleReply = (message) => {
    setReplyToMessage(message);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Handle mentions
  const handleMention = (value) => {
    setNewMessage(value);
    
    if (!enableMentions) return;
    
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const suggestions = participants.filter(p => 
        p.name.toLowerCase().includes(query)
      ).slice(0, 5);
      
      setMentionSuggestions(suggestions);
      setShowMentions(suggestions.length > 0);
    } else {
      setShowMentions(false);
    }
  };

  // Add mention
  const addMention = (name) => {
    const mentionMatch = newMessage.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = newMessage.substring(0, mentionMatch.index);
      setNewMessage(`${beforeMention}@${name} `);
    }
    setShowMentions(false);
  };

  // Get message sender info
  const getMessageSender = (message) => {
    if (message.updated_by) {
      const participant = participants.find(p => p.id === message.updated_by);
      return {
        name: participant?.name || 'Admin',
        isOwnMessage: message.updated_by === currentUser?.id
      };
    }
    return {
      name: 'Reporter',
      isOwnMessage: !currentUser?.id // If no current user, assume reporter
    };
  };

  // Find reply message
  const findReplyMessage = (replyId) => {
    return messages.find(msg => msg.id === replyId);
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Secure Chat
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* New message indicator */}
            {newMessageCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                {newMessageCount} new
              </Badge>
            )}
            
            {/* Participants count */}
            {showParticipants && participants.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{participants.length}</span>
              </div>
            )}
            
            {/* Connection status */}
            <div className="flex items-center gap-1 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 relative">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full px-4"
            onScrollCapture={handleScroll}
          >
            <div className="space-y-4 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                    Loading messages...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const sender = getMessageSender(message);
                  const replyMessage = message.reply_to_message_id 
                    ? findReplyMessage(message.reply_to_message_id) 
                    : null;
                  
                  return (
                    <Message
                      key={message.id}
                      message={message}
                      isOwnMessage={sender.isOwnMessage}
                      senderName={sender.name}
                      timestamp={message.timestamp || message.created_at}
                      isRead={sender.isOwnMessage 
                        ? (currentUser?.id ? message.is_read_by_reporter : message.is_read_by_admin)
                        : true
                      }
                      replyToMessage={replyMessage ? {
                        ...replyMessage,
                        senderName: getMessageSender(replyMessage).name
                      } : null}
                      onReply={handleReply}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      canEdit={sender.isOwnMessage}
                      canDelete={sender.isOwnMessage || currentUser?.role === 'admin'}
                      showReadReceipt={sender.isOwnMessage}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Message input */}
        <MessageInput
          ref={messageInputRef}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          isSubmitting={isSubmitting}
          replyToMessage={replyToMessage}
          setReplyToMessage={setReplyToMessage}
          handleMention={handleMention}
          showMentions={showMentions}
          mentionSuggestions={mentionSuggestions}
          addMention={addMention}
          showEmojiPicker={enableEmojis}
          EmojiPicker={EmojiPicker}
        />
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
