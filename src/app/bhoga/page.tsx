import { createClient } from '@/utils/supabase/server';
import { Award, Clock, HelpCircle, AlertCircle } from 'lucide-react';

export default async function BhogaPage() {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('devotional_content')
    .select('*')
    .eq('title', 'Bhoga Offering Procedure')
    .single();

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Procedure Unavailable</h3>
            <p className="font-sans text-sm">Failed to retrieve Bhoga offering procedure. Please ensure migrations have run.</p>
          </div>
        </div>
      </div>
    );
  }

  // Split prayers by headings if we want to display step-by-step
  const prayers = [
    {
      title: '1. Prayer to Srila Prabhupada (Pranati)',
      subtitle: 'Chant three times',
      sanskrit: `nama om visnu-padaya krsna-presthaya bhu-tale\nsrimate bhaktivedanta-svamin iti namine\n\nnamas te sarasvate deve gaura-vani-pracarine\nnirvisesa-sunyavadi-pascatya-desa-tarine`,
      translation: `I offer my respectful obeisances unto His Divine Grace A.C. Bhaktivedanta Swami Prabhupada, who is very dear to Lord Krishna on this earth, having taken shelter at His lotus feet. Our respectful obeisances are unto you, O spiritual master, servant of Sarasvati Gosvami. You are kindly preaching the message of Lord Caitanyadeva and delivering the Western countries, which are filled with impersonalism and voidism.`
    },
    {
      title: '2. Prayer to Lord Caitanya (Pranati)',
      subtitle: 'Chant three times',
      sanskrit: `namo maha-vadanyaya krsna-prema-pradaya te\nkrsnaya krsna-caitanya-namne gaura-tvise namah`,
      translation: `O most munificent incarnation! You are Krishna Himself appearing as Sri Krishna Caitanya Mahaprabhu. You have assumed the golden color of Srimati Radharani, and You are widely distributing pure love of Krishna. We offer our respectful obeisances unto You.`
    },
    {
      title: '3. Prayer to Lord Krishna (Pranati)',
      subtitle: 'Chant three times',
      sanskrit: `he krsna karuna-sindho dina-bandho jagat-pate\ngopesa gopika-kanta radha-kanta namo 'stu te`,
      translation: `O my dear Krishna, O ocean of mercy, You are the friend of the distressed and the source of creation. You are the master of the cowherds and the lover of the gopis, especially Radharani. I offer my respectful obeisances unto You.`
    },
    {
      title: '4. Sri Pancha Tattva Mantra',
      subtitle: 'Chant three times',
      sanskrit: `sri-krsna-caitanya prabhu-nityananda\nsri-advaita gadadhara srivasadi-gaura-bhakta-vrinda`,
      translation: `I offer my obeisances unto the Supreme Lord, Sri Krishna Caitanya, Lord Nityananda, Sri Advaita, Sri Gadadhara, Srivasa, and all the devotees of Lord Caitanya.`
    },
    {
      title: '5. Hare Krishna Mahamantra',
      subtitle: 'Chant three times',
      sanskrit: `hare krsna hare krsna krsna krsna hare hare\nhare rama hare rama rama rama hare hare`,
      translation: `O Lord, O energy of the Lord, please engage me in Your loving service.`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-primary-dark-blue mb-3">
          Bhoga Offering Guide
        </h1>
        <div className="h-0.5 w-24 bg-saffron mx-auto"></div>
        <p className="text-xs text-primary-dark-blue/80 font-sans tracking-wide mt-2">
          Authorized Vaishnava procedure for offering meals to the Supreme Lord.
        </p>
      </div>

      <div className="bg-white border-2 border-primary-dark-blue/30 devotional-border-double p-6 md:p-8 space-y-8">
        {/* Important Admin Disclaimer */}
        <div className="bg-parchment-dark/50 border border-saffron p-4 text-xs font-sans text-primary-dark-blue flex items-start space-x-2.5">
          <HelpCircle className="h-5 w-5 text-saffron shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">Spiritual Standard Reference</p>
            <p className="leading-relaxed">
              This procedure outlines the simple devotional offering process. The final, authoritative devotional standard remains configurable and subject to the direct designation of the Guru or Admin.
            </p>
          </div>
        </div>

        {/* Guided Steps */}
        <div className="space-y-8">
          <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue border-b border-primary-dark-blue/20 pb-2">
            The Chanting & Offering Sequence
          </h2>

          <div className="space-y-6">
            {prayers.map((prayer, idx) => (
              <div key={idx} className="bg-parchment-dark/10 p-5 border border-primary-dark-blue/10">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
                  <h3 className="font-cinzel font-bold text-sm text-primary-dark-blue">
                    {prayer.title}
                  </h3>
                  <span className="bg-saffron/25 text-primary-dark-blue text-[10px] font-sans px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {prayer.subtitle}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-serif text-sm text-primary-dark-blue/90 mb-3 leading-relaxed bg-white border border-primary-dark-blue/10 p-3">
                  {prayer.sanskrit}
                </pre>
                <div className="text-xs italic text-primary-dark-blue/70 leading-relaxed pl-4 border-l-2 border-saffron">
                  <strong>Translation:</strong> {prayer.translation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offering Process & Waiting Period */}
        <div className="border-t border-primary-dark-blue/20 pt-6">
          <h2 className="font-cinzel text-lg font-bold text-primary-dark-blue mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-saffron" />
            <span>Offering Process & Waiting Period</span>
          </h2>
          
          <div className="text-sm font-sans text-primary-dark-blue/95 space-y-3 leading-relaxed">
            <p>
              1. **Purity First:** Ensure that the kitchen, utensils, and hands are completely clean. Do not taste the food during preparation; the Lord must be the first to enjoy it.
            </p>
            <p>
              2. **The Offering Plate:** Place a portion of the prepared food (bhoga) onto the Deity's dedicated plate. No meat, fish, eggs, onions, or garlic should ever be offered.
            </p>
            <p>
              3. **Chant with Devotion:** Set the plate on the altar, ring a small bell if available, and chant the five prayers above three times each.
            </p>
            <p>
              4. **The Waiting Period:** Leave the plate on the altar for approximately **10 to 15 minutes** for the Lord to accept the offering. During this time, leave the room or sit quietly chanting the Hare Krishna Mahamantra.
            </p>
            <p>
              5. **Removing Prasadam:** After the waiting period, transfer the offered food (now sanctified *Prasadam*) back into the main serving pots. Clean the Deity's plate immediately. Prasadam is now ready to be honored by the devotees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
