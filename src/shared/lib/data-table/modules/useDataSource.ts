import { useMemo } from "react";
import type {
  ClientSideDataSource,
  DataSource,
  ServerSideDataSource,
} from "../types/data-table.types";

/**
 * Tagged-union projection of the raw DataSource. Kept structurally identical
 * to the input after a `useMemo` so downstream hooks get a stable reference.
 */
export type ResolvedDataSource<TData> =
  | (ServerSideDataSource<TData> & { kind: "server" })
  | (ClientSideDataSource<TData> & { kind: "client" });

export function useDataSource<TData>(dataSource: DataSource<TData>): ResolvedDataSource<TData> {
  return useMemo(() => {
    if (dataSource.mode === "server") {
      return { kind: "server", ...dataSource };
    }
    return { kind: "client", ...dataSource };
  }, [dataSource]);
}
