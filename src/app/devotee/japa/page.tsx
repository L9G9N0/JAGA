import { createClient } from '@/utils/supabase/server';
import { getKolkataDateString } from '@/app/devotee/actions';
import LiveKitJapaRoom from '@/components/LiveKitJapaRoom';
import { AlertCircle } from 'lucide-react';

export default async function DevoteeJapaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-cinzel text-lg">Authentication Required</p>
      </div>
    );
  }

  // Fetch Japa schedule config
  const { data: japaConfig, error } = await supabase
    .from('schedule_configs')
    .select('*')
    .eq('type', 'japa')
    .single();

  const todayStr = await getKolkataDateString();

  if (error || !japaConfig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 devotional-border-single flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-lg mb-1">Configuration Error</h3>
            <p className="font-sans text-sm">Failed to retrieve Japa schedule configuration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col">
      <LiveKitJapaRoom
        configId={japaConfig.id}
        dateStr={todayStr}
        externalUrl={japaConfig.external_url}
      />
    </div>
  );
}
