import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { signIn } from "@shared/lib/auth/client";
import { toApiError } from "@shared/lib/auth/toApiError";
import { ApiError, applyApiErrorToForm } from "@shared/lib/dal";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { SignInSchema, type SignInValues } from "../lib/auth.schema";

interface LoginFormProps {
  redirectTo?: string;
  initialEmail?: string;
}

export function LoginForm({ redirectTo = "/dashboard", initialEmail = "" }: LoginFormProps) {
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: initialEmail, password: "" },
  });

  const signInMutation = useMutation({
    mutationFn: async (values: SignInValues) => {
      try {
        const { data, error } = await signIn.email(values);
        if (error) {
          throw toApiError(error);
        }
        return data;
      } catch (err) {
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError({
          success: false,
          message: "Unable to reach the server. Please check your connection and try again.",
        });
      }
    },
    onSuccess: async () => {
      await router.invalidate();
      await router.navigate({ to: redirectTo });
    },
    onError: (err: ApiError) => {
      applyApiErrorToForm(form, err);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => signInMutation.mutate(v))} className="space-y-3">
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
                  placeholder="Password"
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
          disabled={signInMutation.isPending}
        >
          {signInMutation.isPending ? "Signing in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
