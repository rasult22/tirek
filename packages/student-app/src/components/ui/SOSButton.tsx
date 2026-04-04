import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

export function SOSButton() {
  return (
    <Link
      to="/sos"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-danger shadow-lg shadow-danger/30 transition-transform hover:scale-105 active:scale-95"
      aria-label="SOS"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-30" />
      <ShieldAlert size={26} className="relative z-10 text-white" strokeWidth={2.5} />
    </Link>
  );
}
