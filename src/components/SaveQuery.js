'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SaveQuery({ 
  isOpen, 
  onClose, 
  onSave, 
  query, 
  mode, 
  url, 
  result,
  className = "" 
}) {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [folder, setFolder] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your saved query');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          query,
          mode,
          url,
          result: result ? result.substring(0, 500) + '...' : null, // Store first 500 chars
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          folder: folder.trim() || null
        }),
      });

      if (response.ok) {
        const { savedQuery } = await response.json();
        onSave(savedQuery);
        onClose();
        setTitle('');
        setTags('');
        setFolder('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save query');
      }
    } catch (error) {
      console.error('Error saving query:', error);
      alert('Failed to save query');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

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
          <h3 className="text-lg font-semibold text-slate-900">Save Query</h3>
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

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a descriptive title..."
            className="w-full px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="research, biology, homework..."
            className="w-full px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Folder (optional)
          </label>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="CS101, History Paper, Research Project..."
            className="w-full px-3 py-2 border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 rounded-lg transition-all duration-200 hover:border-slate-400 text-sm"
          />
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200/60">
          <p className="text-sm text-slate-600 mb-1">
            <strong>Query:</strong> {query}
          </p>
          <p className="text-sm text-slate-600">
            <strong>Mode:</strong> {mode}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-b-lg">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-lg transition-colors text-sm border border-slate-200/60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Query'}
          </button>
        </div>
      </div>
    </div>
  );
} 