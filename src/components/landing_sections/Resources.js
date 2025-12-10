import Link from 'next/link';

export default function Resources() {
  return (
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
            
          </div>
        </div>
      </section>
  );
}
