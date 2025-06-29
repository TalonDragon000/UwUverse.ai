import React, { useState, useEffect } from 'react';
import { Check, Star, Crown, Info, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSubscriptionPlans } from '../../lib/services/revenueCat';
import { subscribeToNewsletter } from '../../lib/services/newsletter';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  userSubscriptionTier?: string;
  showHeader?: boolean;
  variant?: 'default' | 'detailed';
  userEmail?: string; // Add userEmail prop
  onSubscriptionUpdate?: () => void;
}

interface RevenueCatPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: string;
    priceString: string;
    currencyCode: string;
  };
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  userSubscriptionTier = 'free',
  showHeader = true,
  variant = 'default',
  userEmail, // Destructure userEmail
  onSubscriptionUpdate
}) => {
  const [revenueCatPackages, setRevenueCatPackages] = useState<RevenueCatPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packages = await getSubscriptionPlans();
        setRevenueCatPackages(packages);
      } catch (error) {
        console.error('Failed to fetch subscription packages:', error);
      }
    };

    fetchPackages();
  }, []);

  const handleJoinWaitlist = async (planName: string) => {
    if (!userEmail) {
      toast.error('Please log in to join the waitlist', {
        description: 'You need to be logged in to join the Pro waitlist and receive updates.',
        duration: 4000,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await subscribeToNewsletter(userEmail, 'pro_waitlist');
      if (result.success) {
        toast.success(`🎉 Welcome to the ${planName} waitlist!`, {
          description: 'You\'ll be the first to know when premium features launch. You\'re also subscribed to our newsletter for updates.',
          duration: 6000,
        });
      } else {
        toast.error(`Failed to join ${planName} waitlist`, {
          description: result.message,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@uwuverse.ai?subject=Enterprise Plan Inquiry&body=Hi, I\'m interested in learning more about the Enterprise plan. Please contact me with more details.';
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started with AI companions',
      icon: <Star className="h-6 w-6" />,
      features: [
        '1,000 AI credits/month',
        'Max 3 AI characters',
        'Basic chat features',
        'Community support'
      ],
      buttonText: 'Current Plan',
      buttonVariant: 'disabled' as const,
      popular: false,
      comingSoon: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      description: 'Enhanced features for deeper connections',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '10,000 AI credits/month',
        'Up to 5 characters',
        'Premium chat features',
        'Deeper memory & emotions',
        'Voice messages',
        'Priority support'
      ],
      buttonText: 'Join Waitlist', // Changed button text
      buttonVariant: 'coming-soon' as const,
      popular: true,
      comingSoon: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '/month',
      description: 'Unlimited access for power users',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited AI credits',
        'Unlimited characters',
        'All premium features',
        'Advanced customization',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      buttonText: 'Contact Us',
      buttonVariant: 'outline' as const,
      popular: false,
      comingSoon: false
    }
  ];

  return (
    <div>
      {showHeader && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-pink-400 to-lavender-400 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock the full potential of AI companionship with our flexible pricing plans
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const isCurrentPlan = userSubscriptionTier === plan.id;
          const isDisabled = plan.buttonVariant === 'disabled' || isCurrentPlan || loading;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl ${
                plan.popular 
                  ? 'border-2 border-pink-300 dark:border-pink-700 transform hover:scale-105' 
                  : 'border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-400 to-lavender-400 text-white px-4 py-1 text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.comingSoon && (
                <div className="absolute -top-2 -right-2">
                  <div className="group relative">
                    <div className="text-white p-2 rounded-full shadow-lg" style={{ backgroundColor: '#7a8ff8' }}>
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Join the waitlist for premium features! Be the first to know when they launch.
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-pink-400 to-lavender-400 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                
                {variant === 'detailed' && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {plan.description}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {plan.id === 'enterprise' ? (
                  <button
                    onClick={handleContactSupport}
                    className="w-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-full font-medium transition-all duration-200 text-center"
                  >
                    {plan.buttonText}
                  </button>
                ) : plan.comingSoon ? (
                  <button
                    onClick={() => handleJoinWaitlist(plan.name)}
                    disabled={loading}
                    className="w-full text-white py-3 px-6 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: loading ? '#9ca3af' : '#7a8ff8',
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5588ee')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#7a8ff8')}
                  >
                    <Mail className="h-4 w-4" />
                    {loading ? 'Joining...' : plan.buttonText}
                  </button>
                ) : (
                  <button
                    disabled={isDisabled}
                    className={`w-full py-3 px-6 rounded-full font-medium transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {variant === 'detailed' && (
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-pink-50 to-lavender-50 dark:from-pink-900/20 dark:to-lavender-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Premium Features Coming Soon! 🚀</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              We're working hard to bring you enhanced AI companion features with our Pro and Enterprise plans. 
              Join the waitlist to be the first to know when premium subscriptions launch!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleContactSupport}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full font-medium transition-all duration-200"
              >
                Contact Support
              </button>
              <button
                onClick={() => handleJoinWaitlist('Premium')}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 text-white rounded-full font-medium transition-all duration-200 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: loading ? '#9ca3af' : '#7a8ff8'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5588ee')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#7a8ff8')}
              >
                <Mail className="h-4 w-4" />
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;