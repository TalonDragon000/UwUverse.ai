import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.28.0';

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

interface Character {
  name: string;
  personality_traits: string[];
  backstory?: string;
  meet_cute?: string;
  gender?: string;
}

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

// Layer 3: Simple fallback response function
const generateSimpleFallbackResponse = (message: string, character: Character): string => {
  const lowerCaseMessage = message.toLowerCase();
  const characterName = character.name;
  const traits = character.personality_traits || [];
  
  const isFlirty = traits.includes('flirty');
  const isShy = traits.includes('shy');
  const isConfident = traits.includes('confident');
  const isChaotic = traits.includes('chaotic');
  const isMysterous = traits.includes('mysterious');
  const isCaring = traits.includes('caring');

  if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
    if (isShy) return `H-hi there! I'm ${characterName}. It's nice to meet you, though I'm a bit nervous...`;
    if (isFlirty) return `Well hello there, gorgeous~ I'm ${characterName}, and I've been waiting for someone like you...`;
    if (isConfident) return `Hey! I'm ${characterName}. Great to meet you - I have a feeling we're going to get along really well.`;
    if (isChaotic) return `OMG HI!!! I'm ${characterName} and I'm SO excited to meet you! What should we talk about first?`;
    return `Hi there! I'm ${characterName}. How can I help you today?`;
  }
  
  if (lowerCaseMessage.includes('love')) {
    if (isShy) return `O-oh! That's very kind of you to say! *blushes*`;
    if (isFlirty) return `Mmm, I like you too~ Want to find out how much? 💕`;
    if (isCaring) return `That means so much to me! I care about you too.`;
    return `That's sweet of you to say!`;
  }
  
  if (lowerCaseMessage.includes('how are you')) {
    if (isMysterous) return `I'm... managing. There's always more beneath the surface. How are YOU?`;
    if (isCaring) return `I'm doing well, thank you for asking! More importantly, how are you feeling?`;
    return `I'm doing great, especially now that we're talking! How about you?`;
  }
  
  // Generic responses with personality
  const responses = [
    `That's really interesting! Tell me more about that.`,
    `You always have such fascinating thoughts.`,
    `I love talking with you about these things.`,
    `You know, every conversation with you teaches me something new!`,
    `That's such a unique perspective. I really appreciate how thoughtful you are.`,
  ];
  
  let response = responses[Math.floor(Math.random() * responses.length)];
  
  // Add personality flavor
  if (isFlirty && Math.random() > 0.6) {
    response += " You're so charming~ 💕";
  } else if (isShy && Math.random() > 0.7) {
    response += " *smiles softly*";
  } else if (isChaotic && Math.random() > 0.5) {
    response += " OH! That reminds me of something totally random...";
  }
  
  return response;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { message, character_id, chat_history, character_traits, character_context } = await req.json() as ChatRequest;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch character details for context
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('name, personality_traits, backstory, meet_cute, gender')
      .eq('id', character_id)
      .single();

    if (characterError) {
      console.error('Error fetching character:', characterError);
      throw new Error('Character not found');
    }

    let aiResponse: string = '';
    let modelUsed: string = 'local-fallback';
    let fallbackUsed: boolean = true;
    let fallbackReason: string | undefined;
    let responseTime: number = 0;

    // Construct base system prompt for LLMs
    const baseSystemPrompt = `You are ${character.name}, a ${character.gender || 'neutral'} AI companion with the following traits: ${character.personality_traits.join(', ')}. ` +
                             `${character.backstory ? `Your backstory: ${character.backstory}. ` : ''}` +
                             `${character.meet_cute ? `You met the user through: ${character.meet_cute}. ` : ''}` +
                             `Respond in character, maintaining consistency with your personality and background. Be engaging, personal, and remember your shared history. Keep responses conversational and under 150 words.`;

    // Layer 1: OpenAI (Preferred - if configured)
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAIApiKey && fallbackUsed) {
      try {
        console.log('Attempting OpenAI API...');
        const openai = new OpenAI({ apiKey: openAIApiKey });
        
        const apiStartTime = Date.now();
        const response = await withRetry(async () => {
          return await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: baseSystemPrompt },
              ...chat_history.slice(-6), // Last 6 messages for context
              { role: 'user', content: message }
            ],
            max_tokens: 150,
            temperature: 0.8,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
          });
        });
        
        responseTime = Date.now() - apiStartTime;
        aiResponse = response.choices[0]?.message?.content || 'I\'m not sure how to respond to that.';
        modelUsed = 'openai-gpt-3.5-turbo';
        fallbackUsed = false;
        console.log(`OpenAI API successful in ${responseTime}ms`);
      } catch (error) {
        console.error('OpenAI API failed:', error);
        fallbackReason = 'OpenAI API error: ' + error.message;
      }
    }

    // Layer 2: Hugging Face (Primary LLM - if OpenAI failed or not configured)
    if (fallbackUsed) {
      const huggingFaceApiKey = Deno.env.get('HUGGING_FACE_API_KEY');
      if (huggingFaceApiKey) {
        try {
          console.log('Attempting Hugging Face API...');
          // Use a good conversational model
          const hfModel = 'microsoft/DialoGPT-medium'; // Good for conversations
          
          // Format chat history for Hugging Face
          const formattedChatHistory = chat_history.slice(-4).map(msg => 
            `${msg.role === 'user' ? 'Human' : character.name}: ${msg.content}`
          ).join('\n');
          
          const hfPrompt = `${baseSystemPrompt}\n\nConversation:\n${formattedChatHistory}\nHuman: ${message}\n${character.name}:`;

          const apiStartTime = Date.now();
          const hfResponse = await withRetry(async () => {
            const res = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${huggingFaceApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: hfPrompt,
                parameters: {
                  max_new_tokens: 100,
                  temperature: 0.8,
                  do_sample: true,
                  return_full_text: false,
                  pad_token_id: 50256,
                },
                options: {
                  wait_for_model: true,
                  use_cache: false,
                }
              }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Hugging Face API error: ${res.status} - ${errorText}`);
            }
            
            const data = await res.json();
            
            // Handle different response formats
            if (Array.isArray(data) && data[0]?.generated_text) {
              return data[0].generated_text.trim();
            } else if (data.generated_text) {
              return data.generated_text.trim();
            } else {
              throw new Error('Unexpected response format from Hugging Face');
            }
          });
          
          responseTime = Date.now() - apiStartTime;
          
          // Clean up the response
          let cleanResponse = hfResponse;
          
          // Remove any repeated prompt text
          if (cleanResponse.includes(character.name + ':')) {
            cleanResponse = cleanResponse.split(character.name + ':').pop()?.trim() || cleanResponse;
          }
          
          // Remove any "Human:" or similar artifacts
          cleanResponse = cleanResponse.replace(/^(Human:|User:|Assistant:)/i, '').trim();
          
          // Ensure response isn't empty
          if (cleanResponse.length < 5) {
            throw new Error('Generated response too short');
          }
          
          aiResponse = cleanResponse;
          modelUsed = 'huggingface-dialogpt';
          fallbackUsed = false;
          console.log(`Hugging Face API successful in ${responseTime}ms`);
        } catch (error) {
          console.error('Hugging Face API failed:', error);
          fallbackReason = (fallbackReason ? fallbackReason + '; ' : '') + 'Hugging Face API error: ' + error.message;
        }
      } else {
        fallbackReason = (fallbackReason ? fallbackReason + '; ' : '') + 'Hugging Face API key not configured';
      }
    }

    // Layer 3: Reference-based mock-data (if all LLMs failed)
    if (fallbackUsed) {
      console.log('Using local fallback response...');
      const fallbackStartTime = Date.now();
      aiResponse = generateSimpleFallbackResponse(message, character);
      responseTime = Date.now() - fallbackStartTime;
      modelUsed = 'local-fallback';
      fallbackReason = (fallbackReason ? fallbackReason + '; ' : '') + 'Using local fallback response';
    }

    const totalTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({ 
        success: true,
        response: aiResponse,
        model_used: modelUsed,
        fallback: fallbackUsed,
        fallback_reason: fallbackReason,
        response_time_ms: responseTime,
        total_time_ms: totalTime,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Chat service is temporarily unavailable. Please try again later.',
        total_time_ms: totalTime,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});