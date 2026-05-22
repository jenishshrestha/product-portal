import { z } from "zod";
import { USER_ROLES } from "../types/user.types";

/**
 * Form schema for the admin "Create user" dialog. Backend rejects passwords
 * shorter than 8 chars (422 VALIDATION_ERROR); we mirror the rule client-side
 * so submission only fires once the basic constraints are met. Server-side
 * errors (email uniqueness, domain allowlist) come back as 409/403 and are
 * routed to fields by code, not by re-validation here.
 */
export const CreateUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(128, "Too long"),
  roles: z.array(z.enum(USER_ROLES)).min(1, "Pick at least one role").default(["user"]),
});

export type CreateUserFormValues = z.input<typeof CreateUserFormSchema>;
