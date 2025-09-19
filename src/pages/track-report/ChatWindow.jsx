import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ChatWindow = ({ updates, newMessage, setNewMessage, onSendMessage, isSending, onKeyDown }) => {
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [updates]);

  const ReadStatusIcon = ({ isRead }) => {
    return isRead ? (
      <Eye className="w-5 h-5 text-primary" />
    ) : (
      <EyeOff className="w-5 h-5 text-muted-foreground" />
    );
  };

  return (
    <div className="bg-card p-6 md:p-8 border flex flex-col h-full">
      <h3 className="text-2xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-3" />
        Secure Chat
      </h3>
      <div className="bg-muted p-4 flex-grow h-80 overflow-y-auto mb-4 flex flex-col space-y-4">
        {updates.map((update) => {
          const isSender = !update.updated_by;
          return (
            <div
              key={update.id}
              className={cn('flex flex-col', isSender ? 'items-end' : 'items-start')}
            >
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold">{isSender ? 'You' : 'Admin'}</span>
                   <span className="text-xs text-muted-foreground">{format(new Date(update.created_at), 'p')}</span>
                </div>
                <div
                  className={cn(
                    'p-3 max-w-xs md:max-w-sm mt-1',
                    isSender
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  )}
                >
                  <p className="text-sm break-words">
                    {update.message}
                  </p>
                </div>
              {isSender && (
                <div className="mt-1 mr-1">
                  <ReadStatusIcon isRead={update.is_read} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          className="flex-grow resize-none"
        />
        <Button
          onClick={onSendMessage}
          disabled={isSending || !newMessage.trim()}
          className="w-full uppercase tracking-wider"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;