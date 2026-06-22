'use client';

import { useState } from 'react';

export default function CompanyHubsNotifyForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/teams-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message || "You're on the list!");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 justify-center"
        aria-label="Get notified when Company Hubs launch"
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email for early access"
          disabled={status === 'loading' || status === 'success'}
          className="px-5 py-4 rounded-xl w-full sm:w-80 outline-none disabled:opacity-60"
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid rgba(15,23,42,0.15)',
            color: 'var(--dark)',
          }}
        />

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-7 py-4 rounded-xl font-semibold flex items-center gap-2 justify-center transition-colors duration-300 disabled:opacity-60"
          style={{
            backgroundColor: 'var(--dark)',
            color: 'var(--white)',
          }}
          onMouseEnter={(e) => {
            if (e.currentTarget.disabled) return;
            e.currentTarget.style.backgroundColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--dark)';
          }}
        >
          {status === 'loading' ? 'Sending…' : status === 'success' ? '✓ Subscribed' : '🔔 Notify Me'}
        </button>
      </form>

      {message ? (
        <p
          className="mt-4 text-sm"
          style={{ color: status === 'error' ? '#dc2626' : 'var(--gray)' }}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </>
  );
}
