# Component Integration Examples

## Using Chat.jsx in TrackReportPage.jsx

Here's how to integrate the new `Chat.jsx` component into your existing TrackReportPage:

```jsx
// In TrackReportPage.jsx
import Chat from '@/components/Chat';

// Replace the existing ChatWindow import and usage with:
<Chat 
  report={reportData}
  updates={updates}
  onNewMessage={(newMessage) => setUpdates(prev => [...prev, newMessage])}
  onRefreshUpdates={() => fetchUpdates(reportData, true)}
/>
```

## Using Advanced ChatWindow.jsx

For more advanced chat scenarios with multiple participants:

```jsx
// In admin pages or advanced chat scenarios
import ChatWindow from '@/components/ChatWindow';

// Usage example
const participants = [
  { id: 1, name: 'Admin User', role: 'admin' },
  { id: 2, name: 'Staff Member', role: 'staff' },
  // ... more participants
];

<ChatWindow
  reportId={report.id}
  currentUser={currentUser}
  participants={participants}
  messages={messages}
  onSendMessage={async (messageData) => {
    const { error } = await supabase
      .from('report_updates')
      .insert(messageData);
    if (error) throw error;
  }}
  onNewMessage={(newMessage) => setMessages(prev => [...prev, newMessage])}
  onRefreshMessages={() => fetchMessages()}
  enableMentions={true}
  enableEmojis={true}
  EmojiPicker={EmojiPicker} // Import your preferred emoji picker
/>
```

## Using Individual Components

### MessageInput Component

```jsx
import MessageInput from '@/components/MessageInput';

const [message, setMessage] = useState('');
const [replyTo, setReplyTo] = useState(null);

<MessageInput
  newMessage={message}
  setNewMessage={setMessage}
  handleSendMessage={async () => {
    // Your send logic here
    await sendMessage(message, replyTo);
    setMessage('');
    setReplyTo(null);
  }}
  replyToMessage={replyTo}
  setReplyToMessage={setReplyTo}
  showEmojiPicker={true}
  EmojiPicker={EmojiPicker}
/>
```

### Message Component

```jsx
import Message from '@/components/Message';

const messages = updates.filter(upd => upd.message);

{messages.map(msg => (
  <Message
    key={msg.id}
    message={msg}
    isOwnMessage={!msg.updated_by}
    senderName={msg.updated_by ? 'Admin' : 'You'}
    timestamp={msg.created_at}
    isRead={msg.is_read_by_admin}
    replyToMessage={findReplyMessage(msg.reply_to_message_id)}
    onReply={(message) => setReplyingTo(message)}
    canEdit={!msg.updated_by}
    canDelete={false}
    showReadReceipt={!msg.updated_by}
  />
))}
```

## Migration from Existing Components

### From existing ChatWindow.jsx to new Chat.jsx

**Before:**
```jsx
<ChatWindow 
  updates={updates} 
  newMessage={newMessage} 
  setNewMessage={setNewMessage} 
  onSendMessage={onSendMessage} 
  isSending={isSending} 
  onKeyDown={handleKeyDown}
/>
```

**After:**
```jsx
<Chat 
  report={reportData}
  updates={updates}
  onNewMessage={(newMessage) => setUpdates(prev => [...prev, newMessage])}
  onRefreshUpdates={() => fetchUpdates(reportData, true)}
/>
```

### Benefits of New Components

1. **Chat.jsx**: 
   - Self-contained message sending logic
   - Built-in real-time subscriptions
   - Automatic connection status monitoring
   - Enhanced UI with reply functionality

2. **ChatWindow.jsx**: 
   - Support for multiple participants
   - @mention functionality
   - Emoji picker integration
   - Advanced message management

3. **MessageInput.jsx**:
   - Reusable across different chat contexts
   - Built-in reply preview
   - Mention suggestions
   - Emoji support

4. **Message.jsx**:
   - Consistent message display
   - Built-in threading visualization
   - Action menus (edit, delete, reply)
   - Read receipt indicators

## Installation Requirements

For emoji support, install an emoji picker library:

```bash
npm install emoji-picker-react
# or
npm install @emoji-mart/react
```

Then import and use:

```jsx
import EmojiPicker from 'emoji-picker-react';
// or
import { Picker as EmojiPicker } from '@emoji-mart/react';

// Pass to components that support it
<ChatWindow EmojiPicker={EmojiPicker} enableEmojis={true} />
```

## Component Props Reference

### Chat.jsx Props
- `report` (object): Report data object with id
- `updates` (array): Array of message updates
- `onNewMessage` (function): Callback for new messages
- `onRefreshUpdates` (function): Callback to refresh messages

### ChatWindow.jsx Props
- `reportId` (string): Report ID for real-time subscriptions
- `currentUser` (object): Current user object
- `participants` (array): Array of chat participants
- `messages` (array): Array of messages
- `onSendMessage` (function): Message send handler
- `onNewMessage` (function): New message callback
- `onRefreshMessages` (function): Refresh messages callback
- `enableMentions` (boolean): Enable @mention functionality
- `enableEmojis` (boolean): Enable emoji picker
- `EmojiPicker` (component): Emoji picker component

### MessageInput.jsx Props
- `newMessage` (string): Current message text
- `setNewMessage` (function): Set message text
- `handleSendMessage` (function): Send message handler
- `replyToMessage` (object): Message being replied to
- `setReplyToMessage` (function): Set reply message
- `showEmojiPicker` (boolean): Show emoji picker
- `EmojiPicker` (component): Emoji picker component

### Message.jsx Props
- `message` (object): Message data
- `isOwnMessage` (boolean): Whether message is from current user
- `senderName` (string): Name of message sender
- `timestamp` (string): Message timestamp
- `isRead` (boolean): Whether message has been read
- `replyToMessage` (object): Message being replied to
- `onReply` (function): Reply handler
- `onEdit` (function): Edit handler
- `onDelete` (function): Delete handler
- `canEdit` (boolean): Whether user can edit message
- `canDelete` (boolean): Whether user can delete message
- `showReadReceipt` (boolean): Show read receipt indicator
