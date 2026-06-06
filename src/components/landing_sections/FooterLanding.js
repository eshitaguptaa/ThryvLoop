import Link from 'next/link';
import { ScrollReveal } from '@/components/landing_sections/ScrollReveal';

export default function FooterLanding() {
  return (
    <ScrollReveal as="footer" variant="fadeUpSoft" className="bg-slate-900 text-white py-16 px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            ThryvLoop
          </h3>
          <p className="text-slate-400 leading-relaxed">
            Revolutionizing the digital workspace. Transform context-switching into flow state. Make the online office a place you look forward to inhabiting.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Product</h4>
          <ul className="list-none">
            <li><a href="#features" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Features</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Integrations</a></li>
            <li><a href="#pricing" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Pricing</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Roadmap</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Company</h4>
          <ul className="list-none">
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">About</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Blog</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Careers</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Resources</h4>
          <ul className="list-none">
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Documentation</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Help Center</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-400 no-underline block py-2 transition-colors hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto pt-8 border-t border-slate-700 text-center text-slate-400">
        <p>© 2025 ThryvLoop. All rights reserved.</p>
      </div>
    </ScrollReveal>
  );
}
