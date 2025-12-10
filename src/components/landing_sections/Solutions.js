import Link from 'next/link';

export default function Solutions() {
  return (
    <section className="py-24 px-8 bg-slate-50" id="solutions">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold text-sm mb-4">
              SOLUTIONS
            </span>
            <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Built for Individuals</h2>
            <p className="text-lg text-slate-600">Designed specifically for solo creators, freelancers, students, and professionals who want to maximize their productivity</p>
          </div>
          <div className="max-w-[900px] mx-auto">
            <div className="bg-white rounded-3xl p-12 shadow-lg text-center">
              <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm mb-6">
                For Individuals
              </span>
              <h3 className="text-3xl font-extrabold mb-4 text-slate-900">Your Personal Productivity Powerhouse</h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Eliminate cognitive overload and context-switching. Transform your digital workspace into a sanctuary of focus and creativity. Everything you need to stay productive, all in one beautiful interface.
              </p>
              <ul className="list-none mb-8 text-left max-w-2xl mx-auto">
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  50+ immersive 4K ambient environments
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Built-in Pomodoro timer with customizable intervals
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Music integration from Spotify, YouTube, Apple Music
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Comprehensive analysis tracker and productivity dashboard
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Eraser.io-style collaborative document editor
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Gmail, Outlook, and Calendar integrations
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Smart task reminders and management system
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  AI chatbot assistant for instant help
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Beautiful, distraction-free interface
                </li>
                <li className="py-3 text-slate-900 flex items-center gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Cross-platform sync across all your devices
                </li>
              </ul>
              <div className="mt-8">
                <Link 
                  href="/auth/signup" 
                  className="px-6 py-3 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Start Free Trial
                </Link>
                <p className="mt-4 text-slate-600 text-sm">No credit card required • 14-day free trial</p>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}
