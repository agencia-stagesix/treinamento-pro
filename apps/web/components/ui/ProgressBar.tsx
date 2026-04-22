"use client";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: "cyan" | "green" | "amber" | "red" | "blue" | "purple" | "pink";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const colorMap = {
  cyan: "bg-cyan",
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  blue: "bg-blue",
  purple: "bg-purple",
  pink: "bg-pink",
};

const sizeMap = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  color = "cyan",
  size = "md",
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-dim mb-1">
          <span>{label}</span>
          <span className="font-medium text-text">{pct}%</span>
        </div>
      )}
      <div className={cn("progress-bar", sizeMap[size])}>
        <div
          className={cn("progress-fill", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
