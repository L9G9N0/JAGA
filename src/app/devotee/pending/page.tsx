import { signout } from '@/app/auth/actions';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PendingDevoteePage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-parchment-dark">
      <div className="w-full max-w-md bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-8 text-center">
        <div className="inline-flex p-3 bg-amber-50 border border-saffron rounded-full text-saffron mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        
        <h2 className="text-2xl font-bold font-cinzel text-primary-dark-blue">
          Verification Pending
        </h2>
        <div className="h-0.5 w-16 bg-saffron mx-auto mt-2 mb-4"></div>

        <p className="text-sm text-primary-dark-blue/80 leading-relaxed font-sans mb-6">
          Your account has been created successfully. However, JAGA is a structured devotional discipline platform. Access to devotee programs and features requires manual verification by a Guru or Administrator.
        </p>

        <p className="text-xs text-primary-dark-blue/60 font-sans italic mb-8">
          Please contact your local coordinator or wait for Guru/Admin review.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/devotee/dashboard"
            className="flex-1 bg-white hover:bg-parchment text-primary-dark-blue py-2.5 px-4 border border-primary-dark-blue text-sm font-semibold font-cinzel flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Check Status</span>
          </Link>
          <form action={signout} className="flex-1">
            <button
              type="submit"
              className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-2.5 px-4 border border-saffron text-sm font-semibold font-cinzel flex items-center justify-center space-x-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
