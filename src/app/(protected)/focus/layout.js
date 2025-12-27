'use client';

import { FocusProvider } from '@/contexts/FocusContext';

export default function FocusLayout({ children }) {
  return (
    <FocusProvider>
      <div className="relative min-h-screen">
        {/* Landscape Background Video */}
        <div className="fixed inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          >
            <source src="/scenery1.mp4" type="video/mp4" />
          </video>
          {/* Overlay for better widget visibility */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </FocusProvider>
  );
}

