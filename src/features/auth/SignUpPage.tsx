import { PackageIcon } from "lucide-react";
import { useState } from "react";
import { ProvidersView } from "./components/ProvidersView";
import { SignUpForm } from "./components/SignUpForm";

type Step = "providers" | "credentials";

interface SignUpPageProps {
  redirectTo?: string;
}

/**
 * 2-step sign-up flow:
 *  1. Provider menu — Google (if configured) + "Sign up with email"
 *  2. Credentials — the name/email/password form
 */
export function SignUpPage({ redirectTo }: SignUpPageProps) {
  const [step, setStep] = useState<Step>("providers");

  if (step === "providers") {
    return (
      <ProvidersView
        mode="signup"
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
          <h1 className="text-xl font-medium text-foreground">Create your account</h1>
        </div>

        <SignUpForm redirectTo={redirectTo} />

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep("providers")}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
