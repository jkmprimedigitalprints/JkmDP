/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Tag, Receipt, Sparkles, X } from 'lucide-react';
import { Product, CartItem, Order, PaymentType, PaymentMethod } from '../../types';
import { useToast } from '../Toast';

interface OrderingProps {
  products: Product[];
  orders: Order[];
  onOrderCreated: (order: Order) => Promise<void> | void;
  userDisplayName: string;
}

export const Ordering: React.FC<OrderingProps> = ({ products, orders, onOrderCreated, userDisplayName }) => {
  const { toast } = useToast();
  
  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Product Dimension Configurator Modal State (if any products have dimensions)
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const [customWidth, setCustomWidth] = useState<number>(3);
  const [customHeight, setCustomHeight] = useState<number>(2);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Cart State
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
  // Checkout Payment State
  const [paymentType, setPaymentType] = useState<PaymentType>('Full Payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [downPaymentInput, setDownPaymentInput] = useState<string>('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Auto Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount);
  
  // Down Payment limits (Min 50%)
  const calculatedMinDP = Math.round(cartGrandTotal / 2);
  const actualDP = paymentType === 'Down Payment' ? (parseFloat(downPaymentInput) || 0) : cartGrandTotal;
  const remainingBalance = Math.max(0, cartGrandTotal - actualDP);
  
  // Change logic
  const amountDue = paymentType === 'Down Payment' ? actualDP : cartGrandTotal;
  const amountPaidVal = parseFloat(amountPaidInput) || 0;
  const computedChange = paymentMethod === 'Cash' ? Math.max(0, amountPaidVal - amountDue) : 0;

  // Sync inputs
  useEffect(() => {
    if (paymentType === 'Down Payment') {
      setDownPaymentInput(calculatedMinDP.toString());
    } else {
      setDownPaymentInput('');
    }
  }, [paymentType, cartGrandTotal, calculatedMinDP]);

  useEffect(() => {
    if (paymentMethod === 'Cash') {
      setAmountPaidInput(amountDue.toString());
    } else {
      setAmountPaidInput('');
    }
  }, [paymentMethod, amountDue]);

  // Add Item Click - Auto Add to Cart immediately!
  const handleProductClick = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id && !item.notes && item.overridePrice === undefined);
    if (existingIndex !== -1) {
      setCart(prev => prev.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = item.quantity + 1;
          return {
            ...item,
            quantity: newQty,
            subtotal: Math.round(newQty * item.product.basePrice)
          };
        }
        return item;
      }));
      toast.success(`Added another ${product.name} to cart!`);
    } else {
      const newItem: CartItem = {
        id: Math.random().toString(36).substring(2, 9),
        product: product,
        quantity: 1,
        subtotal: Math.round(product.basePrice)
      };
      setCart(prev => [...prev, newItem]);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const updateCartItemPrice = (id: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          overridePrice: newPrice,
          subtotal: Math.round(item.quantity * newPrice)
        };
      }
      return item;
    }));
  };

  const updateCartItemNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          notes: notes || undefined
        };
      }
      return item;
    }));
  };

  const updateCartItemQty = (id: string, diff: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + diff);
        const unitPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.basePrice;
        return {
          ...item,
          quantity: newQty,
          subtotal: Math.round(newQty * unitPrice)
        };
      }
      return item;
    }));
    toast.info('Quantity updated');
  };

  const setCartItemQty = (id: string, qty: number) => {
    const validQty = Math.max(0, qty);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const unitPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.basePrice;
        return {
          ...item,
          quantity: validQty,
          subtotal: Math.round(validQty * unitPrice)
        };
      }
      return item;
    }));
  };

  const removeCartItem = (id: string, name: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success(`${name} removed.`);
  };

  // Helper: generates JKM-YYYYMMDD-001 format order numbers
  const generateOrderNumber = (): string => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    // Find orders placed today to compute suffix
    const todayPrefix = `JKM-${dateStr}-`;
    const todayOrders = orders.filter(o => o.id.startsWith(todayPrefix));
    
    // Extract suffix numbers
    let maxSuffix = 0;
    todayOrders.forEach(o => {
      const parts = o.id.split('-');
      if (parts.length === 3) {
        const suffix = parseInt(parts[2], 10);
        if (!isNaN(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }
    });

    const nextSuffix = String(maxSuffix + 1).padStart(3, '0');
    return `JKM-${dateStr}-${nextSuffix}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Fulfillment Cart is empty! Choose products to proceed.');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Customer name is required for transaction filing.');
      return;
    }

    // Downpayment validation (At least 50%)
    if (paymentType === 'Down Payment') {
      const dpValue = parseFloat(downPaymentInput) || 0;
      if (dpValue < calculatedMinDP) {
        toast.warning(`Minimum down payment of 50% (₱${calculatedMinDP.toLocaleString()}) required.`);
        return;
      }
      if (dpValue >= cartGrandTotal) {
        toast.warning('Down payment must be less than grand total. Choose "Full Payment" instead.');
        return;
      }
    }

    // Cash Paid check
    if (paymentMethod === 'Cash') {
      const valPaid = parseFloat(amountPaidInput) || 0;
      if (valPaid < amountDue) {
        toast.error(`Cash tendered (₱${valPaid.toLocaleString()}) is below due (₱${amountDue.toLocaleString()}).`);
        return;
      }
    }

    // Formulate new order
    const orderNum = generateOrderNumber();
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-CA');
    const formattedTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: orderNum,
      customerName: customerName.trim(),
      customerContact: customerContact.trim() || undefined,
      date: formattedDate,
      time: formattedTime,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discountAmount,
      grandTotal: cartGrandTotal,
      paymentType: paymentType,
      paymentMethod: paymentMethod,
      downPaymentAmount: paymentType === 'Down Payment' ? actualDP : 0,
      remainingBalance: remainingBalance,
      amountPaid: paymentType === 'Full Payment' ? cartGrandTotal : (paymentType === 'Down Payment' ? actualDP : 0),
      change: computedChange,
      status: 'Pending',
      notes: orderNotes.trim() || undefined,
      trackingNumber: orderNum,
      trackingUpdates: [
        {
          status: 'Order Received' as const,
          timestamp: `${formattedDate} ${formattedTime}`,
          note: `Your order ${orderNum} has been registered and verified by store representative ${userDisplayName}.`,
          images: []
        }
      ]
    };

    toast.info('Processing transaction checkout...');
    try {
      await onOrderCreated(newOrder);

      // Reset Cart form
      setCart([]);
      setCustomerName('');
      setCustomerContact('');
      setDiscountAmount(0);
      setPaymentType('Full Payment');
      setPaymentMethod('Cash');
      setOrderNotes('');
      setMobileView('catalog');

      toast.success(`Order ${orderNum} filed successfully! Invoice generated.`);
    } catch (err) {
      console.error(err);
      toast.error('Fulfillment Checkout failed. Please try again.');
    }
  };

  const filteredProducts = products.filter(p => {
    if (p.isUnlisted) return false;
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-4 text-slate-800 h-full overflow-hidden">
      
      {/* Mobile-only Segmented View Switcher */}
      <div className="lg:hidden flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'catalog' 
              ? 'bg-white text-slate-900 shadow-2xs' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Catalog
        </button>
        <button
          type="button"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 relative ${
            mobileView === 'cart' 
              ? 'bg-white text-slate-900 shadow-2xs' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Cart Sheet
          {cart.length > 0 && (
            <span className="bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full flex items-center justify-center min-w-4 h-4">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* LEFT: Product Catalog (Col Span 7) */}
        <div className={`lg:col-span-7 flex flex-col h-full overflow-hidden space-y-3.5 ${mobileView === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Product Catalog</h3>
                <p className="text-slate-400 text-xs mt-0.5">Select products to add to the order fulfillment cart.</p>
              </div>
              {/* Search inputs */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>
            </div>

            {/* Categories Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => handleProductClick(p)}
                className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between cursor-pointer hover:border-slate-400 hover:shadow-2xs transition-all group h-full"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
                  </div>
                  
                  <div className="pt-1">
                    <h4 className="font-medium text-xs text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2 leading-normal">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    ₱{p.basePrice.toLocaleString()}
                  </span>
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 p-1 rounded-md group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white border border-slate-200/80 rounded-xl">
                <p className="text-slate-400 text-xs">No products matching current filter criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Active Shopping Cart (Col Span 5) */}
        <div className={`lg:col-span-5 h-full flex flex-col overflow-hidden ${mobileView === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col h-full overflow-hidden space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-slate-700" />
                Fulfillment Cart
              </h3>
              <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 scrollbar-thin">
              {/* Customer Metadata Input */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 block">Customer Information</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Walk-in Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Contact No.</label>
                    <input
                      type="tel"
                      placeholder="0917xxxxxxx"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2">
              {cart.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-3 rounded-lg flex flex-col border border-slate-200/80 gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-slate-900 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      
                      {/* Unit Price Override Input */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">Price: ₱</span>
                        <input
                          type="number"
                          min="0"
                          value={item.overridePrice !== undefined ? item.overridePrice : item.product.basePrice}
                          onChange={(e) => updateCartItemPrice(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono w-18 focus:outline-none focus:border-slate-900"
                          title="Edit unit price"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ pc</span>
                      </div>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="font-mono text-xs font-bold text-slate-900">₱{item.subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Inline Notes & Qty controls */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                    {/* Notes input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Notes / instructions..."
                        value={item.notes || ''}
                        onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-700 focus:outline-none focus:border-slate-900 font-sans"
                      />
                    </div>

                    {/* Qty and Remove Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, -1)}
                        className="bg-white border border-slate-200 hover:bg-slate-100 p-1 rounded text-slate-500 transition-colors cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val === '') {
                            setCartItemQty(item.id, 0);
                          } else {
                            const num = parseInt(val, 10);
                            setCartItemQty(item.id, num);
                          }
                        }}
                        onBlur={() => {
                          if (item.quantity <= 0) {
                            setCartItemQty(item.id, 1);
                          }
                        }}
                        className="w-9 bg-slate-50 border border-slate-200 rounded text-center py-0.5 font-mono text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, 1)}
                        className="bg-white border border-slate-200 hover:bg-slate-100 p-1 rounded text-slate-500 transition-colors cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id, item.product.name)}
                        className="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center space-y-1 text-slate-400">
                  <ShoppingCart className="w-6 h-6 text-slate-300" />
                  <p className="text-xs">Cart is empty</p>
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800">₱{cartSubtotal.toLocaleString()}</span>
              </div>
              
              {/* Custom Discount Field */}
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Discount</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 max-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min="0"
                    max={cartSubtotal}
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.min(cartSubtotal, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="bg-transparent border-none text-right w-full text-xs text-slate-800 font-mono focus:outline-none p-0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 my-1" />

              <div className="flex justify-between items-center text-slate-900 font-bold">
                <span className="text-xs">Grand Total</span>
                <span className="font-mono text-sm">₱{cartGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* PAYMENT OPTIONS BLOCK */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block tracking-wider">Payment Details</span>
              
              {/* Payment Type */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('Full Payment')}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    paymentType === 'Full Payment' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Full Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('Down Payment')}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    paymentType === 'Down Payment' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Down Payment (50%)
                </button>
              </div>

              {/* Down Payment Inputs */}
              {paymentType === 'Down Payment' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-2 border-t border-slate-200 text-xs"
                >
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Min Required (50%)</span>
                    <span className="font-mono text-slate-800">₱{calculatedMinDP.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Amount Received</span>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 max-w-[110px]">
                      <span className="text-[10px] text-slate-400 font-mono">₱</span>
                      <input
                        type="number"
                        min={calculatedMinDP}
                        max={cartGrandTotal}
                        value={downPaymentInput}
                        onChange={(e) => setDownPaymentInput(e.target.value)}
                        className="bg-transparent border-none text-right w-full text-xs text-slate-800 focus:outline-none font-mono p-0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-amber-700 font-mono font-medium">
                    <span>Remaining Balance</span>
                    <span>₱{remainingBalance.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}

              <div className="h-px bg-slate-200" />

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Cash', 'GCash', 'Bank Transfer'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        paymentMethod === method 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Tendered Field */}
              {paymentMethod === 'Cash' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-2 border-t border-slate-200 text-xs"
                >
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Due Amount</span>
                    <span className="font-mono text-slate-800">₱{amountDue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Cash Tendered</span>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 max-w-[110px]">
                      <span className="text-[10px] text-slate-400 font-mono">₱</span>
                      <input
                        type="number"
                        min={amountDue}
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value)}
                        className="bg-transparent border-none text-right w-full text-xs text-slate-800 focus:outline-none font-mono p-0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-emerald-700 font-mono font-medium">
                    <span>Change</span>
                    <span>₱{computedChange.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </div>

              {/* Fulfillment internal notes */}
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">Internal Notes</label>
                <textarea
                  placeholder="Order instructions, proofing details..."
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-sans resize-none"
                />
              </div>
            </div>

            {/* Check Out Action (Sticky at bottom) */}
            <div className="pt-2.5 border-t border-slate-100 shrink-0">
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Receipt className="w-3.5 h-3.5" />
                Place Order & Generate Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
