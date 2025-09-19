import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ReportChat = ({ updates, user, newMessage, setNewMessage, onSendMessage, isSending }) => {
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [updates]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const ReadStatusIcon = ({ isRead }) => {
    return isRead ? (
      <Eye className="w-5 h-5 text-primary" />
    ) : (
      <EyeOff className="w-5 h-5 text-muted-foreground" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <MessageSquare className="mr-2 text-primary" />
          Secure Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 h-80 overflow-y-auto mb-4 flex flex-col space-y-4">
          {updates.map((update) => {
            const isSender = update.updated_by === user.id;
            const senderName = isSender ? update.users?.name || 'You' : 'Reporter';
            return (
              <div
                key={update.id}
                className={cn('flex flex-col', isSender ? 'items-end' : 'items-start')}
              >
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold">{senderName}</span>
                   <span className="text-xs text-muted-foreground">{format(new Date(update.created_at), 'p')}</span>
                </div>
                <div
                  className={cn(
                    'p-3 max-w-xs md:max-w-md mt-1',
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
        <div className="flex flex-col space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <Button
            onClick={onSendMessage}
            disabled={isSending}
            className="w-full uppercase tracking-wider"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportChat;