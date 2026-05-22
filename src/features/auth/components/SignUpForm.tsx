import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { signUp } from "@shared/lib/auth/client";
import { toApiError } from "@shared/lib/auth/toApiError";
import { ApiError, applyApiErrorToForm } from "@shared/lib/dal";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { SignUpSchema, type SignUpValues } from "../lib/auth.schema";

interface SignUpFormProps {
  redirectTo?: string;
}

export function SignUpForm({ redirectTo = "/products" }: SignUpFormProps) {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      try {
        const { data, error } = await signUp.email(values);
        if (error) {
          throw toApiError(error);
        }
        return data;
      } catch (err) {
        if (err instanceof ApiError) {
          throw err;
        }
        // Network / unexpected — surface a friendly message via the global
        // MutationCache toast.
        throw new ApiError({
          success: false,
          message: "Unable to reach the server. Please check your connection and try again.",
        });
      }
    },
    onSuccess: async () => {
      // Backend has autoSignIn: true → the response already set the session
      // cookie. Just refresh the router so beforeLoad guards re-evaluate.
      await router.invalidate();
      await router.navigate({ to: redirectTo });
    },
    onError: (err: ApiError) => {
      applyApiErrorToForm(form, err);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => signUpMutation.mutate(v))} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Full name"
                  className="h-11 rounded-xl border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email address"
                  className="h-11 rounded-xl border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  className="h-11 rounded-xl border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="secondary"
          className="h-11 w-full rounded-full text-sm"
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </Form>
  );
}
