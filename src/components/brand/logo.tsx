import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative block h-10 w-10 shrink-0", className)}
      aria-hidden
    >
      {/* Plain <img>: next/image blocks SVG by default (dangerouslyAllowSVG). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="" className="h-full w-full object-contain" />
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
