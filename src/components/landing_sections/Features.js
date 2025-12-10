import Image from "next/image";

export default function Features() {
  return (
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
  );
}
