import { Button } from "@shared/components/ui/Button";
import { signIn } from "@shared/lib/auth/client";
import { toApiError } from "@shared/lib/auth/toApiError";
import { ApiError } from "@shared/lib/dal";
import { Link } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";
import { toast } from "sonner";

interface ProvidersViewProps {
  mode: "login" | "signup";
  onContinueWithEmail: () => void;
  /** Destination after a successful Google redirect (used as the callback URL). */
  redirectTo?: string;
}

export function ProvidersView({
  mode,
  onContinueWithEmail,
  redirectTo = "/dashboard",
}: ProvidersViewProps) {
  const title = mode === "login" ? "Log in" : "Sign up";
  const emailCta = mode === "login" ? "Continue with email" : "Sign up with email";
  const googleCta = mode === "login" ? "Continue with Google" : "Sign up with Google";
  const footerCopy = mode === "login" ? "Don't have an account?" : "Already have an account?";
  const footerLinkTo = mode === "login" ? "/signup" : "/login";
  const footerLinkText = mode === "login" ? "Sign up" : "Log in";

  const onGoogle = async () => {
    try {
      // Both URLs must be absolute — better-auth resolves relative paths
      // against the backend's BETTER_AUTH_URL, which would land users on
      // the backend's 404 page instead of the FE.
      const origin = window.location.origin;
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: `${origin}${redirectTo}`,
        errorCallbackURL: `${origin}/login`,
      });
      if (error) {
        throw toApiError(error);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Unable to start Google sign-in. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-secondary">
            <PackageIcon className="size-6 text-foreground" />
          </div>
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
        </div>

        <div className="space-y-3">
          <Button type="button" onClick={onGoogle} className="h-11 w-full rounded-full text-sm">
            {googleCta}
          </Button>
          <Button
            type="button"
            onClick={onContinueWithEmail}
            variant="secondary"
            className="h-11 w-full rounded-full text-sm"
          >
            {emailCta}
          </Button>
        </div>

        {(mode === "signup" || import.meta.env.DEV) && (
          <p className="text-center text-sm text-muted-foreground">
            {footerCopy}{" "}
            <Link
              to={footerLinkTo}
              search={{ redirect: undefined }}
              className="font-medium text-foreground hover:underline"
            >
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
