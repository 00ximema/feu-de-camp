
import { useOffline } from '@/hooks/useOffline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const { isOnline, isOffline } = useOffline();

  if (isOnline) return null;

  return (
    <Alert className="fixed top-4 right-4 w-auto z-50 bg-yellow-50 border-yellow-200">
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        Mode hors ligne - Les données sont sauvegardées localement
      </AlertDescription>
    </Alert>
  );
};

export default OfflineIndicator;
