import { create } from 'zustand';
import { Database } from '../lib/supabase/database.types';

type Character = Database['public']['Tables']['characters']['Row'];
type InsertCharacter = Database['public']['Tables']['characters']['Insert'];

type CharacterState = {
  characters: Character[];
  activeCharacterId: string | null;
  characterCreationData: Partial<InsertCharacter>;
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  setActiveCharacterId: (id: string | null) => void;
  updateCharacterCreationData: (data: Partial<InsertCharacter>) => void;
  resetCharacterCreationData: () => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  activeCharacterId: null,
  characterCreationData: {},
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set((state) => ({ 
    characters: [...state.characters, character] 
  })),
  setActiveCharacterId: (id) => set({ activeCharacterId: id }),
  updateCharacterCreationData: (data) => set((state) => ({ 
    characterCreationData: { ...state.characterCreationData, ...data } 
  })),
  resetCharacterCreationData: () => set({ characterCreationData: {} }),
}));