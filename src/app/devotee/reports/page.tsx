import { createClient } from '@/utils/supabase/server';
import { Sparkles, Calendar, BookOpen, AlertCircle, CheckCircle, Award } from 'lucide-react';

export default async function DevoteeReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  // Fetch all Mala records
  const { data: malaRecords, error: malaError } = await supabase
    .from('mala_records')
    .select('*')
    .eq('profile_id', user.id)
    .order('date', { ascending: false });

  // Fetch all Daily reports
  const { data: dailyReports, error: reportError } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('profile_id', user.id)
    .order('date', { ascending: false });

  if (malaError || reportError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve devotional history records.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col font-sans">
      <div className="border-b border-primary-dark-blue/15 pb-6 mb-8">
        <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
          Sadhana Logbook
        </span>
        <h1 className="text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
          Devotional Reports Log
        </h1>
        <p className="text-xs text-primary-dark-blue/70 mt-1">
          Review your historical records of Japa rounds and daily sadhana metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* JAPA MALA HISTORY LOG */}
        <div className="lg:col-span-5 bg-white border border-primary-dark-blue/20 p-5">
          <h3 className="font-cinzel text-sm font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-saffron" />
            <span>Mala History (Rounds)</span>
          </h3>

          {malaRecords && malaRecords.length > 0 ? (
            <div className="border border-primary-dark-blue/15 divide-y divide-primary-dark-blue/10">
              {malaRecords.map((m) => (
                <div key={m.id} className="p-3 flex justify-between items-center text-xs font-sans">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-primary-dark-blue/40" />
                    <span className="font-bold text-primary-dark-blue">{m.date}</span>
                  </div>
                  <span className="bg-saffron/10 border border-saffron/30 text-primary-dark-blue font-bold px-3 py-1 font-cinzel">
                    {m.count} Rounds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-primary-dark-blue/60 italic text-center py-6">
              No Mala records submitted.
            </p>
          )}
        </div>

        {/* DAILY REPORTS CHECKLIST LOG */}
        <div className="lg:col-span-7 bg-white border border-primary-dark-blue/20 p-5">
          <h3 className="font-cinzel text-sm font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4 flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-saffron" />
            <span>Daily Reports History</span>
          </h3>

          {dailyReports && dailyReports.length > 0 ? (
            <div className="space-y-4">
              {dailyReports.map((report) => {
                let badgeColor = 'bg-green-50 text-green-700 border-green-200';
                if (report.status === 'late') {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (report.status === 'missing') {
                  badgeColor = 'bg-red-50 text-red-700 border-red-200';
                }

                return (
                  <div key={report.id} className="border border-primary-dark-blue/15 p-4 bg-parchment-dark/5">
                    <div className="flex justify-between items-center border-b border-primary-dark-blue/10 pb-2 mb-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-primary-dark-blue">
                        <Calendar className="h-3.5 w-3.5 text-saffron" />
                        <span>{report.date}</span>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border ${badgeColor}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold text-primary-dark-blue/70 mb-3 bg-white p-2 border border-primary-dark-blue/10">
                      <span className={report.completed_activities.arati ? 'text-green-700' : 'text-primary-dark-blue/30'}>
                        Arati: {report.completed_activities.arati ? '✓' : '✗'}
                      </span>
                      <span className={report.completed_activities.japa ? 'text-green-700' : 'text-primary-dark-blue/30'}>
                        Japa: {report.completed_activities.japa ? '✓' : '✗'}
                      </span>
                      <span className={report.completed_activities.lecture ? 'text-green-700' : 'text-primary-dark-blue/30'}>
                        Lecture: {report.completed_activities.lecture ? '✓' : '✗'}
                      </span>
                    </div>

                    <div className="text-xs font-sans space-y-1.5 text-primary-dark-blue/90">
                      <p>
                        Study duration: <strong>{report.book_reading_minutes} minutes</strong>
                      </p>
                      {report.additional_comments && (
                        <div className="bg-white p-2.5 border border-primary-dark-blue/10 italic text-[11px] text-primary-dark-blue/75 mt-2 rounded-none">
                          " {report.additional_comments} "
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-primary-dark-blue/60 italic text-center py-6">
              No daily reports submitted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
