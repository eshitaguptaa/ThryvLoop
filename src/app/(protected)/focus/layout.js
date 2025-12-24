'use client';

import { FocusProvider } from '@/contexts/FocusContext';

export default function FocusLayout({ children }) {
  return (
    <FocusProvider>
      <div className="relative min-h-screen">
        {/* Landscape Background Image */}
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)'
            }}
          >
            {/* Overlay for better widget visibility */}
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </FocusProvider>
  );
}

