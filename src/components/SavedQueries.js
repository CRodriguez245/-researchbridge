'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SavedQueries({ isOpen, onClose, onLoadQuery, className = "" }) {
  const { data: session } = useSession();
  const [savedQueries, setSavedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Early return after all hooks if not open
  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      fetchSavedQueries();
    }
  }, [isOpen]);

  const fetchSavedQueries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saved-queries');
      if (response.ok) {
        const { savedQueries } = await response.json();
        setSavedQueries(savedQueries);
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this saved query?')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-queries/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedQueries(prev => prev.filter(query => query.id !== id));
      } else {
        alert('Failed to delete saved query');
      }
    } catch (error) {
      console.error('Error deleting saved query:', error);
      alert('Failed to delete saved query');
    }
  };

  const handleToggleFavorite = async (id, currentFavorite) => {
    try {
      const response = await fetch(`/api/saved-queries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFavorite: !currentFavorite
        }),
      });

      if (response.ok) {
        setSavedQueries(prev => 
          prev.map(query => 
            query.id === id 
              ? { ...query, isFavorite: !currentFavorite }
              : query
          )
        );
      }
    } catch (error) {
      console.error('Error updating saved query:', error);
    }
  };

  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = filterMode === 'all' || query.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const sortedQueries = filteredQueries.sort((a, b) => {
    // Favorites first, then by updated date
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Saved Queries</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search saved queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modes</option>
            <option value="Summarize">Summarize</option>
            <option value="Ask">Ask</option>
            <option value="Outline">Outline</option>
            <option value="Citations">Citations</option>
          </select>
        </div>

        {/* Queries List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Loading saved queries...</p>
            </div>
          ) : sortedQueries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No saved queries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQueries.map((query) => (
                <div
                  key={query.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    query.isFavorite ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-slate-900">{query.title}</h4>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {query.mode}
                        </span>
                        {query.isFavorite && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {query.query}
                      </p>
                      {query.url && (
                        <p className="text-xs text-slate-500 mb-2">
                          URL: {query.url}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {new Date(query.updatedAt).toLocaleDateString()}
                        </span>
                        {JSON.parse(query.tags).length > 0 && (
                          <span>• Tags: {JSON.parse(query.tags).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleFavorite(query.id, query.isFavorite)}
                        className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                        title={query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {query.isFavorite ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={() => onLoadQuery(query)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(query.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 