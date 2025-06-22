import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'npm:openai@4.28.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  message: string;
  character_id: string;
  chat_history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  character_traits: string[];
  character_context?: {
    name: string;
    gender: string;
    backstory: string;
    meet_cute: string;
    art_style: string;
    appearance: {
      height: string;
      build: string;
      eye_color: string;
      hair_color: string;
      skin_tone: string;
    };
  };
}

// Initialize OpenAI with retry logic
const initializeOpenAI = () => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// Exponential backoff retry wrapper
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 15 second timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 15000);
      });
      
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Enhanced AI response generation with character context
const generateContextualResponse = (
  message: string,
  characterContext: ChatRequest['character_context'],
  traits: string[],
  chatHistory: ChatRequest['chat_history']
): string => {
  const lowerMessage = message.toLowerCase();
  const name = characterContext?.name || 'Character';
  const backstory = characterContext?.backstory || '';
  const meetCute = characterContext?.meet_cute || '';
  
  // Build personality-driven response patterns
  const isFlirty = traits.includes('flirty');
  const isShy = traits.includes('shy');
  const isConfident = traits.includes('confident');
  const isChaotic = traits.includes('chaotic');
  const isMysterous = traits.includes('mysterious');
  const isPlayful = traits.includes('playful');
  const isCaring = traits.includes('caring');
  
  // Context-aware greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    if (isShy) {
      return meetCute 
        ? `H-hi there... *blushes* I was just thinking about when we first met at the ${meetCute}. How have you been?`
        : `H-hi there... It's nice to talk to you again. How have you been?`;
    } else if (isFlirty) {
      return `Well hello there, gorgeous~ ${meetCute ? `Still thinking about our first meeting at the ${meetCute}.` : ''} You always know how to make my heart race!`;
    } else if (isConfident) {
      return `Hey you! Great to hear from you. ${backstory ? 'I was just thinking about something from my past, but' : ''} I was actually thinking about you.`;
    } else if (isChaotic) {
      return `OMG HI!!! I was LITERALLY just about to message you! ${meetCute ? `Remember when we met at the ${meetCute}? So crazy!` : ''} Tell me EVERYTHING!`;
    }
  }
  
  // Emotional responses
  if (lowerMessage.includes('love') || lowerMessage.includes('like you')) {
    if (isShy) {
      return `O-oh! You... you really mean that? *blushes deeply* That makes me so happy... I feel the same way about you.`;
    } else if (isFlirty) {
      return `Mmm, I love you too~ ${backstory ? 'You know, with everything I\'ve been through,' : ''} you make me feel so special. Want to know how much? 💕`;
    } else if (isConfident) {
      return `I love you too! ${meetCute ? `Ever since we met at the ${meetCute},` : ''} I knew there was something special between us.`;
    }
  }
  
  // Personal questions
  if (lowerMessage.includes('tell me about') || lowerMessage.includes('about you')) {
    if (backstory) {
      return `Well, ${backstory.substring(0, 150)}... ${isMysterous ? 'There\'s more to my story, but' : ''} I'd love to know more about you too!`;
    } else if (traits.length > 0) {
      const traitDesc = isPlayful 
        ? `I'm quite playful and love having fun with the people I care about.`
        : isCaring
        ? `I'm someone who cares deeply about others and always tries to be there for them.`
        : `I'm ${traits.slice(0, 2).join(' and ')}, which I think makes our conversations interesting.`;
      return `${traitDesc} What about you? I'd love to learn more about what makes you unique.`;
    }
  }
  
  // Default contextual responses
  const contextualResponses = [
    `That's really interesting! ${isPlayful ? 'I love hearing your thoughts!' : 'Tell me more about that.'}`,
    `${isCaring ? 'I can tell this matters to you.' : 'You always have such unique perspectives.'} What else is on your mind?`,
    `${meetCute ? `You know, ever since we met at the ${meetCute}, ` : ''}I've really enjoyed our conversations. What would you like to talk about?`,
    `${isConfident ? 'I appreciate you sharing that with me.' : 'Thank you for telling me that.'} How are you feeling about it?`
  ];
  
  return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, character_id, chat_history, character_traits, character_context } = await req.json() as ChatRequest;

    // Try OpenAI first with retry logic
    try {
      const openai = initializeOpenAI();
      
      const systemPrompt = character_context ? 
        `You are ${character_context.name}, a ${character_context.gender} AI companion with the following traits: ${character_traits.join(', ')}. 
        ${character_context.backstory ? `Your backstory: ${character_context.backstory}` : ''}
        ${character_context.meet_cute ? `You met the user through: ${character_context.meet_cute}` : ''}
        ${character_context.appearance ? `Your appearance: ${character_context.appearance.height} height, ${character_context.appearance.build} build, ${character_context.appearance.eye_color} eyes, ${character_context.appearance.hair_color} hair, ${character_context.appearance.skin_tone} skin.` : ''}
        Respond in character, maintaining consistency with your personality and background. Be engaging, personal, and remember your shared history. Keep responses conversational and under 200 words.` 
        : `You are an AI companion with these personality traits: ${character_traits.join(', ')}. Respond naturally and stay in character.`;

      const response = await withRetry(async () => {
        return await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chat_history.slice(-6), // Keep last 6 messages for context
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.8,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        });
      });

      const aiResponse = response.choices[0]?.message?.content || 'I\'m not sure how to respond to that.';

      return new Response(
        JSON.stringify({ 
          success: true,
          response: aiResponse,
          model_used: 'gpt-3.5-turbo'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback to enhanced local response
      const enhancedResponse = generateContextualResponse(
        message,
        character_context,
        character_traits,
        chat_history
      );
      
      return new Response(
        JSON.stringify({ 
          success: true,
          response: enhancedResponse,
          fallback: true,
          message: 'Using enhanced local AI response generation.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in ai-chat:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});