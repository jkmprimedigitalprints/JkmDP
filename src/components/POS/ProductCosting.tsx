/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Calculator, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  BookOpen, 
  Zap, 
  Wrench, 
  Percent, 
  PackageCheck,
  Package2,
  RefreshCw
} from 'lucide-react';
import { db, materialsLibraryCol, productsCol, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Product } from '../../types';
import { useToast } from '../Toast';

// Defining costing Material structure
interface CostingMaterial {
  id: string;
  name: string;
  category: string;
  unit: string; // 'Piece' | 'Sheet' | 'Meter' | 'Roll'
  costPerPiece: number;
  costPerSheet: number;
  costPerMeter: number;
  costPerRoll: number;
  supplier: string;
  notes: string;
}

// Costing Product Formula Structure
interface CostingProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  materialsUsed: {
    materialId: string;
    quantity: number;
    unitUsed: 'piece' | 'sheet' | 'meter' | 'roll';
  }[];
  productionTime: number; // in minutes
  difficulty: 'Easy' | 'Standard' | 'Complex';
  manualSellingPrice?: number; // overriding calculated SRP
  syncedToPOS?: boolean;
}

interface ProductCostingProps {
  products: Product[];
  onProductsChange: (updated: Product[]) => void;
}

export const ProductCosting: React.FC<ProductCostingProps> = ({ products, onProductsChange }) => {
  const { toast } = useToast();

  // Tab mode
  const [costingTab, setCostingTab] = useState<'calculator' | 'library'>('calculator');

  // Firestore lists
  const [libraryMaterials, setLibraryMaterials] = useState<CostingMaterial[]>([]);
  const [costingProducts, setCostingProducts] = useState<CostingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Material Library Modal / Form states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CostingMaterial | null>(null);
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Consumables');
  const [matUnit, setMatUnit] = useState('Piece');
  const [costPiece, setCostPiece] = useState(0);
  const [costSheet, setCostSheet] = useState(0);
  const [costMeter, setCostMeter] = useState(0);
  const [costRoll, setCostRoll] = useState(0);
  const [matSupplier, setMatSupplier] = useState('');
  const [matNotes, setMatNotes] = useState('');

  // Costing Product Modal / Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCostingProduct, setEditingCostingProduct] = useState<CostingProduct | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Customized Products');
  const [prodImage, setProdImage] = useState('/colored.jpg');
  const [prodDesc, setProdDesc] = useState('');
  const [prodTime, setProdTime] = useState(15);
  const [prodDifficulty, setProdDifficulty] = useState<'Easy' | 'Standard' | 'Complex'>('Standard');
  const [prodMaterials, setProdMaterials] = useState<{ materialId: string; quantity: number; unitUsed: 'piece' | 'sheet' | 'meter' | 'roll' }[]>([]);
  const [manualPrice, setManualPrice] = useState<number | ''>('');

  // Delete Confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'material' | 'product';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'material',
    id: '',
    name: '',
  });

  // Dropdown options
  const productPresetImages = [
    { label: 'Photo/Colored', url: '/colored.jpg' },
    { label: 'Rush ID', url: '/idpic.jpg' },
    { label: 'T-Shirt White', url: '/Tshirt1.jpg' },
    { label: 'T-Shirt Dark', url: '/tshirt2.jpg' },
    { label: 'Mug Ceramic', url: '/mug1.jpg' },
    { label: 'Mug Magic', url: '/mug2.jpg' },
    { label: 'Ref Magnet', url: '/magnet1.jpg' },
    { label: 'Tote Bag Raw', url: '/totebag1.jpg' },
    { label: 'Laminate Frame', url: '/laminate.jpg' },
    { label: 'Sintra Board', url: '/sintra1.jpg' },
    { label: 'Notebook Custom', url: '/nb.png' },
  ];

  // REAL-TIME FIRESTORE SYNCHRONIZATION
  useEffect(() => {
    setIsLoading(true);
    // Real-time listener for Costing Materials Library
    const unsubMaterials = onSnapshot(materialsLibraryCol, (snapshot) => {
      const items: CostingMaterial[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CostingMaterial);
      });
      setLibraryMaterials(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'materials_library');
    });

    // Real-time listener for Product Costing formulas
    const costingCol = collection(db, 'costing_formulas');
    const unsubCosting = onSnapshot(costingCol, (snapshot) => {
      const formulas: CostingProduct[] = [];
      snapshot.forEach((doc) => {
        formulas.push({ id: doc.id, ...doc.data() } as CostingProduct);
      });
      setCostingProducts(formulas);
      setIsLoading(false);
    }, (err) => {
      setIsLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'costing_formulas');
    });

    return () => {
      unsubMaterials();
      unsubCosting();
    };
  }, []);

  // INSTANT CALCULATIONS ENGINE FOR DYNAMIC SRP
  const calculateFormulaCosts = (
    materialsUsed: typeof prodMaterials,
    productionTime: number,
    difficulty: 'Easy' | 'Standard' | 'Complex'
  ) => {
    // 1. Material Cost
    let materialCost = 0;
    materialsUsed.forEach((item) => {
      const mat = libraryMaterials.find((m) => m.id === item.materialId);
      if (mat) {
        let unitPrice = 0;
        if (item.unitUsed === 'piece') unitPrice = mat.costPerPiece;
        else if (item.unitUsed === 'sheet') unitPrice = mat.costPerSheet;
        else if (item.unitUsed === 'meter') unitPrice = mat.costPerMeter;
        else if (item.unitUsed === 'roll') unitPrice = mat.costPerRoll;
        materialCost += item.quantity * unitPrice;
      }
    });

    // 2. Labor Cost (Home-based business standard: ₱150/hr base rate)
    const baseLaborRate = 150;
    const basicLabor = (productionTime / 60) * baseLaborRate;
    let laborCost = basicLabor;
    if (difficulty === 'Easy') laborCost = basicLabor * 0.8;
    else if (difficulty === 'Complex') laborCost = basicLabor * 1.5;

    // 3. Electricity Cost
    // Easy difficulty (printer only): ₱8/hr
    // Standard difficulty (printer + press): ₱20/hr
    // Complex difficulty (DTF process/heavy): ₱45/hr
    let electricityRate = 20;
    if (difficulty === 'Easy') electricityRate = 8;
    else if (difficulty === 'Complex') electricityRate = 45;
    const electricityCost = (productionTime / 60) * electricityRate;

    // 4. Maintenance Cost (5% of Material Cost for machine wear & cleaning)
    const maintenanceCost = materialCost * 0.05;

    // 5. Miscellaneous Cost (3% of base material/labor + flat packaging & waste fee)
    let miscFlat = 15;
    if (difficulty === 'Easy') miscFlat = 5;
    else if (difficulty === 'Complex') miscFlat = 35;
    const miscellaneousCost = (materialCost + laborCost) * 0.03 + miscFlat;

    // 6. Recommended Profit
    // Customized high-effort products should yield premium margins
    let profitPercentage = 0.50; // Standard = 50% profit margin
    if (difficulty === 'Easy') profitPercentage = 0.30;
    else if (difficulty === 'Complex') profitPercentage = 0.80;

    const baseCostTotal = materialCost + laborCost + electricityCost + maintenanceCost + miscellaneousCost;
    const recommendedProfit = baseCostTotal * profitPercentage;

    // 7. SRP
    const srp = baseCostTotal + recommendedProfit;

    return {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      electricityCost: Math.round(electricityCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      miscellaneousCost: Math.round(miscellaneousCost * 100) / 100,
      recommendedProfit: Math.round(recommendedProfit * 100) / 100,
      srp: Math.round(srp)
    };
  };

  // Pricing indicator helper
  const getPricingIndicator = (sellingPrice: number, calculatedSRP: number) => {
    if (!sellingPrice || !calculatedSRP) return { label: 'Unknown', color: 'bg-slate-100 text-slate-500' };
    const ratio = sellingPrice / calculatedSRP;

    if (ratio < 0.70) {
      return { label: 'Too Low (Possible Loss)', color: 'bg-rose-50 text-rose-600 border border-rose-200' };
    } else if (ratio < 0.90) {
      return { label: 'Low Profit Margin', color: 'bg-amber-50 text-amber-600 border border-amber-200' };
    } else if (ratio > 1.15) {
      return { label: 'Premium Price', color: 'bg-sky-50 text-sky-600 border border-sky-200' };
    } else {
      return { label: 'Competitive (Healthy Profit)', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
    }
  };

  // Save/Edit costing material in library
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) {
      toast.error('Material name is required');
      return;
    }

    const matId = editingMaterial ? editingMaterial.id : `ml-${Date.now()}`;
    const materialData: CostingMaterial = {
      id: matId,
      name: matName.trim(),
      category: matCategory,
      unit: matUnit,
      costPerPiece: Number(costPiece) || 0,
      costPerSheet: Number(costSheet) || 0,
      costPerMeter: Number(costMeter) || 0,
      costPerRoll: Number(costRoll) || 0,
      supplier: matSupplier.trim(),
      notes: matNotes.trim(),
    };

    try {
      const docRef = doc(db, 'materials_library', matId);
      await setDoc(docRef, materialData);
      toast.success(editingMaterial ? 'Material updated successfully' : 'Material added to library');
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save material to cloud');
    }
  };

  // Open product creator modal
  const handleCreateProductCosting = () => {
    setEditingCostingProduct(null);
    setProdName('');
    setProdCategory('Customized Products');
    setProdImage('/colored.jpg');
    setProdDesc('');
    setProdTime(15);
    setProdDifficulty('Standard');
    setProdMaterials([]);
    setManualPrice('');
    setIsProductModalOpen(true);
  };

  // Edit product costing modal
  const handleEditCostingProduct = (prod: CostingProduct) => {
    setEditingCostingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdImage(prod.imageUrl);
    setProdDesc(prod.description);
    setProdTime(prod.productionTime);
    setProdDifficulty(prod.difficulty);
    setProdMaterials(prod.materialsUsed || []);
    setManualPrice(prod.manualSellingPrice !== undefined ? prod.manualSellingPrice : '');
    setIsProductModalOpen(true);
  };

  // Add material row in product editor
  const handleAddMaterialRow = () => {
    if (libraryMaterials.length === 0) {
      toast.error('Create materials in library first');
      return;
    }
    setProdMaterials(prev => [
      ...prev,
      { materialId: libraryMaterials[0].id, quantity: 1, unitUsed: 'piece' }
    ]);
  };

  // Remove material row
  const handleRemoveMaterialRow = (index: number) => {
    setProdMaterials(prev => prev.filter((_, i) => i !== index));
  };

  // Handle material row field change
  const handleMaterialRowChange = (index: number, field: string, value: any) => {
    setProdMaterials(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        // If materialId changes, auto-assign default logical unit
        if (field === 'materialId') {
          const matched = libraryMaterials.find(m => m.id === value);
          if (matched) {
            updated.unitUsed = matched.unit.toLowerCase() as any;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Save product costing formula to Firestore
  const handleSaveProductCosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error('Product costing name is required');
      return;
    }

    const prodId = editingCostingProduct ? editingCostingProduct.id : `cp-${Date.now()}`;
    const pricingDetails = calculateFormulaCosts(prodMaterials, prodTime, prodDifficulty);

    const costingData: CostingProduct = {
      id: prodId,
      name: prodName.trim(),
      category: prodCategory,
      imageUrl: prodImage,
      description: prodDesc.trim(),
      materialsUsed: prodMaterials,
      productionTime: Number(prodTime) || 0,
      difficulty: prodDifficulty,
      syncedToPOS: editingCostingProduct?.syncedToPOS || false
    };

    if (manualPrice !== '') {
      costingData.manualSellingPrice = Number(manualPrice);
    }

    try {
      const docRef = doc(db, 'costing_formulas', prodId);
      await setDoc(docRef, costingData);

      // If already synced, auto update inside POS catalog instantly!
      if (costingData.syncedToPOS) {
        const finalPrice = costingData.manualSellingPrice !== undefined 
          ? costingData.manualSellingPrice 
          : pricingDetails.srp;

        const posRef = doc(db, 'products', prodId);
        await setDoc(posRef, {
          id: prodId,
          name: costingData.name,
          category: costingData.category,
          imageUrl: costingData.imageUrl,
          description: costingData.description,
          basePrice: finalPrice,
          isCostedProduct: true // Flag to distinguish
        }, { merge: true });
        toast.success('Costing model and POS Catalog synchronized successfully!');
      } else {
        toast.success('Product costing formula saved');
      }

      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save costing formula');
    }
  };

  // ADD TO POS CATALOG / FORCE RE-SYNC
  const handlePushToPOS = async (prod: CostingProduct) => {
    const pricing = calculateFormulaCosts(prod.materialsUsed, prod.productionTime, prod.difficulty);
    const finalPrice = prod.manualSellingPrice !== undefined ? prod.manualSellingPrice : pricing.srp;

    toast.info('Synchronizing with POS terminal...');

    try {
      // 1. Create/Update in products collection
      const posRef = doc(db, 'products', prod.id);
      await setDoc(posRef, {
        id: prod.id,
        name: prod.name,
        category: prod.category,
        imageUrl: prod.imageUrl,
        description: prod.description,
        basePrice: finalPrice,
        isCostedProduct: true
      }, { merge: true });

      // 2. Update formula sync flag
      const formRef = doc(db, 'costing_formulas', prod.id);
      await setDoc(formRef, { syncedToPOS: true }, { merge: true });

      toast.success(`Successfully published "${prod.name}" to POS Catalog at ₱${finalPrice.toLocaleString()} SRP!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish to POS terminal');
    }
  };

  // Delete Material from library
  const handleDeleteMaterial = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'material',
      id,
      name,
    });
  };

  // Delete product costing formula
  const handleDeleteCostingProduct = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'product',
      id,
      name,
    });
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-sky-500" />
            Product Costing & SRP System
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Compute smart, highly profitable, and competitive selling prices for printing goods live.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setCostingTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              costingTab === 'calculator'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Price Costing Engine
          </button>
          <button
            onClick={() => setCostingTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              costingTab === 'library'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Materials Library ({libraryMaterials.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-150 p-12 rounded-3xl text-center shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
          <span className="text-xs font-bold text-slate-400">Loading Costing Data Streams from Firebase...</span>
        </div>
      ) : (
        <>
          {/* CALCULATOR / FORMULAS TAB */}
          {costingTab === 'calculator' && (
            <div className="space-y-6">
              {/* Quick actions bar */}
              <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                  Saved Custom Costing Models ({costingProducts.length})
                </span>
                <button
                  onClick={handleCreateProductCosting}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  New Product Costing
                </button>
              </div>

              {/* Saved costings list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {costingProducts.map((prod) => {
                  const pricing = calculateFormulaCosts(prod.materialsUsed || [], prod.productionTime, prod.difficulty);
                  const activePrice = prod.manualSellingPrice !== undefined ? prod.manualSellingPrice : pricing.srp;
                  const indicator = getPricingIndicator(activePrice, pricing.srp);

                  return (
                    <motion.div
                      key={prod.id}
                      layout
                      className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Top banner */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
                      
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.name} 
                            className="w-14 h-14 object-cover rounded-2xl shadow-inner border border-slate-100 shrink-0" 
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-sky-600 uppercase font-mono bg-sky-50/70 border border-sky-100/50 px-2 py-0.5 rounded-md">
                              {prod.category}
                            </span>
                            <h3 className="font-sans font-extrabold text-sm text-slate-900 mt-1 truncate leading-tight">
                              {prod.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-semibold line-clamp-1 mt-0.5">
                              {prod.description || 'No custom description'}
                            </p>
                          </div>
                        </div>

                        {/* Cost breakdown overview card */}
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2 text-xs font-semibold text-slate-600">
                          <div className="flex justify-between">
                            <span>Materials Cost:</span>
                            <span className="font-mono text-slate-900">₱{pricing.materialCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operating Cost:</span>
                            <span className="font-mono text-slate-900">
                              ₱{(pricing.laborCost + pricing.electricityCost + pricing.maintenanceCost + pricing.miscellaneousCost).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 font-bold">
                            <span className="text-slate-800">Calculated SRP:</span>
                            <span className="font-mono text-indigo-600 text-sm">₱{pricing.srp.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Selling pricing panel */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono uppercase block leading-none">Active Price</span>
                            <span className="text-xl font-black font-mono text-slate-900 block mt-1">
                              ₱{activePrice.toLocaleString()}
                              {prod.manualSellingPrice !== undefined && (
                                <span className="text-[10px] text-amber-500 font-bold ml-1 uppercase">(Edited)</span>
                              )}
                            </span>
                          </div>

                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${indicator.color}`}>
                            {indicator.label}
                          </span>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditCostingProduct(prod)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 p-2 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Edit formula parameters"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCostingProduct(prod.id, prod.name)}
                            className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 p-2 border border-rose-100 hover:border-rose-300 rounded-xl transition-all cursor-pointer"
                            title="Delete costing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handlePushToPOS(prod)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            prod.syncedToPOS 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white border-transparent shadow-xs'
                          }`}
                        >
                          <PackageCheck className="w-4 h-4" />
                          {prod.syncedToPOS ? 'Sync to POS' : 'Add to POS'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {costingProducts.length === 0 && (
                  <div className="col-span-full bg-white border border-slate-100 p-12 rounded-3xl text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                    <Package2 className="w-12 h-12 text-slate-200" />
                    <span>No active costing models calculated yet.</span>
                    <button
                      onClick={handleCreateProductCosting}
                      className="mt-2 text-sky-500 hover:underline text-xs"
                    >
                      Click here to model your first product costing formula.
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MATERIALS LIBRARY TAB */}
          {costingTab === 'library' && (
            <div className="space-y-6">
              {/* Actions Header */}
              <div className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                  Standard Pricing Cost Library ({libraryMaterials.length} materials)
                </span>
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setMatName('');
                    setMatCategory('Consumables');
                    setMatUnit('Piece');
                    setCostPiece(0);
                    setCostSheet(0);
                    setCostMeter(0);
                    setCostRoll(0);
                    setMatSupplier('');
                    setMatNotes('');
                    setIsMaterialModalOpen(true);
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Costing Material
                </button>
              </div>

              {/* Materials Table card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-4 sm:p-5">Material Name</th>
                        <th className="p-4 sm:p-5">Class Group</th>
                        <th className="p-4 sm:p-5">Base Unit</th>
                        <th className="p-4 sm:p-5">Cost per Piece</th>
                        <th className="p-4 sm:p-5">Cost per Sheet</th>
                        <th className="p-4 sm:p-5">Cost per Meter/Roll</th>
                        <th className="p-4 sm:p-5">Supplier Brand</th>
                        <th className="p-4 sm:p-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {libraryMaterials.map((mat) => (
                        <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 sm:p-5 font-bold text-slate-900">{mat.name}</td>
                          <td className="p-4 sm:p-5">
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 font-bold uppercase">
                              {mat.category}
                            </span>
                          </td>
                          <td className="p-4 sm:p-5 text-slate-500 font-mono text-xs">{mat.unit}</td>
                          <td className="p-4 sm:p-5 font-mono">
                            {mat.costPerPiece > 0 ? `₱${mat.costPerPiece.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-4 sm:p-5 font-mono">
                            {mat.costPerSheet > 0 ? `₱${mat.costPerSheet.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-4 sm:p-5 font-mono">
                            {mat.costPerMeter > 0 && `₱${mat.costPerMeter.toLocaleString()} /m`}
                            {mat.costPerRoll > 0 && ` ₱${mat.costPerRoll.toLocaleString()} /roll`}
                            {mat.costPerMeter === 0 && mat.costPerRoll === 0 && '—'}
                          </td>
                          <td className="p-4 sm:p-5 text-slate-500 text-xs">{mat.supplier || 'Unspecified'}</td>
                          <td className="p-4 sm:p-5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingMaterial(mat);
                                  setMatName(mat.name);
                                  setMatCategory(mat.category);
                                  setMatUnit(mat.unit);
                                  setCostPiece(mat.costPerPiece);
                                  setCostSheet(mat.costPerSheet);
                                  setCostMeter(mat.costPerMeter);
                                  setCostRoll(mat.costPerRoll);
                                  setMatSupplier(mat.supplier);
                                  setMatNotes(mat.notes);
                                  setIsMaterialModalOpen(true);
                                }}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 border border-slate-200 rounded-lg cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat.id, mat.name)}
                                className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 p-1.5 border border-rose-100 hover:border-rose-300 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {libraryMaterials.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">
                            No materials inside the costing library yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 1. MATERIAL LIBRARY MODAL */}
      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                  {editingMaterial ? 'Edit Library Material' : 'Add New Library Material'}
                </span>
                <button
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase font-mono">Material Name</label>
                  <input
                    type="text"
                    required
                    value={matName}
                    onChange={(e) => setMatName(e.target.value)}
                    placeholder="e.g., Premium Cotton Shirt Blank"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase font-mono">Category</label>
                    <select
                      value={matCategory}
                      onChange={(e) => setMatCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                    >
                      <option value="Consumables">Consumables</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Mugs">Mugs</option>
                      <option value="Tumblers">Tumblers</option>
                      <option value="Inks">Inks</option>
                      <option value="Papers">Papers</option>
                      <option value="Boards">Boards</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase font-mono">Base Billing Unit</label>
                    <select
                      value={matUnit}
                      onChange={(e) => setMatUnit(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                    >
                      <option value="Piece">Piece</option>
                      <option value="Sheet">Sheet</option>
                      <option value="Meter">Meter</option>
                      <option value="Roll">Roll</option>
                    </select>
                  </div>
                </div>

                {/* Costs details based on standard pricing */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Material Costs breakdown</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Cost/Piece (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={costPiece}
                        onChange={(e) => setCostPiece(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Cost/Sheet (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={costSheet}
                        onChange={(e) => setCostSheet(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Cost/Meter (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={costMeter}
                        onChange={(e) => setCostMeter(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Cost/Roll (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={costRoll}
                        onChange={(e) => setCostRoll(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase font-mono">Supplier</label>
                  <input
                    type="text"
                    value={matSupplier}
                    onChange={(e) => setMatSupplier(e.target.value)}
                    placeholder="Supplier details"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase font-mono">Notes</label>
                  <textarea
                    value={matNotes}
                    onChange={(e) => setMatNotes(e.target.value)}
                    placeholder="Supply dimensions, quality notes, etc."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500 bg-slate-50"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(false)}
                    className="px-4 py-2 text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save Material
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. PRODUCT COSTING / DYNAMIC SRP ENGINE MODAL */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-sky-500" />
                  {editingCostingProduct ? `Model Costing: ${editingCostingProduct.name}` : 'New Custom Product Costing Formula'}
                </span>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProductCosting} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                  {/* Left side: Product parameters */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase font-mono">Product Name</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g., Customized Sublimation White Mug"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase font-mono">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                      >
                        <option value="Photo Printing">Photo Printing</option>
                        <option value="Rush ID Printing">Rush ID Printing</option>
                        <option value="Document Printing">Document Printing</option>
                        <option value="Customized T-Shirt">Customized T-Shirt</option>
                        <option value="Customized Mug">Customized Mug</option>
                        <option value="Customized Jacket">Customized Jacket</option>
                        <option value="Customized Tumbler">Customized Tumbler</option>
                        <option value="Customized Ref Magnets">Customized Ref Magnets</option>
                        <option value="Customized Tote Bag - Flat">Customized Tote Bag - Flat</option>
                        <option value="Customized Tote Bag - With Base">Customized Tote Bag - With Base</option>
                        <option value="Customized Wallet">Customized Wallet</option>
                        <option value="Customized Badge">Customized Badge</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase font-mono">Catalog Preset Image</label>
                      <select
                        value={prodImage}
                        onChange={(e) => setProdImage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                      >
                        {productPresetImages.map((img) => (
                          <option key={img.url} value={img.url}>{img.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase font-mono">Product Description</label>
                    <textarea
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="High-gloss 11oz white mug, customized print..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500 bg-slate-50"
                    />
                  </div>

                  {/* Materials list builder */}
                  <div className="space-y-3.5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase font-mono flex items-center gap-1">
                        <Cpu className="w-4 h-4 text-sky-500" />
                        Materials Used in Production
                      </span>
                      <button
                        type="button"
                        onClick={handleAddMaterialRow}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Material
                      </button>
                    </div>

                    <div className="space-y-2">
                      {prodMaterials.map((item, index) => {
                        const activeMat = libraryMaterials.find(m => m.id === item.materialId);
                        return (
                          <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                            {/* Material selection */}
                            <select
                              value={item.materialId}
                              onChange={(e) => handleMaterialRowChange(index, 'materialId', e.target.value)}
                              className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-xs font-semibold focus:outline-none"
                            >
                              {libraryMaterials.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>

                            {/* Qty */}
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleMaterialRowChange(index, 'quantity', Number(e.target.value))}
                              placeholder="Qty"
                              className="w-16 bg-white border border-slate-200 p-2 rounded-lg text-xs font-mono font-bold text-center focus:outline-none"
                            />

                            {/* Unit selector */}
                            <select
                              value={item.unitUsed}
                              onChange={(e) => handleMaterialRowChange(index, 'unitUsed', e.target.value)}
                              className="bg-white border border-slate-200 p-2 rounded-lg text-xs font-semibold focus:outline-none"
                            >
                              <option value="piece">Piece</option>
                              <option value="sheet">Sheet</option>
                              <option value="meter">Meter</option>
                              <option value="roll">Roll</option>
                            </select>

                            {/* Delete row */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialRow(index)}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}

                      {prodMaterials.length === 0 && (
                        <p className="text-center py-4 text-xs font-semibold text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                          No materials linked. Click "Add Material" to list supplies consumed.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Production params */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase font-mono">Est. Production Time (Min)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={prodTime}
                        onChange={(e) => setProdTime(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase font-mono">Product Difficulty</label>
                      <select
                        value={prodDifficulty}
                        onChange={(e) => setProdDifficulty(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500 bg-slate-50"
                      >
                        <option value="Easy">Easy (Stickers / Photo Prints)</option>
                        <option value="Standard">Standard (Mugs / T-Shirts)</option>
                        <option value="Complex">Complex (Bulk / Sintra Board)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right side: Calculations panel */}
                <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-inner">
                  {/* Detailed calculated costs list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono flex items-center gap-1 border-b border-slate-800 pb-2.5">
                      <Zap className="w-4 h-4 text-sky-400 animate-pulse" />
                      Dynamic Cost Breakdown
                    </h4>

                    {(() => {
                      const computed = calculateFormulaCosts(prodMaterials, prodTime, prodDifficulty);
                      const activePrice = manualPrice !== '' ? Number(manualPrice) : computed.srp;
                      const indicator = getPricingIndicator(activePrice, computed.srp);

                      return (
                        <div className="space-y-3.5 text-xs text-slate-300 font-semibold">
                          <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-slate-500" />
                              Material Cost:
                            </span>
                            <span className="font-mono text-white text-sm">₱{computed.materialCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-slate-500" />
                              Labor Cost (Est):
                            </span>
                            <span className="font-mono text-white text-sm">₱{computed.laborCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-slate-500" />
                              Electricity Estimate:
                            </span>
                            <span className="font-mono text-white text-sm">₱{computed.electricityCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-slate-500" />
                              Machine Maintenance:
                            </span>
                            <span className="font-mono text-white text-sm">₱{computed.maintenanceCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                              <Package2 className="w-3.5 h-3.5 text-slate-500" />
                              Consumables & Misc:
                            </span>
                            <span className="font-mono text-white text-sm">₱{computed.miscellaneousCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between border-t border-slate-800 pt-3">
                            <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                              <Percent className="w-3.5 h-3.5" />
                              Smart Profit Rec:
                            </span>
                            <span className="font-mono text-sky-400 font-bold text-sm">₱{computed.recommendedProfit.toLocaleString()}</span>
                          </div>

                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Calculated SRP:</span>
                              <span className="font-mono text-emerald-400 font-black text-lg">₱{computed.srp.toLocaleString()}</span>
                            </div>

                            {/* Manual selling price override */}
                            <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-3">
                              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Custom Price:</span>
                              <div className="relative max-w-[110px]">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₱</span>
                                <input
                                  type="number"
                                  value={manualPrice}
                                  onChange={(e) => setManualPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                                  placeholder={computed.srp.toString()}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-xs text-right font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Pricing Indicator */}
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Pricing Indicator</span>
                            <div className={`p-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-wider ${indicator.color}`}>
                              {indicator.label}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                    >
                      <Save className="w-4 h-4" />
                      Save Formula Model
                    </button>
                  </div>
                </div>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm Deletion</h3>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {deleteConfirm.type === 'product'
                  ? `Are you sure you want to delete the costing formula for "${deleteConfirm.name}"? This will also remove the product from POS if synced.`
                  : `Are you sure you want to remove "${deleteConfirm.name}" from the costing library?`}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { id, type, name } = deleteConfirm;
                    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                    try {
                      if (type === 'product') {
                        await deleteDoc(doc(db, 'costing_formulas', id));
                        await deleteDoc(doc(db, 'products', id));
                        toast.success(`Costing formula "${name}" deleted`);
                      } else {
                        await deleteDoc(doc(db, 'materials_library', id));
                        toast.success(`Material "${name}" deleted`);
                      }
                    } catch (err) {
                      toast.error(`Failed to delete ${type}`);
                    }
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
