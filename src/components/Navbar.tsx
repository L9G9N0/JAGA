'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import { useState } from 'react';
import { Menu, X, BookOpen, Clock, Award, Sparkles, LogOut, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  userEmail?: string | null;
  userRole?: string | null;
  userName?: string | null;
}

export default function Navbar({ userEmail, userRole, userName }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const publicLinks = [
    { href: '/aarti', label: 'Prayers & Aarti', icon: Sparkles },
    { href: '/bhoga', label: 'Bhoga Offering', icon: Award },
    { href: '/library', label: 'Lecture Library', icon: BookOpen },
    { href: '/books', label: 'Book References', icon: BookOpen },
  ];

  return (
    <nav className="bg-deepest-blue text-white border-b-4 border-saffron relative z-50">
      {/* Devotional Border Top Accent */}
      <div className="h-1 bg-saffron opacity-85"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Platform Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl font-bold tracking-widest text-light-devotional-blue font-cinzel">
                JAGA
              </span>
              <span className="hidden md:inline-block text-xs border-l border-saffron pl-2 text-parchment/80 font-sans tracking-wide">
                Devotional Discipline & Learning
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {publicLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-light-devotional-blue border-b border-light-devotional-blue'
                      : 'text-parchment/80 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 text-saffron" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Devotee / Admin Specific Links */}
            {userRole && userRole !== 'public' && userRole !== 'pending_devotee' && (
              <Link
                href="/devotee/dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/devotee') && !pathname.includes('pending')
                    ? 'text-light-devotional-blue border-b border-light-devotional-blue'
                    : 'text-parchment/80 hover:text-white'
                }`}
              >
                <Clock className="h-4 w-4 text-saffron" />
                <span>Devotee Panel</span>
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'guru') && (
              <Link
                href="/admin/dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-light-devotional-blue border-b border-light-devotional-blue'
                    : 'text-parchment/80 hover:text-white'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-saffron" />
                <span>Guru Panel</span>
              </Link>
            )}
          </div>

          {/* User Auth Buttons / State */}
          <div className="hidden lg:flex items-center space-x-4">
            {userEmail ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-parchment/60 font-sans">
                    {userName || userEmail}
                  </p>
                  <span className="inline-block bg-primary-dark-blue border border-saffron text-[10px] text-saffron px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                    {userRole?.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => signout()}
                  className="bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-2 border border-saffron text-sm font-medium transition-colors flex items-center space-x-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-parchment hover:text-white px-3 py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-blue hover:bg-light-devotional-blue hover:text-deepest-blue text-deepest-blue px-4 py-2 border border-saffron text-sm font-medium transition-all"
                >
                  Join Community
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-parchment/80 hover:text-white hover:bg-secondary-blue"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-deepest-blue border-t border-saffron">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium ${
                  isActive(link.href) ? 'text-light-devotional-blue bg-secondary-blue' : 'text-parchment/80'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {userRole && userRole !== 'public' && userRole !== 'pending_devotee' && (
              <Link
                href="/devotee/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium ${
                  pathname.startsWith('/devotee') ? 'text-light-devotional-blue bg-secondary-blue' : 'text-parchment/80'
                }`}
              >
                Devotee Panel
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'guru') && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium ${
                  pathname.startsWith('/admin') ? 'text-light-devotional-blue bg-secondary-blue' : 'text-parchment/80'
                }`}
              >
                Guru Panel
              </Link>
            )}

            {/* Auth Buttons in Mobile Menu */}
            <div className="pt-4 pb-2 border-t border-saffron mt-4 px-3">
              {userEmail ? (
                <div className="space-y-3">
                  <div className="text-left mb-2">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-parchment/60">{userEmail}</p>
                    <span className="inline-block bg-primary-dark-blue border border-saffron text-[10px] text-saffron px-2 py-0.5 rounded font-medium mt-1 uppercase">
                      {userRole?.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signout();
                    }}
                    className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-2 border border-saffron text-sm font-medium transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-parchment hover:text-white py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center bg-primary-blue text-deepest-blue py-2 border border-saffron text-sm font-medium"
                  >
                    Join Community
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
