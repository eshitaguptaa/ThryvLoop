'use client';

import { useState, useEffect } from 'react';

export default function SpacesDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('Videos');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [volume, setVolume] = useState(10);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const categories = [
    { id: 'all', name: 'All', icon: null },
    { id: 'nature', name: 'Nature', icon: '🏔️' },
    { id: 'cafe', name: 'Cafe', icon: '☕' },
    { id: 'urban', name: 'Urban', icon: '🪟' },
    { id: 'floral', name: 'Floral', icon: '🌸' },
    { id: 'vintage', name: 'Vintage', icon: '📷' },
  ];

  const featuredSpaces = [
    { id: 1, name: 'Amsterdam Loft', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', badge: null },
    { id: 2, name: 'Mount Shuksan', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', badge: '4K ULTRA HD' },
    { id: 3, name: 'Lotus Lake', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', badge: null },
    { id: 4, name: 'rainy cafe in amsterdam', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', badge: null },
    { id: 5, name: 'Bali, Indonesia (TROPICAL WATERFALL)', image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400', badge: '4K HDR' },
    { id: 6, name: 'Mount Rainer Lake', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', badge: '4K ULTRA HD' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Spaces</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-gray-200">
              {['Videos', 'Images', 'Favorites'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5043F3]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search space"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5043F3] focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
              <button className="px-3 py-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Featured Spaces */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Featured Spaces</h3>
              <div className="grid grid-cols-2 gap-4">
                {featuredSpaces.map((space) => (
                  <div key={space.id} className="relative group cursor-pointer">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={space.image}
                        alt={space.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {space.badge && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {space.badge}
                        </div>
                      )}
                      <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full hover:bg-white transition-colors">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-1">{space.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Currently Playing Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Rain Forest</span>
              <span className="bg-[#5043F3] text-white text-xs px-2 py-0.5 rounded">Pro</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <button className="text-orange-300 hover:text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5043F3] mb-3">
            <span>@Community</span>
            <button className="text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
                <div 
                  className="absolute left-0 top-0 h-full bg-gray-400 rounded-full"
                  style={{ width: `${volume}%` }}
                ></div>
                <div 
                  className="absolute w-3 h-3 bg-gray-400 rounded-full -translate-y-1/2 top-1/2 cursor-pointer hover:bg-gray-500"
                  style={{ left: `calc(${volume}% - 6px)` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

