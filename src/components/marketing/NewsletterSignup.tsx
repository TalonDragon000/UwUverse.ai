import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { subscribeToNewsletter } from '../../lib/services/newsletter';
import { toast } from 'sonner';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const result = await subscribeToNewsletter(email);
      if (result.success) {
        toast.success(result.message);
        setEmail('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-grow uwu-input rounded-r-none"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-medium py-2 px-4 rounded-r-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          We'll never share your email with third parties.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-pink-100 to-lavender-100 dark:from-pink-900/30 dark:to-lavender-900/30 rounded-2xl shadow-md p-6 md:p-8 ${className}`}>
      <div className="md:flex md:items-center">
        <div className="md:flex-1 mb-6 md:mb-0 md:mr-8">
          <h3 className="text-xl md:text-2xl font-bold mb-2">Stay Updated!</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Subscribe to our newsletter for updates on new features, art styles, and AI improvements.
          </p>
        </div>
        <div className="md:w-96">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-grow uwu-input rounded-r-none"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-medium py-2 px-4 rounded-r-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            We'll never share your email with third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSignup;