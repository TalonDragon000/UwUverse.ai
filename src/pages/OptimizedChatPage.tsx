import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../stores/authStore';
import { useChatStore, useActiveChat, useIsTyping } from '../stores/optimizedChatStore';
import { queries } from '../lib/supabase/optimizedClient';
import { generateChatResponse } from '../lib/services/ai-service';
import { motion } from 'framer-motion';

// Lazy load the heavy chat messages component
const OptimizedChatMessages = React.lazy(() => import('../components/chat/OptimizedChatMessages'));

type Character = {
  id: string;
  name: string;
  gender: string;
  personality_traits: string[];
  image_url: string | null;
  voice_id: string | null;
  voice_name: string | null;
  backstory: string | null;
  meet_cute: string | null;
  art_style: string | null;
  height: string | null;
  build: string | null;
  eye_color: string | null;
  hair_color: string | null;
  skin_tone: string | null;
};

const OptimizedChatPage: React.FC = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const { session } = useAuthStore();
  const { setActiveChat, setMessages, addMessage, setIsTyping, updateLoveMeter } = useChatStore();
  const activeChat = useActiveChat();
  const isTyping = useIsTyping();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    if (!chatId || !session?.user) return;
    
    const fetchChatData = async () => {
      try {
        // Optimized query with minimal data fetching
        const { data: chatData, error: chatError } = await queries.getUserProfile(session.user.id);
        
        if (chatError) throw chatError;
        
        // Set character and chat data
        startTransition(() => {
          setActiveChat(chatData);
          setCharacter(chatData.characters);
        });
        
        // Fetch messages with pagination
        const { data: messagesData, error: messagesError } = await queries.getMessages(chatId, 50);
        
        if (messagesError) throw messagesError;
        
        startTransition(() => {
          setMessages(messagesData || []);
        });
        
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };
    
    fetchChatData();
  }, [chatId, session, setActiveChat, setMessages]);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !session?.user || !character) return;
    
    const userMessage = messageText;
    setMessageText('');
    
    try {
      // Optimistically add user message
      const tempMessage = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        sender: 'user' as const,
        content: userMessage,
        created_at: new Date().toISOString()
      };
      
      startTransition(() => {
        addMessage(tempMessage);
      });
      
      // Show typing indicator
      setIsTyping(true);
      
      // Generate AI response with optimized context
      const response = await generateChatResponse({
        message: userMessage,
        character_id: character.id,
        chat_history: [], // Will be populated by the service
        character_traits: character.personality_traits || [],
        character_context: {
          name: character.name,
          gender: character.gender,
          backstory: character.backstory || '',
          meet_cute: character.meet_cute || '',
          art_style: character.art_style || '',
          appearance: {
            height: character.height || '',
            build: character.build || '',
            eye_color: character.eye_color || '',
            hair_color: character.hair_color || '',
            skin_tone: character.skin_tone || ''
          }
        }
      });
      
      if (response.success) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          chat_id: chatId,
          sender: 'character' as const,
          content: response.response,
          created_at: new Date().toISOString()
        };
        
        startTransition(() => {
          setIsTyping(false);
          addMessage(aiMessage);
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16 flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 py-3 px-4 sticky top-16 z-10">
          <div className="max-w-4xl mx-auto flex items-center">
            <Link to="/dashboard" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            {character && (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${character.image_url || 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'})` }}>
                </div>
                <div className="ml-3">
                  <h2 className="font-medium">{character.name}</h2>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    {activeChat && (
                      <>
                        <Heart className="h-3 w-3 text-pink-500 mr-1" />
                        <span>{activeChat.love_meter}% Love</span>
                      </>
                    )}
                    {character.voice_name && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Voice: {character.voice_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat messages with Suspense for lazy loading */}
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          </div>
        }>
          <OptimizedChatMessages />
        </Suspense>
        
        {/* Message input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow uwu-input rounded-r-none border-r-0"
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isTyping || isPending}
                className={`uwu-input h-full rounded-l-none bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white px-4 transition-colors duration-200 ${
                  !messageText.trim() || isTyping || isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OptimizedChatPage;