'use client';

export default function FocusLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
