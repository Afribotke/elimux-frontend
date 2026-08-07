import { ShieldCheck, Shield } from "lucide-react";

interface TvetaBadgeProps {
  registrationNumber?: string | null;
  accredited?: boolean | null;
}

export default function TvetaBadge({ registrationNumber, accredited }: TvetaBadgeProps) {
  if (accredited === true) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-500/15 text-green-400 border-green-500/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        TVETA Accredited
        {registrationNumber && <span className="font-mono opacity-75">{registrationNumber}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/20 text-muted border-border">
      <Shield className="w-3.5 h-3.5" />
      Not TVETA Verified
    </div>
  );
}
