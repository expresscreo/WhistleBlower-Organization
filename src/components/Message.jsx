import React from 'react';
import { format } from 'date-fns';
import { Eye, EyeOff, Reply, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Message = ({
  message,
  isOwnMessage,
  senderName,
  timestamp,
  isRead,
  replyToMessage,
  onReply,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  showReadReceipt = true,
  className = ""
}) => {
  const formatTime = (time) => {
    try {
      return format(new Date(time), 'p');
    } catch {
      return 'Invalid time';
    }
  };

  return (
    <div className={cn(
      'flex flex-col group',
      isOwnMessage ? 'items-end' : 'items-start',
      className
    )}>
      <div className="relative max-w-[80%]">
        {/* Message actions (reply, edit, delete) */}
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1',
          isOwnMessage ? '-left-16' : '-right-16'
        )}>
          {/* Reply button */}
          {onReply && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={() => onReply(message)}
              title="Reply to this message"
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}
          
          {/* More actions dropdown */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full shadow-lg"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(message)}>
                    Edit message
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(message)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Message bubble */}
        <div className={cn(
          'p-3 rounded-lg shadow-sm',
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-background border'
        )}>
          {/* Reply quote */}
          {replyToMessage && (
            <div className={cn(
              'mb-2 p-2 rounded border-l-2',
              isOwnMessage 
                ? 'bg-primary-foreground/20 border-primary-foreground/60' 
                : 'bg-muted border-primary'
            )}>
              <p className={cn(
                'text-xs mb-1 font-medium',
                isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                Replying to {replyToMessage.senderName || 'Unknown'}:
              </p>
              <p className={cn(
                'text-xs line-clamp-2',
                isOwnMessage ? 'text-primary-foreground/90' : 'text-foreground/80'
              )}>
                {replyToMessage.message || replyToMessage.content}
              </p>
            </div>
          )}
          
          {/* Message content */}
          <div className="space-y-1">
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.message || message.content}
            </p>
            
            {/* Message attachments or media */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className={cn(
                    'text-xs p-2 rounded border',
                    isOwnMessage 
                      ? 'bg-primary-foreground/20 border-primary-foreground/30' 
                      : 'bg-muted border-border'
                  )}>
                    📎 {attachment.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message metadata */}
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>{senderName} • {formatTime(timestamp)}</span>
        
        {/* Read receipt for own messages */}
        {isOwnMessage && showReadReceipt && (
          <div className="flex items-center" title={isRead ? 'Read' : 'Delivered'}>
            {isRead ? (
              <Eye className="h-3 w-3 text-[#3ECF8E]" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* Message status indicators */}
        {message.isEdited && (
          <span className="text-xs text-muted-foreground">(edited)</span>
        )}
        
        {message.isDeleted && (
          <span className="text-xs text-muted-foreground italic">This message was deleted</span>
        )}
      </div>
    </div>
  );
};

export default Message;
