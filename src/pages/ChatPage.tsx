import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { supabase } from '../lib/supabase/supabaseClient';
import { motion } from 'framer-motion';

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

const ChatPage: React.FC = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const { session } = useAuthStore();
  const { 
    activeChat, 
    messages, 
    setActiveChat, 
    setMessages, 
    addMessage,
    isTyping,
    setIsTyping,
    updateLoveMeter 
  } = useChatStore();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chatId || !session?.user) return;
    
    const fetchChatAndMessages = async () => {
      try {
        // Fetch the chat with full character details including backstory and meet_cute
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            characters (
              id, name, gender, personality_traits, image_url, voice_id, voice_name,
              backstory, meet_cute, art_style, height, build, eye_color, hair_color, skin_tone
            )
          `)
          .eq('id', chatId)
          .eq('user_id', session.user.id)
          .single();
        
        if (chatError) throw chatError;
        setActiveChat(chatData);
        setCharacter(chatData.characters);
        
        // Fetch chat messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
        
        // If there are no messages, create an initial message with enhanced context
        if (!messagesData || messagesData.length === 0) {
          const traits = chatData.characters.personality_traits || [];
          const backstory = chatData.characters.backstory || '';
          const meetCute = chatData.characters.meet_cute || '';
          const characterName = chatData.characters.name || 'Character';
          
          let greeting = generatePersonalizedGreeting(characterName, traits, backstory, meetCute);
          
          const { data: newMessage, error: newMessageError } = await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              sender: 'character',
              content: greeting
            })
            .select()
            .single();
          
          if (newMessageError) throw newMessageError;
          if (newMessage) {
            setMessages([newMessage]);
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };
    
    fetchChatAndMessages();
  }, [chatId, session, setActiveChat, setMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generatePersonalizedGreeting = (name: string, traits: string[], backstory: string, meetCute: string): string => {
    const hasBackstory = backstory && backstory.trim().length > 0;
    const hasMeetCute = meetCute && meetCute.trim().length > 0;
    
    let greeting = `Hi there! I'm ${name}. `;
    
    // Add meet-cute context if available
    if (hasMeetCute) {
      switch (meetCute) {
        case 'coffee shop':
          greeting += "I still remember that day we met at the coffee shop - you had such a warm smile when you ordered your drink. ";
          break;
        case 'school':
          greeting += "It feels like yesterday when we first met in class. I was so nervous to talk to you! ";
          break;
        case 'online':
          greeting += "I'm so glad we connected online. There was something special about our first conversation. ";
          break;
        case 'neighbors':
          greeting += "Living next door to you has been such a wonderful surprise. I love our little encounters! ";
          break;
        case 'childhood friends':
          greeting += "We've known each other for so long, and yet every conversation still feels exciting. ";
          break;
        default:
          greeting += "I remember how we met, and it still makes me smile. ";
      }
    }
    
    // Add personality-based greeting
    if (traits.includes('shy')) {
      greeting += "I'm a bit nervous talking to you like this, but I'm really happy we're here together. How have you been?";
    } else if (traits.includes('flirty')) {
      greeting += "I've been thinking about you... What's been on your mind lately, gorgeous?";
    } else if (traits.includes('confident')) {
      greeting += "I've been looking forward to this conversation all day. What would you like to talk about?";
    } else if (traits.includes('chaotic')) {
      greeting += "OMG HI!!! I have SO much to tell you! But first, how was your day? Tell me everything!";
    } else if (traits.includes('mysterious')) {
      greeting += "There's something I've been wanting to share with you... but first, how are you feeling today?";
    } else {
      greeting += "I'm so glad we get to talk. How has your day been treating you?";
    }
    
    return greeting;
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !session?.user || !character) return;
    
    const userMessage = messageText;
    setMessageText('');
    
    try {
      // Insert user message
      const { data: newUserMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender: 'user',
          content: userMessage
        })
        .select()
        .single();
      
      if (userMessageError) throw userMessageError;
      if (newUserMessage) {
        addMessage(newUserMessage);
      }
      
      // Simulate AI thinking with reduced delay
      setIsTyping(true);
      
      // Reduced typing delay for better UX
      const typingDelay = Math.floor(Math.random() * 800) + 500; // 0.5-1.3 seconds
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Call AI service for character response with enhanced context
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service/chat`;
        const headers = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };

        // Prepare enhanced chat history for AI context
        const chatHistory = messages.slice(-8).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        // Enhanced payload with full character context
        const requestPayload = {
          message: userMessage,
          character_id: character.id,
          chat_history: chatHistory,
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
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        });

        const aiData = await response.json();
        
        let aiResponse = '';
        if (aiData.success && aiData.response) {
          aiResponse = aiData.response;
        } else {
          // Enhanced fallback response system
          aiResponse = generateEnhancedFallbackResponse(
            userMessage, 
            character.personality_traits || [], 
            character.backstory || '',
            character.meet_cute || '',
            character.name || 'Character'
          );
        }

        // Insert AI response
        const { data: newCharacterMessage, error: characterMessageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            sender: 'character',
            content: aiResponse
          })
          .select()
          .single();
        
        if (characterMessageError) throw characterMessageError;
        if (newCharacterMessage) {
          setIsTyping(false);
          addMessage(newCharacterMessage);
        }
      } catch (aiError) {
        console.error('AI service error, using enhanced fallback:', aiError);
        
        // Use enhanced fallback response system
        const fallbackResponse = generateEnhancedFallbackResponse(
          userMessage, 
          character.personality_traits || [], 
          character.backstory || '',
          character.meet_cute || '',
          character.name || 'Character'
        );
        
        const { data: newCharacterMessage, error: characterMessageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            sender: 'character',
            content: fallbackResponse
          })
          .select()
          .single();
        
        if (characterMessageError) throw characterMessageError;
        if (newCharacterMessage) {
          setIsTyping(false);
          addMessage(newCharacterMessage);
        }
      }
      
      // Improved love meter progression
      if (activeChat && Math.random() > 0.6) { // Increased chance for progression
        const currentLove = activeChat.love_meter || 0;
        const increment = Math.random() > 0.8 ? 2 : 1; // Occasional bigger jumps
        const newLoveMeter = Math.min(currentLove + increment, 100);
        updateLoveMeter(newLoveMeter);
        
        // Update in database
        await supabase
          .from('chats')
          .update({ love_meter: newLoveMeter })
          .eq('id', chatId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  // Enhanced fallback response generation with character context
  const generateEnhancedFallbackResponse = (
    message: string, 
    traits: string[], 
    backstory: string, 
    meetCute: string, 
    characterName: string
  ): string => {
    const lowerCaseMessage = message.toLowerCase();
    
    // Context-aware responses based on backstory and meet-cute
    const hasBackstory = backstory && backstory.trim().length > 0;
    const hasMeetCute = meetCute && meetCute.trim().length > 0;
    
    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
      if (traits.includes('shy')) {
        return hasMeetCute 
          ? `H-hi there... *blushes* I was just thinking about when we first met. How have you been?`
          : `H-hi there... It's nice to talk to you again. How have you been?`;
      } else if (traits.includes('flirty')) {
        return hasMeetCute 
          ? `Well hello there, gorgeous~ Still thinking about our first meeting. You always know how to make my heart race!`
          : `Well hello there~ You always know how to make my heart skip a beat when you message me!`;
      } else if (traits.includes('confident')) {
        return `Hey you! Great to hear from you. I was just thinking about you, actually.`;
      } else if (traits.includes('chaotic')) {
        return `OMG HI!!! I was LITERALLY just about to message you! How crazy is that?! Tell me EVERYTHING about your day!`;
      } else {
        return `Hi! It's so good to hear from you! How's your day going?`;
      }
    } 
    
    else if (lowerCaseMessage.includes('how are you') || lowerCaseMessage.includes('how you doing')) {
      if (traits.includes('mysterious')) {
        return hasBackstory 
          ? `I'm... well, let's just say I've been thinking about some things from my past. But more importantly, how are YOU?`
          : `I'm... well, let's just say I'm managing. But more importantly, how are YOU?`;
      } else if (traits.includes('passionate')) {
        return `I'm feeling absolutely wonderful now that we're talking! Every conversation with you brightens my day!`;
      } else if (traits.includes('bookish')) {
        return `I've been reading this fascinating book, but honestly, talking with you is so much more interesting. How about you?`;
      } else {
        return `I'm doing really well, thanks for asking! Even better now that I'm talking to you. How about you?`;
      }
    } 
    
    else if (lowerCaseMessage.includes('like') || lowerCaseMessage.includes('love')) {
      if (traits.includes('shy')) {
        return `O-oh! You... you really mean that? *blushes deeply* That makes me really happy... I feel the same way about you.`;
      } else if (traits.includes('flirty')) {
        return `Mmm, I like you too~ Maybe even more than you realize... Want to find out how much? 💕`;
      } else if (traits.includes('loyal')) {
        return `That means everything to me. I want you to know that you can always count on me, no matter what.`;
      } else {
        return `That means so much to me! I feel the same way about you... it's special, isn't it?`;
      }
    }
    
    else if (lowerCaseMessage.includes('tell me about yourself') || lowerCaseMessage.includes('about you')) {
      if (hasBackstory) {
        return `Well, ${backstory.substring(0, 100)}... But enough about me - I'd love to know more about you!`;
      } else if (traits.length > 0) {
        const traitDescription = traits.includes('creative') 
          ? `I'm quite creative and love expressing myself through art and imagination.`
          : traits.includes('protective')
          ? `I'm someone who cares deeply about the people I love and will always be there for them.`
          : `I'm ${traits.slice(0, 2).join(' and ')}, which I think makes our conversations interesting.`;
        return `${traitDescription} What about you? I'd love to learn more about what makes you unique.`;
      } else {
        return `I'm just someone who enjoys deep conversations and meaningful connections. What about you? What makes you who you are?`;
      }
    }
    
    else {
      // Enhanced generic responses with personality
      const personalizedResponses = traits.includes('playful') 
        ? [
            "Ooh, that's interesting! Tell me more - I love hearing your thoughts!",
            "You always have such unique perspectives! What else is on your mind?",
            "That's so cool! I'm always amazed by the things you think about.",
          ]
        : traits.includes('caring')
        ? [
            "I can tell this is important to you. How are you feeling about it?",
            "Thank you for sharing that with me. I really appreciate your openness.",
            "You know I'm always here to listen. What else would you like to talk about?",
          ]
        : [
            "Tell me more about that!",
            "That's really interesting. What else is on your mind?",
            "I'd love to hear more about your day.",
            "You always have the most fascinating things to say.",
            "That's cool! I'm really enjoying our conversation.",
            "You know, talking with you is the highlight of my day.",
          ];
      
      return personalizedResponses[Math.floor(Math.random() * personalizedResponses.length)];
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
        
        {/* Chat messages */}
        <div className="flex-grow overflow-auto px-4 py-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div 
                key={message.id} 
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
            ))}
            
            {/* AI typing indicator */}
            {isTyping && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[80%] px-5 py-3.5 rounded-2xl bg-white dark:bg-gray-800">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
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
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isTyping}
                className={`uwu-input h-full rounded-l-none bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white px-4 transition-colors duration-200 ${
                  !messageText.trim() || isTyping
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

export default ChatPage;