/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, Award, HardDrive, Cpu, Clipboard, RefreshCw, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialEquipment } from '../../types';
import { useToast } from '../Toast';

interface MaterialsProps {
  materials: MaterialEquipment[];
  onUpdateMaterials: (materials: MaterialEquipment[]) => void;
  userDisplayName: string;
}

export const Materials: React.FC<MaterialsProps> = ({ materials, onUpdateMaterials, userDisplayName }) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Equipment' | 'Material'>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Equipment' | 'Material'>('Equipment');
  const [newQuantity, setNewQuantity] = useState('');
  const [newContributions, setNewContributions] = useState('');
  const [newContributor, setNewContributor] = useState('Mark');
  const [formError, setFormError] = useState('');

  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Compute total capital value contribution
  const totalCapitalValue = materials.reduce((acc, m) => acc + m.contributions, 0);

  // Contributions breakdown by partner
  const contributorSharesMap: { [key: string]: number } = {};
  materials.forEach(m => {
    // some logs have joint names like "Mark & Kaye", split them or credit both
    const splitNames = m.contributor.split('&').map(n => n.trim());
    const splitShareValue = Math.round(m.contributions / splitNames.length);
    splitNames.forEach(name => {
      contributorSharesMap[name] = (contributorSharesMap[name] || 0) + splitShareValue;
    });
  });

  const handleAddNewContribution = () => {
    setNewName('');
    setNewType('Equipment');
    setNewQuantity('');
    setNewContributions('');
    setNewContributor('Mark');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Asset/Equipment name is required!');
      return;
    }
    const val = parseInt(newContributions) || 0;
    if (val < 0) {
      setFormError('Declared value cannot be negative.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    const newAsset: MaterialEquipment = {
      id: `mat-${Date.now()}`,
      date: todayStr,
      name: newName.trim(),
      type: newType,
      quantity: newQuantity.trim() || '1 Unit',
      contributions: val,
      contributor: newContributor
    };

    onUpdateMaterials([newAsset, ...materials]);
    toast.success(`Capital asset logged successfully: ${newAsset.name}`);
    setIsAddModalOpen(false);
  };

  const handleDeleteAsset = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    const updated = materials.filter(m => m.id !== deleteConfirmId);
    onUpdateMaterials(updated);
    toast.success(`${deleteConfirmName} removed.`);
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
  };

  const filtered = materials.filter(m => {
    const matchType = typeFilter === 'All' || m.type === typeFilter;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                        m.contributor.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Capital stats dashboard section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Capital investment */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Total Capital Invested</span>
          <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{totalCapitalValue.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Consolidated equipment & supply</p>
        </div>

        {/* Breakdown partners */}
        {Object.entries(contributorSharesMap).map(([partner, share]) => (
          <div key={partner} className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{partner}'s Share</span>
            <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{share.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Partner contribution ledger</p>
          </div>
        ))}
      </div>

      {/* Control row */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:max-w-xl">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets or partner names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
            />
          </div>

          <div className="flex gap-1 shrink-0">
            {(['All', 'Equipment', 'Material'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === type 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddNewContribution}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Capital Asset
        </button>
      </div>

      {/* Asset log data sheets table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5">Asset ID</th>
                <th className="py-2.5 px-3.5">Equipment / Supply</th>
                <th className="py-2.5 px-3.5">Class</th>
                <th className="py-2.5 px-3.5">Quantity</th>
                <th className="py-2.5 px-3.5">Declared Value</th>
                <th className="py-2.5 px-3.5">Contributor</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs">#{item.id}</td>
                  <td className="py-2.5 px-3.5 text-slate-900 font-medium">{item.name}</td>
                  <td className="py-2.5 px-3.5">
                    {item.type === 'Equipment' ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        Equipment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                        <Cpu className="w-3 h-3 text-slate-500" />
                        Supply
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">{item.quantity}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-900 font-medium">₱{item.contributions.toLocaleString()}</td>
                  <td className="py-2.5 px-3.5 text-slate-700">
                    <span className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                      {item.contributor}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs">{item.date}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => handleDeleteAsset(item.id, item.name)}
                      className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1 rounded border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete asset record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No active capital assets found under current query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN LOG CAPITAL CONTRIBUTION MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-lg border border-slate-200/80 flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-700" />
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Log Capital Contribution</h3>
                    <p className="text-[11px] text-slate-400">Asset & investment ledger</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveContribution} className="p-5 space-y-3.5">
                {formError && (
                  <div className="bg-rose-50 text-rose-700 text-xs px-3 py-2 rounded-md font-medium flex items-center gap-2 border border-rose-200/60">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Asset / Equipment Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Asset / Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Epson L1800 A3 Photo Printer"
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:border-slate-900 text-xs font-medium focus:outline-none transition-colors text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Log Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('Equipment')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        newType === 'Equipment'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Capital Equipment
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('Material')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        newType === 'Material'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Supply Material
                    </button>
                  </div>
                </div>

                {/* Quantity and Asset Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Quantity / Unit
                    </label>
                    <input
                      type="text"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="1 Unit"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:border-slate-900 text-xs font-medium focus:outline-none transition-colors text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Asset Value (₱) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newContributions}
                      onChange={(e) => {
                        setNewContributions(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="15000"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:border-slate-900 text-xs font-mono focus:outline-none transition-colors text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Contributor Partner(s) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contributor Partner
                  </label>
                  <select
                    value={newContributor}
                    onChange={(e) => setNewContributor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:border-slate-900 text-xs font-medium focus:outline-none transition-colors text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    <option value="Mark">Mark</option>
                    <option value="Kaye">Kaye</option>
                    <option value="Jobelle">Jobelle</option>
                    <option value="Mark & Kaye">Mark & Kaye (Joint)</option>
                    <option value="Mark & Jobelle">Mark & Jobelle (Joint)</option>
                    <option value="Kaye & Jobelle">Kaye & Jobelle (Joint)</option>
                    <option value="All Partners">All Partners Joint</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    Record Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-lg border border-slate-200/80 flex flex-col"
            >
              <div className="p-5 space-y-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 text-sm">Remove Capital Asset?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete <span className="text-slate-800 font-medium">"{deleteConfirmName}"</span>? This will adjust the active capital contribution valuations.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 px-5 py-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteConfirmName('');
                  }}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
