import { cn } from "@/lib/utils";

/** Animated baby-tooth illustration. Fills gold + pops in when erupted. */
export function ToothIcon({
  erupted,
  className,
}: {
  erupted: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 36"
      className={cn(
        "transition-all duration-500",
        erupted ? "scale-100" : "scale-90 opacity-60",
        className,
      )}
      aria-hidden
    >
      {/* gum */}
      <ellipse cx="16" cy="30" rx="11" ry="5" fill="#FBDDDF" />
      {/* tooth body */}
      <path
        d="M16 4c5.5 0 9 3.4 9 8.5 0 4-1 7-2.2 10.4-.7 2-1.3 4.6-2.8 4.6-1.3 0-1.6-2-2-3.8-.4-1.6-.9-2.7-2-2.7s-1.6 1.1-2 2.7c-.4 1.8-.7 3.8-2 3.8-1.5 0-2.1-2.6-2.8-4.6C7 19.5 6 16.5 6 12.5 6 7.4 9.5 4 16 4Z"
        className="transition-all duration-500"
        fill={erupted ? "#FFFFFF" : "#F1EEE8"}
        stroke={erupted ? "#C9A227" : "#D8D2C4"}
        strokeWidth="1.6"
      />
      {/* shine */}
      {erupted && (
        <path
          d="M12 9c1.2-1.4 3-2 4.6-1.7"
          stroke="#EAD685"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
