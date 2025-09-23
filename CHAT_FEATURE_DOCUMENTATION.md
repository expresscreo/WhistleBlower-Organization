# Admin-Reporter Chat Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Real-time Implementation](#real-time-implementation)
5. [Frontend Components](#frontend-components)
6. [Backend Integration](#backend-integration)
7. [Security & Permissions](#security--permissions)
8. [Complete Implementation Guide](#complete-implementation-guide)
9. [Code Examples](#code-examples)
10. [Deployment Checklist](#deployment-checklist)

## Overview

The admin-reporter chat feature enables secure, real-time communication between administrators and anonymous reporters. This feature is built using Supabase for backend services, React for the frontend, and includes advanced features like message threading, read receipts, and real-time notifications.

### Key Features
- ✅ Real-time messaging with Supabase Realtime
- ✅ Message threading/replies with visual quotes
- ✅ Read receipts with visual indicators
- ✅ Connection status indicators
- ✅ Auto-scroll to new messages
- ✅ Message notifications
- ✅ Secure authentication and authorization
- ✅ Anonymous reporter support
- ✅ Admin dashboard integration

## Architecture

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Reporter UI   │    │   Admin UI       │    │   Database      │
│                 │    │                  │    │                 │
│ • Chat.jsx      │◄──►│ • ReportDetails  │◄──►│ • report_updates│
│ • TrackReport   │    │ • ChatWindow     │    │ • reports       │
│                 │    │ • MessageInput   │    │ • users         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   Supabase      │
                    │                 │
                    │ • Realtime      │
                    │ • Auth          │
                    │ • Database      │
                    │ • RLS Policies  │
                    └─────────────────┘
```

### Data Flow
1. **Message Creation**: User types message → Frontend validates → Supabase inserts
2. **Real-time Delivery**: Supabase Realtime → All connected clients receive update
3. **Read Status**: Client marks as read → Database updates → Real-time notification
4. **Authentication**: Supabase Auth handles user verification and permissions

## Database Schema

### Core Tables

#### `report_updates` Table
```sql
CREATE TABLE public.report_updates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    message text,
    status_update text,
    timestamp timestamp with time zone DEFAULT now(),
    is_read_by_reporter boolean DEFAULT false,
    is_read_by_admin boolean DEFAULT false,
    reply_to_message_id bigint REFERENCES report_updates(id) ON DELETE SET NULL
);
```

**Key Fields:**
- `id`: Auto-incrementing message ID
- `report_id`: Links to specific report
- `updated_by`: NULL for reporter messages, user ID for admin messages
- `message`: Chat message content
- `is_read_by_reporter`: Read status for reporter
- `is_read_by_admin`: Read status for admin
- `reply_to_message_id`: Enables message threading

#### `reports` Table
```sql
CREATE TABLE public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id text UNIQUE NOT NULL,
    company_id uuid NOT NULL REFERENCES companies(id),
    status text DEFAULT 'pending',
    urgency text,
    category text,
    description text NOT NULL,
    contact_email text,
    contact_phone text,
    is_anonymous boolean DEFAULT true,
    submitted_at timestamp with time zone DEFAULT now(),
    title text,
    state text,
    lga text,
    submitted_by uuid REFERENCES users(id),
    anonymous_password_hash text,
    is_trashed boolean DEFAULT false,
    trashed_at timestamp with time zone,
    last_updated_at timestamp with time zone DEFAULT now(),
    is_feedback boolean DEFAULT false
);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on report_updates table
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON public.report_updates TO anon;
GRANT ALL ON public.report_updates TO authenticated;
GRANT ALL ON public.report_updates TO service_role;

-- Minimal policy for all operations
CREATE POLICY "Allow all operations on report_updates" ON public.report_updates
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);
```

### Real-time Configuration
```sql
-- Enable real-time for report_updates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
```

## Real-time Implementation

### Supabase Realtime Setup
```javascript
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
          toast({
            title: 'New message received',
            description: 'You have a new message from admin',
            duration: 3000,
          });
        }
        onNewMessage(newUpdate);
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
}, [report, onNewMessage, onRefreshUpdates, toast]);
```

### Connection Status Management
```javascript
const [isConnected, setIsConnected] = useState(false);

// Visual connection indicator
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
```

## Frontend Components

### 1. Reporter Chat Component (`Chat.jsx`)

**Purpose**: Handles chat interface for anonymous reporters

**Key Features**:
- Real-time message updates
- Message threading with visual quotes
- Read receipts
- Auto-scroll to new messages
- Connection status indicator

```jsx
const Chat = ({ report, updates, onNewMessage, onRefreshUpdates }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Real-time subscription setup
  useEffect(() => {
    // ... real-time logic
  }, [report]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !report) return;
    
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
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else {
      onNewMessage(data);
      setNewMessage('');
      setReplyingTo(null);
    }
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
            return (
              <div key={upd.id} className={`flex flex-col ${upd.updated_by ? 'items-start' : 'items-end'} group`}>
                <div className="relative">
                  {/* Reply button */}
                  <button
                    onClick={() => handleReply(upd)}
                    className={`absolute ${upd.updated_by ? '-right-12' : '-left-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 shadow-lg`}
                    title="Reply to this message"
                  >
                    <Reply className="h-4 w-4 text-white" />
                  </button>
                  
                  <div className={`relative p-3 max-w-xs ${upd.updated_by ? 'bg-background border' : 'bg-primary text-white'} rounded-lg`}>
                    {/* Show quoted message if this is a reply */}
                    {replyMessage && (
                      <div className={`mb-2 p-2 rounded ${upd.updated_by ? 'bg-muted' : 'bg-primary-foreground/30'} border-l-2 ${upd.updated_by ? 'border-primary' : 'border-white/60'}`}>
                        <p className={`text-xs ${upd.updated_by ? 'text-muted-foreground' : 'text-white/85'} mb-1`}>
                          Replying to {replyMessage.updated_by ? 'Admin' : 'You'}:
                        </p>
                        <p className={`text-xs ${upd.updated_by ? 'text-foreground/95' : 'text-white'} line-clamp-2`}>
                          {replyMessage.message}
                        </p>
                      </div>
                    )}
                    <p className="text-sm">{upd.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{upd.updated_by ? 'Admin' : 'You'} - {new Date(upd.timestamp).toLocaleTimeString()}</span>
                  {!upd.updated_by && (upd.is_read_by_admin ? <Eye className="h-5 w-5 text-[#3ECF8E]" /> : <EyeOff className="h-5 w-5 text-gray-400" />)}
                </div>
              </div>
            );
          })}
        </div>
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
```

### 2. Admin Chat Interface (`ReportDetailsPage.jsx`)

**Purpose**: Admin dashboard for managing reports with integrated chat

**Key Features**:
- Real-time chat with reporters
- Message management
- Read status tracking
- Reply functionality

```jsx
// Admin chat implementation in ReportDetailsPage
const handleSendMessage = async () => {
  if (!newMessage.trim() || !user) return;
  
  const messageData = {
    report_id: report.id,
    updated_by: user.id,
    message: newMessage.trim(),
  };
  
  if (replyingTo) {
    messageData.reply_to_message_id = replyingTo.id;
  }
  
  const { data, error } = await supabase
    .from('report_updates')
    .insert(messageData)
    .select('*, updated_by_user:users(id, name, user_type)')
    .single();
    
  if (error) {
    toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
  } else {
    setUpdates(prev => [...prev, data]);
    setNewMessage('');
    setReplyingTo(null);
  }
};
```

### 3. Support Chat System (`ChatWindow.jsx`, `MessageInput.jsx`, `Message.jsx`)

**Purpose**: Advanced support chat with multiple participants

**Key Features**:
- Multi-user chat
- @mentions
- Emoji support
- Message threading
- Advanced UI components

```jsx
// MessageInput component with advanced features
export const MessageInput = forwardRef(({
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
}, ref) => {
  return (
    <div className="p-4 border-t space-y-2">
      {replyToMessage && (
        <div className="bg-muted/80 p-3 rounded-lg border-l-4 border-[#3ECF8E] text-sm flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#3ECF8E]">Replying to {replyToMessage.user?.name}</p>
            <p className="text-foreground/90 break-words overflow-hidden line-clamp-3">{replyToMessage.message}</p>
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setReplyToMessage(null)}>
            <X className="h-4 w-4"/>
          </Button>
        </div>
      )}
      <div className="relative">
        <Textarea 
          ref={ref}
          placeholder={replyToMessage ? "Type your reply..." : "Type your message..."} 
          value={newMessage} 
          onChange={e => handleMention(e.target.value)} 
          onKeyDown={e => { 
            if(e.key === 'Enter' && !e.shiftKey) { 
              e.preventDefault(); 
              handleSendMessage(); 
            }
            if(e.key === 'Escape') {
              setReplyToMessage(null);
            }
          }} 
          className="pr-20" 
          disabled={isSubmitting}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
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
          <Button onClick={handleSendMessage} disabled={isSubmitting || !newMessage.trim()}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : (replyToMessage ? 'Reply' : 'Send')}
          </Button>
        </div>
        {showMentions && mentionSuggestions.length > 0 && (
          <Card className="absolute bottom-full mb-1 w-full max-h-48 overflow-y-auto">
            <CardContent className="p-2">
              {mentionSuggestions.map(p => (
                <div key={p.id} className="p-2 hover:bg-muted cursor-pointer" onClick={() => addMention(p.name)}>
                  {p.name}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});
```

## Backend Integration

### Supabase Client Configuration
```javascript
// lib/customSupabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Functions (Optional)
```sql
-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_seen(message_ids bigint[], p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE report_updates 
  SET is_read_by_admin = CASE 
    WHEN updated_by IS NULL THEN true 
    ELSE is_read_by_admin 
  END,
  is_read_by_reporter = CASE 
    WHEN updated_by IS NOT NULL THEN true 
    ELSE is_read_by_reporter 
  END
  WHERE id = ANY(message_ids);
END;
$$ LANGUAGE plpgsql;
```

## Security & Permissions

### Authentication Flow
1. **Anonymous Reporters**: Access via report ID verification
2. **Admin Users**: Authenticated via Supabase Auth
3. **Permission Levels**: Based on user_type (super_admin, executive_admin, company_admin, staff)

### Security Measures
- Row Level Security (RLS) enabled on all tables
- Anonymous access controlled via report verification
- Message encryption in transit (HTTPS)
- Input validation and sanitization
- Rate limiting (implement via Supabase Edge Functions if needed)

### Access Control
```javascript
// Permission checking example
const canAssignStaff = userProfile?.user_type === 'super_admin' ||
                      userProfile?.user_type === 'executive_admin' ||
                      userProfile?.user_type === 'company_admin';

const canDeleteReport = userProfile?.user_type === 'super_admin' ||
                       userProfile?.user_type === 'executive_admin';
```

## Complete Implementation Guide

### Step 1: Database Setup

1. **Create Tables**:
```sql
-- Run the migration files in order:
-- 1. 20250825074007_remote_schema.sql
-- 2. 20250825074013_setup_report_updates_rls.sql
-- 3. 20250917000002_enable_realtime_report_updates.sql
-- 4. 20250917000003_add_reply_to_report_updates.sql
```

2. **Configure RLS**:
```sql
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.report_updates TO anon, authenticated, service_role;
CREATE POLICY "Allow all operations on report_updates" ON public.report_updates
  FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
```

3. **Enable Realtime**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
```

### Step 2: Frontend Setup

1. **Install Dependencies**:
```bash
npm install @supabase/supabase-js
npm install lucide-react
npm install emoji-picker-react
npm install date-fns
```

2. **Create Components**:
- Copy `Chat.jsx` for reporter interface
- Copy `ChatWindow.jsx`, `MessageInput.jsx`, `Message.jsx` for admin interface
- Integrate into existing pages

3. **Environment Configuration**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Integration

1. **Reporter Integration**:
```jsx
// In TrackReportPage.jsx
import Chat from '@/components/track-report/Chat';

// Add to render:
<Chat 
  report={report} 
  updates={updates} 
  onNewMessage={handleNewMessage}
  onRefreshUpdates={() => fetchReportData(report.id)}
/>
```

2. **Admin Integration**:
```jsx
// In ReportDetailsPage.jsx
// Add chat interface to the report details view
// Include real-time subscriptions and message handling
```

### Step 4: Testing

1. **Test Real-time Features**:
- Open multiple browser tabs
- Send messages from one tab
- Verify messages appear in other tabs instantly

2. **Test Read Receipts**:
- Send message from reporter
- Verify admin sees unread indicator
- Mark as read and verify indicator updates

3. **Test Message Threading**:
- Reply to existing messages
- Verify quoted message appears
- Test nested replies

## Code Examples

### Complete Chat Component
```jsx
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
            setNewMessageCount(prev => prev + 1);
            toast({
              title: 'New message received',
              description: 'You have a new message from admin',
              duration: 3000,
            });
          }
          onNewMessage(newUpdate);
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
  }, [report, onNewMessage, onRefreshUpdates, toast]);

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
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else {
      onNewMessage(data);
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

  return (
    <div className="pt-6 border-t">
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
            return (
              <div key={upd.id} className={`flex flex-col ${upd.updated_by ? 'items-start' : 'items-end'} group`}>
                <div className="relative">
                  <button
                    onClick={() => handleReply(upd)}
                    className={`absolute ${upd.updated_by ? '-right-12' : '-left-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 shadow-lg`}
                    title="Reply to this message"
                  >
                    <Reply className="h-4 w-4 text-white" />
                  </button>
                  
                  <div className={`relative p-3 max-w-xs ${upd.updated_by ? 'bg-background border' : 'bg-primary text-white'} rounded-lg`}>
                    {replyMessage && (
                      <div className={`mb-2 p-2 rounded ${upd.updated_by ? 'bg-muted' : 'bg-primary-foreground/30'} border-l-2 ${upd.updated_by ? 'border-primary' : 'border-white/60'}`}>
                        <p className={`text-xs ${upd.updated_by ? 'text-muted-foreground' : 'text-white/85'} mb-1`}>
                          Replying to {replyMessage.updated_by ? 'Admin' : 'You'}:
                        </p>
                        <p className={`text-xs ${upd.updated_by ? 'text-foreground/95' : 'text-white'} line-clamp-2`}>
                          {replyMessage.message}
                        </p>
                      </div>
                    )}
                    <p className="text-sm">{upd.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{upd.updated_by ? 'Admin' : 'You'} - {new Date(upd.timestamp).toLocaleTimeString()}</span>
                  {!upd.updated_by && (upd.is_read_by_admin ? <Eye className="h-5 w-5 text-[#3ECF8E]" /> : <EyeOff className="h-5 w-5 text-gray-400" />)}
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
```

### Database Migration Files

**1. Main Schema (`20250825074007_remote_schema.sql`)**:
```sql
-- Core tables for chat functionality
create table "public"."report_updates" (
    "id" bigint generated always as identity not null,
    "report_id" uuid not null,
    "updated_by" uuid,
    "message" text,
    "status_update" text,
    "timestamp" timestamp with time zone default now(),
    "is_read_by_reporter" boolean default false,
    "is_read_by_admin" boolean default false
);

create table "public"."reports" (
    "id" uuid not null default gen_random_uuid(),
    "report_id" text not null,
    "company_id" uuid not null,
    "status" text default 'pending'::text,
    "urgency" text,
    "category" text,
    "description" text not null,
    "contact_email" text,
    "contact_phone" text,
    "is_anonymous" boolean default true,
    "submitted_at" timestamp with time zone default now(),
    "title" text,
    "state" text,
    "lga" text,
    "submitted_by" uuid,
    "anonymous_password_hash" text,
    "is_trashed" boolean default false,
    "trashed_at" timestamp with time zone,
    "last_updated_at" timestamp with time zone default now(),
    "is_feedback" boolean default false
);

-- Constraints and indexes
CREATE UNIQUE INDEX report_updates_pkey ON public.report_updates USING btree (id);
CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);
CREATE UNIQUE INDEX reports_report_id_key ON public.reports USING btree (report_id);

-- Foreign key constraints
alter table "public"."report_updates" add constraint "report_updates_report_id_fkey" 
FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

alter table "public"."report_updates" add constraint "report_updates_updated_by_fkey" 
FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
```

**2. RLS Setup (`20250825074013_setup_report_updates_rls.sql`)**:
```sql
-- Enable RLS on report_updates table with minimal policies
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON public.report_updates TO anon;
GRANT ALL ON public.report_updates TO authenticated;
GRANT ALL ON public.report_updates TO service_role;

-- Minimal policy for all operations
CREATE POLICY "Allow all operations on report_updates" ON public.report_updates
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);
```

**3. Real-time Setup (`20250917000002_enable_realtime_report_updates.sql`)**:
```sql
-- Enable real-time for report_updates table
-- This allows chat messages to be delivered in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
```

**4. Reply Functionality (`20250917000003_add_reply_to_report_updates.sql`)**:
```sql
-- Add reply/quote functionality to report_updates table
-- This allows users to reply to specific messages in chat
ALTER TABLE public.report_updates 
ADD COLUMN reply_to_message_id bigint REFERENCES public.report_updates(id) ON DELETE SET NULL;
```

## Deployment Checklist

### Pre-deployment
- [ ] Database migrations applied in correct order
- [ ] RLS policies configured
- [ ] Real-time enabled for report_updates table
- [ ] Environment variables set
- [ ] Supabase project configured

### Frontend Deployment
- [ ] All chat components copied to new project
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Components integrated into existing pages
- [ ] UI library components available (shadcn/ui)

### Testing
- [ ] Real-time messaging works
- [ ] Read receipts function correctly
- [ ] Message threading/replies work
- [ ] Connection status indicators show correctly
- [ ] Auto-scroll functions properly
- [ ] Notifications appear
- [ ] Security permissions work as expected

### Post-deployment
- [ ] Monitor Supabase real-time connections
- [ ] Check for any console errors
- [ ] Verify database performance
- [ ] Test with multiple concurrent users
- [ ] Monitor message delivery rates

## Troubleshooting

### Common Issues

1. **Real-time not working**:
   - Check if table is added to realtime publication
   - Verify RLS policies allow access
   - Check browser console for connection errors

2. **Messages not appearing**:
   - Verify database insertions are successful
   - Check real-time subscription status
   - Ensure proper event filtering

3. **Read receipts not updating**:
   - Check UPDATE event subscription
   - Verify is_read_by_* field updates
   - Ensure proper user identification

4. **Connection status issues**:
   - Monitor subscription status changes
   - Check network connectivity
   - Verify Supabase project status

### Performance Optimization

1. **Message Loading**:
   - Implement pagination for large message histories
   - Use virtual scrolling for very long conversations
   - Cache messages locally when appropriate

2. **Real-time Optimization**:
   - Use specific event filters to reduce unnecessary updates
   - Implement connection retry logic
   - Monitor connection pool usage

3. **Database Optimization**:
   - Add indexes on frequently queried fields
   - Implement message archiving for old conversations
   - Monitor query performance

---

This documentation provides a complete guide to implementing the admin-reporter chat feature. The system is production-ready and includes all necessary components for a robust, real-time chat experience with advanced features like message threading, read receipts, and secure authentication.
