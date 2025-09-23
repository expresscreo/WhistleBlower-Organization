import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MessageInput = forwardRef(({
  newMessage,
  setNewMessage,
  handleSendMessage,
  isSubmitting,
  replyToMessage,
  setReplyToMessage,
  handleMention,
  showMentions,
  mentionSuggestions,
  addMention,
  showEmojiPicker = false,
  EmojiPicker = null
}, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      setReplyToMessage?.(null);
    }
  };

  return (
    <div className="p-4 border-t space-y-2">
      {/* Reply preview */}
      {replyToMessage && (
        <div className="bg-muted/80 p-3 rounded-lg border-l-4 border-[#3ECF8E] text-sm flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#3ECF8E]">
              Replying to {replyToMessage.user?.name || (replyToMessage.updated_by ? 'Admin' : 'You')}
            </p>
            <p className="text-foreground/90 break-words overflow-hidden line-clamp-3">
              {replyToMessage.message}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0" 
            onClick={() => setReplyToMessage?.(null)}
          >
            <X className="h-4 w-4"/>
          </Button>
        </div>
      )}
      
      {/* Message input */}
      <div className="relative">
        <Textarea 
          ref={ref}
          placeholder={replyToMessage ? "Type your reply..." : "Type your message..."} 
          value={newMessage} 
          onChange={e => handleMention ? handleMention(e.target.value) : setNewMessage(e.target.value)} 
          onKeyDown={handleKeyDown}
          className={showEmojiPicker ? "pr-20" : "pr-12"}
          disabled={isSubmitting}
          rows={2}
        />
        
        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {/* Emoji picker */}
          {showEmojiPicker && EmojiPicker && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <EmojiPicker onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}/>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Send button */}
          <Button 
            onClick={handleSendMessage} 
            disabled={isSubmitting || !newMessage.trim()}
            size="sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs">Sending...</span>
              </div>
            ) : (
              replyToMessage ? 'Reply' : 'Send'
            )}
          </Button>
        </div>
        
        {/* Mention suggestions */}
        {showMentions && mentionSuggestions?.length > 0 && (
          <div className="absolute bottom-full mb-1 w-full max-h-48 overflow-y-auto bg-background border rounded-lg shadow-lg">
            <div className="p-2">
              {mentionSuggestions.map(person => (
                <div 
                  key={person.id} 
                  className="p-2 hover:bg-muted cursor-pointer rounded text-sm" 
                  onClick={() => addMention?.(person.name)}
                >
                  <span className="font-medium">{person.name}</span>
                  {person.role && <span className="text-muted-foreground ml-2">({person.role})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
