import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import NewsletterSignup from '../components/marketing/NewsletterSignup';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase/supabaseClient';
import { motion } from 'framer-motion';
import { Heart, Zap, Shield, Users } from 'lucide-react';

const PricingPage: React.FC = () => {
  const { session } = useAuthStore();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;
        setUserProfile(profileData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  const handleSubscriptionUpdate = async () => {
    // Refetch user profile after subscription update
    if (session?.user) {
      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;
        setUserProfile(profileData);
      } catch (error) {
        console.error('Error refetching user profile:', error);
      }
    }
  };

  const benefits = [
    {
      icon: <Heart className="h-8 w-8 text-pink-400" />,
      title: "Deeper Connections",
      description: "Advanced AI creates more meaningful and personalized interactions with your companions."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: "More Credits",
      description: "Higher credit limits mean longer conversations and more character interactions."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-400" />,
      title: "Priority Support",
      description: "Get faster response times and dedicated assistance when you need help."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-400" />,
      title: "Multiple Characters",
      description: "Create and maintain relationships with multiple AI companions simultaneously."
    }
  ];

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What happens to my characters if I downgrade?",
      answer: "Your characters are never deleted. If you exceed your plan's character limit, older characters will be archived but can be restored when you upgrade again."
    },
    {
      question: "How do AI credits work?",
      answer: "AI credits are consumed when you interact with your characters. Each message, voice generation, and image creation uses credits. Credits reset monthly."
    },
    {
      question: "Is there a free trial for Pro features?",
      answer: "New users get a 7-day free trial of Pro features when they create their first character. No credit card required!"
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Absolutely. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-10">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Unlock Your Perfect AI Romance
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the plan that fits your journey to finding the perfect AI companion. 
                Start free and upgrade as your relationships grow deeper.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-transparent to-pink-100/50 dark:to-pink-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Upgrade Your Experience?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Discover what makes our premium plans special
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md"
                >
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SubscriptionPlans 
              userSubscriptionTier={userProfile?.subscription_tier || (session ? 'free' : undefined)}
              showHeader={false}
              variant="detailed"
              userEmail={session?.user?.email} // Pass user email for waitlist
              onSubscriptionUpdate={handleSubscriptionUpdate}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-pink-100/50 to-transparent dark:from-pink-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything you need to know about our pricing and features
              </p>
            </div>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md"
                >
                  <h3 className="text-xl font-semibold mb-3 text-pink-600 dark:text-pink-400">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <NewsletterSignup />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;