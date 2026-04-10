import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";

export function NetworkStatus() {
  const t = useT();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-danger px-4 py-2 text-sm font-medium text-white">
      <WifiOff size={16} />
      {t.common.offline}
    </div>
  );
}
