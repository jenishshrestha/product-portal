import { ApiError } from "@shared/lib/dal";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

interface ProductDetailErrorProps {
  error: Error;
  reset: () => void;
}

/**
 * Error state for the detail route. Distinguishes 404 (product deleted or
 * never existed) from anything else. Either way we offer a "Back to courses"
 * link — detail routes are leaf pages, no deep path to recover to.
 */
export function ProductDetailError({ error, reset }: ProductDetailErrorProps) {
  const isNotFound = error instanceof ApiError && error.status === 404;

  return (
    <div className="mx-auto max-w-[720px] px-10 pt-24 pb-20 text-center">
      <h1 className="mb-2 text-[1.375rem] font-semibold tracking-[-0.02em]">
        {isNotFound ? "Course not found" : "Something went wrong"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isNotFound
          ? "This course may have been archived or its ID is no longer valid."
          : error.message || "We couldn't load this course. Please try again."}
      </p>
      <div className="flex items-center justify-center gap-2">
        <Link
          to="/products"
          className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-[0.8125rem] font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to courses
        </Link>
        {!isNotFound && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-primary bg-primary px-3.5 text-[0.8125rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
