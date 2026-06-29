'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import LegalAuthConsent from '@/components/legal/LegalAuthConsent';
import { markAuthLoginTransition } from '@/lib/authTransition';

const inputClass =
  'w-full px-3 py-1.25 rounded-lg sm:py-1.5 bg-muted border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm sm:text-base text-foreground placeholder:text-muted-foreground';

const labelClass = 'block text-sm font-semibold text-foreground mb-1';

const modalEase = [0.32, 0.72, 0, 1];
const modalTransition = { duration: 0.34, ease: modalEase };

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function lockBodyScroll() {
  document.body.style.overflow = 'hidden';
  document.body.dataset.authModalOpen = 'true';
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
  delete document.body.dataset.authModalOpen;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMobileViewport();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [forgotStep, setForgotStep] = useState(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigatingAfterAuthRef = useRef(false);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setIsVerifying(false);
    setVerificationCode('');
    setForgotStep(null);
    setResetCode('');
    setNewPassword('');
    navigatingAfterAuthRef.current = false;
    setOauthLoading(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    }
  }, [isOpen]);

  useEffect(() => () => unlockBodyScroll(), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const unlockScroll = useCallback(() => {
    unlockBodyScroll();
  }, []);

  const navigateAfterAuth = useCallback(() => {
    const redirectUrl = searchParams.get('redirect_url');
    const destination = redirectUrl?.startsWith('/') ? redirectUrl : '/home';
    navigatingAfterAuthRef.current = true;
    unlockBodyScroll();
    markAuthLoginTransition();
    onClose();
    router.replace(destination);
  }, [searchParams, onClose, router]);

  const modalVariants = isMobile
    ? {
        hidden: { y: '100%' },
        visible: { y: 0 },
      }
    : {
        hidden: { opacity: 0, scale: 0.96, y: 16 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };

  const handleOauth = async (strategy) => {
    setErrorMessage('');
    setOauthLoading(strategy);
    const ssoCallbackUrl = '/auth/sso-callback';
    try {
      if (mode === 'signin') {
        if (!isSignInLoaded) {
          setOauthLoading(null);
          return;
        }
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: '/home',
        });
      } else {
        if (!isSignUpLoaded) {
          setOauthLoading(null);
          return;
        }
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: '/home',
        });
      }
    } catch (error) {
      setOauthLoading(null);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        'Unable to start sign in. Please try again.';
      setErrorMessage(message);
    }
  };

  const oauthButtonClass = (active) =>
    `w-full min-h-11 py-3 rounded-lg sm:py-2.5 text-base sm:text-sm font-semibold bg-muted border border-border text-foreground transition-all duration-200 flex items-center justify-center gap-2 ${
      active
        ? 'opacity-80 cursor-wait'
        : oauthLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-muted/80 cursor-pointer'
    }`;

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
        navigateAfterAuth();
        return;
      }

      if (result.status === 'needs_first_factor') {
        const firstFactor = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });

        if (firstFactor.status === 'complete') {
          await setActive({ session: firstFactor.createdSessionId });
          navigateAfterAuth();
          return;
        }
      }

      setErrorMessage('Unable to sign in. Please try again.');
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Sign in failed.';
      setErrorMessage(message);
    } finally {
      if (!navigatingAfterAuthRef.current) setIsLoading(false);
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
        navigateAfterAuth();
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerifying(true);
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Sign up failed.';
      setErrorMessage(message);
    } finally {
      if (!navigatingAfterAuthRef.current) setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!isSignInLoaded) return;
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setForgotStep('reset');
    } catch (error) {
      const message =
        error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Failed to send reset code.';
      setErrorMessage(message);
    } finally {
      if (!navigatingAfterAuthRef.current) setIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!isSignInLoaded) return;
      const firstFactor = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });

      if (firstFactor.status !== 'needs_new_password') {
        setErrorMessage('Invalid or expired code. Please try again.');
        return;
      }

      const resetResult = await signIn.resetPassword({ password: newPassword });
      if (resetResult.status === 'complete') {
        await setActive({ session: resetResult.createdSessionId });
        navigateAfterAuth();
        return;
      }

      setErrorMessage('Unable to reset password. Please try again.');
    } catch (error) {
      const message =
        error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Password reset failed.';
      setErrorMessage(message);
    } finally {
      if (!navigatingAfterAuthRef.current) setIsLoading(false);
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
        navigateAfterAuth();
        return;
      }
      setErrorMessage('Verification failed. Please try again.');
    } catch (error) {
      const message = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || 'Verification failed.';
      setErrorMessage(message);
    } finally {
      if (!navigatingAfterAuthRef.current) setIsLoading(false);
    }
  };

  const tabClass = (active) =>
    active
      ? 'cursor-pointer bg-card dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md ring-1 ring-border dark:ring-indigo-500/50'
      : 'cursor-pointer text-muted-foreground hover:text-foreground';

  return (
    <AnimatePresence onExitComplete={unlockScroll}>
      {isOpen && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-9998 bg-black/50 sm:bg-black/40 dark:sm:bg-black/70"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={onClose}
            aria-label="Close sign in dialog"
          />

          <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center p-0 sm:p-2.5 pointer-events-none">
            <motion.div
              className="relative w-full max-w-sm sm:max-w-md pointer-events-auto transform-gpu max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={modalTransition}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="relative rounded-t-3xl sm:rounded-3xl overflow-hidden bg-card border border-border shadow-2xl shadow-black/10 dark:shadow-black/40">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/8 via-purple-500/8 to-pink-500/5 pointer-events-none" />

                <div className="relative p-3 sm:p-4 pt-5 sm:pt-4">
                  {isMobile && (
                    <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden />
                  )}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

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
                <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-extrabold text-foreground mb-0.5">
                  {forgotStep
                    ? forgotStep === 'request'
                      ? 'Forgot Password'
                      : 'Reset Password'
                    : mode === 'signin'
                      ? 'Welcome Back'
                      : isVerifying
                        ? 'Verify Email'
                        : 'Get Started'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                  {forgotStep
                    ? forgotStep === 'request'
                      ? 'Enter your email and we will send you a reset code'
                      : 'Enter the code from your email and choose a new password'
                    : mode === 'signin'
                      ? 'Sign in to continue to ThryvLoop'
                      : isVerifying
                        ? 'Enter the verification code sent to your email'
                        : 'Create your account and start your journey'}
                </p>
              </div>

              {!isVerifying && !forgotStep && (
                <div className="flex gap-2 mb-2.5 p-1.5 bg-muted rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`flex-1 min-h-11 py-3 sm:py-2.5 px-3 rounded-lg text-base sm:text-sm font-semibold transition-all duration-200 ${tabClass(mode === 'signin')}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`flex-1 min-h-11 py-3 sm:py-2.5 px-3 rounded-lg text-base sm:text-sm font-semibold transition-all duration-200 ${tabClass(mode === 'signup')}`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {!isVerifying && !forgotStep && mode === 'signup' && (
                <LegalAuthConsent className="mb-2.5" />
              )}

              {!isVerifying && !forgotStep && (
                <>
                  <div className="space-y-1.5 mb-2.5">
                    <button
                      type="button"
                      disabled={Boolean(oauthLoading)}
                      onClick={() => handleOauth('oauth_google')}
                      className={oauthButtonClass(oauthLoading === 'oauth_google')}
                      aria-busy={oauthLoading === 'oauth_google'}
                    >
                      {oauthLoading === 'oauth_google' ? (
                        <span
                          className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
                          aria-hidden
                        />
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(oauthLoading)}
                      onClick={() => handleOauth('oauth_microsoft')}
                      className={oauthButtonClass(oauthLoading === 'oauth_microsoft')}
                      aria-busy={oauthLoading === 'oauth_microsoft'}
                    >
                      {oauthLoading === 'oauth_microsoft' ? (
                        <span
                          className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
                          aria-hidden
                        />
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                          <path fill="currentColor" d="M2 3h9v9H2zM13 3h9v9h-9zM2 13h9v9H2zM13 13h9v9h-9z" />
                        </svg>
                      )}
                      Continue with Microsoft
                    </button>
                  </div>

                  <div className="my-2 flex items-center">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-2 text-xs sm:text-sm text-muted-foreground">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                </>
              )}

              {errorMessage && (
                <div className="mb-2 text-xs sm:text-sm text-red-600 dark:text-red-400 text-center">
                  {errorMessage}
                </div>
              )}
              <div id="clerk-captcha" className="mt-2" />

              {forgotStep ? (
                <form
                  onSubmit={forgotStep === 'request' ? handleForgotPasswordRequest : handleForgotPasswordReset}
                  className="space-y-1.5 sm:space-y-1.75"
                >
                  <div>
                    <label htmlFor="forgot-email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={forgotStep === 'reset'}
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  {forgotStep === 'reset' && (
                    <>
                      <div>
                        <label htmlFor="resetCode" className={labelClass}>
                          Reset Code
                        </label>
                        <input
                          id="resetCode"
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          required
                          className={inputClass}
                          placeholder="Enter code from email"
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className={labelClass}>
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className={inputClass}
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-12 py-3.5 rounded-lg sm:py-2.5 text-base sm:text-sm font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2 sm:mt-2.5"
                  >
                    {isLoading
                      ? forgotStep === 'request'
                        ? 'Sending code...'
                        : 'Resetting password...'
                      : forgotStep === 'request'
                        ? 'Send Reset Code'
                        : 'Reset Password'}
                  </button>

                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(null);
                        setResetCode('');
                        setNewPassword('');
                        setErrorMessage('');
                      }}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      Back to sign in
                    </button>
                  </p>
                </form>
              ) : !isVerifying ? (
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-1.5 sm:space-y-1.75">
                  {mode === 'signup' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label htmlFor="firstName" className={labelClass}>
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className={inputClass}
                          placeholder="First name"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="lastName" className={labelClass}>
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className={inputClass}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>

                  {mode === 'signin' && (
                    <div className="flex justify-end text-xs sm:text-sm pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('request');
                          setErrorMessage('');
                        }}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-12 py-3.5 rounded-lg sm:py-2.5 text-base sm:text-sm font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2 sm:mt-2.5"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                    <label htmlFor="verificationCode" className={labelClass}>
                      Verification Code
                    </label>
                    <input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Enter code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-12 py-3.5 rounded-lg sm:py-2.5 text-base sm:text-sm font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2 sm:mt-2.5"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              )}

              {!isVerifying && !forgotStep && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {mode === 'signin' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
