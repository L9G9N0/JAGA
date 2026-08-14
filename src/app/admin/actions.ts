'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Helper to write audit logs
async function logAction(actorId: string, action: string, entity: string, entityId: string, oldValues: any, newValues: any) {
  const supabase = await createClient();
  await supabase
    .from('audit_logs')
    .insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues
    });
}

// 1. Verify a pending devotee
export async function verifyDevotee(profileId: string, role: 'devotee' | 'guru' | 'admin', prescribedMala: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  // Fetch current role of profile to log
  const { data: current } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (!current) {
    redirect('/admin/dashboard?tab=verify&error=Profile not found.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      prescribed_mala: prescribedMala,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    redirect(`/admin/dashboard?tab=verify&error=${encodeURIComponent(error.message)}`);
  }

  await logAction(user.id, 'verify_devotee', 'profiles', profileId, { role: current.role, prescribed_mala: current.prescribed_mala }, { role, prescribed_mala: prescribedMala });

  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/devotees');
  redirect('/admin/dashboard?tab=verify&success=Devotee verified successfully.');
}

// 2. Approve or Reject a missed lecture recovery request
export async function approveRecovery(attendanceId: string, approve: boolean, adminNotes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  // Fetch current record
  const { data: current } = await supabase
    .from('lecture_attendance')
    .select('*')
    .eq('id', attendanceId)
    .single();

  if (!current) {
    redirect('/admin/dashboard?tab=recovery&error=Recovery record not found.');
  }

  const newStatus = approve ? 'recovery_approved' : 'missed';

  const { error } = await supabase
    .from('lecture_attendance')
    .update({
      status: newStatus,
      recovery_approved_by: user.id,
      recovery_approved_at: new Date().toISOString(),
      admin_notes: adminNotes || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', attendanceId);

  if (error) {
    redirect(`/admin/dashboard?tab=recovery&error=${encodeURIComponent(error.message)}`);
  }

  await logAction(user.id, approve ? 'approve_recovery' : 'reject_recovery', 'lecture_attendance', attendanceId, { status: current.status }, { status: newStatus, admin_notes: adminNotes });

  revalidatePath('/admin/dashboard');
  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/lecture');
  redirect(`/admin/dashboard?tab=recovery&success=Recovery request ${approve ? 'approved' : 'rejected'} successfully.`);
}

// 3. Schedule a new lecture
export async function scheduleLecture(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const speaker = formData.get('speaker') as string;
  const youtubeVideoId = formData.get('youtubeVideoId') as string;
  const durationMinutesStr = formData.get('durationMinutes') as string;
  const category = formData.get('category') as string;
  const language = formData.get('language') as string;
  const scheduledStartStr = formData.get('scheduledStart') as string;

  if (!title || !speaker || !youtubeVideoId || !durationMinutesStr || !scheduledStartStr) {
    redirect('/admin/dashboard?tab=schedule-lecture&error=Please fill in all required fields.');
  }

  const durationSeconds = (parseInt(durationMinutesStr, 10) || 30) * 60;
  // Convert local datetime-local value (which is in India timezone) to ISO
  // Input format: YYYY-MM-DDTHH:MM
  const scheduledStart = new Date(`${scheduledStartStr}:00+05:30`).toISOString();

  const { data: newLec, error } = await supabase
    .from('lectures')
    .insert({
      title,
      description,
      speaker,
      youtube_video_id: youtubeVideoId,
      duration_seconds: durationSeconds,
      category,
      language,
      scheduled_start: scheduledStart,
      contemplation_required: true,
      active: true
    })
    .select()
    .single();

  if (error) {
    redirect(`/admin/dashboard?tab=schedule-lecture&error=${encodeURIComponent(error.message)}`);
  }

  await logAction(user.id, 'schedule_lecture', 'lectures', newLec.id, null, newLec);

  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/lectures');
  revalidatePath('/library');
  redirect('/admin/dashboard?tab=schedule-lecture&success=Lecture scheduled successfully.');
}

// 4. Update Japa session provider and meeting links
export async function updateJapaConfig(configId: string, provider: 'LIVEKIT' | 'EXTERNAL_LINK', externalUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Authentication required.');
  }

  const { data: current } = await supabase
    .from('schedule_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (!current) {
    redirect('/admin/dashboard?tab=japa-settings&error=Schedule config not found.');
  }

  const { error } = await supabase
    .from('schedule_configs')
    .update({
      provider,
      external_url: externalUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', configId);

  if (error) {
    redirect(`/admin/dashboard?tab=japa-settings&error=${encodeURIComponent(error.message)}`);
  }

  await logAction(user.id, 'update_japa_config', 'schedule_configs', configId, { provider: current.provider, external_url: current.external_url }, { provider, external_url: externalUrl });

  revalidatePath('/admin/dashboard');
  revalidatePath('/devotee/dashboard');
  revalidatePath('/devotee/japa');
  redirect('/admin/dashboard?tab=japa-settings&success=Japa configuration updated successfully.');
}
