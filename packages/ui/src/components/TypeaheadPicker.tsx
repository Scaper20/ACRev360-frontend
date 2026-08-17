import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import './TypeaheadPicker.css';

export interface TypeaheadPickerProps<T> {
  placeholder: string;
  search: (query: string) => Promise<T[]>;
  renderHit: (item: T) => ReactNode;
  renderRef: (item: T) => ReactNode;
  onPick: (item: T) => void;
  minChars?: number;
  debounceMs?: number;
}

/** A live-filtering "pick an existing record" input — the pattern every
 * reference-by-ID field in this app should use instead of a raw ID box
 * (see V2_FRONTEND.md §7). Debounced, with a staleness guard so a slow
 * response for an old keystroke never overwrites a newer one — this is
 * exactly the bug class the original vanilla app's hand-rolled version of
 * this hit once (a `box.value !== q` check that compared a string against
 * `undefined`); useState-driven React re-renders make that class of bug
 * structurally harder to reintroduce, but the debounce+guard logic still
 * needs to be deliberate. */
export function TypeaheadPicker<T>({
  placeholder,
  search,
  renderHit,
  renderRef,
  onPick,
  minChars = 2,
  debounceMs = 200,
}: TypeaheadPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[] | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (query.trim().length < minChars) {
      setResults(null);
      setOpen(false);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const hits = await search(query.trim());
      if (id !== requestId.current) return; // a newer keystroke already won
      setResults(hits);
      setOpen(true);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, minChars, debounceMs, search]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClickAway);
    return () => document.removeEventListener('click', onClickAway);
  }, []);

  return (
    <div className="typeahead" ref={containerRef}>
      <input
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results != null && setOpen(true)}
      />
      {open && (
        <div className="search-results on">
          {results == null || results.length === 0 ? (
            <div className="search-empty">No matches for &ldquo;{query}&rdquo;</div>
          ) : (
            results.slice(0, 8).map((item, i) => (
              <button
                type="button"
                key={i}
                className="search-hit"
                onClick={() => {
                  onPick(item);
                  setOpen(false);
                }}
              >
                <span>{renderHit(item)}</span>
                <span className="hit-ref">{renderRef(item)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
