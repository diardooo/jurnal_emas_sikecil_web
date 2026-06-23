import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy shadow-sm",
        className,
      )}
      aria-hidden
    >
      {/* Stylised baby star */}
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M12 2.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19l1.1-6L3.4 8.8l6-.8L12 2.5z"
          fill="#1A1A2E"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-extrabold tracking-tight text-navy">
            Jurnal Emas
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-600">
            Si Kecil
          </span>
        </span>
      )}
    </Link>
  );
}
