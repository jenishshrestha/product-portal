import { PackageIcon } from "lucide-react";
import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { ProvidersView } from "./components/ProvidersView";

type Step = "providers" | "credentials";

interface LoginPageProps {
  redirectTo?: string;
}

/**
 * 2-step login flow:
 *  1. Provider menu — Google (if configured) + "Continue with email"
 *  2. Credentials — the existing email/password form
 *
 * State lives here; no routing between steps.
 */
export function LoginPage({ redirectTo = "/dashboard" }: LoginPageProps) {
  const [step, setStep] = useState<Step>("providers");

  if (step === "providers") {
    return (
      <ProvidersView
        mode="login"
        redirectTo={redirectTo}
        onContinueWithEmail={() => setStep("credentials")}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-secondary">
            <PackageIcon className="size-6 text-foreground" />
          </div>
          <h1 className="text-xl font-medium text-foreground">Log in</h1>
        </div>

        <LoginForm redirectTo={redirectTo} />

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep("providers")}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
