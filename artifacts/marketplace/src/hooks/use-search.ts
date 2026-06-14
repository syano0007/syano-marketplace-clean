import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { expandSearchQuery, scoreProduct } from "@/lib/search-utils";

export interface SearchProduct {
  id: number;
  sellerId: number;
  sellerName: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number | null;
  finalPrice: number;
  category: string;
  subcategory: string | null;
  stock: number;
  imageUrl: string | null;
  featured: boolean;
  nameAr: string | null;
  createdAt: string;
  score: number;
}

export interface SuggestionProduct {
  id: number;
  name: string;
  nameAr: string | null;
  category: string;
  imageUrl: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number | null;
  score: number;
}

export interface SuggestionStore {
  userId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  categories: string[];
  city: string | null;
}

export interface SuggestionResult {
  products: SuggestionProduct[];
  stores: SuggestionStore[];
  categories: string[];
}

export interface TrendingQuery {
  query: string;
  count: number;
}

async function fetchSearchTerm(term: string, limit: number): Promise<SearchProduct[]> {
  const url = `/api/search?q=${encodeURIComponent(term)}&limit=${limit}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  return res.json() as Promise<SearchProduct[]>;
}

/**
 * Multilingual search hook (for search results page — full product list).
 *
 * Flow:
 *   1. expandSearchQuery(rawQuery) → up to 4 terms (original + AR↔EN synonyms)
 *   2. For each unique term ≥ 2 chars → GET /api/search?q=<term>
 *   3. Results are merged, deduplicated, and re-ranked.
 */
export function useSearch(rawQuery: string, { limit = 8 }: { limit?: number } = {}) {
  const terms = useMemo(
    () => (rawQuery.trim().length >= 2 ? expandSearchQuery(rawQuery) : []),
    [rawQuery],
  );

  const term0 = terms[0] ?? "";
  const term1 = terms[1] ?? "";
  const term2 = terms[2] ?? "";

  const q0 = useQuery({
    queryKey: ["search", term0, limit],
    queryFn: () => fetchSearchTerm(term0, limit),
    enabled: term0.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const q1 = useQuery({
    queryKey: ["search", term1, limit],
    queryFn: () => fetchSearchTerm(term1, limit),
    enabled: term1.length >= 2 && term1 !== term0,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const q2 = useQuery({
    queryKey: ["search", term2, limit],
    queryFn: () => fetchSearchTerm(term2, limit),
    enabled: term2.length >= 2 && term2 !== term0 && term2 !== term1,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const results = useMemo(() => {
    const all = [
      ...(q0.data ?? []),
      ...(q1.data ?? []),
      ...(q2.data ?? []),
    ];
    const seen = new Set<number>();
    return all
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          scoreProduct(b, rawQuery) - scoreProduct(a, rawQuery),
      );
  }, [q0.data, q1.data, q2.data, rawQuery]);

  const hasQuery = rawQuery.trim().length >= 2;

  const isLoading =
    (term0.length >= 2 && q0.isFetching) ||
    (term1.length >= 2 && term1 !== term0 && q1.isFetching) ||
    (term2.length >= 2 && term2 !== term0 && term2 !== term1 && q2.isFetching);

  return { results, isLoading, hasQuery };
}

/**
 * Single-call suggestions hook for the Navbar overlay.
 * Returns { products, stores, categories } from GET /api/search/suggestions.
 */
export function useSearchSuggestions(rawQuery: string) {
  const dq = rawQuery.trim();
  const { data, isFetching } = useQuery<SuggestionResult>({
    queryKey: ["search/suggestions", dq],
    queryFn: async () => {
      if (dq.length < 2) return { products: [], stores: [], categories: [] };
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(dq)}`, {
        credentials: "include",
      });
      if (!res.ok) return { products: [], stores: [], categories: [] };
      return res.json() as Promise<SuggestionResult>;
    },
    enabled: dq.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  return {
    suggestions: data ?? { products: [], stores: [], categories: [] },
    isLoading: isFetching,
    hasQuery: dq.length >= 2,
  };
}

/**
 * Hook to fetch trending / popular search terms.
 */
export function useSearchTrending() {
  const { data } = useQuery<TrendingQuery[]>({
    queryKey: ["search/trending"],
    queryFn: async () => {
      const res = await fetch("/api/search/trending", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<TrendingQuery[]>;
    },
    staleTime: 5 * 60_000,
  });
  return data ?? [];
}
