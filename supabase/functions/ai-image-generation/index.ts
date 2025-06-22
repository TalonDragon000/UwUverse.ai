import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CharacterRequest {
  name: string;
  gender: string;
  height: string;
  build: string;
  eye_color: string;
  hair_color: string;
  skin_tone: string;
  personality_traits: string[];
  art_style: string;
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

// Fallback character images based on gender and style
const getFallbackImage = (gender: string, art_style: string): string => {
  const fallbackImages = {
    male: {
      anime: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    female: {
      anime: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    nonbinary: {
      anime: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    }
  };

  const genderImages = fallbackImages[gender as keyof typeof fallbackImages] || fallbackImages.nonbinary;
  return genderImages[art_style as keyof typeof genderImages] || genderImages.default;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, gender, height, build, eye_color, hair_color, skin_tone, personality_traits, art_style } = await req.json() as CharacterRequest;

    // Try OpenAI DALL-E first with retry logic
    try {
      const openai = initializeOpenAI();
      
      // Construct the prompt based on character traits and art style
      let stylePrefix = '';
      switch (art_style) {
        case 'anime':
          stylePrefix = 'Create a high-quality anime illustration in the style of Studio Ghibli';
          break;
        case 'manhwa':
          stylePrefix = 'Create a detailed manhwa/webtoon style illustration similar to Solo Leveling';
          break;
        case 'comic':
          stylePrefix = 'Create a modern comic book style illustration with clean lines';
          break;
        case 'realistic':
          stylePrefix = 'Create a photorealistic digital painting';
          break;
        case 'cartoon':
          stylePrefix = 'Create a stylized cartoon illustration with vibrant colors';
          break;
        default:
          stylePrefix = 'Create a high-quality digital illustration';
      }

      const prompt = `${stylePrefix} of a ${gender} character with the following features:
        - ${height} height with a ${build} build
        - Striking ${eye_color} eyes and ${hair_color} hair
        - ${skin_tone} skin tone
        - Their expression and pose should reflect their ${personality_traits.join(', ')} personality
        - The character should be centered in a dynamic pose with a soft, atmospheric background
        - The image should be high quality, well-lit, and suitable for a dating app profile
        - No text or watermarks
        - Portrait style, upper body shot with attention to detail`;

      const response = await withRetry(async () => {
        return await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          response_format: 'url',
          n: 1,
        });
      });

      const imageUrl = response.data[0]?.url;
      
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: imageUrl,
          model_used: 'dall-e-3'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (openaiError) {
      console.error('OpenAI image generation error:', openaiError);
      
      // Use fallback image generation based on character attributes
      const fallbackImageUrl = getFallbackImage(gender, art_style);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: fallbackImageUrl,
          fallback: true,
          message: 'Character created with curated stock image. AI image generation temporarily unavailable.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in ai-image-generation:', error);
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