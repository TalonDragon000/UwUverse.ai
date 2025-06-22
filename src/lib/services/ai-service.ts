// Optimized AI service with dynamic imports and caching
interface ChatRequest {
  message: string;
  character_id: string;
  chat_history: Array<{ role: 'user' | 'assistant'; content: string }>;
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

// In-memory cache for recent responses (LRU-style)
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 50;
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const responseCache = new ResponseCache();

export const generateChatResponse = async (request: ChatRequest) => {
  // Create cache key from request
  const cacheKey = `chat_${request.character_id}_${request.message.substring(0, 50)}`;
  const cached = responseCache.get(cacheKey);
  
  if (cached) {
    return { ...cached, cached: true };
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      responseCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
};

export const generateCharacterImage = async (request: CharacterRequest) => {
  // Create cache key for character generation
  const cacheKey = `char_${JSON.stringify(request)}`;
  const cached = responseCache.get(cacheKey);
  
  if (cached) {
    return { ...cached, cached: true };
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image-generation`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      responseCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Image generation API error:', error);
    throw error;
  }
};

// Lazy-loaded voice service
export const getVoiceService = async () => {
  const { getElevenLabsVoices, generateVoicePreview } = await import('./voice-service');
  return { getElevenLabsVoices, generateVoicePreview };
};