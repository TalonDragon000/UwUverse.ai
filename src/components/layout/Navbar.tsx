import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, User, X } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase/supabaseClient';
import UwuIcon from '../UwuIcon';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuthStore();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md fixed top-0 left-0 right-0 z-10 border-b border-pink-200 dark:border-pink-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <UwuIcon 
                size={40} 
                useImage={true} 
                className="animate-heartbeat" 
              />
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                UwUverse.ai
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-300" />
              )}
            </button>
            
            <Link
              to="/pricing"
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                location.pathname === '/pricing'
                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Pricing
            </Link>
            
            <Link
              to="/blog"
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                location.pathname === '/blog'
                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Blog
            </Link>
            
            {session ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="bg-pink-400 hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-500 text-white px-4 py-2 rounded-full transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={toggleTheme}
              className="flex items-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5 mr-3" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 mr-3" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
            
            <Link
              to="/pricing"
              className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <Link
              to="/blog"
              className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            
            {session ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <User className="h-5 w-5 mr-3" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="block px-3 py-2 rounded-md bg-pink-400 hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-500 text-white transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;