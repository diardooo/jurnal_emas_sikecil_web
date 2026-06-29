import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-tour="page-header"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-navy-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
