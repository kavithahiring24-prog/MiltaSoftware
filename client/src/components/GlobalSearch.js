import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../services/auth";

function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          const data = await globalSearch(query);
          setResults(data.results || []);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result) => {
    navigate(result.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
          <span className="search-hint">ESC to close</span>
        </div>
        <div className="search-body">
          {isLoading && <div className="search-message">Searching...</div>}
          {!isLoading && results.length > 0 && (
            <ul className="search-results">
              {results.map((result, idx) => (
                <li key={`${result.type}-${result.id}`} className="search-result-item" onClick={() => handleSelect(result)}>
                  <div className="result-info">
                    <span className="result-type">{result.type}</span>
                    <span className="result-title">{result.title}</span>
                    {result.code && <span className="result-code">{result.code}</span>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && query.length > 1 && results.length === 0 && (
            <div className="search-message">No results found for "{query}"</div>
          )}
          {!isLoading && query.length <= 1 && (
            <div className="search-message">Type at least 2 characters to search...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
