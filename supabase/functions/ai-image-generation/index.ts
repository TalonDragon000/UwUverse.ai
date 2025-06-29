import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

// Initialize Stability AI API
const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY') || 'sk-0lCsvzXwaYKKxA5AxqpQ4VlDda75BBQspBMbGM2ac38OhhYQ';
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

// Exponential backoff retry wrapper
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 30 second timeout wrapper for Stability AI
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 30000);
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
      anime: '/art-styles/male anime.jpg',
      '3d': '/art-styles/male 3d.jpg',
      comic: '/art-styles/male comicbook.jpg',
      realistic: '/art-styles/male 3d.jpg',
      default: '/art-styles/male anime.jpg'
    },
    female: {
      anime: '/art-styles/male anime.jpg',
      '3d': '/art-styles/female 3d.jpg',
      comic: '/art-styles/female comicbook.jpg',
      realistic: '/art-styles/female realistic.jpg',
      default: '/art-styles/female 3d.jpg'
    },
    nonbinary: {
      anime: '/art-styles/male anime.jpg',
      '3d': '/art-styles/male 3d.jpg',
      comic: '/art-styles/male comicbook.jpg',
      realistic: '/art-styles/female realistic.jpg',
      default: '/art-styles/male anime.jpg'
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

    // Try Stability AI first with retry logic
    try {
      if (!STABILITY_API_KEY) {
        throw new Error('Stability AI API key not configured');
      }
      
      // Enhanced art style descriptions for better Stability AI prompts
      let stylePrefix = '';
      let styleDetails = '';
      let negativePrompt = 'blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, text, watermark, signature, logo, copyright';
      
      switch (art_style) {
        case 'anime':
          stylePrefix = 'High-quality anime illustration';
          styleDetails = 'anime art style, cel-shaded, vibrant colors, large expressive eyes, clean line art, Studio Ghibli quality, detailed hair, soft lighting, anime character design';
          negativePrompt += ', realistic, photographic, western cartoon';
          break;
        case '3d':
          stylePrefix = 'High-quality 3D rendered character';
          styleDetails = '3D render, digital art, realistic lighting, smooth textures, modern 3D character design, Pixar quality, detailed modeling, professional 3D artwork';
          negativePrompt += ', 2D, flat, anime, cartoon';
          break;
        case 'comic':
          stylePrefix = 'Western comic book style illustration';
          styleDetails = 'comic book art, bold lines, dynamic shading, vibrant colors, superhero comic style, Marvel/DC Comics quality, detailed line work, dramatic lighting';
          negativePrompt += ', anime, realistic, 3D render';
          break;
        case 'realistic':
          stylePrefix = 'Photorealistic digital portrait';
          styleDetails = 'photorealistic, highly detailed, natural lighting, realistic skin texture, professional photography quality, lifelike, detailed facial features';
          negativePrompt += ', anime, cartoon, comic book, stylized';
          break;
        default:
          stylePrefix = 'High-quality digital illustration';
          styleDetails = 'professional digital art, detailed character design, vibrant colors, clean composition';
      }

      // Build personality-influenced pose and expression description
      const personalityDescription = personality_traits.length > 0 
        ? `Expression and pose reflecting ${personality_traits.slice(0, 3).join(', ')} personality.`
        : 'Friendly and approachable expression.';

      const prompt = `${stylePrefix} of a ${gender} character. ${styleDetails}

Character features: ${height} height, ${build} build, ${eye_color} eyes, ${hair_color} hair, ${skin_tone} skin tone. ${personalityDescription}

Portrait style, upper body shot, centered composition, soft background, high quality, professional artwork, detailed character design.`;

      console.log('Generating image with Stability AI...');
      console.log('Prompt:', prompt);

      const response = await withRetry(async () => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('negative_prompt', negativePrompt);
        formData.append('aspect_ratio', '1:1');
        formData.append('seed', '0');
        formData.append('output_format', 'jpeg');
        formData.append('style_preset', art_style === 'anime' ? 'anime' : art_style === 'comic' ? 'comic-book' : 'photographic');

        return await fetch(STABILITY_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'image/*',
          },
          body: formData,
        });
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Stability AI API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Stability AI API error: ${response.status} - ${errorText}`);
      }

      // Get the image as a blob and convert to base64
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      console.log('Successfully generated image with Stability AI');

      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: imageUrl,
          model_used: 'stability-ai-core',
          art_style: art_style
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (stabilityError) {
      console.error('Stability AI image generation error:', stabilityError);
      
      // Use fallback image generation based on character attributes
      const fallbackImageUrl = getFallbackImage(gender, art_style);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          image_url: fallbackImageUrl,
          fallback: true,
          message: 'Character created with curated reference image. AI image generation temporarily unavailable.',
          error_details: stabilityError.message
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