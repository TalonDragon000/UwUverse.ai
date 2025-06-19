import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase/supabaseClient';
import Navbar from '../components/layout/Navbar';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Handle redirect based on authentication status
          if (session) {
            // User is logged in, log them out and redirect to login
            supabase.auth.signOut().then(() => {
              navigate('/auth', { replace: true });
            });
          } else {
            // User is not logged in, redirect to homepage
            navigate('/', { replace: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [navigate, session]);

  const handleManualRedirect = () => {
    if (session) {
      supabase.auth.signOut().then(() => {
        navigate('/auth', { replace: true });
      });
    } else {
      navigate('/', { replace: true });
    }
  };

  const redirectText = session ? 'login page' : 'homepage';
  const redirectAction = session ? 'logging you out and redirecting to the' : 'redirecting to the';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* 404 Text */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center md:text-left"
              >
                <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-4">
                  404
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  Page Not Found
                </h2>
              </motion.div>

              {/* Cute Panda SVG */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
                className="flex-shrink-0"
              >
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-lg"
                >
                  {/* Panda Body */}
                  <ellipse cx="100" cy="140" rx="45" ry="35" fill="#f0f0f0" />
                  
                  {/* Panda Head */}
                  <circle cx="100" cy="90" r="50" fill="#f8f8f8" />
                  
                  {/* Ears */}
                  <circle cx="75" cy="55" r="20" fill="#2d3748" />
                  <circle cx="125" cy="55" r="20" fill="#2d3748" />
                  <circle cx="75" cy="55" r="12" fill="#f8f8f8" />
                  <circle cx="125" cy="55" r="12" fill="#f8f8f8" />
                  
                  {/* Eye patches */}
                  <ellipse cx="85" cy="80" rx="15" ry="20" fill="#2d3748" />
                  <ellipse cx="115" cy="80" rx="15" ry="20" fill="#2d3748" />
                  
                  {/* Eyes */}
                  <circle cx="85" cy="78" r="8" fill="#ffffff" />
                  <circle cx="115" cy="78" r="8" fill="#ffffff" />
                  <circle cx="87" cy="76" r="4" fill="#2d3748" />
                  <circle cx="117" cy="76" r="4" fill="#2d3748" />
                  
                  {/* Sad expression - tears */}
                  <ellipse cx="78" cy="88" rx="2" ry="8" fill="#60a5fa" opacity="0.7" />
                  <ellipse cx="122" cy="88" rx="2" ry="8" fill="#60a5fa" opacity="0.7" />
                  
                  {/* Nose */}
                  <ellipse cx="100" cy="95" rx="3" ry="2" fill="#2d3748" />
                  
                  {/* Mouth - sad */}
                  <path d="M 90 105 Q 100 100 110 105" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round" />
                  
                  {/* Arms */}
                  <ellipse cx="65" cy="125" rx="12" ry="25" fill="#f0f0f0" />
                  <ellipse cx="135" cy="125" rx="12" ry="25" fill="#f0f0f0" />
                  <circle cx="65" cy="140" r="8" fill="#2d3748" />
                  <circle cx="135" cy="140" r="8" fill="#2d3748" />
                  
                  {/* Legs */}
                  <ellipse cx="85" cy="165" rx="10" ry="15" fill="#f0f0f0" />
                  <ellipse cx="115" cy="165" rx="10" ry="15" fill="#f0f0f0" />
                  <ellipse cx="85" cy="175" rx="8" ry="6" fill="#2d3748" />
                  <ellipse cx="115" cy="175" rx="8" ry="6" fill="#2d3748" />
                  
                  {/* Floating hearts (to match the app theme) */}
                  <g opacity="0.6">
                    <motion.path
                      d="M 160 40 C 160 35, 165 30, 170 30 C 175 30, 180 35, 180 40 C 180 45, 170 55, 170 55 C 170 55, 160 45, 160 40 Z"
                      fill="#ff6ab1"
                      animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.path
                      d="M 25 60 C 25 57, 28 54, 31 54 C 34 54, 37 57, 37 60 C 37 63, 31 70, 31 70 C 31 70, 25 63, 25 60 Z"
                      fill="#b077ff"
                      animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.path
                      d="M 170 120 C 170 118, 172 116, 174 116 C 176 116, 178 118, 178 120 C 178 122, 174 127, 174 127 C 174 127, 170 122, 170 120 Z"
                      fill="#20d78f"
                      animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
                    />
                  </g>
                </svg>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8"
            >
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Oops! The page you're looking for seems to have wandered off. 
                Don't worry, our sad panda will help you find your way back!
              </p>

              <div className="mb-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Automatically {redirectAction} {redirectText} in {countdown} seconds...
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
                  <motion.div 
                    className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(countdown / 5) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <button
                onClick={handleManualRedirect}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105"
              >
                <Home className="h-4 w-4 mr-2" />
                {session ? 'Return to Login' : 'Return to Homepage'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFoundPage;