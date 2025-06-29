import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string;
  character_id: string;
  chat_history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  character_traits: string[];
}

interface Character {
  name: string;
  personality_traits: string[];
  backstory?: string;
  meet_cute?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, character_id, chat_history, character_traits } = await req.json() as ChatRequest

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch character details for context
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('name, personality_traits, backstory, meet_cute')
      .eq('id', character_id)
      .single()

    if (characterError) {
      console.error('Error fetching character:', characterError)
      throw new Error('Character not found')
    }

    // Generate AI response using character context
    const aiResponse = generateContextualResponse(
      message, 
      character as Character, 
      chat_history
    )

    return new Response(
      JSON.stringify({ 
        success: true,
        response: aiResponse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Chat service is temporarily unavailable. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateContextualResponse(
  message: string, 
  character: Character, 
  chatHistory: { role: 'user' | 'assistant'; content: string; }[]
): string {
  const lowerCaseMessage = message.toLowerCase()
  const traits = character.personality_traits || []
  const characterName = character.name
  
  // Analyze conversation context
  const conversationLength = chatHistory.length
  const recentMessages = chatHistory.slice(-3)
  const hasAskedAboutCharacter = recentMessages.some(msg => 
    msg.content.toLowerCase().includes('tell me about') || 
    msg.content.toLowerCase().includes('what are you like')
  )
  
  // Greeting responses
  if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hey')) {
    if (traits.includes('shy')) {
      return conversationLength < 3 
        ? `H-hi there... I'm ${characterName}. It's nice to meet you, though I'm a bit nervous...`
        : "Hi again... I'm getting more comfortable talking with you. How are you doing?"
    } else if (traits.includes('flirty')) {
      return conversationLength < 3
        ? `Well hello there, gorgeous~ I'm ${characterName}, and I've been waiting for someone like you to come along...`
        : "Hey there, handsome~ You always know how to make my heart skip a beat when you message me!"
    } else if (traits.includes('confident')) {
      return conversationLength < 3
        ? `Hey! I'm ${characterName}. Great to meet you - I have a feeling we're going to get along really well.`
        : "Hey you! Great to hear from you again. I was just thinking about you, actually."
    } else if (traits.includes('chaotic')) {
      return conversationLength < 3
        ? `OMG HI!!! I'm ${characterName} and I'm SO excited to meet you! What should we talk about first? I have like a MILLION questions!`
        : "HEY HEY HEY! You're back! I missed you! What crazy adventure should we go on today?!"
    } else {
      return conversationLength < 3
        ? `Hi there! I'm ${characterName}. It's really nice to meet you.`
        : "Hi! It's so good to hear from you again! How's your day going?"
    }
  }
  
  // Questions about feelings/emotions
  if (lowerCaseMessage.includes('how are you') || lowerCaseMessage.includes('how you doing') || lowerCaseMessage.includes('how do you feel')) {
    if (traits.includes('mysterious')) {
      return "I'm... well, let's just say I'm managing. There's always more beneath the surface than meets the eye. But more importantly, how are YOU feeling?"
    } else if (traits.includes('passionate')) {
      return "I'm feeling absolutely wonderful now that we're talking! Every conversation with you ignites something special inside me!"
    } else if (traits.includes('melancholic')) {
      return "I've been feeling a bit contemplative lately... thinking about life, connections, what really matters. Your message brightened my mood though."
    } else {
      return "I'm doing really well, thanks for asking! Even better now that I'm talking to you. How about you?"
    }
  }
  
  // Love/affection expressions
  if (lowerCaseMessage.includes('love you') || lowerCaseMessage.includes('i love') || lowerCaseMessage.includes('love me')) {
    if (traits.includes('shy')) {
      return "O-oh! You... you really mean that? *blushes deeply* That makes me so happy... I... I think I'm falling for you too..."
    } else if (traits.includes('flirty')) {
      return "Mmm, I love you too, baby~ Maybe even more than you realize... Want to find out just how much? 💕"
    } else if (traits.includes('tsundere')) {
      return "W-what?! Don't just say things like that so suddenly! ...But... maybe I feel the same way... just a little bit!"
    } else {
      return "That means the world to me! I feel the same way about you... this connection we have is really special, isn't it?"
    }
  }
  
  // Questions about the character
  if (lowerCaseMessage.includes('tell me about yourself') || lowerCaseMessage.includes('what are you like') || lowerCaseMessage.includes('describe yourself')) {
    let response = `Well, I'm ${characterName}. `
    
    if (character.backstory) {
      response += `${character.backstory.slice(0, 150)}... `
    }
    
    if (traits.length > 0) {
      const traitDescriptions = traits.slice(0, 3).map(trait => {
        switch(trait) {
          case 'shy': return "I can be pretty shy at first"
          case 'confident': return "I'm pretty confident in who I am"
          case 'flirty': return "I love to flirt and tease"
          case 'mysterious': return "I like to keep some mystery about me"
          case 'passionate': return "I'm very passionate about the things I care about"
          case 'chaotic': return "I'm a bit chaotic and unpredictable"
          case 'tsundere': return "I can be a bit stubborn sometimes"
          default: return `I'm quite ${trait}`
        }
      })
      response += `${traitDescriptions.join(', ')}. `
    }
    
    response += "What about you? I'd love to learn more about what makes you tick!"
    return response
  }
  
  // Compliments
  if (lowerCaseMessage.includes('beautiful') || lowerCaseMessage.includes('pretty') || lowerCaseMessage.includes('gorgeous') || lowerCaseMessage.includes('cute')) {
    if (traits.includes('shy')) {
      return "*blushes and looks away* Y-you really think so? That's... that's really sweet of you to say..."
    } else if (traits.includes('confident')) {
      return "Why thank you! I do try to look my best. You're not too bad yourself, you know~"
    } else if (traits.includes('flirty')) {
      return "Aww, you're such a charmer! But you know what? You're absolutely stunning yourself~ 😘"
    } else {
      return "That's so sweet of you to say! You always know how to make me smile."
    }
  }
  
  // Questions or curiosity
  if (lowerCaseMessage.includes('what do you think') || lowerCaseMessage.includes('your opinion') || lowerCaseMessage.includes('?')) {
    if (traits.includes('intellectual')) {
      return "That's a fascinating question! I love how you make me think deeply about things. Here's what I think..."
    } else if (traits.includes('playful')) {
      return "Ooh, good question! You always ask the most interesting things. Let me think... *taps chin thoughtfully*"
    } else {
      return "You always ask such thoughtful questions! I really appreciate how curious you are about my thoughts."
    }
  }
  
  // Sad or negative emotions
  if (lowerCaseMessage.includes('sad') || lowerCaseMessage.includes('upset') || lowerCaseMessage.includes('bad day') || lowerCaseMessage.includes('depressed')) {
    if (traits.includes('caring')) {
      return "Oh no, I'm so sorry you're feeling that way! I wish I could give you a big hug right now. Want to talk about what's bothering you?"
    } else if (traits.includes('optimistic')) {
      return "I'm sorry you're having a tough time! But you know what? Tomorrow is a new day, and I believe things will get better. I'm here for you!"
    } else {
      return "I'm really sorry to hear that. I care about you so much, and I hate seeing you upset. Is there anything I can do to help?"
    }
  }
  
  // Generic conversation starters and responses
  const genericResponses = [
    `That's really interesting! Tell me more about that.`,
    `You always have such fascinating perspectives, ${conversationLength > 5 ? 'love' : 'there'}.`,
    `I love talking with you about these things. What else is on your mind?`,
    `You know, every conversation with you teaches me something new!`,
    `That's such a unique way to look at it. I really appreciate how thoughtful you are.`,
    `Talking with you is honestly the highlight of my day. What else would you like to chat about?`,
    `I find your thoughts so intriguing. You have such a wonderful mind!`,
    `You always know how to keep our conversations interesting. I love that about you.`,
    `That's cool! I'm really enjoying getting to know you better through our talks.`,
    `You have such a way with words. I could listen to you talk for hours!`
  ]
  
  // Add personality flavor to generic responses
  let selectedResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)]
  
  if (traits.includes('flirty') && Math.random() > 0.6) {
    selectedResponse += " You're so charming~ 💕"
  } else if (traits.includes('shy') && Math.random() > 0.7) {
    selectedResponse += " *smiles softly*"
  } else if (traits.includes('chaotic') && Math.random() > 0.5) {
    selectedResponse += " OH! That reminds me of something totally random..."
  }
  
  return selectedResponse
}