'use client';

import { useEffect, useRef, useState } from 'react';
import { logLectureProgress, completeLecture, submitContemplation } from '@/app/devotee/lecture/actions';
import { Play, Clock, CheckCircle, AlertTriangle, BookOpen, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SynchronizedPlayerProps {
  lecture: {
    id: string;
    title: string;
    description: string | null;
    speaker: string;
    youtube_video_id: string;
    duration_seconds: number;
    scheduled_start: string;
    contemplation_required: boolean;
  };
  initialStatus?: string;
  isRecovery?: boolean;
  startSeconds: number;
}

export default function SynchronizedPlayer({
  lecture,
  initialStatus = 'not_started',
  isRecovery = false,
  startSeconds
}: SynchronizedPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [watchProgress, setWatchProgress] = useState(0);
  const [lateWarning, setLateWarning] = useState(startSeconds > 120 && !isRecovery);

  // Contemplation Form State
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const duration = lecture.duration_seconds;

  // 1. Load YouTube Iframe API
  useEffect(() => {
    // If the YT script is not yet loaded, inject it
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Set up global callback
    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;

    playerRef.current = new (window as any).YT.Player('yt-player', {
      videoId: lecture.youtube_video_id,
      playerVars: {
        controls: isRecovery ? 1 : 0, // Disable controls for live sync to enforce discipline
        disablekb: isRecovery ? 0 : 1,
        rel: 0,
        modestbranding: 1,
        start: startSeconds, // Start at the correct sync position
      },
      events: {
        onReady: (event: any) => {
          // If live broadcast is active, force play and seek to correct start time
          if (!isRecovery) {
            event.target.seekTo(startSeconds, true);
          }
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.PLAYING = 1
          if (event.data === 1) {
            setIsPlaying(true);
            startTracking();
          } else {
            setIsPlaying(false);
            stopTracking();
          }
          
          // YT.PlayerState.ENDED = 0
          if (event.data === 0) {
            handleVideoEnd();
          }
        }
      }
    });
  };

  // 2. Discipline Check: Block Rewinds & Track Progress
  const maxTimeWatched = useRef(startSeconds);

  const startTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);

      // Enforce live broadcast wall-clock sync or block recovery rewinds/skips
      if (!isRecovery) {
        const startMs = new Date(lecture.scheduled_start).getTime();
        const expectedLiveTime = Math.floor((Date.now() - startMs) / 1000);
        
        if (time < expectedLiveTime - 4 || time > expectedLiveTime + 4) {
          playerRef.current.seekTo(expectedLiveTime, true);
        }
        
        if (time > maxTimeWatched.current) {
          maxTimeWatched.current = time;
        }
      } else {
        if (time < maxTimeWatched.current - 4) {
          playerRef.current.seekTo(maxTimeWatched.current, true);
        } else if (time > maxTimeWatched.current + 4) {
          playerRef.current.seekTo(maxTimeWatched.current, true);
        } else if (time > maxTimeWatched.current) {
          maxTimeWatched.current = time;
        }
      }

      const progress = Math.min((maxTimeWatched.current / duration) * 100, 100);
      setWatchProgress(progress);

      // Save watch progress to database every 10 seconds
      logLectureProgress(lecture.id, Math.floor(maxTimeWatched.current));

      // Auto-complete if they reach 95% of duration
      if (maxTimeWatched.current >= duration * 0.95) {
        handleVideoEnd();
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // 3. Mark Completed in Database
  const handleVideoEnd = async () => {
    stopTracking();
    if (status === 'completed' || status === 'late' || status === 'recovery_completed') return;

    console.log('Lecture completed, marking database...');
    const result = await completeLecture(lecture.id);
    if (result.success && result.status) {
      setStatus(result.status);
    }
  };

  // 4. Submit Contemplation Form
  const handleContemplationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q1.trim() || !q2.trim() || !q3.trim()) {
      setFormError('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const answers = {
      q1: q1.trim(),
      q2: q2.trim(),
      q3: q3.trim()
    };

    const result = await submitContemplation(lecture.id, answers);
    setIsSubmitting(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      setIsSubmitted(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCompleted = status === 'completed' || status === 'late' || status === 'recovery_completed';

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Late Arrival discipline banner */}
      {lateWarning && (
        <div className="bg-amber-50 border border-saffron text-primary-dark-blue p-4 flex items-start space-x-3 text-xs font-sans">
          <AlertTriangle className="h-5 w-5 text-saffron shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold uppercase tracking-wider font-cinzel mb-0.5 text-saffron">
              Late Joining Detected
            </h4>
            <p className="leading-relaxed">
              Punctuality is a core pillar of devotional discipline. You have joined {formatTime(startSeconds)} after the lecture started. The player has auto-synced you to the current broadcast time. Your attendance is flagged as **LATE**.
            </p>
          </div>
        </div>
      )}

      {/* Synchronized Player Frame */}
      <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-4 md:p-6">
        <div className="aspect-video bg-black relative mb-4">
          <div id="yt-player" className="w-full h-full"></div>
        </div>

        {/* Playback Progress Details */}
        <div className="flex items-center justify-between text-xs font-sans text-primary-dark-blue/80 px-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-saffron uppercase">
              {isRecovery ? 'Recovery Replay' : 'Synchronized Stream'}
            </span>
            <span className="text-primary-dark-blue/30">|</span>
            <span>Progress: {Math.round(watchProgress)}%</span>
          </div>
          <div>
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Master Completion Status */}
        {isCompleted && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 p-4 text-xs font-sans flex items-center space-x-2.5">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider">Lecture Marked Completed</p>
              <p className="mt-0.5">
                Devotional attendance logged as: <strong className="uppercase">{status.replace('_', ' ')}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contemplation Box (Unlocks after completion) */}
      {isCompleted && (
        <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8">
          <h3 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-6 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-saffron" />
            <span>Lecture Contemplation Form</span>
          </h3>

          {isSubmitted ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-6 text-center text-sm font-sans space-y-3">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <h4 className="font-cinzel font-bold text-base">Contemplation Logged</h4>
              <p className="text-xs">Your lecture contemplation answers have been successfully submitted and logged under Guru/Admin supervision.</p>
              <Link
                href="/devotee/dashboard"
                className="inline-block bg-primary-dark-blue hover:bg-secondary-blue text-white px-6 py-2 border border-saffron text-xs font-bold font-cinzel tracking-wider uppercase transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleContemplationSubmit} className="space-y-6 font-sans text-sm">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5">
                    1. What did you understand from this lecture?
                  </label>
                  <textarea
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    rows={3}
                    required
                    placeholder="Enter your understanding here..."
                    className="block w-full px-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/20 focus:outline-none focus:border-saffron"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5">
                    2. What was the main instruction of the speaker?
                  </label>
                  <textarea
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    rows={3}
                    required
                    placeholder="Enter the main instruction here..."
                    className="block w-full px-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/20 focus:outline-none focus:border-saffron"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-dark-blue/70 mb-1.5">
                    3. What practical change will you apply to your life?
                  </label>
                  <textarea
                    value={q3}
                    onChange={(e) => setQ3(e.target.value)}
                    rows={3}
                    required
                    placeholder="Enter practical application here..."
                    className="block w-full px-3 py-2.5 border border-primary-dark-blue/30 bg-parchment/20 focus:outline-none focus:border-saffron"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-dark-blue hover:bg-secondary-blue disabled:bg-primary-dark-blue/50 text-white py-3 border border-saffron font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Contemplation</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-primary-dark-blue/60 text-center italic mt-1">
                Note: A normal contemplation deadline is enforced exactly 30 minutes after the lecture window closes.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
