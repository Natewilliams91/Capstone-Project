import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SearchPage.css';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ players: [], teams: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ players: [], teams: [] });
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed. Please try again.');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'An error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  }, []); 
  const handleInputChange = useCallback((e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    

    if (newQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(newQuery);
      }, 300);
    } else {
      setResults({ players: [], teams: [] });
      setError(null);
    }
  }, [handleSearch]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      handleSearch(query);
    }
  }, [handleSearch, query]); 

  return (
    <div className="search-page-container">
      <h2 className="search-page-title">Search</h2>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Enter player or team name"
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={error ? 'error' : ''}
          />
          {error && <div className="error-message">{error}</div>}
        </div>
        <button 
          onClick={() => handleSearch(query)}
          disabled={isLoading || !query.trim()}
          className={isLoading ? 'button-loading' : ''}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Only show results section if there's a query */}
      {query.trim() && (
        <div className="search-results">
          {/* Players */}
          {results.players.length > 0 && (
            <div className="results-section">
              <h3>Players</h3>
              <div className="search-results-grid">
                {results.players.map((player) => (
                  <Link 
                    to={`/player/${player._id}`} 
                    key={player._id} 
                    className="result-card player-result"
                  >
                    {player.imgURL && (
                      <div className="image-wrapper">
                        <img src={player.imgURL} alt={player.name} />
                      </div>
                    )}
                    <div className="result-info">
                      <h4>{player.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {results.teams.length > 0 && (
            <div className="results-section">
              <h3>Teams</h3>
              <div className="search-results-grid">
                {results.teams.map((team) => (
                  <Link 
                    to={`/team/${team._id}`} 
                    key={team._id} 
                    className="result-card team-result"
                  >
                    {team.imgURL && (
                      <div className="image-wrapper">
                        <img src={team.imgURL} alt={team.name} />
                      </div>
                    )}
                    <div className="result-info">
                      <h4>{team.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {!isLoading && results.players.length === 0 && results.teams.length === 0 && (
            <div className="no-results">
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
