import React, { useState } from 'react';
import './WebSearch.css';

export default function WebSearch({ onSearchComplete }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [useWebSearch, setUseWebSearch] = useState(true);

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, useWebSearch })
      });

      const data = await response.json();
      setResult(data);
      onSearchComplete?.(data);
    } catch (error) {
      alert('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="websearch-container">
      <h3>Web Search</h3>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search the web for information..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSearch} disabled={!query || loading} className="search-btn">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="search-options">
        <label>
          <input
            type="checkbox"
            checked={useWebSearch}
            onChange={(e) => setUseWebSearch(e.target.checked)}
          />
          Enable Web Search (requires SerpAPI key)
        </label>
      </div>

      {result && (
        <div className="search-result">
          <h4>AI Response with Web Context:</h4>
          <p className="response">{result.response}</p>
          {result.usedWebSearch && (
            <div className="search-info">Enhanced with live web search results</div>
          )}
          {result.searchResults && (
            <div className="search-sources">
              <h5>Sources:</h5>
              <p>{result.searchResults}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
