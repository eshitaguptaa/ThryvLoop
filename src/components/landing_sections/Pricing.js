import Link from 'next/link';

export default function Pricing() {
  return (
    <section className="py-24 px-6 bg-white" id="pricing">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center max-w-[760px] mx-auto mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold text-sm mb-4">
              PRICING
            </span>
            <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">Start free. Upgrade when you want deeper insights, pro features, and premium ambience. Lifetime offer limited to first 2,000 signups.</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
            {/* Free Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center transition-all hover:-translate-y-2 hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Free</h3>
              <div className="text-4xl sm:text-5xl font-extrabold text-indigo-600 mb-2">₹0</div>
              <div className="text-slate-600 mb-6">Forever free — useful & complete</div>

              <ul className="list-none mb-8 text-left">
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
                  <li key={i} className="py-2 text-slate-900 flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl mt-0.5">✓</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/auth/signup?plan=free"
                className="inline-block w-full px-5 py-3 rounded-lg font-semibold no-underline transition-all bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white"
              >
                Get Started — Free
              </a>
            </div>

            {/* Pro Monthly Card */}
            <div className="relative bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-2 border-indigo-200 rounded-3xl p-8 text-center transition-all hover:-translate-y-2 hover:shadow-xl">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>

              <h3 className="text-2xl font-bold mb-4 text-slate-900">Pro — Monthly</h3>
              <div className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">₹89</div>
              <div className="text-slate-600 mb-6">per month — cancel anytime</div>

              <ul className="list-none mb-8 text-left">
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
                  <li key={i} className="py-2 text-slate-900 flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl mt-0.5">✓</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/auth/signup?plan=monthly"
                className="inline-block w-full px-5 py-3 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg"
              >
                Start 14-Day Trial
              </a>
            </div>

            {/* Pro Yearly + Lifetime Card (combined) */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center transition-all hover:-translate-y-2 hover:shadow-xl">
              {/* Yearly pricing */}
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Pro — Yearly</h3>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">₹599</div>
                <div className="text-sm text-slate-500 self-end"> / year (~₹50/mo)</div>
              </div>
              <div className="text-slate-600 mb-6">Best value — save ~45% vs monthly</div>

              <ul className="list-none mb-6 text-left">
                {[
                  "Everything in Pro (monthly)",
                  "Priority updates & early access to scenes",
                  "Personalized AI weekly report",
                  "Exclusive yearly-only ambience packs"
                ].map((item, i) => (
                  <li key={i} className="py-2 text-slate-900 flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl mt-0.5">✓</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/auth/signup?plan=yearly"
                className="inline-block w-full px-5 py-3 rounded-lg font-semibold no-underline transition-all bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Get Yearly — Save More
              </a>

              {/* Lifetime Offer */}
              <div className="mt-6 border-t pt-6">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c.667 0 1.333.333 2 .667m0 0A9 9 0 0112 21m0-13.333V3m0 5.667a9 9 0 00-2 .667" />
                  </svg>
                  Limited — First 2,000 users
                </div>

                <div className="text-2xl font-extrabold text-slate-900 mb-1">₹1,099</div>
                <div className="text-sm text-slate-500 mb-4">One-time — lifetime access (launch special)</div>

                <ul className="list-none mb-6 text-left">
                  {[
                    "All Pro features forever",
                    "Lifetime access to new ambience packs",
                    "Lifetime AI credits & premium support",
                    "Invite-only community events"
                  ].map((item, i) => (
                    <li key={i} className="py-2 text-slate-900 flex items-start gap-3">
                      <span className="text-indigo-600 font-bold text-xl mt-0.5">✓</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth/signup?plan=lifetime"
                  className="inline-block w-full px-5 py-3 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:brightness-95"
                >
                  Claim Lifetime (Limited)
                </a>
                <p className="text-xs text-slate-400 mt-3">Lifetime offer limited to the first 2,000 users. Prices increase after launch.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-10 text-slate-600 max-w-[760px] mx-auto">
            <p>All plans include regular updates and new features. Cancel anytime. No hidden fees. Student discount & campus programs available — contact us for bulk / campus licenses.</p>
          </div>
        </div>
      </section>
  );
}
