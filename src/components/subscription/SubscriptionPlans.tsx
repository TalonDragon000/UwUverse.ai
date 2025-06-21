import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { purchaseSubscription } from '../../lib/services/revenueCat';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  userSubscriptionTier?: string;
  showHeader?: boolean;
  variant?: 'default' | 'detailed';
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  userSubscriptionTier = 'free',
  showHeader = true,
  variant = 'default'
}) => {
  const handleUpgrade = async (planId: string) => {
    try {
      await purchaseSubscription(planId);
      toast.success('Subscription upgraded successfully!');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to upgrade subscription. Please try again.');
    }
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
      popular: false
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
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'primary' as const,
      popular: true
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
      popular: false
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
          const isDisabled = plan.buttonVariant === 'disabled' || isCurrentPlan;

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
                  <Link
                    to="/contact"
                    className="w-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-full font-medium transition-all duration-200 text-center block"
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <button
                    onClick={() => !isDisabled && handleUpgrade(plan.id)}
                    disabled={isDisabled}
                    className={`w-full py-3 px-6 rounded-full font-medium transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-default'
                        : plan.popular
                        ? 'bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white transform hover:scale-105'
                        : 'bg-pink-400 hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-500 text-white'
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
            <h3 className="text-2xl font-bold mb-4">Need Help Choosing?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Not sure which plan is right for you? Our team is here to help you find the perfect fit for your AI companion needs.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full font-medium transition-all duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;