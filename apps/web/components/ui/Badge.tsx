import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "critical" | "warning" | "info" | "success" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        variant === "critical" && "badge-critical",
        variant === "warning" && "badge-warning",
        variant === "info" && "badge-info",
        variant === "success" && "badge-success",
        variant === "default" &&
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-border text-dim border border-dim3",
        className,
      )}
    >
      {children}
    </span>
  );
}
