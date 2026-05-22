import { config } from "@shared/lib/config";
import { getErrorParser } from "@shared/lib/dal/core/config";
import { ApiErrorCode } from "@shared/lib/dal/error-codes";
import axios from "axios";

/**
 * Axios client configured for the backend.
 * Intentionally minimal — request/response shaping lives in the DAL
 * (see src/shared/lib/dal/). This module only handles transport concerns:
 * base URL, timeout, credentials, tenant header, and the 401 side effect.
 *
 * Session tokens flow as httpOnly cookies set by better-auth, not as
 * Authorization: Bearer headers — which is why there's no request-side
 * token-injection interceptor here. `withCredentials: true` makes the
 * browser send the cookie on cross-origin requests too.
 */
const xTenantId = import.meta.env.VITE_X_TENANT_ID;

export const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    ...(xTenantId && { "x-tenant-id": xTenantId }),
  },
  // Serialize array params as repeated keys (`?country=AU&country=UK`) rather
  // than axios's default bracket syntax (`?country[]=AU&country[]=UK`) or
  // comma-join. Backend accepts both repeated + CSV; repeated is unambiguous
  // for values that may contain commas.
  paramsSerializer: {
    serialize: (params) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value == null) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item != null) {
              sp.append(key, String(item));
            }
          }
        } else {
          sp.append(key, String(value));
        }
      }
      return sp.toString();
    },
  },
});

/**
 * Registry for auth redirect handlers. Set once from the router (see
 * __root.tsx). Using a registry instead of a window event keeps the channel
 * typed and traceable — no magic event names. Also avoids the circular
 * import that would result if this module imported the router directly.
 */
let unauthorizedHandler: (() => void) | null = null;
let accountDisabledHandler: (() => void) | null = null;

export function setAuthRedirectHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function setAccountDisabledHandler(handler: (() => void) | null) {
  accountDisabledHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Backend `403 ACCOUNT_DISABLED` means the user was disabled mid-session.
    // The session cookie isn't revoked server-side, so we sign out + redirect
    // to surface the disabled state. Routed through the configured parser
    // so the envelope shape stays a single source of truth.
    if (axios.isAxiosError(error) && status === 403) {
      const parsed = getErrorParser()(error);
      if (parsed.code === ApiErrorCode.ACCOUNT_DISABLED) {
        accountDisabledHandler?.();
        return Promise.reject(error);
      }
    }
    if (status === 401) {
      // The session cookie itself is managed by better-auth; we don't touch
      // it here. Just notify the router to redirect to /login.
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
