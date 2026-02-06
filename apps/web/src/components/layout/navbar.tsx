'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              AdultB2B
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/feed"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Feed
                </Link>
                <Link
                  href="/network"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Network
                </Link>
                <Link
                  href="/messages"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Messages
                </Link>
                <Link
                  href="/groups"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Groups
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {user?.displayName}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="btn-outline text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
