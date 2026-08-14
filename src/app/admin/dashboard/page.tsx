import { createClient } from '@/utils/supabase/server';
import { verifyDevotee, approveRecovery, scheduleLecture, updateJapaConfig } from '@/app/admin/actions';
import Link from 'next/link';
import {
  Users,
  Award,
  Video,
  Settings,
  ShieldCheck,
  Check,
  X,
  Plus,
  Clock,
  BookOpen,
  AlertCircle,
  HelpCircle,
  FileText,
  CheckCircle
} from 'lucide-react';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  const { tab = 'verify', error, success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  async function handleScheduleLecture(formData: FormData) {
    'use server';
    await scheduleLecture(formData);
  }

  // 1. Fetch pending devotees
  const { data: pendingDevotees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'pending_devotee')
    .order('created_at', { ascending: true });

  // 2. Fetch recovery requests (joined with profiles and lectures)
  const { data: recoveryRequests } = await supabase
    .from('lecture_attendance')
    .select('*, profiles(full_name, email), lectures(title, speaker)')
    .eq('status', 'recovery_requested')
    .order('created_at', { ascending: true });

  // 3. Fetch Japa schedule config
  const { data: japaConfig } = await supabase
    .from('schedule_configs')
    .select('*')
    .eq('type', 'japa')
    .single();

  // 4. Fetch audit logs (joined with actor profiles)
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(20);

  // 5. Fetch all verified devotees for summary review
  const { data: verifiedDevotees } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'pending_devotee')
    .order('full_name', { ascending: true });

  const adminTabs = [
    { id: 'verify', label: 'Verification Queue', icon: ShieldCheck, badge: pendingDevotees?.length || 0 },
    { id: 'recovery', label: 'Recovery Requests', icon: Award, badge: recoveryRequests?.length || 0 },
    { id: 'japa-settings', label: 'Japa Settings', icon: Settings },
    { id: 'schedule-lecture', label: 'Schedule Lecture', icon: Plus },
    { id: 'audit', label: 'Audit Logs', icon: FileText }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col font-sans">
      {/* Admin Dashboard Header */}
      <div className="border-b border-primary-dark-blue/15 pb-6 mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
            Administrative Control Panel
          </span>
          <h1 className="text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
            Guru / Admin Dashboard
          </h1>
          <p className="text-xs text-primary-dark-blue/70 mt-1">
            Supervise devotee compliance, approve recovery requests, and manage content.
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex flex-col space-y-1">
            {adminTabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/admin/dashboard?tab=${t.id}`}
                  className={`flex items-center justify-between px-4 py-3 border border-primary-dark-blue/15 transition-all text-xs font-bold font-cinzel tracking-wider uppercase ${
                    isActive
                      ? 'bg-primary-dark-blue text-white border-saffron border-r-4'
                      : 'bg-white hover:bg-parchment-dark text-primary-dark-blue'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-saffron' : 'text-primary-dark-blue/40'}`} />
                    <span>{t.label}</span>
                  </div>
                  {t.badge !== undefined && t.badge > 0 && (
                    <span className="bg-saffron text-deepest-blue text-[9px] px-2 py-0.5 font-bold rounded-full font-sans">
                      {t.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detail Viewer Panel */}
        <div className="lg:col-span-9 bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8 min-h-[450px]">
          {/* TAB 1: VERIFICATION QUEUE */}
          {tab === 'verify' && (
            <div className="space-y-6">
              <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
                Devotee Verification Queue
              </h2>

              {pendingDevotees && pendingDevotees.length > 0 ? (
                <div className="space-y-4">
                  {pendingDevotees.map((devotee) => (
                    <div key={devotee.id} className="border border-primary-dark-blue/15 p-4 bg-parchment-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                      <div>
                        <h4 className="font-cinzel font-bold text-sm text-primary-dark-blue">{devotee.full_name}</h4>
                        <p className="text-primary-dark-blue/60 mt-1">Email: {devotee.email}</p>
                        <p className="text-primary-dark-blue/60">Registered: {new Date(devotee.created_at).toLocaleString()}</p>
                      </div>

                      {/* Verification Action Form */}
                      <form
                        action={async (formData) => {
                          'use server';
                          const role = formData.get('role') as any;
                          const rounds = parseInt(formData.get('prescribedMala') as string, 10) || 16;
                          await verifyDevotee(devotee.id, role, rounds);
                        }}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-primary-dark-blue/70 mb-1">Assign Role</label>
                          <select
                            name="role"
                            className="bg-white border border-primary-dark-blue/20 p-1.5 focus:outline-none focus:border-saffron text-xs"
                          >
                            <option value="devotee">Devotee</option>
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-primary-dark-blue/70 mb-1">Japa Rounds</label>
                          <input
                            type="number"
                            name="prescribedMala"
                            defaultValue={16}
                            min={0}
                            className="w-16 bg-white border border-primary-dark-blue/20 p-1.5 focus:outline-none focus:border-saffron text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-2 border border-saffron font-bold text-xs uppercase font-cinzel tracking-wider flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="font-cinzel text-base text-primary-dark-blue">Queue Empty</p>
                  <p className="text-xs text-primary-dark-blue/60 font-sans mt-0.5">No pending accounts require spiritual verification.</p>
                </div>
              )}

              {/* Verified Devotees Directory */}
              <div className="mt-10 pt-8 border-t border-primary-dark-blue/15">
                <h3 className="font-cinzel text-sm font-bold text-primary-dark-blue mb-4">
                  Verified Devotee Directory ({verifiedDevotees?.length || 0})
                </h3>
                {verifiedDevotees && verifiedDevotees.length > 0 ? (
                  <div className="border border-primary-dark-blue/15 divide-y divide-primary-dark-blue/10">
                    {verifiedDevotees.map((devotee) => (
                      <div key={devotee.id} className="p-3 flex justify-between items-center text-xs font-sans">
                        <div>
                          <span className="font-bold text-primary-dark-blue">{devotee.full_name}</span>
                          <span className="text-[10px] text-primary-dark-blue/50 ml-2 font-mono">({devotee.email})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="bg-saffron/10 border border-saffron/30 text-primary-dark-blue font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            {devotee.role}
                          </span>
                          <span className="text-primary-dark-blue/70">
                            <strong>{devotee.prescribed_mala}</strong> Rounds
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-primary-dark-blue/60 italic font-sans">No verified devotees registered.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECOVERY REQUESTS */}
          {tab === 'recovery' && (
            <div className="space-y-6">
              <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
                Missed Lecture Recovery Requests
              </h2>

              {recoveryRequests && recoveryRequests.length > 0 ? (
                <div className="space-y-4">
                  {recoveryRequests.map((request) => {
                    const devotee = (request.profiles as any) || {};
                    const lecture = (request.lectures as any) || {};
                    return (
                      <div key={request.id} className="border border-primary-dark-blue/15 p-4 bg-parchment-dark/10 flex flex-col justify-between gap-4 font-sans text-xs">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <h4 className="font-cinzel font-bold text-sm text-primary-dark-blue">{devotee.full_name || 'Unknown Devotee'}</h4>
                            <p className="text-primary-dark-blue/60 mt-1">Lecture: <strong>{lecture.title || 'Unknown Lecture'}</strong> ({lecture.speaker})</p>
                            <p className="text-red-700 bg-red-50 border border-red-100 p-2 mt-2 italic text-[11px] rounded-none">
                              Reason: "{request.recovery_reason}"
                            </p>
                          </div>
                          <span className="text-[10px] text-primary-dark-blue/50">
                            Requested: {new Date(request.updated_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Approval / Rejection form */}
                        <form
                          action={async (formData) => {
                            'use server';
                            const approve = formData.get('decision') === 'approve';
                            const notes = formData.get('adminNotes') as string;
                            await approveRecovery(request.id, approve, notes);
                          }}
                          className="flex flex-col sm:flex-row items-end gap-3 border-t border-primary-dark-blue/10 pt-3"
                        >
                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              name="adminNotes"
                              placeholder="Guru administrative note / feedback..."
                              className="w-full bg-white border border-primary-dark-blue/20 p-2 text-xs focus:outline-none focus:border-saffron"
                            />
                          </div>
                          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              type="submit"
                              name="decision"
                              value="reject"
                              className="flex-1 sm:flex-initial bg-white hover:bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-xs font-bold font-cinzel uppercase tracking-wider flex items-center justify-center space-x-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="submit"
                              name="decision"
                              value="approve"
                              className="flex-1 sm:flex-initial bg-primary-dark-blue hover:bg-secondary-blue text-white px-4 py-2 border border-saffron font-bold text-xs uppercase font-cinzel tracking-wider flex items-center justify-center space-x-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="font-cinzel text-base text-primary-dark-blue">No Requests</p>
                  <p className="text-xs text-primary-dark-blue/60 font-sans mt-0.5">The recovery approval queue is currently empty.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JAPA SETTINGS */}
          {tab === 'japa-settings' && (
            <div className="space-y-6">
              <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
                Japa Session Configuration
              </h2>

              <form
                action={async (formData) => {
                  'use server';
                  const provider = formData.get('provider') as any;
                  const url = formData.get('externalUrl') as string;
                  if (japaConfig) {
                    await updateJapaConfig(japaConfig.id, provider, url);
                  }
                }}
                className="space-y-6 font-sans text-xs text-primary-dark-blue"
              >
                <div>
                  <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                    Japa Audio Room Provider
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2 bg-parchment-dark/20 border border-primary-dark-blue/15 p-4 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value="LIVEKIT"
                        defaultChecked={japaConfig?.provider === 'LIVEKIT'}
                        className="h-4 w-4 text-primary-dark-blue"
                      />
                      <div>
                        <strong className="block font-cinzel text-[11px]">LiveKit Cloud</strong>
                        <span className="text-[10px] text-primary-dark-blue/60 font-sans">Congregational audio session directly in browser</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 bg-parchment-dark/20 border border-primary-dark-blue/15 p-4 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value="EXTERNAL_LINK"
                        defaultChecked={japaConfig?.provider === 'EXTERNAL_LINK'}
                        className="h-4 w-4 text-primary-dark-blue"
                      />
                      <div>
                        <strong className="block font-cinzel text-[11px]">External Meeting</strong>
                        <span className="text-[10px] text-primary-dark-blue/60 font-sans">Redirect to external Zoom/Google Meet link</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                    External Meeting URL (Zoom / Meet)
                  </label>
                  <input
                    type="url"
                    name="externalUrl"
                    defaultValue={japaConfig?.external_url || ''}
                    placeholder="https://zoom.us/j/meeting-id"
                    className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                  />
                  <p className="text-[10px] text-primary-dark-blue/50 italic mt-1">
                    Only required if External Meeting is selected. Devotees will see this link protected behind login.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-3 border border-saffron font-bold text-xs uppercase font-cinzel tracking-wider transition-colors"
                >
                  Save Configuration Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: SCHEDULE LECTURE */}
          {tab === 'schedule-lecture' && (
            <div className="space-y-6">
              <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
                Schedule New Lecture
              </h2>

              <form action={handleScheduleLecture} className="space-y-5 font-sans text-xs text-primary-dark-blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Lecture Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g. SB 1.2.1 - Suta Gosvami's answers"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Speaker Name
                    </label>
                    <input
                      type="text"
                      name="speaker"
                      required
                      placeholder="e.g. HG Goloka Vrindavan Das"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Enter short description/topics covered..."
                    className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      YouTube Video ID
                    </label>
                    <input
                      type="text"
                      name="youtubeVideoId"
                      required
                      placeholder="e.g. 3SZG9lMv32c"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      name="durationMinutes"
                      required
                      min="1"
                      placeholder="e.g. 12"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Scheduled Start Time (Asia/Kolkata)
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledStart"
                      required
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      name="category"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    >
                      <option value="Bhagavad Gita">Bhagavad Gita</option>
                      <option value="Srimad Bhagavatam">Srimad Bhagavatam</option>
                      <option value="Krishna Book">Krishna Book</option>
                      <option value="Japa / Harinama">Japa / Harinama</option>
                      <option value="Vaishnava Etiquette">Vaishnava Etiquette</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-primary-dark-blue/70 mb-1.5 uppercase tracking-wide">
                      Language
                    </label>
                    <input
                      type="text"
                      name="language"
                      defaultValue="Hindi"
                      className="block w-full px-3 py-2 border border-primary-dark-blue/30 bg-parchment/20 text-sm focus:outline-none focus:border-saffron"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-dark-blue hover:bg-secondary-blue text-white py-3 border border-saffron font-bold text-xs uppercase font-cinzel tracking-wider transition-colors"
                >
                  Schedule Lecture Stream
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="space-y-6">
              <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4">
                Administrative Audit Logs
              </h2>

              {auditLogs && auditLogs.length > 0 ? (
                <div className="border border-primary-dark-blue/15 divide-y divide-primary-dark-blue/10">
                  {auditLogs.map((log) => {
                    const actor = (log.actor as any) || {};
                    return (
                      <div key={log.id} className="p-3 text-xs font-sans flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="text-primary-dark-blue leading-relaxed">
                            <strong>{actor.full_name || 'System'}</strong> performed action <code className="bg-parchment-dark px-1.5 py-0.5 rounded font-mono font-bold">{log.action}</code> on entity <strong>{log.entity}</strong>.
                          </p>
                          {log.new_values && (
                            <pre className="text-[10px] font-mono text-primary-dark-blue/60 bg-parchment-dark/30 p-2 mt-1 border-l-2 border-primary-dark-blue/20">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          )}
                        </div>
                        <span className="text-[10px] text-primary-dark-blue/40 shrink-0">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-primary-dark-blue/60 italic font-sans text-center py-6">No audit records found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
