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
      manhwa: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      comic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      cartoon: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    female: {
      anime: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      manhwa: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      comic: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      cartoon: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      default: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    nonbinary: {
      anime: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      manhwa: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      comic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      realistic: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      cartoon: 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
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
      
      // Enhanced art style descriptions for better DALL-E prompts
      let stylePrefix = '';
      let styleDetails = '';
      
      switch (art_style) {
        case 'anime':
          stylePrefix = 'Create a high-quality anime illustration in the style of Studio Ghibli or modern anime';
          styleDetails = 'with large expressive eyes, vibrant colors, soft cel-shading, clean line art, and dynamic anime proportions. The character should have the distinctive anime aesthetic with detailed hair and clothing textures.';
          break;
        case 'manhwa':
          stylePrefix = 'Create a detailed manhwa/webtoon style illustration similar to Solo Leveling or Tower of God';
          styleDetails = 'with refined facial features, soft gradient shading, detailed hair rendering, elegant proportions, and the sophisticated Korean webtoon art style. Use subtle color palettes and smooth digital painting techniques.';
          break;
        case 'comic':
          stylePrefix = 'Create a modern Western comic book style illustration like Marvel or DC Comics';
          styleDetails = 'with bold clean line art, dynamic poses, strong contrast, vibrant colors, and heroic proportions. The character should have the classic superhero comic aesthetic with detailed costume design and dramatic lighting.';
          break;
        case 'realistic':
          stylePrefix = 'Create a photorealistic digital painting with lifelike detail';
          styleDetails = 'featuring natural human proportions, realistic skin textures, detailed facial features, natural lighting, and high-quality digital art rendering. The image should look like a professional portrait photograph.';
          break;
        case 'cartoon':
          stylePrefix = 'Create a stylized cartoon illustration with Disney or Pixar-like quality';
          styleDetails = 'featuring exaggerated but appealing features, bright vibrant colors, smooth rounded shapes, expressive character design, and charming cartoon aesthetics. The style should be family-friendly and visually appealing.';
          break;
        default:
          stylePrefix = 'Create a high-quality digital illustration';
          styleDetails = 'with professional artistic quality, appealing character design, and vibrant colors.';
      }

      // Build personality-influenced pose and expression description
      const personalityDescription = personality_traits.length > 0 
        ? `The character's expression and pose should reflect their ${personality_traits.slice(0, 3).join(', ')} personality traits.`
        : 'The character should have a friendly and approachable expression.';

      const prompt = `${stylePrefix} of a ${gender} character ${styleDetails}

Character Details:
- ${height} height with a ${build} build
- Striking ${eye_color} eyes and ${hair_color} hair
- ${skin_tone} skin tone
- ${personalityDescription}

Technical Requirements:
- Portrait orientation, upper body shot with attention to facial details
- The character should be centered with a soft, atmospheric background
- High quality, well-lit, and suitable for a character profile
- No text, watermarks, or logos
- Professional digital art quality with clean composition

Art Style: ${art_style} with all the distinctive visual characteristics of that style.`;

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