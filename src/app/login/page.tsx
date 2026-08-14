import Link from 'next/link';
import { login } from '@/app/auth/actions';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function handleLogin(formData: FormData) {
    'use server';
    await login(formData);
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-parchment-dark">
      <div className="w-full max-w-md bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-cinzel text-primary-dark-blue">
            Sign In to JAGA
          </h2>
          <div className="h-0.5 w-16 bg-saffron mx-auto mt-2"></div>
          <p className="text-xs text-primary-dark-blue/70 mt-2 font-sans">
            Access the devotee discipline portal and structured learning.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 text-sm flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold font-cinzel text-primary-dark-blue mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-primary-dark-blue/40" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/30 text-sm font-sans focus:outline-none focus:border-saffron"
                placeholder="you@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold font-cinzel text-primary-dark-blue mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-primary-dark-blue/40" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/30 text-sm font-sans focus:outline-none focus:border-saffron"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-3 border border-saffron font-bold text-sm tracking-wider uppercase transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-primary-dark-blue/10">
          <p className="text-xs font-sans text-primary-dark-blue/80">
            Don't have an account?{' '}
            <Link href="/signup" className="text-secondary-blue font-semibold hover:underline">
              Request Verification
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
