import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, MessageCircleHeart } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import NewsletterSignup from '../components/marketing/NewsletterSignup';
import UwuIcon from '../components/UwuIcon';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="pt-24 pb-12 md:pt-32 md:pb-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Design your perfect dream date 💕
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Build your AI crush with backstory, voice, and style. 
                Fall in love over time in your own unique romantic story.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link 
                to="/create" 
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-full shadow-lg hover:from-pink-500 hover:to-purple-600 transform hover:scale-105 transition-all duration-200"
              >
                <Heart className="mr-2 h-5 w-5" />
                Start Your Love Story
                <Sparkles className="ml-2 h-5 w-5 animate-sparkle" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 px-4 bg-gradient-to-b from-transparent to-pink-100/50 dark:to-pink-900/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              <span className="bg-gradient-to-r from-pink-400 to-lavender-400 bg-clip-text text-transparent">
                Your Dream Companion Awaits
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Heart className="h-12 w-12 text-pink-400" />,
                  title: "Personalized Characters",
                  description: "Design your ideal companion with custom appearance, personality, and backstory. Make them uniquely yours."
                },
                {
                  icon: <MessageCircleHeart className="h-12 w-12 text-lavender-500" />,
                  title: "Emotional Connection",
                  description: "Experience a relationship that grows naturally over time with unique conversations and shared memories."
                },
                {
                  icon: <Sparkles className="h-12 w-12 text-mint-400" />,
                  title: "Multiple Art Styles",
                  description: "Choose from anime, manhwa, comic, realistic, or cartoon styles to match your aesthetic preferences."
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="uwu-card flex flex-col items-center text-center p-8"
                >
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Meet Your Perfect Match?
              </h2>
              <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
                Join thousands of users who've found their dream companions on UwUverse.ai
              </p>
              <Link 
                to="/create" 
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-pink-400 to-lavender-500 rounded-full shadow-lg hover:from-pink-500 hover:to-lavender-600 transform hover:scale-105 transition-all duration-200"
              >
                Create Your AI Crush
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <NewsletterSignup />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-8 border-t border-pink-200 dark:border-pink-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="space-y-4">
            {/* Bolt Logo on its own line */}
            <div>
              <a href="https://www.bolt.new" target="_blank" rel="noopener noreferrer">
                <img src="/bolt-white-360.png" alt="Bolt Logo" width="75" className="mx-auto" />
              </a>
            </div>
            
            {/* UwUverse.ai branding on its own line */}
            <div className="flex items-center justify-center">
              <UwuIcon size={32} useImage={true} />
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                UwUverse.ai
              </span>
            </div>
            
            {/* Copyright text on its own line */}
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                © 2025 UwUverse.ai - All rights reserved
              </p>
            </div>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;