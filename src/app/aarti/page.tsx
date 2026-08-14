import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Sparkles, BookOpen, AlertCircle, Quote, Music, ShieldCheck, Heart } from 'lucide-react';

export default async function AartiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();

  // Fetch all active devotional content (excluding the Bhoga Offering Procedure which is on its own page)
  const { data: contents, error } = await supabase
    .from('devotional_content')
    .select('*')
    .neq('title', 'Bhoga Offering Procedure')
    .order('display_order', { ascending: true });

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve devotional texts. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contents || contents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="devotional-card">
          <p className="font-cinzel text-lg">No Devotional Content Found</p>
          <p className="font-sans text-xs text-primary-dark-blue/60 mt-1">Please ensure the database seeds have been run.</p>
        </div>
      </div>
    );
  }

  // Filter out the Jaya closing sequence from the sidebar selection list
  const selectableContents = contents.filter((c) => c.type !== 'Jaya');
  
  // Determine active content
  const activeContent = selectableContents.find((c) => c.title === tab) || selectableContents[0];
  
  // Find the closing Jaya sequence
  const jayaSequence = contents.find((c) => c.type === 'Jaya');

  // Group selectable contents by type for structured sidebar navigation
  const groupedContents: Record<string, typeof selectableContents> = {
    'Guru Vandana (Guru)': selectableContents.filter(c => c.type === 'Guru'),
    'Tulasi Worship (Tulasi)': selectableContents.filter(c => c.type === 'Tulasi'),
    'Nrsimha Prayers (Nrsimha)': selectableContents.filter(c => c.type === 'Nrsimha'),
    'Sandhya Aartis (Aarti)': selectableContents.filter(c => c.type === 'Aarti'),
    'Vaishnava Prayers (Prayer)': selectableContents.filter(c => c.type === 'Prayer'),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col font-sans">
      {/* Title Header */}
      <div className="text-center mb-10">
        <span className="text-[10px] uppercase font-bold text-saffron tracking-wider">
          Scriptural Reference Library
        </span>
        <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-primary-dark-blue mt-1 mb-3">
          Vaishnava Prayers & Aartis
        </h1>
        <div className="h-0.5 w-24 bg-saffron mx-auto"></div>
        <p className="text-xs text-primary-dark-blue/80 tracking-wide mt-2">
          Guru-approved lyrics, transliterations, translations, and program details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-primary-dark-blue/20 p-5 shadow-sm">
            <h2 className="font-cinzel text-sm font-bold text-primary-dark-blue border-b border-primary-dark-blue/15 pb-2 mb-4 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-saffron" />
              <span>Devotional Index</span>
            </h2>
            
            <div className="space-y-4">
              {Object.entries(groupedContents).map(([groupName, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={groupName} className="space-y-1.5">
                    <h3 className="font-cinzel text-[10px] font-bold text-saffron uppercase tracking-widest pl-1">
                      {groupName}
                    </h3>
                    <div className="flex flex-col space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/aarti?tab=${encodeURIComponent(item.title)}`}
                          className={`text-left px-3 py-2 border transition-all text-xs font-medium flex items-center justify-between ${
                            activeContent.id === item.id
                              ? 'bg-primary-dark-blue text-white border-saffron border-r-4 shadow-sm'
                              : 'bg-white hover:bg-parchment-dark text-primary-dark-blue border-primary-dark-blue/10'
                          }`}
                        >
                          <span>{item.title}</span>
                          <Sparkles className={`h-3 w-3 ${activeContent.id === item.id ? 'text-saffron' : 'text-primary-dark-blue/20'}`} />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-8 bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8 flex flex-col justify-between shadow-md">
          <div>
            {/* Metadata Header Grid */}
            <div className="border-b border-primary-dark-blue/15 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-saffron tracking-wider font-sans block mb-1">
                  Author/Source: {activeContent.source_reference || 'Traditional'}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold font-cinzel text-primary-dark-blue mt-0.5">
                  {activeContent.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {activeContent.associated_program && (
                  <span className="bg-primary-dark-blue/10 text-primary-dark-blue text-[10px] font-sans px-2.5 py-1 font-bold uppercase tracking-wider border border-primary-dark-blue/15">
                    {activeContent.associated_program}
                  </span>
                )}
                <span className="bg-green-50 text-green-700 text-[10px] font-sans px-2.5 py-1 font-bold uppercase tracking-wider border border-green-200 flex items-center space-x-1">
                  <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />
                  <span>Approved</span>
                </span>
              </div>
            </div>

            {/* Audio Section (Mock Player if not null) */}
            <div className="bg-parchment-dark/10 border border-primary-dark-blue/10 p-3.5 mb-6 flex items-center justify-between flex-wrap gap-2 text-xs font-sans text-primary-dark-blue/80">
              <div className="flex items-center space-x-2">
                <Music className="h-4 w-4 text-saffron shrink-0" />
                <span><strong>Audio Guide:</strong> Traditional Melodious Chant</span>
              </div>
              <div className="flex items-center space-x-1 text-primary-blue font-semibold">
                <span>Format: MP3 (Standard Altar Meter)</span>
              </div>
            </div>

            {/* Text Hierarchy */}
            <div className="space-y-8 font-sans">
              {activeContent.original_text && (
                <div>
                  <h3 className="font-cinzel text-xs font-bold text-primary-blue uppercase tracking-widest mb-3 border-b border-primary-dark-blue/10 pb-1">
                    Original Text
                  </h3>
                  <pre className="whitespace-pre-wrap font-serif text-base text-primary-dark-blue leading-relaxed bg-parchment-dark/30 p-5 border-l-2 border-primary-dark-blue/30 shadow-inner">
                    {activeContent.original_text}
                  </pre>
                </div>
              )}

              {activeContent.transliteration && (
                <div>
                  <h3 className="font-cinzel text-xs font-bold text-primary-blue uppercase tracking-widest mb-3 border-b border-primary-dark-blue/10 pb-1">
                    Roman Transliteration
                  </h3>
                  <pre className="whitespace-pre-wrap font-serif text-sm text-primary-dark-blue/90 leading-relaxed bg-parchment-dark/10 p-5 border-l-2 border-saffron shadow-inner">
                    {activeContent.transliteration}
                  </pre>
                </div>
              )}

              {activeContent.translation && (
                <div>
                  <h3 className="font-cinzel text-xs font-bold text-primary-blue uppercase tracking-widest mb-2 border-b border-primary-dark-blue/10 pb-1">
                    English Translation
                  </h3>
                  <div className="italic text-primary-dark-blue/90 text-sm leading-relaxed relative pl-6 pr-2 pt-2">
                    <Quote className="absolute left-0 top-0 h-4 w-4 text-saffron opacity-60" />
                    <p className="indent-2">{activeContent.translation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Program-end Closing Jaya Sequence (Appears exactly once at the end of appropriate templates) */}
          {activeContent.associated_program && activeContent.title !== 'Vaishnave Vijnapti' && jayaSequence && (
            <div className="mt-12 pt-6 border-t-2 border-double border-saffron bg-parchment-dark/30 p-5 shadow-inner">
              <div className="flex items-center justify-center space-x-1.5 mb-4">
                <Heart className="h-4 w-4 text-saffron fill-saffron shrink-0" />
                <h4 className="font-cinzel text-xs font-bold text-saffron uppercase tracking-widest text-center">
                  Mandatory Program Closing Sequence
                </h4>
                <Heart className="h-4 w-4 text-saffron fill-saffron shrink-0" />
              </div>
              <pre className="whitespace-pre-wrap font-serif text-xs text-primary-dark-blue/80 text-center leading-relaxed font-semibold">
                {jayaSequence.original_text}
              </pre>
              <p className="text-[9px] text-center text-primary-dark-blue/50 mt-4 font-sans uppercase tracking-wider">
                This Jaya sequence completes the active {activeContent.associated_program} session.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
