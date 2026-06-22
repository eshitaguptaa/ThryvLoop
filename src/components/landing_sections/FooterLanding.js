import { ScrollReveal } from '@/components/landing_sections/ScrollReveal';

export default function FooterLanding() {
  return (
    <ScrollReveal
      as="footer"
      variant="fadeUpSoft"
      className="w-full bg-[var(--footer)] text-white py-16 px-8"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
        <div className="lg:col-span-5">
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            ThryvLoop
          </h3>
          <p className="text-white/60 leading-relaxed max-w-md">
            Transforming digital workspaces for people and companies. One unified hub—no app-hopping—
            with focus, tasks, and analytics built to deliver measurable productivity gains.
          </p>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-lg font-semibold mb-4">Product</h4>
          <ul className="list-none">
            <li><a href="#features" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Features</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Integrations</a></li>
            <li><a href="#pricing" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Pricing</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Roadmap</a></li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-lg font-semibold mb-4">Company</h4>
          <ul className="list-none">
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">About</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Blog</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Careers</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h4 className="text-lg font-semibold mb-4">Resources</h4>
          <ul className="list-none">
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Documentation</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Help Center</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="text-white/60 no-underline block py-2 transition-colors hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/10 text-center text-white/60">
        <p>© 2025 ThryvLoop. All rights reserved.</p>
      </div>
    </ScrollReveal>
  );
}
