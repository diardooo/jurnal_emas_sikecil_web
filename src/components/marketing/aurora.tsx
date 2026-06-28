import { cn } from "@/lib/utils";

/**
 * Soft, slowly-morphing gradient blobs used as a premium ambient background.
 * Purely decorative (aria-hidden); animation pauses under reduced-motion.
 */
export function Aurora({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const tint =
    variant === "dark"
      ? ["bg-gold-500/25", "bg-sage/20", "bg-soft-orange/15"]
      : ["bg-gold-300/40", "bg-sage/25", "bg-soft-orange/25"];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl motion-safe:animate-blob",
          tint[0],
        )}
      />
      <div
        className={cn(
          "absolute -right-16 top-8 h-80 w-80 rounded-full blur-3xl motion-safe:animate-blob [animation-delay:5s]",
          tint[1],
        )}
      />
      <div
        className={cn(
          "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full blur-3xl motion-safe:animate-blob [animation-delay:9s]",
          tint[2],
        )}
      />
    </div>
  );
}
