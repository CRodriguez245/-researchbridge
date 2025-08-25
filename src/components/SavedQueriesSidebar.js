'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SavedQueriesSidebar({ onLoadQuery, className = "" }) {
  const { data: session } = useSession();
  const [savedQueries, setSavedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Early return after all hooks if no session
  if (!session?.user) return null;

  useEffect(() => {
    fetchSavedQueries();
  }, [session]);

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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
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

  const handleToggleFavorite = async (id, currentFavorite, e) => {
    e.stopPropagation();
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

  const handleMoveToFolder = async (id, newFolder) => {
    try {
      const response = await fetch(`/api/saved-queries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: newFolder
        }),
      });

      if (response.ok) {
        setSavedQueries(prev => 
          prev.map(query => 
            query.id === id 
              ? { ...query, folder: newFolder }
              : query
          )
        );
      }
    } catch (error) {
      console.error('Error moving query to folder:', error);
    }
  };

  // Get all unique folders
  const folders = [...new Set(savedQueries.map(query => query.folder).filter(Boolean))].sort();
  
  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = filterMode === 'all' || query.mode === filterMode;
    const matchesFolder = selectedFolder === 'all' || query.folder === selectedFolder;
    
    return matchesSearch && matchesMode && matchesFolder;
  });

  const sortedQueries = filteredQueries.sort((a, b) => {
    // Favorites first, then by updated date
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className={`fixed left-0 top-[160px] h-[calc(100vh-160px)] bg-white border-r border-slate-200 shadow-lg transition-all duration-300 z-40 sidebar-responsive ${
      isCollapsed ? 'w-12' : 'w-80'
    } ${className}`}>
      
      {/* Collapse/Expand Button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        {!isCollapsed && (
          <h3 className="text-lg font-semibold text-slate-900">Saved Queries</h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Search and Filter */}
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Modes</option>
                <option value="Summarize">Summarize</option>
                <option value="Ask">Ask</option>
                <option value="Outline">Outline</option>
                <option value="Citations">Citations</option>
              </select>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>
                    📁 {folder}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Create New Folder */}
            <div className="mt-2">
              <button
                onClick={() => setShowFolderInput(!showFolderInput)}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                {showFolderInput ? 'Cancel' : '+ Create New Folder'}
              </button>
              {showFolderInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        setSelectedFolder(newFolderName.trim());
                        setNewFolderName('');
                        setShowFolderInput(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newFolderName.trim()) {
                        setSelectedFolder(newFolderName.trim());
                        setNewFolderName('');
                        setShowFolderInput(false);
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Queries List */}
          <div className="flex-1 overflow-y-auto h-[calc(100vh-300px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : sortedQueries.length === 0 ? (
              <div className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">No saved queries yet</p>
                <p className="text-xs text-slate-500 mt-1">Save queries to see them here</p>
              </div>
            ) : (
              <div className="p-2">
                {sortedQueries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => onLoadQuery(query)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50 border-l-4 ${
                      query.isFavorite 
                        ? 'border-yellow-400 bg-yellow-50/50' 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 text-sm truncate">
                            {query.title}
                          </h4>
                          {query.isFavorite && (
                            <span className="text-yellow-500 text-xs">⭐</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {query.query}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {query.mode}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(query.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Folder Info */}
                        {query.folder && (
                          <div className="mt-2">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                              📁 {query.folder}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => handleToggleFavorite(query.id, query.isFavorite, e)}
                          className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                          title={query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {query.isFavorite ? '⭐' : '☆'}
                        </button>
                        <select
                          value={query.folder || ''}
                          onChange={(e) => handleMoveToFolder(query.id, e.target.value || null)}
                          className="p-1 text-xs border border-slate-300 rounded bg-white text-slate-600 hover:text-slate-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="Move to folder"
                        >
                          <option value="">📁 No Folder</option>
                          {folders.map(folder => (
                            <option key={folder} value={folder}>
                              📁 {folder}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => handleDelete(query.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </>
      )}

      {/* Collapsed State - Show only icons */}
      {isCollapsed && (
        <div className="p-2">
          <div className="text-center py-4">
            <svg className="w-6 h-6 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          {savedQueries.slice(0, 3).map((query) => (
            <div
              key={query.id}
              onClick={() => onLoadQuery(query)}
              className="p-2 mb-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors group"
              title={query.title}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
            </div>
          ))}
          {savedQueries.length > 3 && (
            <div className="text-center">
              <span className="text-xs text-slate-500">+{savedQueries.length - 3}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 