import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { Database } from '../../lib/supabase/database.types';

type Character = Database['public']['Tables']['characters']['Row'] & {
  chats: Array<{ id: string; love_meter: number }> | null;
};

interface CharacterCardProps {
  character: Character;
  index: number;
  onArchive: (characterId: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, index, onArchive }) => {
  const chat = character.chats && character.chats.length > 0 ? character.chats[0] : null;
  const loveMeter = chat ? chat.love_meter : 0;

  const handleArchive = () => {
    if (window.confirm(`Are you sure you want to archive ${character.name}? You can restore them later from your archived characters.`)) {
      onArchive(character.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden"
    >
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${character.image_url || 'https://images.pexels.com/photos/6157228/pexels-photo-6157228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'})` }}
      ></div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold">{character.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-1 rounded-full capitalize">
              {character.gender === 'male' ? 'Boyfriend' : character.gender === 'female' ? 'Girlfriend' : 'Partner'}
            </span>
            <button
              onClick={handleArchive}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              title="Archive character"
            >
              <Archive className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-1">
            <Heart className="h-4 w-4 text-pink-500 mr-2" />
            <span className="text-sm font-medium">Love Meter</span>
            <span className="text-sm ml-auto">{loveMeter}%</span>
          </div>
          <div className="love-meter">
            <div className="love-meter-fill" style={{ width: `${loveMeter}%` }}></div>
          </div>
        </div>

        {chat?.id ? (
          <Link
            to={`/chat/${chat.id}`}
            className="block w-full text-center bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white py-2 px-4 rounded-full font-medium transition-all duration-200"
          >
            Chat Now
          </Link>
        ) : (
          <button
            disabled
            className="block w-full text-center bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-2 px-4 rounded-full font-medium cursor-not-allowed"
          >
            Chat Not Available
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CharacterCard;