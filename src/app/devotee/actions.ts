'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Helper to get current Date in Asia/Kolkata as a string (YYYY-MM-DD)
export async function getKolkataDateString(): Promise<string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export async function submitMalaCount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  const countStr = formData.get('count') as string;
  const dateStr = formData.get('date') as string;
  const count = parseInt(countStr, 10);

  if (isNaN(count) || count < 0) {
    redirect('/devotee/dashboard?error=Invalid Mala count.');
  }

  const date = dateStr || await getKolkataDateString();

  const { error } = await supabase
    .from('mala_records')
    .insert({
      profile_id: user.id,
      date,
      count,
      submitted_at: new Date().toISOString()
    });

  if (error) {
    // If conflict, try updating
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('mala_records')
        .update({
          count,
          submitted_at: new Date().toISOString()
        })
        .eq('profile_id', user.id)
        .eq('date', date);

      if (updateError) {
        redirect(`/devotee/dashboard?error=${encodeURIComponent(updateError.message)}`);
      }
    } else {
      redirect(`/devotee/dashboard?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/reports');
  redirect('/devotee/dashboard?success=Mala rounds logged successfully.');
}

export async function submitDailyReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  const date = formData.get('date') as string || await getKolkataDateString();
  const arati = formData.get('arati') === 'on';
  const japa = formData.get('japa') === 'on';
  const lecture = formData.get('lecture') === 'on';
  const readingMinutesStr = formData.get('readingMinutes') as string;
  const comments = formData.get('comments') as string;

  const readingMinutes = parseInt(readingMinutesStr, 10) || 0;

  // Enforce server-authoritative submission status (e.g. late after 10 PM)
  const submissionTime = new Date();
  
  // Convert current server time to Asia/Kolkata hours/minutes
  const timeString = submissionTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Configurable cutoff (e.g. 22:00 / 10 PM)
  let status: 'completed' | 'late' = 'completed';
  if (hours >= 22) {
    status = 'late';
  }

  const completedActivities = { arati, japa, lecture };

  const { error } = await supabase
    .from('daily_reports')
    .insert({
      profile_id: user.id,
      date,
      completed_activities: completedActivities,
      book_reading_minutes: readingMinutes,
      additional_comments: comments,
      status,
      submitted_at: submissionTime.toISOString()
    });

  if (error) {
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({
          completed_activities: completedActivities,
          book_reading_minutes: readingMinutes,
          additional_comments: comments,
          status,
          submitted_at: submissionTime.toISOString()
        })
        .eq('profile_id', user.id)
        .eq('date', date);

      if (updateError) {
        redirect(`/devotee/dashboard?error=${encodeURIComponent(updateError.message)}`);
      }
    } else {
      redirect(`/devotee/dashboard?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/reports');
  redirect('/devotee/dashboard?success=Daily sadhana report submitted.');
}

export async function requestLectureRecovery(lectureId: string, reason: string) {
  if (!lectureId || !reason.trim()) {
    redirect('/devotee/lecture?error=Lecture ID and recovery reason are required.');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  // Insert or update lecture attendance with status = 'recovery_requested'
  const { error } = await supabase
    .from('lecture_attendance')
    .insert({
      profile_id: user.id,
      lecture_id: lectureId,
      status: 'recovery_requested',
      recovery_reason: reason,
      first_joined_at: new Date().toISOString()
    });

  if (error) {
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('lecture_attendance')
        .update({
          status: 'recovery_requested',
          recovery_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', user.id)
        .eq('lecture_id', lectureId);

      if (updateError) {
        redirect(`/devotee/lecture?error=${encodeURIComponent(updateError.message)}`);
      }
    } else {
      redirect(`/devotee/lecture?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/lecture');
  redirect('/devotee/lecture?success=Recovery request submitted successfully.');
}

export async function logJapaJoin(configId: string, date: string) {
  if (!configId || !date) return { error: 'Missing parameters.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  // Fetch the schedule config to verify timing
  const { data: config } = await supabase
    .from('schedule_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (!config) return { error: 'Schedule config not found.' };

  const now = new Date();
  
  // Verify if they are late
  const start = new Date(`${date}T${config.start_time_local}+05:30`);
  const elapsedFromStart = (now.getTime() - start.getTime()) / 1000;
  
  // If joined more than 10 minutes (600s) after Japa starts, mark as late
  const status = elapsedFromStart > 600 ? 'late' : 'on_time';

  const { error } = await supabase
    .from('attendance')
    .insert({
      profile_id: user.id,
      config_id: configId,
      date,
      status,
      join_time: now.toISOString(),
      leave_time: now.toISOString(),
      reconnections: 0
    });

  if (error) {
    if (error.code === '23505') {
      // Conflict: user is reconnecting
      // Increment reconnections count
      const { data: current } = await supabase
        .from('attendance')
        .select('reconnections')
        .eq('profile_id', user.id)
        .eq('config_id', configId)
        .eq('date', date)
        .single();
        
      const currentReconnections = current?.reconnections || 0;

      await supabase
        .from('attendance')
        .update({
          reconnections: currentReconnections + 1,
          updated_at: now.toISOString()
        })
        .eq('profile_id', user.id)
        .eq('config_id', configId)
        .eq('date', date);
    } else {
      return { error: error.message };
    }
  }

  revalidatePath('/devotee/dashboard');
  return { success: true, status };
}

export async function logJapaHeartbeat(configId: string, date: string) {
  if (!configId || !date) return { error: 'Missing parameters.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const now = new Date();

  // Simply update the leave_time to the current timestamp to track duration
  const { error } = await supabase
    .from('attendance')
    .update({
      leave_time: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('profile_id', user.id)
    .eq('config_id', configId)
    .eq('date', date);

  if (error) return { error: error.message };

  return { success: true };
}
