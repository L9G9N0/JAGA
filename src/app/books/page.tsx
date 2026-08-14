import { createClient } from '@/utils/supabase/server';
import { BookOpen, ExternalLink, AlertCircle, Info } from 'lucide-react';

export default async function BooksPage() {
  const supabase = await createClient();

  const { data: books, error } = await supabase
    .from('book_references')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Database Error</h3>
            <p className="font-sans text-sm">Failed to retrieve book references. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-primary-dark-blue mb-3">
          Book Learning & References
        </h1>
        <div className="h-0.5 w-24 bg-saffron mx-auto"></div>
        <p className="text-xs text-primary-dark-blue/80 font-sans tracking-wide mt-2">
          "Books are the basis" — Approved reading list and authoritative scriptural links.
        </p>
      </div>

      <div className="space-y-6">
        {/* Intellectual Property Disclaimer */}
        <div className="bg-light-devotional-blue/20 border border-primary-blue/30 p-4 text-xs font-sans text-primary-dark-blue flex items-start space-x-2.5">
          <Info className="h-5 w-5 text-primary-dark-blue shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">Copyright & Sourcing Integrity</p>
            <p className="leading-relaxed">
              JAGA respects the copyright and integrity of sacred text translations and commentaries. In alignment with administrative standards, we do not scrape, republish, or copy copyrighted books. Instead, we provide verified references and direct links to the official online archives.
            </p>
          </div>
        </div>

        {/* Book Cards Grid */}
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white border border-primary-dark-blue/20 p-6 flex flex-col justify-between hover:border-saffron transition-all">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-primary-dark-blue/10 p-2 text-primary-dark-blue border border-primary-dark-blue/20">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-cinzel font-bold text-base text-primary-dark-blue">
                        {book.book_title}
                      </h3>
                      {book.chapter_section && (
                        <span className="text-[10px] text-saffron font-bold uppercase tracking-wider font-sans">
                          {book.chapter_section}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-sans text-primary-dark-blue/80 leading-relaxed mb-6">
                    {book.description}
                  </p>
                </div>

                {book.url && (
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-parchment-dark/50 hover:bg-light-devotional-blue/20 text-primary-dark-blue border border-primary-dark-blue/20 py-2 text-center text-xs font-bold font-cinzel flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>Read on Vedabase</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="devotional-card text-center py-10">
            <p className="font-cinzel text-lg">No book references available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
