import Link from 'next/link';
import { signup } from '@/app/auth/actions';
import { KeyRound, Mail, User, AlertCircle } from 'lucide-react';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function handleSignup(formData: FormData) {
    'use server';
    await signup(formData);
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-parchment-dark">
      <div className="w-full max-w-md bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-cinzel text-primary-dark-blue">
            Request Access
          </h2>
          <div className="h-0.5 w-16 bg-saffron mx-auto mt-2"></div>
          <p className="text-xs text-primary-dark-blue/70 mt-2 font-sans">
            Create an account. Access is subject to verification by Guru/Admin.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 text-sm flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form action={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold font-cinzel text-primary-dark-blue mb-1.5">
              Full Name (Spiritual / Legal)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-primary-dark-blue/40" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/30 text-sm font-sans focus:outline-none focus:border-saffron"
                placeholder="Prabhu Ji / Devotee Name"
              />
            </div>
          </div>

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
                minLength={6}
                className="block w-full pl-10 pr-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/30 text-sm font-sans focus:outline-none focus:border-saffron"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-3 border border-saffron font-bold text-sm tracking-wider uppercase transition-colors"
          >
            Submit Request
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-primary-dark-blue/10">
          <p className="text-xs font-sans text-primary-dark-blue/80">
            Already have an account?{' '}
            <Link href="/login" className="text-secondary-blue font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
