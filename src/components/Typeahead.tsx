import { useEffect, useRef, useState } from "react";

interface TypeaheadProps<T> {
  placeholder: string;
  search: (query: string) => Promise<T[]>;
  renderOption: (item: T) => string;
  onSelect: (item: T) => void;
  selectedLabel?: string;
}

// Live search, not a raw-ID box — APP_FLOW.md §6b: anywhere a flow needs an
// existing record, type a name/ref/phone and pick from matches.
export function Typeahead<T>({ placeholder, search, renderOption, onSelect, selectedLabel }: TypeaheadProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `search` is typically an inline function at the call site, so it's a new
  // reference every render — read it via a ref so the effect below only
  // re-runs when `query` actually changes, not on every parent re-render.
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const found = await searchRef.current(query);
      setResults(found);
      setOpen(true);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="typeahead">
      <input
        type="search"
        placeholder={selectedLabel ?? placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="typeahead-results">
          {results.map((item, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                // Select on mousedown, not click: mousedown is what blurs the
                // input (closing this dropdown via onBlur) before a click
                // would ever fire, so acting here — with preventDefault to
                // stop that blur in the first place — is what actually wins
                // the race in every browser, not just delays it.
                e.preventDefault();
                onSelect(item);
                setQuery("");
                setOpen(false);
              }}
            >
              {renderOption(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
