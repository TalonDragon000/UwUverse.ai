import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase/supabaseClient';
import { subscribeToNewsletter } from '../lib/services/newsletter';
import Navbar from '../components/layout/Navbar';
import UwuIcon from '../components/UwuIcon';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type TabType = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>(
    location.search.includes('signup') ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Handle email verification redirect and newsletter signup
  useEffect(() => {
    const handleEmailVerification = async () => {
      const urlParams = new URLSearchParams(location.search);
      const type = urlParams.get('type');
      const accessToken = urlParams.get('access_token');
      
      if (type === 'email_confirm' || type === 'signup') {
        try {
          // Get the current user after email confirmation
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.email) {
            // Subscribe to newsletter automatically
            const result = await subscribeToNewsletter(user.email);
            if (result.success) {
              toast.success('Welcome! You\'ve been subscribed to our newsletter.');
            }
          }
          
          // Clear URL parameters and redirect to login
          navigate('/auth', { replace: true });
          toast.success('Email confirmed! You can now log in to your account.');
        } catch (error) {
          console.error('Error handling email verification:', error);
          navigate('/auth', { replace: true });
        }
      }
    };

    handleEmailVerification();
  }, [location.search, navigate]);

  // Countdown timer for signup success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signupSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (signupSuccess && countdown === 0) {
      navigate('/auth');
    }
    return () => clearTimeout(timer);
  }, [signupSuccess, countdown, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific error for unconfirmed email
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            error.message.includes('signup_disabled')) {
          setError('Please confirm your email address to continue logging into your account.');
        } else {
          setError(error.message || 'Failed to log in');
        }
        return;
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      // Show success message instead of navigating
      setSignupSuccess(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setSignupSuccess(false);
    setActiveTab('login');
    setCountdown(5); // Reset countdown
  };

  // Render signup success view
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-lavender-400 bg-clip-text text-transparent">
                Congratulations!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your account has been created successfully. Please check your email and confirm your email address to continue.
              </p>
              
              <div className="mb-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Redirecting to login in {countdown} seconds...
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-400 to-lavender-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <button
                onClick={handleReturnToLogin}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white rounded-full font-medium transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Login
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <UwuIcon size={48} className="mx-auto mb-2 animate-heartbeat" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-lavender-400 bg-clip-text text-transparent">
                {activeTab === 'login' ? 'Welcome Back' : 'Join UwUverse.ai'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {activeTab === 'login'
                  ? 'Your AI companions miss you!'
                  : 'Create an account to find your perfect AI partner'}
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                className={`flex-1 py-2 font-medium text-center transition-colors duration-200 ${
                  activeTab === 'login'
                    ? 'text-pink-500 border-b-2 border-pink-500'
                    : 'text-gray-500 hover:text-pink-400'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`flex-1 py-2 font-medium text-center transition-colors duration-200 ${
                  activeTab === 'signup'
                    ? 'text-pink-500 border-b-2 border-pink-500'
                    : 'text-gray-500 hover:text-pink-400'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="uwu-input pl-10 w-full"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="uwu-input pl-10 w-full"
                      placeholder="********"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-medium py-3 px-4 rounded-full shadow-md transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}
            
            {/* Signup Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp}>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="uwu-input pl-10 w-full"
                      placeholder="Your display name"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="uwu-input pl-10 w-full"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="uwu-input pl-10 w-full"
                      placeholder="********"
                      minLength={8}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-medium py-3 px-4 rounded-full shadow-md transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AuthPage;