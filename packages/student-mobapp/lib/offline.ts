import { useEffect } from "react";
import { onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

/**
 * Syncs React Query's online/offline state with device connectivity.
 * When offline, mutations are paused and queued.
 * When back online, paused mutations are automatically resumed.
 */
export function OnlineManager() {
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      onlineManager.setOnline(isOnline);
    });
  }, []);

  return null;
}
