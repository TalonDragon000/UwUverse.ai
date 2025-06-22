import React, { memo, useMemo, useTransition, useDeferredValue } from 'react';
import { motion } from 'framer-motion';
import { useMessages, useIsTyping } from '../../stores/optimizedChatStore';

interface Message {
  id: string;
  sender: 'user' | 'character';
  content: string;
  created_at: string;
}

// Memoized individual message component
const ChatMessage = memo<{ message: Message; index: number }>(({ message, index }) => {
  return (
    <div className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          message.sender === 'user'
            ? 'bg-pink-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }`}
      >
        {message.content}
      </motion.div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

// Memoized typing indicator
const TypingIndicator = memo(() => {
  return (
    <div className="mb-4 flex justify-start">
      <div className="max-w-[80%] px-5 py-3.5 rounded-2xl bg-white dark:bg-gray-800">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// Virtualized message list for better performance with large message counts
const OptimizedChatMessages: React.FC = () => {
  const messages = useMessages();
  const isTyping = useIsTyping();
  const [isPending, startTransition] = useTransition();
  
  // Defer heavy rendering updates
  const deferredMessages = useDeferredValue(messages);
  
  // Memoize message rendering
  const renderedMessages = useMemo(() => {
    return deferredMessages.map((message, index) => (
      <ChatMessage key={message.id} message={message} index={index} />
    ));
  }, [deferredMessages]);
  
  // Auto-scroll effect with transition
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    startTransition(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages.length, isTyping]);
  
  return (
    <div className="flex-grow overflow-auto px-4 py-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-4xl mx-auto">
        {renderedMessages}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default memo(OptimizedChatMessages);