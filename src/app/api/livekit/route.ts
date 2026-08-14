import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  // 1. Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Sign in required.' }, { status: 401 });
  }

  // 2. Fetch user profile and verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    (profile.role !== 'devotee' && profile.role !== 'guru' && profile.role !== 'admin')
  ) {
    return NextResponse.json(
      { error: 'Unauthorized: Only verified devotees can join Japa sessions.' },
      { status: 403 }
    );
  }

  // 3. Generate deterministic room name (japa-YYYY-MM-DD in India timezone)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(new Date());
  const roomName = `japa-${dateStr}`;

  // 4. Create collision-safe participant identity (user.id-name)
  const safeName = (profile.full_name || 'Devotee').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const participantIdentity = `${user.id}-${encodeURIComponent(safeName)}`;

  // 5. Read server secrets
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret || apiSecret === 'your_livekit_api_secret_here') {
    return NextResponse.json(
      { error: 'Server configuration error: LiveKit secrets are not set.' },
      { status: 500 }
    );
  }

  try {
    // 6. Generate access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: safeName,
      ttl: '4h', // 4 hours covers the morning Japa session
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,      // Devotee can speak
      canPublishData: true,  // Metadata
      canSubscribe: true,    // Devotee can listen
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      room: roomName,
      identity: participantIdentity,
      name: safeName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Token generation failed: ${err.message}` }, { status: 500 });
  }
}
