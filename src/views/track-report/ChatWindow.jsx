import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError } from '@/components/ui/form-feedback';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, MessageCircle, Wifi, WifiOff, ArrowDown, Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ChatWindow = ({ 
  report, 
  updates, 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  isSending, 
  onKeyDown,
  onNewMessage,
  onRefreshUpdates,
  sendError = '',
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const prevUpdatesLength = useRef(0);
  const [messageError, setMessageError] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [updates]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!report || !report.id) return;

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
          const newUpdate = payload.new;
          if (newUpdate.message && newUpdate.updated_by) {
            // This is a new admin message
            setNewMessageCount(prev => prev + 1);
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
          // Handle read status updates
          if (onRefreshUpdates) {
            onRefreshUpdates();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [report, onNewMessage, onRefreshUpdates]);

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
    if (!newMessage.trim()) return;
    setMessageError('');

    if (onSendMessage) {
      onSendMessage();
      return;
    }

    if (!report) return;
    
    const messageData = {
      report_id: report.id,
      message: newMessage.trim(),
      is_read_by_admin: false,
      is_read_by_reporter: false,
    };
    
    if (replyingTo) {
      messageData.reply_to_message_id = replyingTo.id;
    }
    
    const { data, error } = await supabase
      .from('report_updates')
      .insert(messageData)
      .select()
      .single();
      
    if (error) {
      setMessageError(error.message);
    } else {
      if (onNewMessage) onNewMessage(data);
      setNewMessage('');
      setReplyingTo(null);
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
    setReplyingTo(message);
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

  const ReadStatusIcon = ({ isRead }) => {
    return isRead ? (
      <Eye className="w-5 h-5 text-[#3ECF8E]" />
    ) : (
      <EyeOff className="w-5 h-5 text-gray-400" />
    );
  };

  return (
    <div className="bg-card p-6 md:p-8 border flex flex-col h-full">
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
      
      <div className="relative">
        <div 
          ref={chatContainerRef} 
          className="bg-muted/50 p-2 md:p-4 h-80 overflow-y-auto mb-4 space-y-4"
          onScroll={handleScroll}
        >
          {updates.filter(upd => upd.message).map(upd => {
            const replyMessage = upd.reply_to_message_id ? findReplyMessage(upd.reply_to_message_id) : null;
            const isSender = !upd.updated_by;
            return (
              <div key={upd.id} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} group`}>
                <div className="relative">
                  {/* Reply button */}
                  <button
                    onClick={() => handleReply(upd)}
                    className={`absolute ${isSender ? '-left-12' : '-right-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 shadow-lg`}
                    title="Reply to this message"
                  >
                    <Reply className="h-4 w-4 text-white" />
                  </button>
                  
                  <div className={`relative p-3 max-w-xs ${isSender ? 'bg-primary text-white' : 'bg-background border'} rounded-lg`}>
                    {/* Show quoted message if this is a reply */}
                    {replyMessage && (
                      <div className={`mb-2 p-2 rounded ${isSender ? 'bg-primary-foreground/30' : 'bg-muted'} border-l-2 ${isSender ? 'border-white/60' : 'border-primary'}`}>
                        <p className={`text-xs ${isSender ? 'text-white/85' : 'text-muted-foreground'} mb-1`}>
                          Replying to {replyMessage.updated_by ? 'Admin' : 'You'}:
                        </p>
                        <p className={`text-xs ${isSender ? 'text-white' : 'text-foreground/95'} line-clamp-2`}>
                          {replyMessage.message}
                        </p>
                      </div>
                    )}
                    <p className="text-sm">{upd.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{isSender ? 'You' : 'Admin'} - {format(new Date(upd.timestamp || upd.created_at), 'p')}</span>
                  {isSender && (upd.is_read_by_admin ? <Eye className="h-5 w-5 text-[#3ECF8E]" /> : <EyeOff className="h-5 w-5 text-gray-400" />)}
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
          className="flex-grow resize-none"
        />
        <FieldError message={sendError || messageError} />
        <Button
          onClick={handleSendMessage}
          loading={isSending}
          disabled={!newMessage.trim()}
          className="w-full uppercase tracking-wider"
        >
          {replyingTo ? 'SEND REPLY' : 'SEND'}
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;