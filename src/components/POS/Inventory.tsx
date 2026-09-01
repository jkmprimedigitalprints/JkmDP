/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, RotateCcw, AlertTriangle, CheckCircle, PenTool, Trash2, X, Layers, Package, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../Toast';
import { InventoryItem } from '../../types';

interface InventoryProps {
  items: InventoryItem[];
  onItemsChange: (items: InventoryItem[]) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, onItemsChange }) => {
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // React State controlled modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newStock, setNewStock] = useState<number>(20);
  const [newUnit, setNewUnit] = useState('Pieces');
  const [newThreshold, setNewThreshold] = useState<number>(10);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(0);

  const saveToLocal = (newItems: InventoryItem[]) => {
    onItemsChange(newItems);
  };

  // Modern React Add Modal Handlers
  const handleOpenAddModal = () => {
    setNewName('');
    setNewCategory('');
    setNewStock(20);
    setNewUnit('Pieces');
    setNewThreshold(10);
    setIsAddOpen(true);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCategory.trim()) {
      toast.error('Item Name and Category are required!');
      return;
    }
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim(),
      stock: Number(newStock) || 0,
      unit: newUnit.trim() || 'Pieces',
      minThreshold: Number(newThreshold) || 10
    };
    const updated = [...items, newItem];
    saveToLocal(updated);
    toast.success(`Inventory stock added: ${newItem.name}`);
    setIsAddOpen(false);
  };

  // Quick adjust quantity
  const adjustStock = (id: string, name: string, change: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const nextStock = Math.max(0, item.stock + change);
        if (nextStock < item.minThreshold) {
          toast.warning(`Warning: ${name} is below min threshold level!`);
        }
        return { ...item, stock: nextStock };
      }
      return item;
    });
    saveToLocal(updated);
    toast.success(`Updated stock volume for ${name}`);
  };

  // Modern React Edit Modal Handlers
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditStock(item.stock);
    setEditThreshold(item.minThreshold);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = items.map(i => 
      i.id === editingItem.id 
        ? { ...i, stock: Number(editStock) || 0, minThreshold: Number(editThreshold) || 0 } 
        : i
    );
    saveToLocal(updated);
    toast.success(`Threshold & stock updated for ${editingItem.name}`);
    setEditingItem(null);
  };

  // Delete inventory item
  const handleDeleteItem = (id: string, name: string) => {
    Swal.fire({
      title: 'Delete Inventory Item?',
      text: `Are you sure you want to delete ${name} from stock tracking lists?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = items.filter(i => i.id !== id);
        saveToLocal(updated);
        toast.success(`${name} deleted from inventory list.`);
      }
    });
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filtered = items.filter(item => {
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                        item.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Sub-header controls */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:max-w-xl">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search raw material stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900 w-full sm:w-auto shrink-0"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stock Item
        </button>
      </div>

      {/* Grid of raw stock lists */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5">Stock ID</th>
                <th className="py-2.5 px-3.5">Raw Material Name</th>
                <th className="py-2.5 px-3.5">Category</th>
                <th className="py-2.5 px-3.5">Pricelist & Packaging</th>
                <th className="py-2.5 px-3.5">Available Stock</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isLow = item.stock < item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs">#{item.id}</td>
                    <td className="py-2.5 px-3.5 text-slate-900 font-medium">{item.name}</td>
                    <td className="py-2.5 px-3.5">
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-slate-900 font-medium">
                          {item.price ? `₱${item.price.toLocaleString()}` : '—'}
                        </span>
                        {item.packaging && (
                          <p className="text-[10px] text-slate-400 font-normal">{item.packaging}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-800 font-medium">
                      {item.stock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-medium border border-amber-200/60">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Stock ({item.minThreshold} min)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Healthy ({item.minThreshold} min)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => adjustStock(item.id, item.name, 1)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors"
                          title="Increase stock count by 1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => adjustStock(item.id, item.name, -1)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors"
                          title="Decrease stock count by 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="bg-white hover:bg-slate-50 text-slate-600 p-1 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Modify stock threshold info"
                        >
                          <PenTool className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1 rounded border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No active stock items matching filter constraints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN PORTAL MODALS */}
      <AnimatePresence>
        {/* ADD STOCK MODAL */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200/80 overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700" />
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Add Stock Item</h3>
                    <p className="text-[11px] text-slate-400">Raw materials inventory</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveNewItem} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Glossy Sticker Paper Pack"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Papers, Mugs, Inks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Unit Name</label>
                    <input
                      type="text"
                      required
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="Packs, Pieces"
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Low Stock Threshold Level</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Triggers alert notifications if stock falls below this level.</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-3.5 py-1.5 rounded-md cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT STOCK MODAL */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200/80 overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-slate-700" />
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Update Stock & Threshold</h3>
                    <p className="text-[11px] text-slate-400">Inventory modifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveEditItem} className="p-5 space-y-3.5">
                {/* Product Detail Info Block */}
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">{editingItem.category}</span>
                    <span className="text-[10px] font-mono text-slate-400">#{editingItem.id}</span>
                  </div>
                  <h4 className="font-medium text-xs text-slate-900 leading-snug">{editingItem.name}</h4>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Stock Level ({editingItem.unit})</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">{editingItem.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Minimum Alert Threshold</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Warns if available quantity is below this number.</p>
                </div>

                {/* LIVE PREVIEW STATUS BADGE */}
                <div className="pt-1">
                  {editStock < editThreshold ? (
                    <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-md flex gap-2 items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-amber-900 text-xs font-medium leading-none">Low Stock Warning</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">Stock ({editStock}) is less than minimum limit ({editThreshold}).</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-md flex gap-2 items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-emerald-900 text-xs font-medium leading-none">Healthy Stock Level</p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">Stock ({editStock}) meets the minimum threshold requirement.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-3.5 py-1.5 rounded-md cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
