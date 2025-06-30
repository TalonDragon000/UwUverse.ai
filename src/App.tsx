import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import NotFoundPage from './pages/NotFoundPage';
import { ThemeProvider } from './components/theme/ThemeProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const { session } = useAuthStore();
  const isLoggedIn = !!session;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950 transition-colors duration-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/create" element={<CharacterCreationPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:id" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;