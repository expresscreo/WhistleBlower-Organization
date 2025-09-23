import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, MessageSquare, Wifi, WifiOff, ArrowDown, Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ReportChat = ({ 
  report, 
  updates, 
  user, 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  isSending,
  onNewMessage,
  onRefreshUpdates 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [updates]);

  // Direct real-time subscription for immediate message delivery
  useEffect(() => {
    if (!report || !report.id) return;

    console.log('Setting up ReportChat direct real-time subscription for report:', report.id);

    const channel = supabase
      .channel(`report_chat_direct_${report.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_updates',
          filter: `report_id=eq.${report.id}`,
        },
        (payload) => {
          console.log('ReportChat direct subscription received INSERT:', payload.new);
          const newUpdate = payload.new;
          
          if (newUpdate.message) {
            // Check if this is a new reporter message (not from current user)
            if (!newUpdate.updated_by) {
              console.log('ReportChat: New reporter message detected');
              setNewMessageCount(prev => prev + 1);
              toast({
                title: 'New message from reporter',
                description: 'You have a new message from the reporter',
                duration: 3000,
              });
              
              // Call onNewMessage to update parent state
              if (onNewMessage) {
                console.log('ReportChat: Calling onNewMessage');
                onNewMessage(newUpdate);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'report_updates',
          filter: `report_id=eq.${report.id}`,
        },
        (payload) => {
          console.log('ReportChat direct subscription received UPDATE:', payload.new);
          // Handle read status updates
          if (onRefreshUpdates) {
            console.log('ReportChat: Calling onRefreshUpdates');
            onRefreshUpdates();
          }
        }
      )
      .subscribe((status) => {
        console.log('ReportChat direct subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up ReportChat direct subscription');
      supabase.removeChannel(channel);
    };
  }, [report?.id, user?.id, onNewMessage, onRefreshUpdates, toast]);

  // Simplified read status management
  useEffect(() => {
    if (!report?.id || !user?.id) return;

    const markReporterMessagesAsRead = async () => {
      try {
        // Use existing function for simplicity
        await supabase.rpc('mark_messages_as_read', {
          p_report_id: report.id,
          p_reader_id: user.id
        });
      } catch (e) {
        console.log('mark_messages_as_read function not available');
      }
    };

    // Mark messages as read when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markReporterMessagesAsRead();
      }
    };

    // Mark messages as read immediately if page is visible
    if (document.visibilityState === 'visible') {
      markReporterMessagesAsRead();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [report?.id, user?.id]);

  // Handle scroll detection
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      setShowScrollButton(!isAtBottom);
      
      if (isAtBottom && newMessageCount > 0) {
        setNewMessageCount(0);
      }
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setNewMessageCount(0);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !report) return;
    
    // Prepare message with quote if replying
    let finalMessage = newMessage.trim();
    if (replyingTo) {
      const replyPrefix = `> Replying to ${replyingTo.updated_by ? 'Admin' : 'Reporter'}: "${replyingTo.message}"\n\n`;
      finalMessage = replyPrefix + finalMessage;
    }
    
    // Simple message data - use old schema for speed
    const messageData = {
      report_id: report.id,
      updated_by: user.id,
      message: finalMessage,
      is_read: false
    };
    
    const { data, error } = await supabase
      .from('report_updates')
      .insert(messageData)
      .select('*, users(id, name, user_type)')
      .single();
      
    if (error) {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else {
      if (onNewMessage) onNewMessage(data);
      setNewMessage('');
      setReplyingTo(null);
      
      // Update report to show reporter has new messages
      await supabase.from('reports').update({ 
        reporter_has_viewed: false,
        last_updated_at: new Date().toISOString()
      }).eq('id', report.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
    }
  };

  const handleReply = (message) => {
    // Parse the message to get only the main content (not nested quotes)
    const parsedMessage = parseMessage(message.message);
    
    // Create a clean reply object with only the main content
    const cleanReplyMessage = {
      ...message,
      message: parsedMessage.content // Use only the main content, not the full quoted message
    };
    
    setReplyingTo(cleanReplyMessage);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Find the original message that was replied to
  const findReplyMessage = (replyId) => {
    return updates.find(upd => upd.id === replyId);
  };

  // Parse message to extract quote and main content
  const parseMessage = (message) => {
    if (!message) return { quote: null, content: message };
    
    const quoteRegex = /^> Replying to (Admin|You|Reporter): "(.+?)"\n\n(.+)$/s;
    const match = message.match(quoteRegex);
    
    if (match) {
      // Extract the quoted message and clean it of any nested quotes
      let quotedMessage = match[2];
      
      // If the quoted message itself contains a quote, extract only its main content
      const nestedQuoteRegex = /^> Replying to .+?: ".+?"\n\n(.+)$/s;
      const nestedMatch = quotedMessage.match(nestedQuoteRegex);
      if (nestedMatch) {
        quotedMessage = nestedMatch[1]; // Use only the main content, not the nested quote
      }
      
      return {
        quote: {
          sender: match[1],
          message: quotedMessage
        },
        content: match[3]
      };
    }
    
    return { quote: null, content: message };
  };

  const ReadStatusIcon = ({ isRead }) => {
    return isRead ? (
      <Eye className="w-5 h-5 text-[#3ECF8E]" />
    ) : (
      <EyeOff className="w-5 h-5 text-gray-400" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-2xl">
            <MessageSquare className="mr-2 text-primary" />
            Secure Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            {newMessageCount > 0 && (
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse">
                {newMessageCount} new
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            ref={chatContainerRef}
            className="bg-muted p-4 h-80 overflow-y-auto mb-4 flex flex-col space-y-4"
            onScroll={handleScroll}
          >
            {updates.filter(upd => upd.message).map((update) => {
              const replyMessage = update.reply_to_message_id ? findReplyMessage(update.reply_to_message_id) : null;
              const parsedMessage = parseMessage(update.message);
              const isSender = update.updated_by === user.id;
              const senderName = isSender ? update.users?.name || 'You' : 'Reporter';
              
              return (
                <div
                  key={update.id}
                  className={cn('flex flex-col group', isSender ? 'items-end' : 'items-start')}
                >
                  <div className="relative">
                    {/* Reply button - always show */}
                    <button
                      onClick={() => handleReply(update)}
                      className={`absolute ${isSender ? '-left-12' : '-right-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg`}
                      title="Reply to this message"
                    >
                      <Reply className="h-4 w-4 text-white" />
                    </button>
                    
                    <div
                      className={cn(
                        'p-3 max-w-xs md:max-w-md mt-1 rounded-lg',
                        isSender
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      )}
                    >
                      {/* Show quoted message - from database field or parsed from text */}
                      {(replyMessage || parsedMessage.quote) && (
                        <div className={`mb-2 p-2 rounded ${isSender ? 'bg-primary-foreground/30' : 'bg-muted'} border-l-2 ${isSender ? 'border-white/60' : 'border-primary'}`}>
                          <p className={`text-xs ${isSender ? 'text-white/85' : 'text-muted-foreground'} mb-1`}>
                            Replying to {parsedMessage.quote ? parsedMessage.quote.sender : (replyMessage?.updated_by ? 'Admin' : 'Reporter')}:
                          </p>
                          <p className={`text-xs ${isSender ? 'text-white' : 'text-foreground/95'} line-clamp-2`}>
                            {parsedMessage.quote ? parsedMessage.quote.message : replyMessage?.message}
                          </p>
                        </div>
                      )}
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {parsedMessage.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{senderName} - {format(new Date(update.timestamp || update.created_at), 'p')}</span>
                    {isSender && (
                      // Check both new and old read status fields for admin messages
                      (update.is_read_by_reporter !== undefined ? update.is_read_by_reporter : update.is_read) ? 
                        <Eye className="w-5 h-5 text-[#3ECF8E]" /> : 
                        <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="absolute bottom-6 right-4 h-8 w-8 rounded-full p-0 shadow-lg"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Reply preview */}
        {replyingTo && (
          <div className="bg-muted/80 p-3 mb-2 rounded-lg border-l-4 border-primary">
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs text-muted-foreground font-medium flex-shrink-0">
                Replying to {replyingTo.updated_by ? 'Admin' : 'Reporter'}:
              </p>
              <button
                onClick={cancelReply}
                className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
                title="Cancel reply"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-sm text-foreground break-words overflow-hidden line-clamp-3">{replyingTo.message}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className="w-full uppercase tracking-wider"
          >
            {replyingTo ? 'SEND REPLY' : 'SEND'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportChat;