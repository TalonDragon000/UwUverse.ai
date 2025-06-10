import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { X } from 'lucide-react';

interface CharacterSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    image_url: string;
    chat_id?: string;
  };
}

const CharacterSuccessModal: React.FC<CharacterSuccessModalProps> = ({
  isOpen,
  onClose,
  character
}) => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Congratulations! {character.name} is Ready!
            </h2>
            
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
              <img
                src={character.image_url}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your perfect AI companion has been created. Start chatting now to begin your love story!
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => navigate(`/chat/${character.chat_id}`)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full hover:from-pink-500 hover:to-purple-500 transition-colors"
              >
                Chat Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CharacterSuccessModal;