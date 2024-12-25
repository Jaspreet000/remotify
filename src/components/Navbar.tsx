'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    setIsLoggedIn(!!token);
    setIsAdmin(userRole === 'admin');
  }, []);

  const menuItems = [
    // Core Navigation
    { href: '/', label: 'Home', public: true },
    { href: '/dashboard', label: 'Dashboard', auth: true },
    
    // Focus & Productivity
    { href: '/focus', label: 'Focus Mode', auth: true },
    { href: '/analytics', label: 'Analytics', auth: true },
    
    // Collaboration
    { href: '/collaboration', label: 'Team Insights', auth: true },
    { href: '/leaderboard', label: 'Leaderboard', auth: true },
    
    // User Settings & Profile
    { href: '/profile', label: 'Profile', auth: true },
    { href: '/settings', label: 'Settings', auth: true },
    
    // Admin Only
    { href: '/admin-dashboard', label: 'Admin Panel', admin: true },
    
    // Authentication
    { href: '/auth/login', label: 'Login', public: true, hideIfAuth: true },
    { href: '/auth/register', label: 'Register', public: true, hideIfAuth: true },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ProductivityHub
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4">
            {menuItems.map((item) => {
              const shouldShow = 
                (item.public && (!item.hideIfAuth || !isLoggedIn)) ||
                (item.auth && isLoggedIn) ||
                (item.admin && isAdmin);

              if (!shouldShow) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userRole');
                  window.location.href = '/auth/login';
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => {
              const shouldShow = 
                (item.public && (!item.hideIfAuth || !isLoggedIn)) ||
                (item.auth && isLoggedIn) ||
                (item.admin && isAdmin);

              if (!shouldShow) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userRole');
                  window.location.href = '/auth/login';
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
