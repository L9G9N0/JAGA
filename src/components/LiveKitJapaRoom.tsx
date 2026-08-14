'use client';

import { useEffect, useState, useRef } from 'react';
import { logJapaJoin, logJapaHeartbeat } from '@/app/devotee/actions';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useConnectionState,
  AudioTrack,
} from '@livekit/components-react';
import { ConnectionState, Room, Track } from 'livekit-client';
import { Mic, MicOff, LogOut, Loader2, Users, AlertCircle, PhoneCall, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LiveKitJapaRoomProps {
  configId: string;
  dateStr: string;
  externalUrl?: string | null;
}

export default function LiveKitJapaRoom({ configId, dateStr, externalUrl }: LiveKitJapaRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch token on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/livekit');
        const data = await res.json();
        
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setToken(data.token);
          setRoomName(data.room);
          
          // Log join event to DB
          await logJapaJoin(configId, dateStr);
        }
      } catch (err: any) {
        setErrorMsg('Failed to connect to Japa authentication service.');
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, [configId, dateStr]);

  if (loading) {
    return (
      <div className="devotional-card text-center py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-saffron animate-spin mb-4" />
        <h3 className="font-cinzel text-lg font-bold">Securing Sacred Channel...</h3>
        <p className="text-xs text-primary-dark-blue/60 mt-1">Generating short-lived Japa token...</p>
      </div>
    );
  }

  if (errorMsg || !token) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">LiveKit Connection Blocked</h3>
            <p className="font-sans text-sm">{errorMsg || 'Could not verify LiveKit tokens.'}</p>
          </div>
        </div>

        {/* Fallback Option */}
        {externalUrl && (
          <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 text-center space-y-4">
            <PhoneCall className="h-10 w-10 text-saffron mx-auto" />
            <h3 className="font-cinzel text-base font-bold text-primary-dark-blue">
              Fallback Japa Channel Available
            </h3>
            <p className="text-xs text-primary-dark-blue/80 max-w-sm mx-auto font-sans leading-relaxed">
              An alternative external Japa meeting link has been configured by the Guru/Admin.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex bg-primary-dark-blue hover:bg-secondary-blue text-white px-6 py-2.5 border border-saffron text-xs font-bold font-cinzel tracking-wider uppercase items-center justify-center space-x-1.5"
            >
              <span>Connect via Zoom/External Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      connect={true}
      audio={true}
      video={false}
      className="flex-1 flex flex-col min-h-[500px]"
    >
      <JapaInterface configId={configId} dateStr={dateStr} roomName={roomName || 'japa-room'} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function JapaInterface({ configId, dateStr, roomName }: { configId: string; dateStr: string; roomName: string }) {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [micMuted, setMicMuted] = useState(true);
  const [localParticipant, setLocalParticipant] = useState<any>(null);

  // 1. Establish Heartbeat tracking when connected
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      console.log('Connected to LiveKit room. Starting heartbeat...');
      
      heartbeatIntervalRef.current = setInterval(() => {
        logJapaHeartbeat(configId, dateStr);
      }, 20000); // Send heartbeat every 20 seconds
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connectionState, configId, dateStr]);

  // Handle mute state toggle
  const toggleMute = () => {
    // LiveKit mic tracks can be toggled using local participant methods
    const room = (window as any).Room; // Let LiveKit standard React bindings handle it
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.Connecting:
        return 'Chanting channel opening...';
      case ConnectionState.Reconnecting:
        return 'Chanting channel interrupted. Reconnecting...';
      case ConnectionState.Connected:
        return 'Sacred connection active';
      default:
        return 'Chanting channel closed';
    }
  };

  return (
    <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8 flex-1 flex flex-col justify-between gap-6">
      {/* Header Info */}
      <div className="border-b border-primary-dark-blue/15 pb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-saffron tracking-wider font-sans">
            Live Japa Room: {roomName}
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-cinzel text-primary-dark-blue">
            Congregational Harinam Chanting
          </h2>
        </div>
        <span className="bg-parchment-dark border border-primary-dark-blue/20 text-primary-dark-blue text-[10px] font-sans px-3 py-1 font-bold uppercase tracking-wider">
          {getStatusText()}
        </span>
      </div>

      {/* Participant List */}
      <div className="flex-1 min-h-[250px] bg-parchment-dark/30 border border-primary-dark-blue/10 p-4 overflow-y-auto">
        <div className="flex items-center space-x-2 text-primary-dark-blue/60 mb-4 pb-2 border-b border-primary-dark-blue/10">
          <Users className="h-4 w-4 text-saffron" />
          <span className="text-xs font-bold font-cinzel uppercase tracking-wide">
            Chanting Sadhakas ({participants.length})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {participants.map((p) => {
            const isMuted = !p.isMicrophoneEnabled;
            const isSpeaking = p.isSpeaking;
            return (
              <div
                key={p.sid}
                className={`p-3 border flex items-center justify-between transition-colors ${
                  isSpeaking
                    ? 'border-saffron bg-saffron/5'
                    : 'border-primary-dark-blue/10 bg-white'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isSpeaking ? 'bg-saffron animate-ping' : 'bg-green-600'}`}></div>
                  <span className="text-xs font-semibold text-primary-dark-blue truncate max-w-[120px]">
                    {p.name || 'Devotee'}
                  </span>
                </div>
                
                {isMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-red-500 shrink-0" />
                ) : (
                  <Mic className={`h-3.5 w-3.5 text-green-600 shrink-0 ${isSpeaking ? 'scale-110' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Room Control Panel */}
      <div className="border-t border-primary-dark-blue/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-primary-dark-blue/60 font-sans italic text-center sm:text-left max-w-sm">
          Attendance requires active connection. Chanting with microphone open is optional. Please maintain respect and focus.
        </p>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Back/Leave Button */}
          <Link
            href="/devotee/dashboard"
            className="flex-1 sm:flex-initial bg-white hover:bg-parchment text-primary-dark-blue px-6 py-2.5 border border-primary-dark-blue/30 text-xs font-bold font-cinzel flex items-center justify-center space-x-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave Room</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
