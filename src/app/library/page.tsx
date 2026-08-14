import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Play, Clock, Search, AlertCircle, X, HelpCircle } from 'lucide-react';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; watch?: string }>;
}) {
  const { category, watch } = await searchParams;
  const supabase = await createClient();

  // Fetch active lectures
  let query = supabase
    .from('lectures')
    .select('*')
    .eq('active', true)
    .order('scheduled_start', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data: lectures, error } = await query;

  // Fetch all active categories to display as filters
  const { data: rawCategories } = await supabase
    .from('lectures')
    .select('category')
    .eq('active', true);

  const categories = ['All', ...Array.from(new Set(rawCategories?.map((c) => c.category) || []))];

  // If watching a video, fetch details
  let watchingLecture = null;
  if (watch) {
    const { data } = await supabase
      .from('lectures')
      .select('*')
      .eq('youtube_video_id', watch)
      .single();
    watchingLecture = data;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve lectures. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} mins`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col relative">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-primary-dark-blue mb-3">
          Lecture Library
        </h1>
        <div className="h-0.5 w-24 bg-saffron mx-auto"></div>
        <p className="text-xs text-primary-dark-blue/80 font-sans tracking-wide mt-2">
          Curated collection of spiritual teachings, lectures, and Japa guidelines.
        </p>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 pb-4 border-b border-primary-dark-blue/15">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/library?${cat === 'All' ? '' : `category=${encodeURIComponent(cat)}`}`}
            className={`px-4 py-1.5 border border-primary-dark-blue/20 text-xs font-semibold uppercase tracking-wider font-cinzel transition-all ${
              (category || 'All') === cat
                ? 'bg-primary-dark-blue text-white border-saffron'
                : 'bg-white hover:bg-parchment-dark text-primary-dark-blue'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Lectures Grid */}
      {lectures && lectures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lectures.map((lecture) => (
            <div
              key={lecture.id}
              className="bg-white border border-primary-dark-blue/20 hover:border-saffron hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-black overflow-hidden border-b border-primary-dark-blue/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${lecture.youtube_video_id}/mqdefault.jpg`}
                  alt={lecture.title}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                />
                <Link
                  href={`/library?${category ? `category=${encodeURIComponent(category)}&` : ''}watch=${lecture.youtube_video_id}`}
                  className="absolute inset-0 flex items-center justify-center bg-deepest-blue/30 group-hover:bg-deepest-blue/50 transition-colors"
                >
                  <div className="bg-saffron p-3 border-2 border-white rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 text-deepest-blue fill-deepest-blue" />
                  </div>
                </Link>
                <div className="absolute bottom-2 right-2 bg-deepest-blue/80 text-parchment text-[10px] px-2 py-0.5 font-bold font-sans">
                  {formatDuration(lecture.duration_seconds)}
                </div>
              </div>

              {/* Info Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] uppercase font-bold text-saffron tracking-wider font-sans">
                      {lecture.category}
                    </span>
                    <span className="text-[9px] text-primary-dark-blue/60 font-sans">
                      {lecture.language}
                    </span>
                  </div>
                  <h3 className="font-cinzel font-bold text-sm text-primary-dark-blue group-hover:text-secondary-blue transition-colors line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-xs text-primary-dark-blue/70 font-sans mt-2 line-clamp-3 leading-relaxed">
                    {lecture.description}
                  </p>
                </div>

                <div className="border-t border-primary-dark-blue/10 pt-3 mt-4 flex items-center justify-between text-[11px] font-sans text-primary-dark-blue/60">
                  <span>Speaker: <strong>{lecture.speaker}</strong></span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-saffron" />
                    <span>{new Date(lecture.scheduled_start).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="devotional-card text-center py-12">
          <HelpCircle className="h-10 w-10 text-saffron mx-auto mb-2" />
          <p className="font-cinzel text-lg">No lectures found</p>
          <p className="font-sans text-xs text-primary-dark-blue/60 mt-1">There are no approved lectures matching this category.</p>
        </div>
      )}

      {/* Video Overlay Player Modal */}
      {watchingLecture && (
        <div className="fixed inset-0 bg-deepest-blue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border-4 border-saffron devotional-border-double relative flex flex-col">
            <Link
              href={`/library${category ? `?category=${encodeURIComponent(category)}` : ''}`}
              className="absolute -top-12 right-0 text-white hover:text-saffron flex items-center space-x-1 text-sm font-cinzel font-bold"
            >
              <X className="h-5 w-5" />
              <span>Close</span>
            </Link>

            {/* Responsive Iframe Container */}
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${watchingLecture.youtube_video_id}?autoplay=1&rel=0`}
                title={watchingLecture.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Video Details */}
            <div className="p-6 bg-parchment">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs uppercase font-bold text-saffron tracking-wider font-sans">
                  {watchingLecture.category} | {watchingLecture.language}
                </span>
                <span className="text-xs text-primary-dark-blue/60 font-sans">
                  Speaker: <strong>{watchingLecture.speaker}</strong>
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-cinzel text-primary-dark-blue">
                {watchingLecture.title}
              </h2>
              <p className="text-sm text-primary-dark-blue/80 font-sans mt-3 leading-relaxed">
                {watchingLecture.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
