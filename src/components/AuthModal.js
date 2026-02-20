'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp } from '@clerk/nextjs';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const router = useRouter();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setIsVerifying(false);
    setVerificationCode('');
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

  if (!isOpen) return null;

  const handleOauth = async (strategy) => {
    setErrorMessage('');
    // redirectUrl must be a page that renders <AuthenticateWithRedirectCallback />
    const ssoCallbackUrl = '/auth/sso-callback';
    if (mode === 'signin') {
      if (!isSignInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: ssoCallbackUrl,
        redirectUrlComplete: '/home',
      });
    } else {
      if (!isSignUpLoaded) return;
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: ssoCallbackUrl,
        redirectUrlComplete: '/home',
      });
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!isSignInLoaded) return;
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onClose();
        router.push('/home');
        return;
      }

      if (result.status === 'needs_first_factor') {
        const firstFactor = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });

        if (firstFactor.status === 'complete') {
          await setActive({ session: firstFactor.createdSessionId });
          onClose();
          router.push('/home');
          return;
        }
      }

      setErrorMessage('Unable to sign in. Please try again.');
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Sign in failed.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!isSignUpLoaded) return;
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        onClose();
        router.push('/home');
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerifying(true);
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Sign up failed.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!isSignUpLoaded) return;
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        onClose();
        router.push('/home');
        return;
      }
      setErrorMessage('Verification failed. Please try again.');
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Verification failed.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-md z-9998 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-2 sm:p-2.5 pointer-events-none">
        <div 
          className="relative w-full max-w-sm sm:max-w-md pointer-events-auto"
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
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
            
            {/* Content */}
            <div className="relative p-3 sm:p-4">
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
              <div className="text-center mb-2 sm:mb-2.5">
                <div className="inline-flex items-center justify-center mb-1.5">
                  <Image 
                    src="/LandingPageImages/logo.png" 
                    alt="ThryvLoop Logo" 
                    width={36} 
                    height={36}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5">
                  {mode === 'signin' ? 'Welcome Back' : isVerifying ? 'Verify Email' : 'Get Started'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-800 leading-snug">
                  {mode === 'signin' 
                    ? 'Sign in to continue to ThryvLoop' 
                    : isVerifying 
                      ? 'Enter the verification code sent to your email'
                      : 'Create your account and start your journey'}
                </p>
              </div>

              {/* Toggle buttons */}
              {!isVerifying && (
                <div className="flex gap-2 mb-2.5 p-1 bg-white/20 rounded-xl backdrop-blur-sm">
                  <button
                    onClick={() => setMode('signin')}
                    className={`flex-1 py-1.5 sm:py-1.75 px-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                      mode === 'signin'
                        ? 'bg-white text-indigo-600 shadow-md'
                        : 'text-slate-800 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-1.5 sm:py-1.75 px-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                      mode === 'signup'
                        ? 'bg-white text-indigo-600 shadow-md'
                        : 'text-slate-800 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {!isVerifying && (
                <>
                  {/* Social login buttons */}
                  <div className="space-y-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleOauth('oauth_google')}
                      className="w-full py-2 rounded-lg sm:py-2.5 text-sm sm:text-base font-semibold bg-white/30 backdrop-blur-sm border border-white/30 text-slate-800 hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOauth('oauth_microsoft')}
                      className="w-full py-2 rounded-lg sm:py-2.5 text-sm sm:text-base font-semibold bg-white/30 backdrop-blur-sm border border-white/30 text-slate-800 hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M2 3h9v9H2zM13 3h9v9h-9zM2 13h9v9H2zM13 13h9v9h-9z"/>
                      </svg>
                      Continue with Microsoft
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-2 flex items-center">
                    <div className="flex-1 border-t border-white/20"></div>
                    <span className="px-2 text-xs sm:text-sm text-slate-800">or</span>
                    <div className="flex-1 border-t border-white/20"></div>
                  </div>
                </>
              )}

              {errorMessage && (
                <div className="mb-2 text-xs sm:text-sm text-red-600 text-center">
                  {errorMessage}
                </div>
              )}
              <div id="clerk-captcha" className="mt-2" />

              {!isVerifying ? (
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-1.5 sm:space-y-1.75">
                  {mode === 'signup' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label htmlFor="firstName" className="block text-sm font-semibold text-slate-800 mb-1">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-slate-900 placeholder-slate-600"
                          placeholder="First name"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="lastName" className="block text-sm font-semibold text-slate-800 mb-1">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-slate-900 placeholder-slate-600"
                          placeholder="Last name"
                        />
                      </div>
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
                      className="w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-slate-900 placeholder-slate-600"
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
                      className="w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-slate-900 placeholder-slate-600"
                      placeholder="••••••••"
                    />
                  </div>

                  {mode === 'signin' && (
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-indigo-500/20"
                        />
                        <span className="ml-2 text-slate-800">Remember me</span>
                      </label>
                      <button type="button" className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-1.4 rounded-lg sm:py-1.75 text-sm sm:text-base font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-1.75 sm:mt-2.5"
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
              ) : (
                <form onSubmit={handleVerify} className="space-y-1.5 sm:space-y-1.75">
                  <div>
                    <label htmlFor="verificationCode" className="block text-sm font-semibold text-slate-800 mb-1">
                      Verification Code
                    </label>
                    <input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className="w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-slate-900 placeholder-slate-600"
                      placeholder="Enter code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-1.4 rounded-lg sm:py-1.75 text-sm sm:text-base font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-1.75 sm:mt-2.5"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              )}

              {/* Footer text */}
              {!isVerifying && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

