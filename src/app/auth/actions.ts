'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?error=Email and password are required.');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Retrieve user role to redirect appropriately
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (profile.role === 'pending_devotee') {
        redirect('/devotee/pending');
      } else if (profile.role === 'devotee') {
        redirect('/devotee/dashboard');
      } else if (profile.role === 'guru' || profile.role === 'admin') {
        redirect('/admin/dashboard');
      }
    }
  }

  redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !fullName) {
    redirect('/signup?error=All fields are required.');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Profiles trigger will automatically create a public.profiles row with role = 'pending_devotee'.
  // Redirect to waitlist page
  redirect('/devotee/pending');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
