'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function logLectureProgress(lectureId: string, watchSeconds: number) {
  if (!lectureId) return { error: 'Lecture ID is required.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  // Fetch lecture to verify timing
  const { data: lecture } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .single();

  if (!lecture) return { error: 'Lecture not found.' };

  const now = new Date();
  const start = new Date(lecture.scheduled_start);
  const end = new Date(start.getTime() + lecture.duration_seconds * 1000);

  // Fetch or create attendance record
  const { data: attendance } = await supabase
    .from('lecture_attendance')
    .select('*')
    .eq('profile_id', user.id)
    .eq('lecture_id', lectureId)
    .single();

  let status = 'in_progress';
  let firstJoinedAt = now.toISOString();

  if (attendance) {
    status = attendance.status;
    firstJoinedAt = attendance.first_joined_at || now.toISOString();
  }

  // Determine starting status based on timing
  if (!attendance || attendance.status === 'not_started' || attendance.status === 'in_progress') {
    if (now >= start && now <= end) {
      const elapsedFromStart = (now.getTime() - start.getTime()) / 1000;
      // If devotee joined more than 2 minutes (120s) late, flag as late
      if (elapsedFromStart > 120) {
        status = 'late';
      } else {
        status = 'in_progress';
      }
    }
  }

  // Update watch duration
  const newWatchDuration = Math.max(attendance ? attendance.watch_duration_seconds : 0, watchSeconds);

  const { error } = await supabase
    .from('lecture_attendance')
    .upsert({
      profile_id: user.id,
      lecture_id: lectureId,
      status,
      watch_duration_seconds: newWatchDuration,
      first_joined_at: firstJoinedAt,
      updated_at: now.toISOString()
    }, {
      onConflict: 'profile_id,lecture_id'
    });

  if (error) return { error: error.message };

  return { success: true, status };
}

export async function completeLecture(lectureId: string) {
  if (!lectureId) return { error: 'Lecture ID is required.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  // Fetch current attendance
  const { data: attendance } = await supabase
    .from('lecture_attendance')
    .select('*')
    .eq('profile_id', user.id)
    .eq('lecture_id', lectureId)
    .single();

  if (!attendance) {
    return { error: 'No attendance record found to complete.' };
  }

  const now = new Date();
  let finalStatus = attendance.status;

  if (attendance.status === 'recovery_approved') {
    finalStatus = 'recovery_completed';
  } else if (attendance.status === 'in_progress') {
    finalStatus = 'completed'; // On-time completion
  } else if (attendance.status === 'late') {
    finalStatus = 'late'; // Preserves the "late" penalty
  }

  const { error } = await supabase
    .from('lecture_attendance')
    .update({
      status: finalStatus,
      completed_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('profile_id', user.id)
    .eq('lecture_id', lectureId);

  if (error) return { error: error.message };

  // Log to public.attendance table if they completed on-time or late
  const { data: lecture } = await supabase
    .from('lectures')
    .select('scheduled_start')
    .eq('id', lectureId)
    .single();

  if (lecture) {
    const lectureDate = new Date(lecture.scheduled_start).toISOString().split('T')[0];
    
    // Find the schedule config for the morning lecture
    const { data: config } = await supabase
      .from('schedule_configs')
      .select('id')
      .eq('type', 'lecture')
      .limit(1)
      .single();

    if (config) {
      const { data: exists } = await supabase
        .from('attendance')
        .select('id')
        .eq('profile_id', user.id)
        .eq('config_id', config.id)
        .eq('date', lectureDate)
        .limit(1)
        .maybeSingle();

      if (!exists) {
        await supabase
          .from('attendance')
          .insert({
            profile_id: user.id,
            config_id: config.id,
            date: lectureDate,
            status: finalStatus === 'late' ? 'late' : 'on_time',
            join_time: attendance.first_joined_at,
            leave_time: now.toISOString()
          });
      }
    }
  }

  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/lecture');
  return { success: true, status: finalStatus };
}

export async function submitContemplation(lectureId: string, answers: Record<string, string>) {
  if (!lectureId || !answers) {
    return { error: 'Lecture ID and answers are required.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  // Fetch lecture to calculate deadline
  const { data: lecture } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .single();

  if (!lecture) return { error: 'Lecture not found.' };

  const now = new Date();
  
  // Deadline = scheduled_start + duration + 30 minutes
  const start = new Date(lecture.scheduled_start);
  const durationMs = lecture.duration_seconds * 1000;
  const gracePeriodMs = 30 * 60 * 1000; // 30 minutes
  const deadline = new Date(start.getTime() + durationMs + gracePeriodMs);

  let submissionStatus: 'on_time' | 'late' = 'on_time';
  if (now > deadline) {
    submissionStatus = 'late';
  }

  const { error } = await supabase
    .from('contemplations')
    .insert({
      profile_id: user.id,
      lecture_id: lectureId,
      answers,
      submission_status: submissionStatus,
      submitted_at: now.toISOString()
    });

  if (error) {
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('contemplations')
        .update({
          answers,
          submission_status: submissionStatus,
          submitted_at: now.toISOString()
        })
        .eq('profile_id', user.id)
        .eq('lecture_id', lectureId);
        
      if (updateError) return { error: updateError.message };
    } else {
      return { error: error.message };
    }
  }

  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/lecture');
  return { success: true, submissionStatus };
}
