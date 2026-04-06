import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

export function SOSButton() {
  return (
    <Link
      to="/sos"
      className="btn-press fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-danger to-red-400 glow-danger transition-transform hover:scale-105"
      aria-label="SOS"
    >
      <span className="absolute inset-0 animate-ping rounded-2xl bg-danger opacity-20" />
      <ShieldAlert size={26} className="relative z-10 text-white drop-shadow-sm" strokeWidth={2.5} />
    </Link>
  );
}
