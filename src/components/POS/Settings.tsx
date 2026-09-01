/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Film, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, RefreshCw, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { db, landingPageReelsCol, handleFirestoreError, OperationType } from '../../lib/firebase';
import { onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { DEFAULT_REELS } from '../../utils/data';
import { useToast } from '../Toast';

interface ReelItem {
  id: string;
  title: string;
  facebookUrl: string;
  order: number;
}

interface SettingsProps {
  userDisplayName: string;
  userRole: string;
}

export const Settings: React.FC<SettingsProps> = ({ userDisplayName, userRole }) => {
  const { toast } = useToast();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Subscribe to real-time Reels from Firestore
  useEffect(() => {
    setIsLoading(true);

    // Initial local storage hydration
    const saved = localStorage.getItem('jkm_reels_list');
    if (saved) {
      try {
        setReels(JSON.parse(saved));
      } catch (e) {
        // use default
      }
    }

    const unsub = onSnapshot(landingPageReelsCol, (snapshot) => {
      const items: ReelItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || 'JKM Prime Reel',
          facebookUrl: data.facebookUrl || `https://www.facebook.com/reel/${docSnap.id}`,
          order: data.order ?? 0
        });
      });
      if (items.length > 0) {
        items.sort((a, b) => a.order - b.order);
        setReels(items);
        localStorage.setItem('jkm_reels_list', JSON.stringify(items));
      }
      setIsLoading(false);
    }, (err) => {
      console.warn('Firestore reels subscription notice:', err);
      const cached = localStorage.getItem('jkm_reels_list');
      if (cached) {
        try {
          setReels(JSON.parse(cached));
        } catch (e) {
          setReels(DEFAULT_REELS.map((r, idx) => ({ ...r, order: idx })));
        }
      } else {
        setReels(DEFAULT_REELS.map((r, idx) => ({ ...r, order: idx })));
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const parseReelId = (url: string): string => {
    const match = url.match(/(?:\/reel\/|\/videos\/|\/watch\/\?v=)(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: sanitized string or random ID
    const clean = url.replace(/[^a-zA-Z0-9]/g, '');
    return clean ? clean.slice(-15) : `reel-${Date.now()}`;
  };

  // Save reels helper (updates both Firestore and localStorage)
  const saveReelsLocallyAndCloud = async (updatedList: ReelItem[], successMsg: string) => {
    // Always update local state & localStorage immediately
    setReels(updatedList);
    localStorage.setItem('jkm_reels_list', JSON.stringify(updatedList));

    // Also attempt Firestore update
    try {
      const batch = writeBatch(db);
      updatedList.forEach((item, idx) => {
        const ref = doc(db, 'landing_page_reels', item.id);
        batch.set(ref, {
          id: item.id,
          title: item.title,
          facebookUrl: item.facebookUrl,
          order: idx
        });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore sync note:', err);
    }

    toast.success(successMsg);
  };

  const handleAddSingleReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      toast.error('Please enter a valid Facebook Reel URL.');
      return;
    }

    const reelId = parseReelId(newUrl.trim());
    const title = newTitle.trim() || `JKM Reel ${reelId}`;

    const newReelDoc: ReelItem = {
      id: reelId,
      title,
      facebookUrl: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
      order: 0
    };

    // Prepend newest reel at the beginning so it's always first
    const updated = [newReelDoc, ...reels.filter(r => r.id !== reelId)].map((r, idx) => ({ ...r, order: idx }));
    await saveReelsLocallyAndCloud(updated, 'Facebook Reel added successfully!');
    setNewUrl('');
    setNewTitle('');
  };

  const handleAddBulkReels = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      toast.error('Please enter at least one Facebook Reel URL.');
      return;
    }

    const newItems: ReelItem[] = lines.map((line, idx) => {
      const reelId = parseReelId(line);
      const fullUrl = line.startsWith('http') ? line : `https://${line}`;
      return {
        id: reelId,
        title: `Featured Reel (${reelId.slice(-6)})`,
        facebookUrl: fullUrl,
        order: idx
      };
    });

    const newIds = new Set(newItems.map(i => i.id));
    const filteredExisting = reels.filter(r => !newIds.has(r.id));

    // Prepend newest bulk reels to the front
    const updated = [...newItems, ...filteredExisting].map((r, idx) => ({ ...r, order: idx }));
    await saveReelsLocallyAndCloud(updated, `${lines.length} Facebook Reels added successfully!`);
    setBulkUrls('');
    setIsBulkMode(false);
  };

  const handleDeleteReel = async (id: string, title: string) => {
    const updated = reels.filter(r => r.id !== id).map((r, idx) => ({ ...r, order: idx }));
    
    try {
      await deleteDoc(doc(db, 'landing_page_reels', id));
    } catch (err) {
      console.warn('Firestore delete note:', err);
    }

    await saveReelsLocallyAndCloud(updated, `Removed "${title}" from Landing Page.`);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reels.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...reels];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    await saveReelsLocallyAndCloud(reordered, 'Reels order rearranged!');
  };

  const handleRestoreDefaultReels = async () => {
    const defaultsWithOrder: ReelItem[] = DEFAULT_REELS.map((r, idx) => ({ ...r, order: idx }));
    await saveReelsLocallyAndCloud(defaultsWithOrder, 'Restored default Facebook Reels!');
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Landing Page Reels Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, remove, or rearrange Facebook Reels featured on the storefront landing page.
          </p>
        </div>
        
        <button
          onClick={handleRestoreDefaultReels}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Restore Defaults
        </button>
      </div>

      {/* Add New Reels Form Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-slate-700" />
            Add Reels
          </h3>
          <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200/60">
            <button
              onClick={() => setIsBulkMode(false)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                !isBulkMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Link
            </button>
            <button
              onClick={() => setIsBulkMode(true)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                isBulkMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulk Add
            </button>
          </div>
        </div>

        {!isBulkMode ? (
          <form onSubmit={handleAddSingleReel} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Facebook Reel URL *
              </label>

              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="https://www.facebook.com/reel/1499561185538757"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-md text-xs focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Display Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Premium Mug Printing Showcase"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-xs focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Reel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddBulkReels} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste Multiple Facebook Reel Links (One URL per line)
              </label>
              <textarea
                rows={3}
                required
                placeholder={`https://www.facebook.com/reel/1499561185538757\nhttps://www.facebook.com/reel/1741909163830480`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md text-xs font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add All Reels
            </button>
          </form>
        )}
      </div>

      {/* Active Reels List & Rearrange Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider font-mono">
              Active Storefront Reels ({reels.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Reels appear in order from top to bottom
          </p>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs font-mono text-slate-400">
            Loading configuration...
          </div>
        ) : reels.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Film className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-600">No Facebook Reels added.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Add a link above or click "Restore Defaults".</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reels.map((reel, index) => (
              <div
                key={reel.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-xs text-slate-900 truncate">
                      {reel.title}
                    </h4>
                    <a
                      href={reel.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 truncate mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{reel.facebookUrl}</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      index === 0
                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === reels.length - 1}
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      index === reels.length - 1
                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleDeleteReel(reel.id, reel.title)}
                    className="p-1 rounded border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
