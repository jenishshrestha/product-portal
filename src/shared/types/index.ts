import { z } from "zod";

// Common types
export type ID = string;
export type Timestamp = string; // ISO 8601 format for API transport

// User types — mirrors the backend's better-auth User (+ roles array extension)
export const UserRoles = ["admin", "user"] as const;
export type UserRole = (typeof UserRoles)[number];

/**
 * better-auth's client auto-deserializes ISO date strings in session
 * responses into `Date` objects — so `createdAt`/`updatedAt` arrive as
 * `Date` at runtime even though the wire shape is string. Accept either
 * and normalize to an ISO string so the exported `User` type stays JSON-stable.
 */
const IsoDateish = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.string().datetime(),
);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  emailVerified: z.boolean().default(false),
  image: z.string().url().nullable().optional(),
  roles: z.array(z.enum(UserRoles)).default(["user"]),
  createdAt: IsoDateish,
  updatedAt: IsoDateish,
});

export type User = z.infer<typeof UserSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Re-export only the z constructor for schema creation convenience
export { z } from "zod";
