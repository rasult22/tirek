import { useQuery } from "@tanstack/react-query";
import { directChatApi } from "../api/direct-chat";

export function useDirectChatUnread() {
  const { data } = useQuery({
    queryKey: ["direct-chat", "unread-count"],
    queryFn: directChatApi.unreadCount,
    refetchInterval: 30_000,
  });

  return data?.count ?? 0;
}
