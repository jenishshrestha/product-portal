import { cn } from "@shared/lib/utils";

function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--skeleton-base) 0%, var(--skeleton-highlight) 50%, var(--skeleton-base) 100%)",
        backgroundSize: "200% 100%",
        ...style,
      }}
      {...props}
    />
  );
}

export { Skeleton };
