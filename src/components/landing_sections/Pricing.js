import Link from 'next/link';

export default function Pricing() {
  return (
    // Base colors using standard classes
    <section className="py-20 px-6 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-16">
            
            {/* UPDATED: Pricing Plans Badge with animated dot, using indigo colors */}
            <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200 shadow-sm uppercase mb-6">
                <span className="relative flex h-2 w-2">
                  {/* Pulsing effect using indigo-600 */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
                  {/* Solid dot using indigo-600 */}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                Pricing Plans
            </div>
            
            {/* UPDATED: Title with Indigo/Violet Gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 via-violet-700 to-indigo-800 leading-tight">
              Simple, Transparent Pricing
            </h1>
            
            {/* Subtitle (slate-500) */}
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-500 leading-relaxed">
              Start free. Upgrade for deeper insights, pro features, and a premium experience.
            </p>
          </header>

          {/* Cards Grid: lg:grid-cols-4 */}
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1100px] mx-auto">
            
            {/* 1. Free Card (Light Theme) */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex-grow">
                <h3 className="text-2xl font-semibold text-slate-900 mb-1.5">Free</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Forever free — useful &amp; complete</p>
                
                <div className="mt-7 mb-9">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹0</span>
                </div>

                <ul className="space-y-3.5 text-slate-500">
                  {[
                    "8 immersive environments (select)",
                    "Standard Pomodoro timer",
                    "Full task lists + subtasks",
                    "Basic productivity dashboard",
                    "Limited music integration",
                    "Read-only Gmail/Outlook & Calendar",
                    "5 AI assistant messages / day",
                    "1 canvas in editor",
                    "Community support"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500/slate-100) */}
              <a
                href="/signup?plan=free"
                className="mt-8 w-full py-3 px-6 font-semibold text-indigo-500 bg-slate-100 rounded-lg transition-colors duration-300 hover:bg-slate-200 text-center"
              >
                Get Started — Free
              </a>
            </div>

            {/* 2. Pro Monthly Card (Most Popular - Primary Accent) */}
            <div className="relative bg-white border-2 border-indigo-500 rounded-2xl p-8 flex flex-col shadow-2xl shadow-indigo-500/10 scale-105">
              
              {/* "Most Popular" Badge (indigo-500) */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-2 text-sm font-bold rounded-full shadow-lg text-center whitespace-nowrap">
                Most Popular
              </span>

              <div className="flex-grow pt-2">
                <h3 className="text-2xl font-semibold text-slate-900 mb-1.5">Pro Monthly</h3>
                <p className="text-slate-500 text-sm leading-relaxed">per month — cancel anytime</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹89</span>
                  <span className="text-lg text-slate-500 font-medium">/ month</span>
                </div>

                <ul className="space-y-3.5 text-slate-500">
                  {[
                    "All 50+ immersive environments (4K + dynamic)",
                    "Advanced Pomodoro (custom cycles & lock)",
                    "Full task management + smart reminders",
                    "Gmail, Outlook & Calendar full sync & actions",
                    "Eraser-style editor — unlimited canvases",
                    "AI assistant (unlimited messages)",
                    "Music mixer + focus playlists",
                    "Advanced analytics & heatmaps",
                    "Priority support",
                    "14-day free trial"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500) */}
              <a
                href="/signup?plan=monthly"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-indigo-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-center"
              >
                Start 14-Day Trial
              </a>
            </div>

            {/* 3. Pro Yearly Card (Light Theme) */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex-grow">
                <h3 className="text-2xl font-semibold text-slate-900 mb-1.5">Pro Yearly</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Best value — save ~45% vs monthly</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹599</span>
                  <span className="text-lg text-slate-500 font-medium">/ year</span>
                </div>

                <ul className="space-y-3.5 text-slate-500">
                  {[
                    "Everything in Pro (monthly)",
                    "Priority updates & early access to scenes",
                    "Personalized AI weekly report",
                    "Exclusive yearly-only ambience packs"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500) */}
              <a
                href="/signup?plan=yearly"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-indigo-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-center"
              >
                Get Yearly & Save
              </a>
            </div>

            {/* 4. Lifetime Card (Light Theme with GOLD accent and INNER GRADIENT) */}
            <div className="relative bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-[#F59E0B] rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
              
              <div className="flex-grow">
                {/* Title and Badge arranged horizontally */}
                <div className="flex items-center justify-center gap-3 mb-1.5">
                  {/* Title color is dark slate */}
                  <h3 className="text-2xl font-semibold text-slate-900">Lifetime</h3>
                  {/* Limited Offer Badge - pill shape, light background, dark text */}
                  <span className="px-2 py-0.5 text-xs font-medium text-[#D97706] bg-[#FCD34D]/70 rounded-full shadow-sm text-center whitespace-nowrap">
                    Limited Offer
                  </span>
                </div>
                
                {/* Secondary text color is gray */}
                <p className="text-slate-500 text-sm leading-relaxed">One-time payment</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  {/* Price color is dark slate */}
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹1,099</span>
                </div>

                <ul className="space-y-3.5 text-slate-500">
                  {[
                    "All Pro features forever",
                    "Lifetime access to new ambience packs",
                    "Lifetime AI credits & premium support",
                    "Invite-only community events"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Gold Star Icon */}
                      <span className="material-symbols-outlined mr-3 mt-0.5 text-[#F59E0B] flex-shrink-0" style={{ fontSize: '20px' }}>verified</span>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button using explicit orange/amber hex colors for reliable gradient */}
              <a
                href="/signup?plan=lifetime"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#F59E0B] rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#F97316]/40 hover:-translate-y-0.5 text-center"
              >
                Claim Lifetime Access
              </a>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="text-center mt-12 max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 leading-relaxed">
              All plans include regular updates. Cancel anytime. No hidden fees.
            </p>
          </footer>
        </div>
    </section>
  );
}