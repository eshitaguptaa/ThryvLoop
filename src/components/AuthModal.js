'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle authentication here
      console.log(mode === 'signin' ? 'Signing in...' : 'Signing up...', { email, password, name });
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-md z-[9998] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-md pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass morphism container */}
          <div 
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
            
            {/* Content */}
            <div className="relative p-5">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all duration-200 hover:scale-110"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Logo/Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center mb-2">
                  <Image 
                    src="/LandingPageImages/logo.png" 
                    alt="ThryvLoop Logo" 
                    width={46} 
                    height={46}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-0.5">
                  {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-sm text-slate-800">
                  {mode === 'signin' 
                    ? 'Sign in to continue to ThryvLoop' 
                    : 'Create your account and start your journey'}
                </p>
              </div>

              {/* Toggle buttons */}
              <div className="flex gap-2 mb-3 p-1 bg-white/20 rounded-xl backdrop-blur-sm">
                <button
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 px-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                    mode === 'signin'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-800 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 px-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                    mode === 'signup'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-800 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-800 mb-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === 'signup'}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-base text-slate-900 placeholder-slate-600"
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-base text-slate-900 placeholder-slate-600"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-base text-slate-900 placeholder-slate-600"
                    placeholder="••••••••"
                  />
                </div>

                {mode === 'signin' && (
                  <div className="flex items-center justify-between text-sm pt-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-indigo-500/20"
                      />
                      <span className="ml-2 text-slate-800">Remember me</span>
                    </label>
                    <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-3"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : (
                    mode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-3 flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-2 text-sm text-slate-800">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Social login buttons */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg text-base font-semibold bg-white/30 backdrop-blur-sm border border-white/30 text-slate-800 hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg text-base font-semibold bg-white/30 backdrop-blur-sm border border-white/30 text-slate-800 hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              {/* Footer text */}
              <p className="mt-4 text-center text-sm text-slate-800">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

