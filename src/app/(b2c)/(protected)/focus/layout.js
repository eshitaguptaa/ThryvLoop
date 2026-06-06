'use client';

export default function FocusLayout({ children }) {
  return (
    <div className="relative min-h-screen pointer-events-none [&_*]:pointer-events-auto">
      {children}
    </div>
  );
}
