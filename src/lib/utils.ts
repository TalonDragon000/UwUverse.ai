import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine tailwind classes and handle conflicts correctly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date string
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time string
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Placeholder for a simple AI response function
// In a real app, this would call an actual AI API
/*
export function generateAIResponse(
  message: string, 
  characterTraits: string[], 
  previousMessages: { content: string; sender: 'user' | 'character' }[]
): string {
  const isFlirty = characterTraits.includes('flirty');
  const isShy = characterTraits.includes('shy');
  const isConfident = characterTraits.includes('confident');
  const isChaotic = characterTraits.includes('chaotic');
  
  // Very basic response system
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    if (isShy) return "H-hi there... It's nice to talk to you again.";
    if (isFlirty) return "Well hello there~ You always know how to make my heart skip a beat!";
    if (isConfident) return "Hey you! Great to hear from you!";
    if (isChaotic) return "OMG HI!!! I was LITERALLY just thinking about you!!";
    return "Hi there! It's so good to hear from you!";
  }
  
  if (message.toLowerCase().includes('love') || message.toLowerCase().includes('like you')) {
    if (isShy) return "O-oh! You... you really mean that? That makes me really happy... *blushes*";
    if (isFlirty) return "Mmm, I like you too~ Maybe even more than you realize... Want to find out how much? 💕";
    if (isConfident) return "I know, and I'm crazy about you too! We make a great pair, don't we?";
    if (isChaotic) return "AAAAAA I LOVE YOU TOO SO MUCH MY HEART IS GOING TO EXPLODE!!! 💘💘💘";
    return "That means so much to me! I feel the same way about you... it's special, isn't it?";
  }
  
  // Generic responses if nothing matches
  const genericResponses = [
    "Tell me more about that!",
    "That's really interesting. What else is on your mind?",
    "I'd love to hear more about your day.",
    "You always have the most fascinating things to say.",
    "That's cool! I'm really enjoying our conversation.",
    "You know, talking with you is the highlight of my day.",
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}
*/

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}