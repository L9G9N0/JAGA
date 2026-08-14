import { createClient } from '@/utils/supabase/server';
import { getKolkataDateString, submitMalaCount, submitDailyReport } from '@/app/devotee/actions';
import Link from 'next/link';
import {
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Calendar,
  Activity,
  CheckCircle,
  HelpCircle,
  Play,
  Heart,
  Plus,
  AlertCircle
} from 'lucide-react';

export default async function DevoteeDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  async function handleMalaSubmit(formData: FormData) {
    'use server';
    await submitMalaCount(formData);
  }

  async function handleReportSubmit(formData: FormData) {
    'use server';
    await submitDailyReport(formData);
  }

  // Fetch devotee profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const todayStr = await getKolkataDateString();

  // Fetch schedule configs
  const { data: configs } = await supabase
    .from('schedule_configs')
    .select('*')
    .order('start_time_local', { ascending: true });

  // Fetch today's attendance records
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('profile_id', user.id)
    .eq('date', todayStr);

  // Fetch today's scheduled lectures
  // We look for lectures scheduled to start today (in IST)
  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('active', true)
    .order('scheduled_start', { ascending: true });

  // Fetch today's Mala record
  const { data: todayMala } = await supabase
    .from('mala_records')
    .select('*')
    .eq('profile_id', user.id)
    .eq('date', todayStr)
    .single();

  // Fetch today's Daily Report
  const { data: todayReport } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('profile_id', user.id)
    .eq('date', todayStr)
    .single();

  // Fetch past 30 days compliance stats
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
  const date30DaysAgoStr = date30DaysAgo.toISOString().split('T')[0];

  const { data: last30Attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('profile_id', user.id)
    .gte('date', date30DaysAgoStr);

  const { data: last30Mala } = await supabase
    .from('mala_records')
    .select('count')
    .eq('profile_id', user.id)
    .gte('date', date30DaysAgoStr);

  // Calculate compliance counts
  const attendanceStats = {
    onTime: last30Attendance?.filter(a => a.status === 'on_time').length || 0,
    late: last30Attendance?.filter(a => a.status === 'late').length || 0,
    missed: last30Attendance?.filter(a => a.status === 'missed').length || 0,
    excused: last30Attendance?.filter(a => a.status === 'excused').length || 0,
  };

  const totalReportsCount = last30Mala?.length || 0;
  const averageMala = totalReportsCount > 0
    ? Math.round(last30Mala!.reduce((sum, m) => sum + m.count, 0) / totalReportsCount)
    : 0;

  // Helper to convert time configuration into target Date object
  const getKolkataDateTime = (timeStr: string): Date => {
    return new Date(`${todayStr}T${timeStr}+05:30`);
  };

  const now = new Date();

  // Process and evaluate schedule items
  const processedSchedule = (configs || []).map((config) => {
    const start = getKolkataDateTime(config.start_time_local);
    const end = getKolkataDateTime(config.end_time_local);

    let status: 'upcoming' | 'active' | 'completed' | 'missed' | 'recorded' = 'upcoming';
    let attendanceRecord = todayAttendance?.find(a => a.config_id === config.id);

    if (now < start) {
      status = 'upcoming';
    } else if (now >= start && now <= end) {
      status = 'active';
    } else {
      // It has finished
      if (attendanceRecord) {
        status = 'recorded';
      } else {
        status = config.is_mandatory ? 'missed' : 'completed';
      }
    }

    return {
      ...config,
      start,
      end,
      status,
      record: attendanceRecord
    };
  });

  // Active Japa room link check (Japa is active if the current time falls inside the Japa window)
  const japaSlot = processedSchedule.find(s => s.type === 'japa');
  const isJapaActive = japaSlot?.status === 'active';

  // Scheduled lecture slot evaluation
  const activeLecture = lectures?.find((lec) => {
    const start = new Date(lec.scheduled_start);
    const end = new Date(start.getTime() + lec.duration_seconds * 1000);
    return now >= start && now <= end;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col font-sans">
      {/* Devotee Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary-dark-blue/15 pb-6 mb-8 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
            Verified Devotee Portal
          </span>
          <h1 className="text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
            Hari Om, {profile?.full_name || 'Devotee'}
          </h1>
          <p className="text-xs text-primary-dark-blue/70 mt-1">
            Chanting Standard: <strong>{profile?.prescribed_mala || 16} Rounds</strong> | Date: {todayStr} (Asia/Kolkata)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/devotee/profile"
            className="bg-white text-primary-dark-blue px-5 py-2.5 border border-primary-dark-blue/30 text-xs font-bold font-cinzel transition-all hover:bg-parchment-dark"
          >
            Discipline History
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-sans flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 text-xs font-sans flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* LEFT COLUMN: Actions & Forms & Stats */}
        <div className="lg:col-span-7 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-primary-dark-blue/20 p-4">
            <div className="text-center p-2 border-r border-primary-dark-blue/10">
              <span className="text-2xl font-bold font-cinzel text-green-700">{attendanceStats.onTime}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark-blue/60 mt-1">On-Time</p>
            </div>
            <div className="text-center p-2 sm:border-r border-primary-dark-blue/10">
              <span className="text-2xl font-bold font-cinzel text-amber-600">{attendanceStats.late}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark-blue/60 mt-1">Late</p>
            </div>
            <div className="text-center p-2 border-r border-primary-dark-blue/10">
              <span className="text-2xl font-bold font-cinzel text-red-600">{attendanceStats.missed}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark-blue/60 mt-1">Missed</p>
            </div>
            <div className="text-center p-2">
              <span className="text-2xl font-bold font-cinzel text-primary-dark-blue">{averageMala}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark-blue/60 mt-1">Avg Mala</p>
            </div>
          </div>

          {/* Quick Japa Session Card */}
          {isJapaActive && (
            <div className="bg-light-devotional-blue/20 border-2 border-primary-blue p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center space-x-3 text-left">
                <div className="bg-primary-dark-blue p-2.5 border border-saffron rounded-full text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-primary-dark-blue">Live Japa Chanting Room</h4>
                  <p className="text-xs text-primary-dark-blue/80 font-sans">The congregation Japa session is currently active.</p>
                </div>
              </div>
              <Link
                href="/devotee/japa"
                className="w-full sm:w-auto bg-primary-dark-blue hover:bg-secondary-blue text-white px-6 py-2 border border-saffron text-xs font-bold font-cinzel text-center flex items-center justify-center space-x-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Join Japa Session</span>
              </Link>
            </div>
          )}

          {/* Forms Section */}
          <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8 space-y-8">
            {/* Mala Submission Form */}
            <div>
              <h3 className="font-cinzel text-base font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-saffron" />
                <span>Daily Mala Submission</span>
              </h3>
              
              {todayMala ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 text-xs font-sans flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <span>You have submitted <strong>{todayMala.count} Rounds</strong> of Japa today.</span>
                  </div>
                  <span className="text-[10px] text-green-700/60">
                    Logged at {new Date(todayMala.submitted_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              ) : (
                <form action={handleMalaSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                  <input type="hidden" name="date" value={todayStr} />
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5 font-sans">
                      Rounds Chanted
                    </label>
                    <input
                      type="number"
                      name="count"
                      min="0"
                      required
                      placeholder="e.g. 16"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm font-sans focus:outline-none focus:border-saffron"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-primary-dark-blue hover:bg-secondary-blue text-white py-2.5 px-6 border border-saffron font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
                  >
                    Log Rounds
                  </button>
                </form>
              )}
            </div>

            {/* Daily Compliance Checklist Form */}
            <div>
              <h3 className="font-cinzel text-base font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-saffron" />
                <span>Daily Sadhana Checklist</span>
              </h3>

              {todayReport ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 text-xs font-sans space-y-2">
                  <div className="flex items-center space-x-2 justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span>Daily report has been logged successfully (Status: <strong>{todayReport.status.toUpperCase()}</strong>).</span>
                    </div>
                    <span className="text-[10px] text-green-700/60">
                      Logged at {new Date(todayReport.submitted_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                  <div className="border-t border-green-200/50 pt-2 grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold text-green-900">
                    <span className={todayReport.completed_activities.arati ? 'text-green-700' : 'text-green-300'}>
                      Arati: {todayReport.completed_activities.arati ? '✓' : '✗'}
                    </span>
                    <span className={todayReport.completed_activities.japa ? 'text-green-700' : 'text-green-300'}>
                      Japa: {todayReport.completed_activities.japa ? '✓' : '✗'}
                    </span>
                    <span className={todayReport.completed_activities.lecture ? 'text-green-700' : 'text-green-300'}>
                      Lecture: {todayReport.completed_activities.lecture ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ) : (
                <form action={handleReportSubmit} className="space-y-4 font-sans text-sm">
                  <input type="hidden" name="date" value={todayStr} />
                  
                  {/* Checklist Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-parchment-dark/30 p-4 border border-primary-dark-blue/10">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="arati"
                        className="h-4 w-4 rounded border-primary-dark-blue/30 text-primary-dark-blue focus:ring-saffron"
                      />
                      <span className="text-xs font-bold text-primary-dark-blue">Arati Attendance</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="japa"
                        className="h-4 w-4 rounded border-primary-dark-blue/30 text-primary-dark-blue focus:ring-saffron"
                      />
                      <span className="text-xs font-bold text-primary-dark-blue">Japa Session</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="lecture"
                        className="h-4 w-4 rounded border-primary-dark-blue/30 text-primary-dark-blue focus:ring-saffron"
                      />
                      <span className="text-xs font-bold text-primary-dark-blue">Lecture Study</span>
                    </label>
                  </div>

                  {/* Reading Minutes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5">
                      Book Reading (Minutes Studied)
                    </label>
                    <input
                      type="number"
                      name="readingMinutes"
                      min="0"
                      placeholder="e.g. 30"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5">
                      Additional Comments / Notes
                    </label>
                    <textarea
                      name="comments"
                      rows={2}
                      placeholder="Log exceptions or devotional details..."
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-2.5 border border-saffron font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Submit Daily Report
                  </button>
                  <p className="text-[10px] text-primary-dark-blue/60 text-center italic mt-1.5">
                    Note: Reports submitted after 10:00 PM local time are automatically marked as LATE.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Today's Devotional Schedule */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-5">
            <h3 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2.5 mb-4 flex items-center justify-between">
              <span>Today's Schedule</span>
              <Calendar className="h-4 w-4 text-saffron" />
            </h3>

            {/* List of configs */}
            <div className="space-y-4">
              {processedSchedule.map((slot) => {
                let badgeColor = '';
                let statusLabel = '';
                
                if (slot.status === 'upcoming') {
                  badgeColor = 'bg-gray-100 text-gray-600 border-gray-300';
                  statusLabel = 'Upcoming';
                } else if (slot.status === 'active') {
                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse';
                  statusLabel = 'Active Now';
                } else if (slot.status === 'recorded') {
                  const s = slot.record?.status;
                  if (s === 'on_time') {
                    badgeColor = 'bg-green-50 text-green-700 border-green-300';
                    statusLabel = 'Present';
                  } else if (s === 'late') {
                    badgeColor = 'bg-amber-50 text-amber-700 border-amber-300';
                    statusLabel = 'Late';
                  } else {
                    badgeColor = 'bg-gray-50 text-gray-700 border-gray-300';
                    statusLabel = 'Recorded';
                  }
                } else if (slot.status === 'missed') {
                  badgeColor = 'bg-red-50 text-red-700 border-red-300';
                  statusLabel = 'Missed';
                } else {
                  badgeColor = 'bg-gray-100 text-gray-700 border-gray-300';
                  statusLabel = 'Completed';
                }

                return (
                  <div
                    key={slot.id}
                    className={`border p-4 transition-all flex flex-col justify-between gap-3 ${
                      slot.status === 'active'
                        ? 'border-saffron bg-parchment-dark/20'
                        : 'border-primary-dark-blue/10 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold font-sans text-secondary-blue">
                          {slot.start_time_local.substring(0, 5)} - {slot.end_time_local.substring(0, 5)}
                        </span>
                        <h4 className="font-cinzel font-bold text-sm text-primary-dark-blue mt-0.5">
                          {slot.title}
                        </h4>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold font-sans px-2.5 py-0.5 border ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Conditional Action Buttons inside slots */}
                    {slot.type === 'lecture' && (
                      <div className="pt-2 border-t border-primary-dark-blue/5 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-sans text-primary-dark-blue/60">
                          Synchronization timing enforced.
                        </span>
                        <Link
                          href="/devotee/lecture"
                          className="bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-1.5 border border-saffron text-[10px] font-bold font-cinzel flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Lecture Room</span>
                        </Link>
                      </div>
                    )}

                    {slot.type === 'japa' && slot.status === 'active' && (
                      <div className="pt-2 border-t border-primary-dark-blue/5 flex justify-end">
                        <Link
                          href="/devotee/japa"
                          className="bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-1.5 border border-saffron text-[10px] font-bold font-cinzel flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Connect Audio</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
