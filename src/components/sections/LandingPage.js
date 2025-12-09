import Link from 'next/link';
import NavbarLanding from '@/components/sections/NavbarLanding';
import Hero from '@/components/sections/Hero';
import FooterLanding from '@/components/sections/FooterLanding';

export default function LandingPage() {
  return (
    <>
      <NavbarLanding />
      <Hero />

      {/* Features Section */}
      <section className="py-24 px-8 bg-white" id="features">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold text-sm mb-4">
            FEATURES
          </span>
          <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Everything You Need to Thrive</h2>
          <p className="text-lg text-slate-600">A comprehensive suite of tools designed to eliminate digital fragmentation and enhance your focus</p>
        </div>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">🌄</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Ambience & Pomodoro</h3>
            <p className="text-slate-600 leading-relaxed">Immersive 4K video environments with scientifically mixed soundscapes. Built-in Pomodoro timer helps you maintain focus with structured work and break intervals. Choose from 50+ ambient environments.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">🎵</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Music Integration</h3>
            <p className="text-slate-600 leading-relaxed">Seamlessly integrate music from Spotify, YouTube Music, or Apple Music. Play your favorite tracks while maintaining ambient soundscapes for the perfect focus atmosphere.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">📊</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Analysis Tracker</h3>
            <p className="text-slate-600 leading-relaxed">Comprehensive dashboard showing your productivity patterns, focus session duration, task completion rates, and performance metrics over time. Visualize your progress and optimize your workflow.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">✍️</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Eraser.io Editor</h3>
            <p className="text-slate-600 leading-relaxed">Rich document editing environment similar to eraser.io. Brainstorm, plan, and execute your ideas with collaborative whiteboards and documents without leaving your flow state.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">📅</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Gmail, Outlook & Calendar</h3>
            <p className="text-slate-600 leading-relaxed">Seamless two-way sync with Gmail, Outlook, and Google Calendar. Manage your emails and schedule from one beautiful interface. Never miss an important meeting or deadline.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">✓</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Task Reminders</h3>
            <p className="text-slate-600 leading-relaxed">Intelligent task management with smart reminders. Create, organize, and track your to-dos with priority levels, due dates, and automated notifications. Stay on top of everything.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white text-3xl">🤖</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">AI Chatbot Assistant</h3>
            <p className="text-slate-600 leading-relaxed">Built-in AI assistant for brainstorming, task breakdowns, productivity tips, and instant help. Get answers and suggestions without context switching or leaving your workspace.</p>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
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

      {/* Resources Section */}
      <section className="py-24 px-8 bg-slate-50" id="resources">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold text-sm mb-4">
              RESOURCES
            </span>
            <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Learn & Get Started</h2>
            <p className="text-lg text-slate-600">Everything you need to maximize your productivity with ThryvLoop</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">📚</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Documentation</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Comprehensive guides and tutorials to help you get the most out of ThryvLoop. Learn about all features and integrations.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">Read Docs →</a>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">❓</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Help Center</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Find answers to common questions, troubleshoot issues, and learn best practices for productivity and focus.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">Visit Help Center →</a>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">🎥</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Video Tutorials</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Step-by-step video guides showing you how to set up integrations, use features, and optimize your workflow.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">Watch Videos →</a>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">💡</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Productivity Tips</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Expert advice on time management, focus techniques, and productivity strategies to help you achieve more.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">Read Tips →</a>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">🔌</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Integration Guides</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Detailed instructions for connecting Gmail, Outlook, Calendar, and other services to streamline your workflow.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">View Guides →</a>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">📖</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Blog</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">Latest updates, productivity insights, feature announcements, and stories from our community of users.</p>
              <a href="#" className="text-indigo-600 font-semibold no-underline hover:text-indigo-700">Read Blog →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 bg-white" id="pricing">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold text-sm mb-4">
              PRICING
            </span>
            <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">Start free, upgrade when you're ready to unlock the full potential</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 text-center transition-all hover:-translate-y-2 hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Free</h3>
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">₹0</div>
              <div className="text-slate-600 mb-8">Forever free</div>
              <ul className="list-none mb-8 text-left">
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  5 immersive environments
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Basic Pomodoro timer
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Simple task lists
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Basic analytics dashboard
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Limited music integration
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Community support
                </li>
              </ul>
              <Link 
                href="/auth/signup" 
                className="block w-full px-6 py-3 rounded-lg font-semibold no-underline transition-all bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white text-center"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-white border-2 border-indigo-500 rounded-3xl p-10 text-center transition-all hover:-translate-y-2 hover:shadow-xl relative bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Pro</h3>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">₹499</div>
              <div className="text-slate-600 mb-8">per month</div>
              <ul className="list-none mb-8 text-left">
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Unlimited immersive environments
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Advanced Pomodoro with custom intervals
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Full task management with reminders
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Gmail, Outlook & Calendar integration
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Eraser.io-style document editor
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  AI chatbot assistant
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Unlimited music streaming
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Comprehensive analysis tracker
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  Priority support
                </li>
                <li className="py-3 text-slate-900 flex items-start gap-3">
                  <span className="text-indigo-600 font-bold text-xl">✓</span>
                  14-day free trial
                </li>
              </ul>
              <Link 
                href="/auth/signup" 
                className="block w-full px-6 py-3 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 text-center"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          <div className="text-center mt-12 text-slate-600">
            <p>All plans include regular updates and new features. Cancel anytime. No hidden fees.</p>
          </div>
        </div>
      </section>

      <FooterLanding />
    </>
  );
}
