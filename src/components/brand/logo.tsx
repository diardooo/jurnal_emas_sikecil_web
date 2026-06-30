import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-sm",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/brand/logo.png"
        alt=""
        fill
        sizes="64px"
        className="object-cover"
        priority
      />
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
