import type { ClientSideDataSource, ServerSideDataSource } from "../types/data-table.types";

/**
 * Pass-through resolver for client/server data sources. Exists as a boundary
 * so useDataSource can treat non-provider sources uniformly; no runtime
 * transformation today.
 */
export function resolveDataSource<TData>(
  dataSource: ClientSideDataSource<TData> | ServerSideDataSource<TData>,
): ClientSideDataSource<TData> | ServerSideDataSource<TData> {
  return dataSource;
}
