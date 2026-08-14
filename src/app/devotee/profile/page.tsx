import { createClient } from '@/utils/supabase/server';
import { User, Mail, Calendar, Sparkles, Award, AlertCircle, ShieldCheck } from 'lucide-react';

export default async function DevoteeProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch stats for the last 30 days
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
  const date30DaysAgoStr = date30DaysAgo.toISOString().split('T')[0];

  const { data: attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('profile_id', user.id)
    .gte('date', date30DaysAgoStr);

  const { data: malas } = await supabase
    .from('mala_records')
    .select('count')
    .eq('profile_id', user.id)
    .gte('date', date30DaysAgoStr);

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve devotee profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    onTime: attendance?.filter((a) => a.status === 'on_time').length || 0,
    late: attendance?.filter((a) => a.status === 'late').length || 0,
    missed: attendance?.filter((a) => a.status === 'missed').length || 0,
    totalSessions: attendance?.length || 0,
    totalMalasCount: malas?.length || 0,
    averageMala:
      malas && malas.length > 0
        ? Math.round(malas.reduce((sum, m) => sum + m.count, 0) / malas.length)
        : 0,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col font-sans">
      <div className="border-b border-primary-dark-blue/15 pb-6 mb-8">
        <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
          Sadhaka Account
        </span>
        <h1 className="text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
          Devotee Profile
        </h1>
        <p className="text-xs text-primary-dark-blue/70 mt-1">
          Review your spiritual configuration and 30-day compliance logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Profile Card Info */}
        <div className="md:col-span-5 bg-white border border-primary-dark-blue/20 p-6 space-y-6">
          <div className="text-center pb-6 border-b border-primary-dark-blue/10">
            <div className="inline-flex p-3 bg-primary-dark-blue text-white border border-saffron rounded-full mb-3">
              <User className="h-10 w-10 text-light-devotional-blue" />
            </div>
            <h2 className="font-cinzel font-bold text-lg text-primary-dark-blue">
              {profile.full_name}
            </h2>
            <span className="inline-block bg-primary-dark-blue border border-saffron text-[10px] text-saffron px-3 py-0.5 mt-2 rounded font-bold uppercase tracking-wider">
              {profile.role.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-primary-dark-blue/5">
              <div className="flex items-center space-x-2 text-primary-dark-blue/60">
                <Mail className="h-4 w-4 text-saffron" />
                <span>Email Address</span>
              </div>
              <span className="font-semibold text-primary-dark-blue truncate max-w-[150px]">{profile.email}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-primary-dark-blue/5">
              <div className="flex items-center space-x-2 text-primary-dark-blue/60">
                <Sparkles className="h-4 w-4 text-saffron" />
                <span>Prescribed Japa</span>
              </div>
              <span className="font-bold text-primary-dark-blue">{profile.prescribed_mala} Rounds / Day</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-primary-dark-blue/5">
              <div className="flex items-center space-x-2 text-primary-dark-blue/60">
                <Calendar className="h-4 w-4 text-saffron" />
                <span>Member Since</span>
              </div>
              <span className="font-semibold text-primary-dark-blue">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center space-x-2 text-primary-dark-blue/60">
                <ShieldCheck className="h-4 w-4 text-saffron" />
                <span>Verification State</span>
              </div>
              <span className="bg-green-50 border border-green-200 text-green-700 font-bold px-2 py-0.5 uppercase tracking-wide text-[9px]">
                {profile.role === 'pending_devotee' ? 'Pending' : 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary Log */}
        <div className="md:col-span-7 bg-white border border-primary-dark-blue/20 p-6 space-y-6">
          <h3 className="font-cinzel text-sm font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 flex items-center space-x-2">
            <Award className="h-4 w-4 text-saffron" />
            <span>30-Day Sadhana Compliance Summary</span>
          </h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-parchment-dark/30 p-3 border border-primary-dark-blue/10">
              <span className="text-xl font-bold font-cinzel text-green-700">{stats.onTime}</span>
              <p className="text-[10px] uppercase font-bold text-primary-dark-blue/60 mt-1">On-Time</p>
            </div>
            <div className="bg-parchment-dark/30 p-3 border border-primary-dark-blue/10">
              <span className="text-xl font-bold font-cinzel text-amber-600">{stats.late}</span>
              <p className="text-[10px] uppercase font-bold text-primary-dark-blue/60 mt-1">Late</p>
            </div>
            <div className="bg-parchment-dark/30 p-3 border border-primary-dark-blue/10">
              <span className="text-xl font-bold font-cinzel text-red-600">{stats.missed}</span>
              <p className="text-[10px] uppercase font-bold text-primary-dark-blue/60 mt-1">Missed</p>
            </div>
          </div>

          <div className="border-t border-primary-dark-blue/10 pt-4 space-y-3.5 text-xs text-primary-dark-blue/90">
            <div className="flex justify-between items-center">
              <span>Total Scheduled Program Sessions Attended:</span>
              <strong className="text-sm font-cinzel">{stats.totalSessions}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Days Logged Japa Rounds:</span>
              <strong className="text-sm font-cinzel">{stats.totalMalasCount} / 30</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Average Daily Rounds Chanted:</span>
              <strong className="text-sm font-cinzel">{stats.averageMala} Rounds</strong>
            </div>
            <div className="bg-parchment-dark/30 border border-primary-dark-blue/10 p-4 text-[11px] leading-relaxed italic text-primary-dark-blue/80 mt-4">
              "One who chants the Holy Names of the Lord in a disciplined and regulated manner is gradually purified of all material contaminations and attains pure love for God."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
