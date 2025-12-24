'use client';

/**
 * Development Helper Component
 * 
 * This component helps you quickly authenticate during frontend development.
 * It only works in development mode.
 * 
 * Usage: Add this component to your layout or any page during development
 * to easily access protected routes without logging in.
 */

import { useEffect } from 'react';

export default function DevAuthHelper() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      // Automatically set auth token if it doesn't exist
      if (!localStorage.getItem('authToken')) {
        localStorage.setItem('authToken', 'dev-mode');
        console.log('🔧 Dev Mode: Auto-authenticated for frontend development');
      }
      
      // Add a helper function to window for manual control
      if (typeof window !== 'undefined') {
        window.devAuth = {
          login: () => {
            localStorage.setItem('authToken', 'dev-mode');
            console.log('✅ Dev Mode: Logged in');
            window.location.reload();
          },
          logout: () => {
            localStorage.removeItem('authToken');
            console.log('❌ Dev Mode: Logged out');
            window.location.reload();
          },
          status: () => {
            const token = localStorage.getItem('authToken');
            console.log('🔍 Dev Mode Auth Status:', token ? 'Authenticated' : 'Not authenticated');
            return token;
          }
        };
        
        console.log('🛠️ Dev Mode: Use window.devAuth.login(), window.devAuth.logout(), or window.devAuth.status() in console');
      }
    }
  }, []);

  // Don't render anything
  return null;
}

