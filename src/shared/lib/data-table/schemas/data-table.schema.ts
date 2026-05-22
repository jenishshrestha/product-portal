import { z } from "zod";

export const dataTableSearchSchema = z.object({
  page: z.number().int().min(0).optional().default(0),
  pageSize: z.number().int().min(1).max(100).optional().default(10),
  sort: z.string().optional(),
  filters: z.string().optional(),
  search: z.string().optional(),
});

export type DataTableSearchParams = z.infer<typeof dataTableSearchSchema>;

/**
 * Creates a prefixed search schema for routes with multiple tables.
 */
export function createDataTableSearchSchema(prefix: string) {
  return z.object({
    [`${prefix}page`]: z.number().int().min(0).optional().default(0),
    [`${prefix}pageSize`]: z.number().int().min(1).max(100).optional().default(10),
    [`${prefix}sort`]: z.string().optional(),
    [`${prefix}filters`]: z.string().optional(),
    [`${prefix}search`]: z.string().optional(),
  });
}
