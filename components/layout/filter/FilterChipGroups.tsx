'use client';

import type { JSX } from 'react';

import { groupByExtended } from '@/components/layout/filter/filterBottomUtils';
import type { PreferenceOption } from '@/components/layout/header/CategoriesScroller';

/**
 * FilterChipGroups — chip list grouped by `option.group` for the OneEntry `filter` attribute.
 *
 * Renders the section title once at the top, then for each group emits a small uppercase subheader
 * (`option.group`) followed by a row of toggleable chips. When no option declares a group, falls
 * back to a single ungrouped row to stay compatible with flat list attributes.
 *
 * @param   {object}              props           - Component props.
 * @param   {string}              props.title     - Parent section title (e.g. "Categories").
 * @param   {PreferenceOption[]}  props.options   - All chip options.
 * @param   {string[]}            props.selected  - Currently selected `value`s.
 * @param   {(v: string) => void} props.onToggle  - Toggle handler for a chip.
 * @param   {(active: boolean) => string} props.itemClass - Class builder for chip active/idle state.
 * @returns JSX of the grouped chip block.
 */
const FilterChipGroups = ({
  title,
  options,
  selected,
  onToggle,
  itemClass,
}: {
  title: string;
  options: PreferenceOption[];
  selected: string[];
  onToggle: (value: string) => void;
  itemClass: (active: boolean) => string;
}): JSX.Element => {
  const groups = groupByExtended(options);
  return (
    <div className="mt-5.25 flex flex-col gap-3.75">
      <p className="filter_title">{title}</p>
      {groups.map(group => (
        <div key={group.name || '_'} className="flex flex-col gap-1.75">
          {group.name ? (
            <p className="text-xs tracking-wide text-paper/80 uppercase">{group.name}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.75">
            {group.items.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={itemClass(selected.includes(option.value))}
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterChipGroups;
