import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BrandMark = ({
  to = "/",
  compact = false,
  inverted = false,
}: {
  to?: string;
  compact?: boolean;
  inverted?: boolean;
}) => (
  <Link to={to} className="group flex items-center gap-3">
    <span
      className={cn(
        "grid place-items-center rounded-full border border-primary/25 bg-card shadow-soft",
        compact ? "h-9 w-9" : "h-11 w-11"
      )}
    >
      <img src="/logo.png" alt="" className={compact ? "h-6 w-6" : "h-8 w-8"} />
    </span>
    <span className="leading-none">
      <span
        className={cn(
          "block font-display italic text-[1.35rem] tracking-tight",
          inverted ? "text-primary-foreground" : "text-foreground"
        )}
      >
        Khan
      </span>
      <span
        className={cn(
          "block text-[0.68rem] uppercase tracking-[0.28em]",
          inverted ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        Education
      </span>
    </span>
  </Link>
);
