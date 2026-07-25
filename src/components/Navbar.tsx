'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, signOut, loading } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              ElimuX
            </Link>
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              BETA
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Explore
            </Link>
            <Link href="/universities" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Universities
            </Link>
            <Link href="/internships" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Internships
            </Link>
            <Link href="/employer/register" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              For Employers
            </Link>
            <Link href="/gamification" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Achievements
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Sign Out
                </button>
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {user?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button - simplified */}
          <div className="md:hidden">
            <Link href="/search" className="text-gray-600 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
