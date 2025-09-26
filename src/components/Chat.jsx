import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, MessageCircle, Wifi, WifiOff, ArrowDown, Reply, X } from 'lucide-react';

const Chat = ({ report, updates, onNewMessage, onRefreshUpdates }) => {
  const [newMessage, setNewMessage] = useState('');
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

  // Real-time subscription for new messages
  useEffect(() => {
    if (!report || !report.id) return;

    // Setting up reporter real-time subscription for report

    const channel = supabase
      .channel(`chat_${report.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_updates',
          filter: `report_id=eq.${report.id}`,
        },
        (payload) => {
          // Reporter received new message
          const newUpdate = payload.new;
          if (newUpdate.message && newUpdate.updated_by) {
            // This is a new admin message
            setNewMessageCount(prev => prev + 1);
            toast({
              title: 'New message received',
              description: 'You have a new message from admin',
              duration: 3000,
            });
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
          filter: `report_id=eq.${report.id}`,
        },
        (payload) => {
          // Reporter received message update
          // Handle read status updates - refresh to get latest read status
          if (onRefreshUpdates) {
            onRefreshUpdates();
          }
        }
      )
      .subscribe((status) => {
        // Reporter subscription status updated
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      // Cleaning up reporter subscription
      supabase.removeChannel(channel);
    };
  }, [report?.id]);

  // Simplified read status management
  useEffect(() => {
    if (!report?.id) return;

    const markAdminMessagesAsRead = async () => {
      try {
        // Use existing function for simplicity
        await supabase.rpc('mark_messages_as_read', {
          p_report_id: report.id,
          p_reader_id: null
        });
      } catch (e) {
        console.log('mark_messages_as_read function not available');
      }
    };

    // Mark messages as read when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markAdminMessagesAsRead();
      }
    };

    // Mark messages as read immediately if page is visible
    if (document.visibilityState === 'visible') {
      markAdminMessagesAsRead();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [report?.id]);

  // Reset new message count when user scrolls to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      if (isAtBottom && newMessageCount > 0) {
        setNewMessageCount(0);
      }
    }
  }, [updates, newMessageCount]);

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
    if (!newMessage.trim() || !report) return;
    
    // Prepare message with quote if replying
    let finalMessage = newMessage.trim();
    if (replyingTo) {
      const replyPrefix = `> Replying to ${replyingTo.updated_by ? 'Admin' : 'You'}: "${replyingTo.message}"\n\n`;
      finalMessage = replyPrefix + finalMessage;
    }
    
    // Simple message data - use old schema for speed
    const messageData = {
      report_id: report.id,
      message: finalMessage,
      updated_by: null, // Reporter messages have null updated_by
      is_read: false
    };
    
    const { data, error } = await supabase
      .from('report_updates')
      .insert(messageData)
      .select()
      .single();
      
    if (error) {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else {
      if (onNewMessage) onNewMessage(data);
      setNewMessage('');
      setReplyingTo(null);
      
      // Update report to show admin has new messages
      await supabase.from('reports').update({ admin_has_viewed: false }).eq('id', report.id);
    }
  };

  const handleChatKeyDown = (e) => {
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

  return (
    <div className="pt-6 border-t">
      {/* Chat header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" /> 
          Secure Chat
        </h3>
        <div className="flex items-center gap-2">
          {newMessageCount > 0 && (
            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse">
              {newMessageCount} new
            </div>
          )}
          {/* Connection status indicator */}
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
      
      {/* Messages container */}
      <div className="relative">
        <div 
          ref={chatContainerRef} 
          className="bg-muted/50 p-2 md:p-4 h-80 overflow-y-auto mb-4 space-y-4"
          onScroll={handleScroll}
        >
          {updates.filter(upd => upd.message).map(upd => {
            const replyMessage = upd.reply_to_message_id ? findReplyMessage(upd.reply_to_message_id) : null;
            const parsedMessage = parseMessage(upd.message);
            
            return (
              <div key={upd.id} className={`flex flex-col ${upd.updated_by ? 'items-start' : 'items-end'} group`}>
                <div className="relative">
                  {/* Reply button - always show */}
                  <button
                    onClick={() => handleReply(upd)}
                    className={`absolute ${upd.updated_by ? '-right-12' : '-left-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg`}
                    title="Reply to this message"
                  >
                    <Reply className="h-4 w-4 text-white" />
                  </button>
                  
                  <div className={`relative p-3 max-w-xs ${upd.updated_by ? 'bg-background border' : 'bg-primary text-white'} rounded-lg`}>
                    {/* Show quoted message - from database field or parsed from text */}
                    {(replyMessage || parsedMessage.quote) && (
                      <div className={`mb-2 p-2 rounded ${upd.updated_by ? 'bg-muted' : 'bg-primary-foreground/30'} border-l-2 ${upd.updated_by ? 'border-primary' : 'border-white/60'}`}>
                        <p className={`text-xs ${upd.updated_by ? 'text-muted-foreground' : 'text-white/85'} mb-1`}>
                          Replying to {parsedMessage.quote ? parsedMessage.quote.sender : (replyMessage?.updated_by ? 'Admin' : 'You')}:
                        </p>
                        <p className={`text-xs ${upd.updated_by ? 'text-foreground/95' : 'text-white'} line-clamp-2`}>
                          {parsedMessage.quote ? parsedMessage.quote.message : replyMessage?.message}
                        </p>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{parsedMessage.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{upd.updated_by ? 'Admin' : 'You'} - {new Date(upd.timestamp || upd.created_at).toLocaleTimeString()}</span>
                  {!upd.updated_by && (
                    // Check both new and old read status fields
                    (upd.is_read_by_admin !== undefined ? upd.is_read_by_admin : upd.is_read) ? 
                      <Eye className="h-5 w-5 text-[#3ECF8E]" /> : 
                      <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Scroll to bottom button */}
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
      
      {/* Message input with reply preview */}
      {replyingTo && (
        <div className="bg-muted/80 p-3 mb-2 rounded-lg border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-xs text-muted-foreground font-medium flex-shrink-0">
              Replying to {replyingTo.updated_by ? 'Admin' : 'You'}:
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
      
      <div className="flex flex-col gap-2">
        <Textarea 
          ref={textareaRef}
          placeholder={replyingTo ? "Type your reply..." : "Type your message..."} 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          onKeyDown={handleChatKeyDown}
          rows={2} 
        />
        <Button onClick={handleSendMessage} className="w-full uppercase">
          {replyingTo ? 'SEND REPLY' : 'SEND'}
        </Button>
      </div>
    </div>
  );
};

export default Chat;
