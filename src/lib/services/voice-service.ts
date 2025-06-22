// Separated voice service for better bundle splitting
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  gender: string;
  accent: string;
  age: string;
  tone: string;
  description: string;
  preview_url?: string;
}

// Voice cache for better performance
class VoiceCache {
  private cache = new Map<string, { data: ElevenLabsVoice[]; timestamp: number }>();
  private ttl = 30 * 60 * 1000; // 30 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: ElevenLabsVoice[]) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const voiceCache = new VoiceCache();

export const getElevenLabsVoices = async (): Promise<ElevenLabsVoice[]> => {
  const cached = voiceCache.get('voices');
  if (cached) {
    return cached;
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-elevenlabs-voices`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, { headers });
    const data = await response.json();

    if (data.success) {
      voiceCache.set('voices', data.voices);
      return data.voices;
    } else {
      throw new Error(data.error || 'Failed to fetch voices');
    }
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};

export const generateVoicePreview = async (voiceId: string, text: string) => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service/generate-voice-preview`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ voice_id: voiceId, text }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error generating voice preview:', error);
    throw error;
  }
};