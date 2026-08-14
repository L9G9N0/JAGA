import { createClient } from '@/utils/supabase/server';
import { requestLectureRecovery } from '@/app/devotee/actions';
import SynchronizedPlayer from '@/components/SynchronizedPlayer';
import { Play, Clock, AlertTriangle, AlertCircle, CheckCircle, HelpCircle, FileText, Send } from 'lucide-react';
import Link from 'next/link';

export default async function DevoteeLecturePage({
  searchParams,
}: {
  searchParams: Promise<{ recovery?: string; error?: string; success?: string }>;
}) {
  const { recovery, error, success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  const now = new Date();

  // 1. Fetch active lectures (all lectures scheduled in the database)
  const { data: lectures, error: fetchError } = await supabase
    .from('lectures')
    .select('*')
    .eq('active', true)
    .order('scheduled_start', { ascending: false });

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve scheduled lectures.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Evaluate if there is a LIVE active lecture window
  let activeLecture = null;
  let liveOffsetSeconds = 0;

  if (lectures) {
    for (const lec of lectures) {
      const start = new Date(lec.scheduled_start);
      const end = new Date(start.getTime() + lec.duration_seconds * 1000);
      
      if (now >= start && now <= end) {
        activeLecture = lec;
        liveOffsetSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
        break;
      }
    }
  }

  // 3. Fetch devotee lecture attendance records to cross-reference status
  const { data: attendanceRecords } = await supabase
    .from('lecture_attendance')
    .select('*')
    .eq('profile_id', user.id);

  // 4. Handle Approved Recovery Playback selection (?recovery=lecture_id)
  let recoveryLecture = null;
  let recoveryRecord = null;
  if (recovery && lectures) {
    recoveryLecture = lectures.find(l => l.id === recovery);
    recoveryRecord = attendanceRecords?.find(a => a.lecture_id === recovery);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col font-sans">
      <div className="border-b border-primary-dark-blue/15 pb-6 mb-8">
        <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
          Devotional Study Room
        </span>
        <h1 className="text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
          Synchronized Lectures
        </h1>
        <p className="text-xs text-primary-dark-blue/70 mt-1">
          Attendance and contemplation submission are strictly monitored.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN AREA: Player / Active Stream */}
        <div className="lg:col-span-8 space-y-6">
          {activeLecture ? (
            // Render Synchronized Player for Live Window
            <div>
              <div className="bg-primary-dark-blue text-white p-4 border border-saffron flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-saffron bg-saffron/10 px-2 py-0.5 border border-saffron/30">
                    Live Broadcast Active
                  </span>
                  <h3 className="font-cinzel text-sm font-bold mt-1 text-light-devotional-blue">
                    {activeLecture.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <Clock className="h-4 w-4 text-saffron shrink-0" />
                  <span>Stream Ends: {new Date(new Date(activeLecture.scheduled_start).getTime() + activeLecture.duration_seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <SynchronizedPlayer
                lecture={activeLecture}
                startSeconds={liveOffsetSeconds}
                initialStatus={attendanceRecords?.find(a => a.lecture_id === activeLecture!.id)?.status || 'not_started'}
                isRecovery={false}
              />
            </div>
          ) : recoveryLecture && recoveryRecord?.status === 'recovery_approved' ? (
            // Render Synchronized Player for Approved Recovery (starts at 0)
            <div>
              <div className="bg-amber-950 text-white p-4 border border-saffron flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-saffron bg-saffron/10 px-2 py-0.5 border border-saffron/30">
                    Recovery Playback Mode
                  </span>
                  <h3 className="font-cinzel text-sm font-bold mt-1 text-light-devotional-blue">
                    {recoveryLecture.title}
                  </h3>
                </div>
                <Link
                  href="/devotee/lecture"
                  className="bg-primary-dark-blue hover:bg-secondary-blue border border-saffron px-3 py-1 text-xs font-cinzel font-bold text-white transition-colors"
                >
                  Exit Replay
                </Link>
              </div>

              <SynchronizedPlayer
                lecture={recoveryLecture}
                startSeconds={0}
                initialStatus="recovery_approved"
                isRecovery={true}
              />
            </div>
          ) : (
            // No Active Live Lecture
            <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-8 text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-saffron mx-auto" />
              <h3 className="font-cinzel text-lg font-bold text-primary-dark-blue">
                No Active Synchronized Lecture
              </h3>
              <p className="text-sm text-primary-dark-blue/80 max-w-md mx-auto leading-relaxed font-sans">
                Scheduled lectures start exactly at their configured times (typically morning 07:30 AM). Late joining is synchronized, and joining after completion is blocked.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  href="/devotee/dashboard"
                  className="bg-primary-dark-blue hover:bg-secondary-blue text-white px-6 py-2.5 border border-saffron text-xs font-bold font-cinzel tracking-wider uppercase transition-colors"
                >
                  Back to Today's Schedule
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: History / Recovery Queue */}
        <div className="lg:col-span-4 bg-white border border-primary-dark-blue/20 p-5 space-y-6">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
              Lecture Logs & Recovery
            </h3>
            
            {lectures && lectures.length > 0 ? (
              <div className="divide-y divide-primary-dark-blue/10 max-h-[500px] overflow-y-auto pr-1 space-y-3.5">
                {lectures
                  .filter(lec => lec.id !== activeLecture?.id) // Don't list the active one here
                  .map((lec) => {
                    const record = attendanceRecords?.find(r => r.lecture_id === lec.id);
                    
                    let statusLabel = 'Missed';
                    let statusColor = 'bg-red-50 text-red-700 border-red-200';
                    
                    if (record) {
                      if (record.status === 'completed') {
                        statusLabel = 'Completed';
                        statusColor = 'bg-green-50 text-green-700 border-green-200';
                      } else if (record.status === 'late') {
                        statusLabel = 'Late';
                        statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (record.status === 'recovery_requested') {
                        statusLabel = 'Recovery Pending';
                        statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (record.status === 'recovery_approved') {
                        statusLabel = 'Recovery Approved';
                        statusColor = 'bg-teal-50 text-teal-700 border-teal-200';
                      } else if (record.status === 'recovery_completed') {
                        statusLabel = 'Recovery Done';
                        statusColor = 'bg-green-50 text-green-700 border-green-200';
                      } else if (record.status === 'in_progress') {
                        statusLabel = 'In Progress';
                        statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      }
                    }

                    return (
                      <div key={lec.id} className="pt-3.5 first:pt-0 space-y-2">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs text-primary-dark-blue leading-snug line-clamp-2">
                            {lec.title}
                          </h4>
                          <span className={`text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 border shrink-0 ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-primary-dark-blue/60 font-sans">
                          {lec.speaker} | Scheduled: {new Date(lec.scheduled_start).toLocaleDateString()}
                        </p>

                        {/* Action buttons based on state */}
                        {statusLabel === 'Missed' && (
                          <div className="bg-parchment-dark/30 p-2.5 border border-primary-dark-blue/10 rounded-none space-y-2">
                            <p className="text-[10px] font-sans leading-relaxed text-primary-dark-blue/80">
                              You missed this lecture. To regain restricted replay access, please submit a recovery reason.
                            </p>
                            <form action={async (formData) => {
                              'use server';
                              const reason = formData.get('reason') as string;
                              await requestLectureRecovery(lec.id, reason);
                            }} className="flex flex-col gap-1.5">
                              <input
                                type="text"
                                name="reason"
                                required
                                placeholder="Reason for missing..."
                                className="w-full text-[10px] p-1.5 border border-primary-dark-blue/20 bg-white"
                              />
                              <button
                                type="submit"
                                className="bg-primary-dark-blue hover:bg-secondary-blue text-white py-1 px-3 text-[9px] font-bold uppercase tracking-wider font-cinzel flex items-center justify-center space-x-1"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Request Replay</span>
                              </button>
                            </form>
                          </div>
                        )}

                        {statusLabel === 'Recovery Approved' && (
                          <Link
                            href={`/devotee/lecture?recovery=${lec.id}`}
                            className="inline-flex w-full bg-teal-700 hover:bg-teal-800 text-white text-center py-1.5 text-[10px] font-bold font-cinzel tracking-wider uppercase justify-center items-center space-x-1"
                          >
                            <Play className="h-3 w-3 fill-white" />
                            <span>Start Recovery Replay</span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-primary-dark-blue/60 font-sans italic text-center py-4">
                No historical lectures logged.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
