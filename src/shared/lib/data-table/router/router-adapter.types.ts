export interface RouterSearchParamsReturn {
  /** Current URL search params as flat key-value map */
  getParams: () => Record<string, unknown>;
  /** Merge updates into URL params. undefined values remove the key. Replaces history entry. */
  setParams: (updates: Record<string, unknown>) => void;
}

export interface RouterAdapter {
  /** Hook that returns read/write access to URL search params. Must follow React hooks rules. */
  useSearchParams: () => RouterSearchParamsReturn;
}
