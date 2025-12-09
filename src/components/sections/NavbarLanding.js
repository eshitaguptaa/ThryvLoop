import Link from 'next/link';
import Image from 'next/image';

export default function NavbarLanding() {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-[1000]">
      <div className="max-w-[1200px] mx-auto px-8 py-1.5 flex justify-between items-center">
        <Link 
          href="/" 
          className="flex items-center gap-2 no-underline"
        >
          <Image 
            src="/LandingPageImages/logo.png" 
            alt="ThryvLoop Logo" 
            width={36} 
            height={36}
            className="object-contain h-8 w-auto"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            ThryvLoop
          </span>
        </Link>
        <ul className="hidden md:flex gap-8 list-none">
          <li>
            <a href="#features" className="text-slate-900 font-medium no-underline transition-colors hover:text-indigo-500">
              Features
            </a>
          </li>
          <li>
            <a href="#solutions" className="text-slate-900 font-medium no-underline transition-colors hover:text-indigo-500">
              Solutions
            </a>
          </li>
          <li>
            <a href="#resources" className="text-slate-900 font-medium no-underline transition-colors hover:text-indigo-500">
              Resources
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-slate-900 font-medium no-underline transition-colors hover:text-indigo-500">
              Pricing
            </a>
          </li>
        </ul>
        <div className="flex gap-4">
          <Link 
            href="/auth/signin" 
            className="px-5 py-2 rounded-lg font-semibold no-underline transition-all bg-transparent text-indigo-500 border-2 border-indigo-500 hover:bg-indigo-500 hover:text-white"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="px-5 py-2 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

