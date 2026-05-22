import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import type { AdvancedFilterState } from "../modules/useAdvancedFilters";

/**
 * Parse `?sort=<id>.<asc|desc>` — splits on the LAST `.` so column ids
 * containing dots (e.g. `course_details.course_name`) survive round-trip.
 * A naive `split(".")[0..1]` truncates the id and swaps the direction for
 * the next path segment — a bug that silently scrambles server-side sort.
 */
export function parseSortParam(sort?: string): SortingState {
  if (!sort) {
    return [];
  }
  const lastDot = sort.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === sort.length - 1) {
    return [];
  }
  const id = sort.slice(0, lastDot);
  const dir = sort.slice(lastDot + 1);
  if (dir !== "asc" && dir !== "desc") {
    return [];
  }
  return [{ id, desc: dir === "desc" }];
}

export function serializeSortState(sorting: SortingState): string | undefined {
  const first = sorting[0];
  if (!first) {
    return undefined;
  }
  return `${first.id}.${first.desc ? "desc" : "asc"}`;
}

export function parseFiltersParam(filters?: string): ColumnFiltersState {
  if (!filters) {
    return [];
  }
  try {
    return JSON.parse(filters) as ColumnFiltersState;
  } catch {
    return [];
  }
}

export function serializeFiltersState(filters: ColumnFiltersState): string | undefined {
  if (filters.length === 0) {
    return undefined;
  }
  return JSON.stringify(filters);
}

/**
 * Advanced filters are serialized as one URL param per section, with the
 * shape `<prefix><section>=value1,value2`. Examples:
 *   ?af.studyLevel=undergraduate
 *   ?af.country=USA,UK
 *
 * The prefix (default "af.") namespaces filter params so they don't collide
 * with other DT state (page, sort, search, …) or app params.
 */

export function readAdvancedFiltersFromParams(
  params: Record<string, unknown>,
  prefix: string,
): AdvancedFilterState {
  const result: AdvancedFilterState = {};
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const sectionKey = key.slice(prefix.length);
    if (!sectionKey) {
      continue;
    }
    if (Array.isArray(value)) {
      const values = value.map(String).filter(Boolean);
      if (values.length > 0) {
        result[sectionKey] = values;
      }
    } else if (typeof value === "string" && value.length > 0) {
      const values = value.split(",").filter(Boolean);
      if (values.length > 0) {
        result[sectionKey] = values;
      }
    }
  }
  return result;
}

export function buildAdvancedFilterUpdates(
  nextState: AdvancedFilterState,
  existingParams: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  // Remove params that were previously present but are no longer in state.
  for (const key of Object.keys(existingParams)) {
    if (key.startsWith(prefix)) {
      updates[key] = undefined;
    }
  }

  // Add current state entries.
  for (const [sectionKey, values] of Object.entries(nextState)) {
    if (values.length > 0) {
      updates[`${prefix}${sectionKey}`] = values.join(",");
    }
  }

  return updates;
}
