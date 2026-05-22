import { z } from "zod";

export const SignInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  // Backend enforces min 8 via better-auth config; mirror it here for
  // immediate client-side feedback.
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SignUpSchema = SignInSchema.extend({
  name: z.string().min(1, "Name is required"),
});

export type SignInValues = z.infer<typeof SignInSchema>;
export type SignUpValues = z.infer<typeof SignUpSchema>;
