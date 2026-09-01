/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, RotateCcw, Edit2, AlertCircle, Eye, EyeOff, Plus, Save, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { Product } from '../../types';
import { useToast } from '../Toast';

interface ProductsCatalogProps {
  products: Product[];
  onProductsChange: (updatedProducts: Product[]) => void;
}

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({ products, onProductsChange }) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'listed' | 'unlisted'>('all');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Photo Printing');
  const [newPrice, setNewPrice] = useState<number>(50);
  const [newDescription, setNewDescription] = useState('');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'listed') matchesStatus = !p.isUnlisted;
    if (statusFilter === 'unlisted') matchesStatus = !!p.isUnlisted;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleListing = (product: Product) => {
    const isUnlisting = !product.isUnlisted;
    const updated = products.map(p => 
      p.id === product.id ? { ...p, isUnlisted: isUnlisting } : p
    );
    onProductsChange(updated);
    if (isUnlisting) {
      toast.info(`Unlisted "${product.name}". Hidden from POS ordering terminal.`);
    } else {
      toast.success(`Listed "${product.name}". Active in POS ordering terminal.`);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.basePrice);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editPrice < 0) {
      toast.error('Price cannot be negative.');
      return;
    }

    const updated = products.map(p => 
      p.id === editingProduct.id ? { ...p, basePrice: editPrice } : p
    );

    onProductsChange(updated);
    toast.success(`Updated price for ${editingProduct.name} to ₱${editPrice}`);
    setEditingProduct(null);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Product name is required.');
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      basePrice: newPrice,
      description: newDescription.trim() || 'Custom JKM product',
      imageUrl: '/logo.png',
      isUnlisted: false
    };

    onProductsChange([...products, newProd]);
    toast.success(`Added "${newProd.name}" to POS product catalog!`);
    setShowAddModal(false);
    setNewName('');
    setNewDescription('');
    setNewPrice(50);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all product prices and listing statuses to default?')) {
      localStorage.removeItem('jkm_products_v2');
      window.location.reload();
    }
  };

  const listedCount = products.filter(p => !p.isUnlisted).length;
  const unlistedCount = products.filter(p => p.isUnlisted).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Panel */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-sky-600 font-extrabold uppercase bg-sky-50 px-2.5 py-0.5 rounded-full">
                POS Product Management
              </span>
            </div>
            <h3 className="font-sans font-black text-lg text-slate-900 tracking-tight">
              POS Product Manager
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Enable or disable products, adjust prices, or add new items. Unlisted products are hidden from POS ordering terminals in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              Add Product
            </button>
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('listed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'listed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Listed / Active ({listedCount})
          </button>
          <button
            onClick={() => setStatusFilter('unlisted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'unlisted'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Unlisted / Disabled ({unlistedCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold text-slate-700"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const isUnlisted = !!product.isUnlisted;
            const isDocOrPhoto = product.category === 'Document Printing' || product.category === 'Photo Printing';
            const onlinePrice = isDocOrPhoto ? product.basePrice : Math.max(0, product.basePrice - 5);
            
            return (
              <div 
                key={product.id} 
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                  isUnlisted 
                    ? 'border-amber-200/80 bg-amber-50/30 opacity-75' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    
                    {/* Status Badge */}
                    {isUnlisted ? (
                      <span className="text-[9px] font-mono font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" />
                        Unlisted
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2 min-h-[32px]">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 min-h-[30px]">
                    {product.description}
                  </p>
                </div>

                <div className="border-t border-slate-100/80 pt-3 mt-3 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">POS:</span>
                      <span className="font-mono text-sm font-black text-slate-800">₱{product.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Online:</span>
                      <span className="font-mono text-xs font-black text-emerald-600">₱{onlinePrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Edit Price"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleListing(product)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                        isUnlisted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isUnlisted ? (
                        <>
                          <Eye className="w-3 h-3" />
                          List
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Unlist
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">No products found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Edit Price Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-500 uppercase">{editingProduct.category}</span>
              <h4 className="font-sans font-black text-sm text-slate-900 uppercase mt-1">Adjust Base Price</h4>
              <p className="text-xs text-slate-500 mt-1">{editingProduct.name}</p>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 mb-1">
                  POS Base Price (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono font-black text-slate-400">₱</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 pl-8 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-sans font-black text-sm text-slate-900 uppercase">Add New POS Product</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Will automatically appear in POS catalog</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sublimation Keychains"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 text-slate-700"
                  >
                    <option value="Photo Printing">Photo Printing</option>
                    <option value="Rush ID Printing">Rush ID Printing</option>
                    <option value="Document Printing">Document Printing</option>
                    <option value="Custom Sublimation">Custom Sublimation</option>
                    <option value="Sintra Board & Frames">Sintra Board & Frames</option>
                    <option value="General Merchandise">General Merchandise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">
                    POS Base Price (₱)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4 text-sky-400" />
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
