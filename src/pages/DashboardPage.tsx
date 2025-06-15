import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, CreditCard, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import CharacterCard from '../components/character/CharacterCard';
import { useAuthStore } from '../stores/authStore';
import { useCharacterStore } from '../stores/characterStore';
import { supabase } from '../lib/supabase/supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const DashboardPage: React.FC = () => {
  const { session } = useAuthStore();
  const { characters, setCharacters } = useCharacterStore();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        let { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        // If no profile exists, create one with default values
        if (!profileData) {
          const defaultProfile = {
            user_id: session.user.id,
            display_name: session.user.email?.split('@')[0] || 'User',
            ai_credits_remaining: 1000,
            subscription_tier: 'free',
            nsfw_enabled: false
          };
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([defaultProfile])
            .select()
            .single();
            
          if (createError) throw createError;
          profileData = newProfile;
        }
        
        setUserProfile(profileData);
        
        // Fetch characters (only non-archived ones)
        const { data: charactersData, error: charactersError } = await supabase
          .from('characters')
          .select(`
            *,
            chats (
              id,
              love_meter
            )
          `)
          .eq('user_id', session.user.id)
          .eq('is_archived', false);
        
        if (charactersError) throw charactersError;
        setCharacters(charactersData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session, setCharacters]);

  const handleArchiveCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .update({ is_archived: true })
        .eq('id', characterId)
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      // Remove the character from the current list
      setCharacters(characters.filter(char => char.id !== characterId));
      toast.success('Character archived successfully');
    } catch (error) {
      console.error('Error archiving character:', error);
      toast.error('Failed to archive character');
    }
  };
  
  const getSubscriptionLabel = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'Free Plan';
      case 'pro':
        return 'Pro Plan';
      case 'enterprise':
        return 'Enterprise Plan';
      default:
        return 'Unknown Plan';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
            </div>
          ) : (
            <>
              {/* User Summary */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">Welcome back, {userProfile?.display_name || 'User'}!</h1>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        You have {userProfile?.ai_credits_remaining || 0} AI credits remaining
                      </p>
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-lavender-400 mr-2" />
                        <span className="text-sm font-medium bg-lavender-100 dark:bg-lavender-900/30 text-lavender-800 dark:text-lavender-200 px-3 py-1 rounded-full">
                          {getSubscriptionLabel(userProfile?.subscription_tier || 'free')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Link
                        to="/create"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full text-sm font-medium transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Character
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Characters Grid */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Your AI Companions</h2>
                
                {characters.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No companions yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Create your first AI companion to start your love story!
                    </p>
                    <Link
                      to="/create"
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full font-medium transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Character
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((character, index) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        index={index}
                        onArchive={handleArchiveCharacter}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Subscription Info */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-2 border-transparent transition-all duration-200 hover:border-pink-200 dark:hover:border-pink-800">
                    <h3 className="text-xl font-bold mb-2">Free</h3>
                    <p className="text-3xl font-bold mb-4">
                      $0 <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/month</span>
                    </p>
                    <ul className="mb-6 space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>1,000 AI credits/month</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Max 3 AI characters</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Basic chat features</span>
                      </li>
                    </ul>
                    <button 
                      className={`w-full py-2 px-4 rounded-full font-medium transition-all duration-200 ${
                        userProfile?.subscription_tier === 'free'
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                          : 'bg-pink-400 hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-500 text-white'
                      }`}
                      disabled={userProfile?.subscription_tier === 'free'}
                    >
                      {userProfile?.subscription_tier === 'free' ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                  
                  {/* Pro Plan */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-2 border-pink-300 dark:border-pink-700 relative">
                    <div className="absolute top-0 right-0 bg-pink-400 text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                      Popular
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pro</h3>
                    <p className="text-3xl font-bold mb-4">
                      $9.99 <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/month</span>
                    </p>
                    <ul className="mb-6 space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>10,000 AI credits/month</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Up to 5 characters</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Premium chat features</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Deeper memory & emotions</span>
                      </li>
                    </ul>
                    <button 
                      className={`w-full py-2 px-4 rounded-full font-medium transition-all duration-200 ${
                        userProfile?.subscription_tier === 'pro'
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                          : 'bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white'
                      }`}
                      disabled={userProfile?.subscription_tier === 'pro'}
                    >
                      {userProfile?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                    </button>
                  </div>
                  
                  {/* Enterprise Plan */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-2 border-transparent transition-all duration-200 hover:border-pink-200 dark:hover:border-pink-800">
                    <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                    <p className="text-3xl font-bold mb-4">
                      Custom <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/month</span>
                    </p>
                    <ul className="mb-6 space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Unlimited AI credits</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Unlimited characters</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Premium features + priority access</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Dedicated support</span>
                      </li>
                    </ul>
                    <button 
                      className="w-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-full font-medium transition-all duration-200"
                    >
                      Contact Us
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Newsletter Signup */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-pink-100 to-lavender-100 dark:from-pink-900/30 dark:to-lavender-900/30 rounded-2xl shadow-md p-6 md:p-8">
                  <div className="md:flex md:items-center">
                    <div className="md:flex-1 mb-6 md:mb-0 md:mr-8">
                      <h3 className="text-xl md:text-2xl font-bold mb-2">Stay Updated!</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Subscribe to our newsletter for updates on new features, art styles, and AI improvements.
                      </p>
                    </div>
                    <div className="md:w-96">
                      <form className="flex">
                        <input
                          type="email"
                          placeholder="Your email address"
                          className="flex-grow uwu-input rounded-r-none"
                        />
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-medium py-2 px-4 rounded-r-lg transition-all duration-200"
                        >
                          Subscribe
                        </button>
                      </form>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        We'll never share your email with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;