import { supabase } from "@/integrations/supabase/client";

type FetchAllParams = {
  table: string;
  select: string;
  /** Defaults to 1000 (common PostgREST max-rows). */
  batchSize?: number;
  /** Optional stable ordering to make offset pagination deterministic. */
  orderColumn?: string;
  /** Safety cap to prevent infinite loops in case of unexpected API behavior. */
  maxPages?: number;
};

/**
 * Fetches all rows from a table even when the API enforces a 1000-row cap per request.
 * Uses offset pagination via `.range(from, to)`.
 */
export async function fetchAllFromSupabase<T = any>({
  table,
  select,
  batchSize = 1000,
  orderColumn,
  maxPages = 200,
}: FetchAllParams): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  for (let page = 0; page < maxPages; page++) {
    // The generated Supabase types enforce literal table names.
    // This helper intentionally works with dynamic table strings.
    let query = (supabase as any).from(table).select(select);
    if (orderColumn) query = query.order(orderColumn, { ascending: true });
    const { data, error } = await query.range(from, from + batchSize - 1);

    if (error) throw error;

    const chunk = (data ?? []) as T[];
    all.push(...chunk);

    if (chunk.length < batchSize) break;
    from += batchSize;
  }

  return all;
}
