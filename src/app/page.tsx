import Link from 'next/link';
import { Calendar, BookOpen, Clock, Heart, Award, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const pillars = [
    {
      title: 'Structured Sadhana',
      description: 'Engage in a rigorous, time-bound daily schedule including Arati, Japa, Darshan, and lectures designed to build steady spiritual habit.',
      icon: Clock
    },
    {
      title: 'Synchronized Learning',
      description: 'Study authorized spiritual lectures. Devotees join live-broadcasted content at fixed times to enforce punctuality and community participation.',
      icon: BookOpen
    },
    {
      title: 'Contemplation & Daily Reporting',
      description: 'Synthesize knowledge by answering contemplation questions after lectures. Log daily Mala counts and reports under the guidance of Guru/Admin.',
      icon: Award
    },
    {
      title: 'Guru/Admin Supervision',
      description: 'A platform built on supervision and accountability. Submit recovery requests for missed duties and review discipline patterns.',
      icon: ShieldCheck
    }
  ];

  const standardSchedule = [
    { time: '04:30 AM - 05:00 AM', event: 'Mangala Arati & Tulasi Puja', desc: 'Devotional prayers, songs, and worship to start the day.' },
    { time: '05:00 AM - 07:15 AM', event: 'JAPA Session (Live Audio)', desc: 'Group chanting of the Hare Krishna Mahamantra (LiveKit integration).' },
    { time: '07:15 AM - 07:30 AM', event: 'Darshan & Shringara Arati', desc: 'Deity darshan accompanied by the Govindam prayers.' },
    { time: '07:30 AM - 08:30 AM', event: 'Morning Lecture', desc: 'Synchronized, structured book-learning lecture.' },
    { time: '12:30 PM - 01:00 PM', event: 'Raja-Bhoga Offering', desc: 'Chanting authorized prayers to offer bhoga with love.' },
    { time: '04:15 PM - 04:45 PM', event: 'Afternoon Darshan & Dhoop Arati', desc: 'Afternoon temple opening and prayers.' },
    { time: '07:00 PM - 07:30 PM', event: 'Sandhya & Gaura Arati', desc: 'Evening congregational prayers and Vaishnave Vijnapti.' },
    { time: '09:15 PM - 09:30 PM', event: 'Shayana Arati', desc: 'Night prayers offering rest to the Deities.' }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-deepest-blue text-white py-20 px-4 sm:px-6 lg:px-8 border-b-8 border-saffron relative overflow-hidden">
        {/* Subtle decorative background border pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none border-[16px] border-double border-parchment m-4"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-wider font-cinzel text-light-devotional-blue mb-4">
            JAGA
          </h1>
          <p className="text-lg md:text-xl font-sans tracking-wide text-parchment/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            A production-ready devotional discipline, learning, and accountability platform for serious sadhakas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-saffron hover:bg-amber-500 text-deepest-blue px-8 py-3.5 text-base font-semibold border-2 border-white transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>Apply for Devotee Access</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/library"
              className="w-full sm:w-auto bg-primary-dark-blue hover:bg-secondary-blue text-white px-8 py-3.5 text-base font-semibold border border-saffron transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Public Library</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-cinzel text-primary-dark-blue mb-3">
            The Pillars of JAGA
          </h2>
          <div className="h-0.5 w-24 bg-saffron mx-auto"></div>
          <p className="text-parchment-dark mt-4 text-sm font-sans max-w-xl mx-auto">
            "Books are the basis. Purity is the force. Preaching is the essence. Utility is the principle."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="devotional-card rounded-none hover:border-saffron transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-dark-blue p-3 border border-saffron">
                    <Icon className="h-6 w-6 text-light-devotional-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-cinzel text-primary-dark-blue mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-primary-dark-blue/85 leading-relaxed font-sans">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Devotional Schedule Section */}
      <section className="bg-parchment-dark py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-primary-dark-blue/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-cinzel text-primary-dark-blue mb-2">
              Daily Devotional Schedule
            </h2>
            <p className="text-xs text-saffron font-bold uppercase tracking-wider font-sans">
              Authoritative Timezone: Asia/Kolkata (IST)
            </p>
            <div className="h-0.5 w-24 bg-saffron mx-auto mt-3"></div>
          </div>

          <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8">
            <div className="divide-y divide-primary-dark-blue/20">
              {standardSchedule.map((slot, index) => (
                <div key={index} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-saffron shrink-0" />
                    <span className="font-semibold text-sm font-sans tracking-wide text-secondary-blue">
                      {slot.time}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-bold text-base font-cinzel text-primary-dark-blue">
                      {slot.event}
                    </p>
                    <p className="text-xs text-primary-dark-blue/70 font-sans mt-0.5">
                      {slot.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action/About Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold font-cinzel text-primary-dark-blue mb-4">
          Public Devotional Resources
        </h2>
        <p className="text-sm text-primary-dark-blue/80 leading-relaxed mb-8">
          JAGA is open for public viewing of approved spiritual songs, book learning references, and the curated YouTube lecture library. To participate in interactive daily programs like synchronized lectures and LiveKit Japa audio sessions, you must sign up and receive spiritual verification from a Guru or Admin.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/aarti"
            className="bg-white text-primary-dark-blue px-6 py-3 border border-primary-dark-blue hover:border-saffron hover:bg-parchment-dark transition-all text-sm font-bold font-cinzel"
          >
            Read Aartis & Prayers
          </Link>
          <Link
            href="/bhoga"
            className="bg-white text-primary-dark-blue px-6 py-3 border border-primary-dark-blue hover:border-saffron hover:bg-parchment-dark transition-all text-sm font-bold font-cinzel"
          >
            Bhoga Procedures
          </Link>
          <Link
            href="/books"
            className="bg-white text-primary-dark-blue px-6 py-3 border border-primary-dark-blue hover:border-saffron hover:bg-parchment-dark transition-all text-sm font-bold font-cinzel"
          >
            Vedabase Links
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deepest-blue text-parchment/60 text-xs py-8 px-4 text-center border-t border-saffron mt-auto">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-cinzel text-sm text-light-devotional-blue">JAGA Devotional Community</p>
          <p>“All glories to the assembled devotees. Thank you very much.”</p>
          <p className="pt-2 font-sans opacity-50">&copy; {new Date().getFullYear()} JAGA. All spiritual rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
