/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Clipboard, FileText, Calendar, Sparkles, X, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, QuotationItem } from '../../types';
import { useToast } from '../Toast';
import { exportElementAsImage, exportElementAsPDF } from '../../utils/exportUtils';

interface QuotationProps {
  products: Product[];
}

export const Quotation: React.FC<QuotationProps> = ({ products }) => {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/logo.png');
        if (!response.ok) throw new Error('Response status not OK');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Could not preload logo.png as base64 in Quotation.', err);
      }
    };
    loadLogo();
  }, []);

  // Auto-calculated fields
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Please select a product first.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const finalPrice = typeof customPrice === 'number' ? customPrice : prod.basePrice;

    // Check if already in quotation with same ID and same price
    const existingIdx = items.findIndex(item => item.id === prod.id && item.price === finalPrice);
    if (existingIdx > -1) {
      const updated = items.map((item, idx) => {
        if (idx === existingIdx) {
          const newQty = item.quantity + addQty;
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.price
          };
        }
        return item;
      });
      setItems(updated);
      toast.success(`Incremented quantity for ${prod.name}`);
    } else {
      const newItem: QuotationItem = {
        id: prod.id + (finalPrice !== prod.basePrice ? `-${finalPrice}` : ''),
        name: prod.name,
        quantity: addQty,
        price: finalPrice,
        total: addQty * finalPrice
      };
      setItems([...items, newItem]);
      toast.success(`${prod.name} added to quotation sheet.`);
    }

    // Reset selectors
    setSelectedProductId('');
    setAddQty(1);
    setCustomPrice('');
  };

  const handleRemoveItem = (id: string, name: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success(`${name} removed from quotation list.`);
  };

  const exportQuotationAsImage = async () => {
    const element = document.getElementById('printable-quotation');
    if (!element) {
      toast.error('Quotation container not found.');
      return;
    }
    
    toast.info('Preparing formal quotation layout...');

    try {
      await exportElementAsImage(element, {
        fileName: `JKM_Quotation_${customerName.trim().replace(/\s+/g, '_') || 'Draft'}.png`,
        scale: 3,
        backgroundColor: '#ffffff',
      });

      toast.success('Quotation exported as PNG image!');
    } catch (err) {
      console.error("QUOTATION EXPORT ERROR:", err);
      toast.error('Failed to export quotation as image.');
    }
  };

  const exportQuotationAsPDF = async () => {
    const element = document.getElementById('printable-quotation');
    if (!element) {
      toast.error('Quotation container not found.');
      return;
    }
    
    toast.info('Preparing A5 PDF document...');

    try {
      await exportElementAsPDF(element, {
        fileName: `JKM_A5_Quotation_${customerName.trim().replace(/\s+/g, '_') || 'Draft'}.pdf`,
        pdfWidthMm: 148, // Standard A5 width in mm
        scale: 3,
        backgroundColor: '#ffffff',
      });

      toast.success('Quotation exported as A5 PDF successfully!');
    } catch (err) {
      console.error("QUOTATION PDF EXPORT ERROR:", err);
      toast.error('Failed to export quotation as A5 PDF.');
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Formal Header and input */}
      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Builder Controls (Col Span 5) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                Quotation Builder
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Generate formal digital printing estimates for potential clients.</p>
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="09XXXXXXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Select Product Dropdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Add Catalog Items</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Service / Item</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProductId(id);
                      const prod = products.find(p => p.id === id);
                      if (prod) {
                        setCustomPrice(prod.basePrice);
                      } else {
                        setCustomPrice('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="">-- Choose printing service --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.category} - {p.name} (₱{p.basePrice}/unit)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Unit Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Price"
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-slate-900 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line Item
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {items.length > 0 && customerName.trim() && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View & Export Proposal
                </button>
              </div>
            )}
          </div>

          {/* Draft Item List (Col Span 7) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-900">Quotation Line Items</h3>
                <span className="text-xs font-mono text-slate-500">{items.length} items</span>
              </div>
              
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 mt-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                    <div>
                      <h4 className="font-medium text-xs text-slate-800">{item.name}</h4>
                      <span className="block font-mono text-[11px] text-slate-500 mt-0.5">
                        ₱{item.price.toLocaleString()} × {item.quantity} pcs
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-900">₱{item.total.toLocaleString()}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-16 text-slate-400 font-medium border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center space-y-1.5">
                    <Clipboard className="w-6 h-6 text-slate-300" />
                    <p className="text-xs">No quotation items added yet. Select products on the left.</p>
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-medium text-xs text-slate-900">
                <span className="text-slate-500">Estimated Total:</span>
                <span className="font-mono text-base font-bold text-slate-900">₱{subtotal.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PREVIEW MODE: Beautiful formal printed layout document template */
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Action header bar (Non printed) */}
          <div className="bg-white p-3 rounded-xl flex items-center justify-between border border-slate-200/80 shadow-2xs print:hidden">
            <span className="text-xs text-slate-700 font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Formal Quotation Proposal
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={exportQuotationAsImage}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export PNG
              </button>
              <button
                onClick={exportQuotationAsPDF}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Export PDF (A5)
              </button>
              <button
                onClick={() => setPreviewMode(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Back to Editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Proposal Document Body (Printable) */}
          <div id="printable-quotation" className="bg-white p-8 sm:p-10 rounded-xl border border-slate-200/80 shadow-sm text-slate-900 space-y-6 font-mono text-xs sm:text-sm">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img 
                  src={logoBase64 || "/logo.png"} 
                  alt="JKM Prime Logo" 
                  className="w-10 h-10 object-contain rounded-md shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="text-left space-y-0.5">
                  <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">JKM PRIME DIGITAL PRINTS</h1>
                  <p className="text-[10px] text-slate-500 font-sans">Precision Printing • Premium Quality • Quick Turnaround</p>
                  <p className="text-[9px] text-slate-400 font-sans">GHQ Road, South Signal, Taguig • 09524776545</p>
                </div>
              </div>
              <div className="sm:text-right space-y-0.5 font-bold text-slate-700 shrink-0">
                <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wide">Quotation Proposal</h3>
                <p className="text-[10px] font-normal font-mono text-slate-500">REF: JKM-Q-{Math.floor(10000 + Math.random() * 90000)}</p>
                <p className="text-[10px] font-normal font-mono text-slate-500">DATE: {todayStr}</p>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-1 text-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">CUSTOMER:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {customerName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">CONTACT:</span>
                <span className="font-mono text-slate-800">
                  {contactNumber || 'N/A'}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">Scope of Work & Pricing</span>
              
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                      <td className="p-2.5">{item.quantity} pcs</td>
                      <td className="p-2.5 font-mono">₱{item.price.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-medium text-slate-900">₱{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Total summation */}
            <div className="flex flex-col items-end gap-1 text-slate-600 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between w-full sm:max-w-xs">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono text-slate-900 font-medium">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full sm:max-w-xs">
                <span className="text-slate-500">VAT:</span>
                <span className="font-mono text-slate-500">₱0.00 (Exempt)</span>
              </div>
              <div className="flex justify-between w-full sm:max-w-xs font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Estimate:</span>
                <span className="font-mono text-base">₱{subtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="text-[10px] text-slate-500 leading-relaxed font-sans">
                <p className="font-bold text-slate-700 text-xs font-mono uppercase mb-1">Terms & Conditions:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>A 50% down payment is required to confirm the order.</li>
                  <li>Production will begin upon payment confirmation.</li>
                  <li>Remaining balance must be settled before delivery or pickup.</li>
                </ol>
              </div>

              <div className="pt-4 text-center text-[10px] font-sans">
                <div className="space-y-6 max-w-xs mx-auto">
                  <div className="h-px bg-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium">Prepared by: JKM Prime Digital Prints</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
