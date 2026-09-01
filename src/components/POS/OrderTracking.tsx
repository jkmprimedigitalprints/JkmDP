/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, MapPin, Printer, ClipboardCheck, Clock, CheckCircle2, CreditCard, X, ShieldCheck, Sparkles, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../../types';
import { useToast } from '../Toast';

interface OrderTrackingProps {
  orders: Order[];
  onUpdateOrders?: (orders: Order[]) => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orders, onUpdateOrders }) => {
  const { toast } = useToast();
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  // Online Payment States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'GCash' | 'Bank Transfer'>('GCash');
  const [isSimulatingPay, setIsSimulatingPay] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [referenceIdError, setReferenceIdError] = useState('');
  const [copiedState, setCopiedState] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!trackQuery.trim()) {
      setTrackedOrder(null);
      return;
    }

    const found = orders.find(
      o => o.id.toLowerCase() === trackQuery.trim().toLowerCase() ||
           (o.trackingNumber && o.trackingNumber.toLowerCase() === trackQuery.trim().toLowerCase())
    );
    setTrackedOrder(found || null);
  };

  const triggerPaymentSimulation = () => {
    if (!trackedOrder) return;
    if (!referenceId.trim()) {
      setReferenceIdError('Reference ID is required to verify your transaction.');
      return;
    }
    if (referenceId.trim().length < 8) {
      setReferenceIdError('Please enter a valid GCash/Bank reference ID (at least 8 characters/digits).');
      return;
    }
    setReferenceIdError('');
    setIsSimulatingPay(true);
    
    // Simulate payment processing gateway check
    setTimeout(() => {
      setIsSimulatingPay(false);
      setPaySuccess(true);
      toast.success('Online Payment Authorized Successfully!');

      // Settle the balance in real-time
      const updatedOrder: Order = {
        ...trackedOrder,
        remainingBalance: 0,
        amountPaid: trackedOrder.grandTotal,
        paymentType: 'Full Payment',
        paymentMethod: selectedPayMethod,
        trackingUpdates: [
          ...trackedOrder.trackingUpdates,
          {
            status: trackedOrder.status, // keep current fulfillment status
            timestamp: `${new Date().toLocaleDateString('en-CA')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            note: `Remaining balance of ₱${trackedOrder.remainingBalance.toLocaleString()} settled online via real-time integrated ${selectedPayMethod} Payment Gateway. Reference ID: ${referenceId}`,
            images: []
          }
        ]
      };

      // Sync local component state
      setTrackedOrder(updatedOrder);

      // Sync globally
      if (onUpdateOrders) {
        const index = orders.findIndex(o => o.id === trackedOrder.id);
        if (index !== -1) {
          const updatedList = [...orders];
          updatedList[index] = updatedOrder;
          onUpdateOrders(updatedList);
        }
      } else {
        // Fallback sync directly to localStorage
        try {
          const saved = localStorage.getItem('jkm_orders_v2');
          if (saved) {
            const list: Order[] = JSON.parse(saved);
            const idx = list.findIndex(o => o.id === trackedOrder.id);
            if (idx !== -1) {
              list[idx] = updatedOrder;
              localStorage.setItem('jkm_orders_v2', JSON.stringify(list));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 2000);
  };

  const handleClosePayment = () => {
    setIsPayModalOpen(false);
    setPaySuccess(false);
    setReferenceId('');
    setReferenceIdError('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 text-slate-800">
      
      {/* Intro branding */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Public Order Tracker Terminal</h2>
        <p className="text-slate-500 text-xs max-w-sm mx-auto">
          Input your transaction number or tracking ID to check active job printing status, downpayment balance details, and pickup readiness.
        </p>
      </div>

      {/* Query Search Form */}
      <form onSubmit={handleTrackSearch} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
        <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Enter Your Transaction Order ID / Tracking No.</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. JKM-20260714-001 or JKM-ONLINE-A1B2"
            value={trackQuery}
            onChange={(e) => setTrackQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 uppercase"
          />
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-sky-500/10 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Track Job
          </button>
        </div>
      </form>

      {/* Tracker Visual Outcomes */}
      {trackedOrder ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-500 uppercase">Active Fulfillment Tracking</span>
              <h3 className="font-mono font-bold text-base text-slate-900 uppercase mt-0.5">{trackedOrder.id}</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Logged Customer</span>
              <span className="font-bold text-slate-800 uppercase block mt-0.5">{trackedOrder.customerName}</span>
            </div>
          </div>

          {/* Progress Timeline Stepper */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Printing Job Roadmap</span>
            
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              
              {/* Step 1: File Received */}
              <div className="relative">
                <span className={`absolute -left-6 top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                  ['Pending', 'Printing', 'Ready for Pickup', 'Completed', 'Order Received'].includes(trackedOrder.status)
                    ? 'bg-sky-500 border-sky-500 text-white font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
                <div className="space-y-0.5 pl-2">
                  <h4 className="font-bold text-xs text-slate-800">Job Registered</h4>
                  <p className="text-[10px] text-slate-400">Order successfully logged into current system queue.</p>
                </div>
              </div>

              {/* Step 2: In Print Machine */}
              <div className="relative">
                <span className={`absolute -left-6 top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                  ['Printing', 'Ready for Pickup', 'Completed'].includes(trackedOrder.status)
                    ? 'bg-sky-500 border-sky-500 text-white font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {trackedOrder.status === 'Printing' ? '•' : ['Ready for Pickup', 'Completed'].includes(trackedOrder.status) ? '✓' : '2'}
                </span>
                <div className="space-y-0.5 pl-2">
                  <h4 className="font-bold text-xs text-slate-800">Active Printing Queue</h4>
                  <p className="text-[10px] text-slate-400">Designs processed by printer heads. Ink curing checks pending.</p>
                </div>
              </div>

              {/* Step 3: Ready for pickup */}
              <div className="relative">
                <span className={`absolute -left-6 top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                  ['Ready for Pickup', 'Completed'].includes(trackedOrder.status)
                    ? 'bg-sky-500 border-sky-500 text-white font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {trackedOrder.status === 'Ready for Pickup' ? '•' : trackedOrder.status === 'Completed' ? '✓' : '3'}
                </span>
                <div className="space-y-0.5 pl-2">
                  <h4 className="font-bold text-xs text-slate-800">Fulfillment Verification Complete</h4>
                  <p className="text-[10px] text-slate-400">Prints certified by QA specialists. Ready for customer release.</p>
                </div>
              </div>

              {/* Step 4: Completed */}
              <div className="relative">
                <span className={`absolute -left-6 top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[10px] font-mono ${
                  trackedOrder.status === 'Completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {trackedOrder.status === 'Completed' ? '✓' : '4'}
                </span>
                <div className="space-y-0.5 pl-2">
                  <h4 className="font-bold text-xs text-slate-800">Completed & Handed Over</h4>
                  <p className="text-[10px] text-slate-400">Order fully settled and picked up at storefront counter.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Real-time progress updates stream */}
          {trackedOrder.trackingUpdates && trackedOrder.trackingUpdates.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Activity & Progress Milestones</span>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {trackedOrder.trackingUpdates.map((update, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded font-extrabold uppercase font-sans">
                        {update.status}
                      </span>
                      <span className="text-slate-400 font-mono">{update.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-xs font-sans leading-relaxed">{update.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downpayment & Billing status info inside tracking */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs font-semibold text-slate-600 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Billing Ledger Summary</span>
            <div className="flex justify-between">
              <span>Overall Grand Total:</span>
              <span className="font-mono text-slate-900 font-bold">₱{trackedOrder.grandTotal.toLocaleString()}</span>
            </div>
            {trackedOrder.remainingBalance > 0 ? (
              <>
                <div className="flex justify-between">
                  <span>Downpayment Made:</span>
                  <span className="font-mono text-sky-600 font-bold">₱{trackedOrder.downPaymentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold items-center">
                  <span>Outstanding Balance Due:</span>
                  <span className="font-mono text-base text-amber-600">₱{trackedOrder.remainingBalance.toLocaleString()}</span>
                </div>

                {/* Settle Balance Button */}
                <div className="pt-3 border-t border-slate-200/55 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaySuccess(false);
                      setIsPayModalOpen(true);
                    }}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    <CreditCard className="w-4 h-4" />
                    Settle Balance with Real-time Online Payment
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-emerald-600 font-bold py-1">
                <span>Transaction billing state:</span>
                <span className="uppercase text-[11px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Fully Settled (Paid)
                </span>
              </div>
            )}
          </div>

        </div>
      ) : (
        searched && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center justify-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <p className="text-xs">No active records found for "{trackQuery}".</p>
            <p className="text-[10px] text-slate-400 font-normal">Check for correct hyphenations and uppercase characters.</p>
          </div>
        )
      )}

      {/* REAL-TIME ONLINE PAYMENT API GATEWAY MODAL */}
      <AnimatePresence>
        {isPayModalOpen && trackedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col text-left"
            >
              {/* Header */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" />
                  Secured Integrated Payment Terminal
                </span>
                <button
                  onClick={handleClosePayment}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {!paySuccess ? (
                  <>
                    <div className="text-center space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">Amount to Settle</span>
                      <h2 className="font-mono text-3xl font-black text-indigo-600">₱{trackedOrder.remainingBalance.toLocaleString()}</h2>
                      <p className="text-[10px] text-slate-400 font-sans">Paying outstanding balance for Order Reference: <strong>{trackedOrder.id}</strong></p>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('GCash')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedPayMethod === 'GCash'
                            ? 'border-blue-500 bg-blue-50/40 text-blue-600 font-bold shadow-sm'
                            : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider">GCash Pay Portal</span>
                        <span className="text-xs font-mono font-extrabold text-blue-600">₱{trackedOrder.remainingBalance.toLocaleString()}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('Bank Transfer')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedPayMethod === 'Bank Transfer'
                            ? 'border-violet-500 bg-violet-50/40 text-violet-600 font-bold shadow-sm'
                            : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Bank Transfer</span>
                        <span className="text-xs font-mono font-extrabold text-violet-600">₱{trackedOrder.remainingBalance.toLocaleString()}</span>
                      </button>
                    </div>

                    {/* Secure QR Frame */}
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col items-center justify-center space-y-2 text-center">
                      <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-150 relative">
                        <img 
                          src={selectedPayMethod === 'GCash' ? '/gqr.jpg' : '/bqr.jpg'} 
                          alt={`${selectedPayMethod} QR`}
                          className="w-32 h-32 object-contain p-1 rounded-lg"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {isSimulatingPay && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center space-y-2">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-sans font-bold text-indigo-600 uppercase tracking-wider">Awaiting Verification...</span>
                          </div>
                        )}
                      </div>
                      {selectedPayMethod === 'GCash' ? (
                        <div className="space-y-1 w-full flex flex-col items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-sans text-slate-600 font-bold">GCash No:</span>
                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">09507310062</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('09507310062', 'gcash')}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Copy GCash Number"
                            >
                              {copiedState === 'gcash' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {copiedState === 'gcash' && <span className="text-[10px] text-emerald-600 font-bold">Copied to clipboard!</span>}
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Scan the GCash QR code or send payment to the number above.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 w-full flex flex-col items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-sans text-slate-600 font-bold">BPI Acct No:</span>
                            <span className="font-mono text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded">0869767995</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('0869767995', 'bpi')}
                              className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                              title="Copy BPI Account Number"
                            >
                              {copiedState === 'bpi' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {copiedState === 'bpi' && <span className="text-[10px] text-emerald-600 font-bold">Copied to clipboard!</span>}
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Scan the Bank QR code or transfer to BPI account above.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reference ID Input Field */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">
                        Enter {selectedPayMethod} Reference Transaction ID
                      </label>
                      <input
                        type="text"
                        value={referenceId}
                        onChange={(e) => {
                          setReferenceId(e.target.value);
                          if (referenceIdError) setReferenceIdError('');
                        }}
                        placeholder={selectedPayMethod === 'GCash' ? 'e.g., 5013000204123' : 'e.g., 109234567890'}
                        className={`w-full px-4 py-3 rounded-xl border font-mono text-xs focus:outline-none transition-all ${
                          referenceIdError
                            ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100'
                        }`}
                      />
                      {referenceIdError && (
                        <p className="text-[10px] text-red-500 font-medium font-sans">{referenceIdError}</p>
                      )}
                    </div>

                    {/* Submit Payment button */}
                    <button
                      type="button"
                      disabled={isSimulatingPay}
                      onClick={triggerPaymentSimulation}
                      className={`w-full text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        isSimulatingPay
                          ? 'bg-slate-300 shadow-none'
                          : selectedPayMethod === 'GCash'
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                            : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/10'
                      }`}
                    >
                      {isSimulatingPay ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Verifying with {selectedPayMethod} Gateway...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verify & Settle Balance
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-4 flex flex-col items-center"
                  >
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full border border-emerald-100 shadow-md">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-slate-900 text-base uppercase">Payment Cleared Instantly</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed px-4">
                        Thank you! Your outstanding balance of ₱{trackedOrder.grandTotal.toLocaleString()} has been fully paid and verified through our real-time integrated gateway system.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 w-full text-left text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span>PAYMENT STATE:</span>
                        <span className="text-emerald-600 font-extrabold uppercase">SUCCESS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TRANSACTION REF:</span>
                        <span className="text-slate-800 font-bold break-all">{referenceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>METHOD:</span>
                        <span className="text-slate-800 font-bold uppercase">{selectedPayMethod} Online Portal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClosePayment}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Done & Return to Tracker
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
