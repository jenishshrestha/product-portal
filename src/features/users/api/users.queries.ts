/**
 * Per-feature query key factory for users.
 */
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters: unknown) => [...usersKeys.lists(), { filters }] as const,
};
