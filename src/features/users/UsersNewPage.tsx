import { zodResolver } from "@hookform/resolvers/zod";
import { BackLink } from "@shared/components/BackLink";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@shared/components/ui/Button";
import { Card, CardContent } from "@shared/components/ui/Card";
import { Checkbox } from "@shared/components/ui/Checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { Label } from "@shared/components/ui/Label";
import { type ApiError, ApiErrorCode, applyApiErrorToForm } from "@shared/lib/dal";
import { useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateUser } from "./api/useUsers";
import { CreateUserFormSchema, type CreateUserFormValues } from "./lib/user.schema";
import type { CreateUserInput } from "./types/user.types";

const DEFAULTS: CreateUserFormValues = {
  name: "",
  email: "",
  password: "",
  roles: ["user"],
};

/**
 * Full-page Add User form. Mirrors ProductNewPage's outer skeleton —
 * BackLink → PageHeader → form body → sticky footer actions — so the two
 * "new" surfaces feel like the same screen in different modes. The 4-field
 * form is too small to justify tabs/sidebar, so the body is a single Card.
 */
export function UsersNewPage() {
  const formId = useId();
  const adminId = useId();
  const navigate = useNavigate();
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: DEFAULTS,
  });

  function onSubmit(values: CreateUserFormValues) {
    const body: CreateUserInput = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      roles: values.roles?.length ? values.roles : ["user"],
    };
    createUser.mutate(body, {
      onSuccess: (created) => {
        toast.success(`${created.name} created`);
        void navigate({ to: "/admin/users" });
      },
      onError: (err: ApiError) => {
        // See docs/backend-integration.md#creating-a-user---scenarios.
        if (err.code === ApiErrorCode.CONFLICT || err.status === 409) {
          form.setError("email", { message: "This email is already in use" });
          return;
        }
        if (err.code === ApiErrorCode.EMAIL_DOMAIN_NOT_ALLOWED) {
          form.setError("email", {
            message: "Only office email domains can be added",
          });
          return;
        }
        if (err.status === 422 && err.errors) {
          applyApiErrorToForm(form, err);
          return;
        }
        toast.error(err.message || "Failed to create user");
      },
    });
  }

  function handleCancel() {
    void navigate({ to: "/admin/users" });
  }

  const adminChecked = form.watch("roles")?.includes("admin") ?? false;

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <BackLink to="/admin/users">Back to users</BackLink>

        <PageHeader.Root>
          <PageHeader.Content>
            <PageHeader.Title>New user</PageHeader.Title>
            <PageHeader.Description>
              Creates an account with an initial password. Communicate the password to the user out
              of band — there's no email invite.
            </PageHeader.Description>
          </PageHeader.Content>
        </PageHeader.Root>

        <Card className="mt-6 max-w-2xl">
          <CardContent className="space-y-5 pt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
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
                  <FormLabel>Initial password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>At least 8 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked disabled />
                  <Label className="text-sm">User</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={adminId}
                    checked={adminChecked}
                    onCheckedChange={(v) =>
                      form.setValue("roles", v === true ? ["user", "admin"] : ["user"], {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label htmlFor={adminId} className="text-sm">
                    Admin
                  </Label>
                </div>
              </div>
              <FormDescription>User is granted by default.</FormDescription>
            </FormItem>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createUser.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
