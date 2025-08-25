"use client";

import { useState, useEffect } from "react";

export default function QueryLibraryPanel({ isOpen, onClose, onLoadQuery }) {
  const [savedQueries, setSavedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [folders, setFolders] = useState([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSavedQueries();
    }
  }, [isOpen]);

  const fetchSavedQueries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/saved-queries");
      if (response.ok) {
        const data = await response.json();
        setSavedQueries(data.queries || []);
        
        // Extract unique folders
        const uniqueFolders = [...new Set(data.queries?.map(q => q.folder).filter(Boolean) || [])];
        setFolders(uniqueFolders);
      }
    } catch (error) {
      console.error("Error fetching saved queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadQuery = (query) => {
    onLoadQuery(query);
    onClose();
  };

  const handleDelete = async (queryId) => {
    if (!confirm("Are you sure you want to delete this query?")) return;
    
    try {
      const response = await fetch(`/api/saved-queries/${queryId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setSavedQueries(prev => prev.filter(q => q.id !== queryId));
      }
    } catch (error) {
      console.error("Error deleting query:", error);
    }
  };

  const handleToggleFavorite = async (queryId, currentFavorite) => {
    try {
      const response = await fetch(`/api/saved-queries/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });
      
      if (response.ok) {
        setSavedQueries(prev => 
          prev.map(q => 
            q.id === queryId ? { ...q, isFavorite: !currentFavorite } : q
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const response = await fetch("/api/saved-queries/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      
      if (response.ok) {
        setFolders(prev => [...prev, newFolderName]);
        setNewFolderName("");
        setShowFolderInput(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === "all" || query.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div 
      className={`fixed bg-white/90 backdrop-blur-sm shadow-lg w-72 z-50 flex flex-col border border-slate-200/60 transform transition-all duration-300 ease-in-out rounded-lg ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
      }`}
      style={{
        right: '1rem',
        top: '200px',
        height: 'calc(100vh - 280px)',
        maxHeight: 'calc(100vh - 280px)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Query Library</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-200/60 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
          >
            <option value="all">All folders</option>
            {folders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowFolderInput(!showFolderInput)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showFolderInput ? "Cancel" : "New Folder"}
          </button>
        </div>

        {showFolderInput && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
            />
            <button
              onClick={handleCreateFolder}
              className="px-3 py-2 bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors rounded-lg border border-slate-200"
            >
              Create
            </button>
          </div>
        )}
      </div>

      {/* Queries List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4 text-slate-500">Loading...</div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No queries found</div>
          ) : (
            filteredQueries.map((query) => (
              <div
                key={query.id}
                className="p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50/50 border border-slate-200/60 hover:border-slate-300/60"
                onClick={() => handleLoadQuery(query)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate">{query.title}</h4>
                    <p className="text-slate-600 text-xs mt-1 line-clamp-2">{query.query}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200/60">
                        {query.mode}
                      </span>
                      {query.folder && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded border border-blue-200/60">
                          {query.folder}
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">
                        {new Date(query.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(query.id, query.isFavorite);
                      }}
                      className={`p-1 rounded transition-colors ${
                        query.isFavorite 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-slate-400 hover:text-yellow-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={query.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(query.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 