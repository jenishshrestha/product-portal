/**
 * Symbolic error codes the backend emits via the Heubert error envelope's
 * `error.code` field. Centralized here so call sites that branch on a code
 * (e.g. inline form errors, axios interceptors) stay typo-safe.
 *
 * The full set is much larger; this module only enumerates codes the
 * frontend actually branches on. Add new entries as new branches appear.
 */
export const ApiErrorCode = {
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  CONFLICT: "CONFLICT",
  EMAIL_DOMAIN_NOT_ALLOWED: "EMAIL_DOMAIN_NOT_ALLOWED",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
