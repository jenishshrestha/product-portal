import { useMemo, useState } from "react";
import type { DataTableConfig, DataTableView } from "../types/data-table.types";

interface UseViewStateOptions {
  columns: DataTableConfig<unknown>["columns"];
  cardRenderer: DataTableConfig<unknown>["cardRenderer"];
  defaultView?: DataTableView;
}

interface UseViewStateReturn {
  view: DataTableView;
  setView: (view: DataTableView) => void;
  availableViews: DataTableView[];
}

export function useViewState(options: UseViewStateOptions): UseViewStateReturn {
  const { columns = [], cardRenderer, defaultView } = options;

  const availableViews = useMemo<DataTableView[]>(() => {
    if (columns.length > 0 && cardRenderer) {
      return ["table", "card"];
    }
    if (cardRenderer) {
      return ["card"];
    }
    return ["table"];
  }, [columns.length, cardRenderer]);

  // Safe: availableViews always has at least one element
  const resolvedDefault = defaultView ?? (availableViews[0] as DataTableView);
  const [view, setView] = useState<DataTableView>(resolvedDefault);

  return { view, setView, availableViews };
}
