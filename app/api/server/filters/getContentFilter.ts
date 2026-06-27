import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IContentFilter } from 'oneentry/dist/filters/filtersInterfaces';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api';

/** A flattened, group-tagged option derived from a content-filter tree node. */
export type ContentFilterOption = {
  title: string;
  value: string;
  group?: string;
};

type ContentFilterResult = {
  isError: boolean;
  error?: IError;
  filter?: IContentFilter;
};

const fetchContentFilter = unstable_cache(
  async (marker: string, lang: string): Promise<ContentFilterResult> => {
    try {
      const filter = await getApi().Filters.getFilterByMarker(marker, lang);
      if (isError(filter)) {
        return { isError: true, error: filter as IError };
      }
      return { isError: false, filter };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getContentFilter'],
  // Filter trees change about as rarely as attribute sets — match their 300 s window.
  { revalidate: 300, tags: ['oneentry', 'oneentry-filters'] }
);

/**
 * getContentFilter — a single content filter (items tree) by marker.
 *
 * @param   {string} marker     - Filter marker (e.g. `dishes`).
 * @param   {string} [langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to `{ isError, error?, filter? }` (graceful fallback on SDK error).
 */
export const getContentFilter = cache(
  async (marker: string, langCode?: string): Promise<ContentFilterResult> =>
    fetchContentFilter(marker, langCode || getLang())
);

/**
 * contentFilterToOptions — flattens a content-filter items tree into chip options.
 *
 * @param   {IContentFilter} [filter] - Content filter returned by {@link getContentFilter}.
 * @returns Ordered array of `{ title, value, group? }` options for filter chips.
 */
export const contentFilterToOptions = (filter?: IContentFilter): ContentFilterOption[] => {
  const options: ContentFilterOption[] = [];
  for (const node of filter?.items ?? []) {
    const children = node.children ?? [];
    if (children.length > 0) {
      const group = node.localizeInfos?.title ?? '';
      for (const leaf of children) {
        if (leaf.value == null) continue;
        options.push({
          title: leaf.localizeInfos?.title ?? String(leaf.value),
          value: String(leaf.value),
          ...(group ? { group } : {}),
        });
      }
    } else if (node.type !== 'custom' && node.value != null) {
      options.push({
        title: node.localizeInfos?.title ?? String(node.value),
        value: String(node.value),
      });
    }
  }
  return options;
};
