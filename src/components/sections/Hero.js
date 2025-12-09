import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="mt-6 px-6 py-10 flex justify-center bg-white relative overflow-visible min-h-screen">
      {/* Grey inner area with dotted background pattern */}
      <div className="max-w-[1280px] w-full relative bg-gray-100 rounded-3xl min-h-[600px] border border-gray-300">
          {/* Dotted background pattern inside the grey area - diamond shape */}
          <div 
            className="absolute inset-0 opacity-100 pointer-events-none rounded-3xl"
            style={{
              backgroundImage: `
                radial-gradient(circle, rgba(0, 0, 0, 0.05) 2px, transparent 2px),
                radial-gradient(circle, rgba(0, 0, 0, 0.05) 2px, transparent 2px)
              `,
              backgroundSize: '16px 16px, 16px 16px',
              backgroundPosition: '0 0, 8px 8px'
            }}
          />
        
          {/* Ambience image in top right corner */}
          <div className="absolute top-0 right-0 z-20">
            <Image 
              src={`/LandingPageImages/ambience.png?${Date.now()}`} 
              alt="Ambience" 
              width={290} 
              height={210}
              className="object-contain rounded-tr-3xl"
              unoptimized
            />
          </div>
        
          {/* Analytics image in top left corner */}
          <div className="absolute top-5 left-0 z-20">
            <Image 
              src={`/LandingPageImages/analytic.png?v=${Date.now()}`} 
              alt="Analytics" 
              width={290} 
              height={240}
              className="object-contain rounded-tl-3xl"
              unoptimized
            />
          </div>
        
          {/* Integrations image in bottom right corner */}
          <div className="absolute bottom-0 right-4 z-20">
            <Image 
              src={`/LandingPageImages/Integrations.png?v=${Date.now()}`} 
              alt="Integrations" 
              width={280} 
              height={200}
              className="object-contain rounded-br-3xl"
              unoptimized
            />
          </div>
        
          {/* Tasks image in bottom left corner */}
          <div className="absolute bottom-0 left-4 z-20">
            <Image 
              src={`/LandingPageImages/tasks.png?v=${Date.now()}`} 
              alt="Tasks" 
              width={270} 
              height={200}
              className="object-contain rounded-bl-3xl"
              unoptimized
            />
          </div>
        
          <div className="relative z-10 p-12">
            {/* Logo centered */}
            <div className="flex justify-center mb-10 mt-8">
              <div 
                className="bg-white/70 rounded-xl p-3" 
                style={{ 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 15px 30px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
                }}
              >
                <Image 
                  src="/LandingPageImages/logo.png" 
                  alt="ThryvLoop Logo" 
                  width={72} 
                  height={72}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-[720px] mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-0">
                Switch On. Lock In.<br />Go Beyond.
              </h1>
              <p className="text-lg text-slate-600 mb-8 mt-4">
                A productivity powerhouse blending ambience, music, analytics, tasks<br />and integrations into a frictionless flow.
              </p>

              <div className="flex justify-center">
                <Link 
                  href="/auth/signup"
                  className="px-8 py-3 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg transition-colors"
                >
                  Get free demo
                </Link>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
