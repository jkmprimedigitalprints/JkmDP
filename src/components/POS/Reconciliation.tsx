/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShieldCheck, Scale, Archive, RefreshCcw, HelpCircle, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Expense } from '../../types';
import { useToast } from '../Toast';

interface ReconciliationProps {
  orders: Order[];
  expenses: Expense[];
  onArchiveMonth: () => void | Promise<void>;
  userRole: string;
}

interface MonthlyArchiveLog {
  id: string;
  monthYear: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  shareMark: number;
  shareKaye: number;
  shareJobelle: number;
  shareMaintenance: number;
  dateArchived: string;
}

export const Reconciliation: React.FC<ReconciliationProps> = ({ orders, expenses, onArchiveMonth, userRole }) => {
  const { toast } = useToast();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [archiveStatus, setArchiveStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const [archives, setArchives] = useState<MonthlyArchiveLog[]>(() => {
    const cached = localStorage.getItem('jkm_archives_v2');
    return cached ? JSON.parse(cached) : [
      {
        id: 'arch-june-2026',
        monthYear: 'June 2026',
        totalSales: 14630,
        totalExpenses: 9320,
        netProfit: 5310,
        shareMark: 1593,
        shareKaye: 1593,
        shareJobelle: 1593,
        shareMaintenance: -337,
        dateArchived: '2026-06-30'
      },
      {
        id: 'arch-may-2026',
        monthYear: 'May 2026',
        totalSales: 34885,
        totalExpenses: 20480,
        netProfit: 14405,
        shareMark: 4322,
        shareKaye: 4322,
        shareJobelle: 4322,
        shareMaintenance: 1441,
        dateArchived: '2026-05-31'
      }
    ];
  });

  // Dynamic current month-year prefix (e.g., "2026-07")
  const currentMonthPrefix = new Date().toLocaleDateString('en-CA').substring(0, 7);

  // Filter for the current active month
  const activeOrders = orders.filter(o => o.date.startsWith(currentMonthPrefix));
  const activeExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  // Automated Monthly Archiving on mount / when calendar month shifts
  useEffect(() => {
    try {
      // Find past month prefixes in current state
      const pastOrderPrefixes = Array.from(new Set(orders.map(o => o.date.substring(0, 7)).filter(p => p < currentMonthPrefix)));
      const pastExpensePrefixes = Array.from(new Set(expenses.map(e => e.date.substring(0, 7)).filter(p => p < currentMonthPrefix)));
      const allPastPrefixes = Array.from(new Set([...pastOrderPrefixes, ...pastExpensePrefixes])).sort() as string[];

      if (allPastPrefixes.length > 0) {
        let updatedArchives = [...archives];
        let hasArchivedAny = false;

        allPastPrefixes.forEach(prefix => {
          const yearNum = prefix.substring(0, 4);
          const monthNum = prefix.substring(5, 7);
          const formattedMonthYear = new Date(parseInt(yearNum), parseInt(monthNum) - 1, 15)
            .toLocaleString('default', { month: 'long', year: 'numeric' });

          const exists = updatedArchives.some(a => a.monthYear === formattedMonthYear);
          if (!exists) {
            const pastOrders = orders.filter(o => o.date.startsWith(prefix));
            const pastExpenses = expenses.filter(e => e.date.startsWith(prefix));

            const pSales = pastOrders.reduce((sum, o) => sum + o.grandTotal, 0);
            
            // Maintenance logic for previous months
            const pastMaintenanceExps = pastExpenses.filter(e => e.category === 'Maintenance' || e.category.toLowerCase().includes('maintenance'));
            const pastGeneralExps = pastExpenses.filter(e => e.category !== 'Maintenance' && !e.category.toLowerCase().includes('maintenance'));

            const pExpenses = pastExpenses.reduce((sum, e) => sum + e.amount, 0);
            const pGenExps = pastGeneralExps.reduce((sum, e) => sum + e.amount, 0);
            const pMaintExps = pastMaintenanceExps.reduce((sum, e) => sum + e.amount, 0);

            const pNet = Math.max(0, pSales - pGenExps);

            const newArch: MonthlyArchiveLog = {
              id: `arch-auto-${prefix}-${Date.now()}`,
              monthYear: formattedMonthYear,
              totalSales: pSales,
              totalExpenses: pExpenses,
              netProfit: pNet,
              shareMark: pNet * 0.3,
              shareKaye: pNet * 0.3,
              shareJobelle: pNet * 0.3,
              shareMaintenance: (pNet * 0.1) - pMaintExps,
              dateArchived: new Date().toLocaleDateString('en-CA')
            };

            updatedArchives = [newArch, ...updatedArchives];
            hasArchivedAny = true;
          }
        });

        if (hasArchivedAny) {
          setArchives(updatedArchives);
          localStorage.setItem('jkm_archives_v2', JSON.stringify(updatedArchives));
          onArchiveMonth(); // wipes out the past month orders & expenses
          toast.info('System automatically compiled and archived previous month data.');
        }
      }
    } catch (err) {
      console.error('Auto archive failure:', err);
    }
  }, [orders, expenses, archives, currentMonthPrefix, onArchiveMonth]);

  // Financial calculations
  // Equipment maintenance expenses are subtracted directly from the Maintenance Fund, leaving partner dividend pools unaffected.
  const activeMaintenanceExpenses = activeExpenses.filter(e => e.category === 'Maintenance' || e.category.toLowerCase().includes('maintenance'));
  const activeGeneralExpenses = activeExpenses.filter(e => e.category !== 'Maintenance' && !e.category.toLowerCase().includes('maintenance'));

  const totalSales = activeOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalExpenses = activeExpenses.reduce((acc, e) => acc + e.amount, 0);

  const totalGeneralExpenses = activeGeneralExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalMaintenanceExpenses = activeMaintenanceExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Profit for dividend distribution (insulated from equipment maintenance overhead)
  const netProfit = Math.max(0, totalSales - totalGeneralExpenses);

  const shareMark = netProfit * 0.3;
  const shareKaye = netProfit * 0.3;
  const shareJobelle = netProfit * 0.3;
  const shareMaintenance = (netProfit * 0.1) - totalMaintenanceExpenses;

  const handleArchiveMonthClick = () => {
    if (userRole !== 'Manager') {
      toast.error('Unauthorized! Only managers can execute monthly reconciliation closures.');
      return;
    }

    if (activeOrders.length === 0 && activeExpenses.length === 0) {
      toast.warning('No active orders or expenses to reconcile and archive for this period.');
      return;
    }

    setArchiveError(null);
    setArchiveStatus('idle');
    setShowArchiveModal(true);
  };

  const executeArchive = async () => {
    setArchiveStatus('processing');
    setArchiveError(null);

    try {
      const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      // Construct archive entry
      const newArchive: MonthlyArchiveLog = {
        id: `arch-${Date.now()}`,
        monthYear: currentMonthStr,
        totalSales,
        totalExpenses,
        netProfit,
        shareMark,
        shareKaye,
        shareJobelle,
        shareMaintenance,
        dateArchived: new Date().toLocaleDateString('en-CA')
      };

      const updatedArchives = [newArchive, ...archives];
      setArchives(updatedArchives);
      localStorage.setItem('jkm_archives_v2', JSON.stringify(updatedArchives));

      // Trigger parent state clear / sync
      await Promise.resolve(onArchiveMonth());

      // Show success state in modal and fire toast
      setArchiveStatus('success');
      toast.success(`Successfully reconciled and archived ${currentMonthStr}!`);

      // Auto-close modal and auto-collapse the reconciliation section after brief success confirmation
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        setShowArchiveModal(false);
        setIsSectionOpen(false); // Auto-collapse the Monthly Reconciliation section
        setArchiveStatus('idle');
      }, 1200);
    } catch (err: any) {
      console.error('Reconciliation error:', err);
      setArchiveStatus('error');
      setArchiveError(err?.message || 'Failed to complete monthly reconciliation.');
      toast.error('Reconciliation failed. Section remains open for review.');
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Financial Reconciliation</h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
              isSectionOpen ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {isSectionOpen ? 'Active Period' : 'Collapsed'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Audit monthly income against operating overhead and allocate partner distributions.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsSectionOpen(!isSectionOpen)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isSectionOpen ? 'Collapse reconciliation section' : 'Expand reconciliation section'}
          >
            {isSectionOpen ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Expand</span>
              </>
            )}
          </button>
          <button
            onClick={handleArchiveMonthClick}
            disabled={archiveStatus === 'processing'}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <Archive className="w-3.5 h-3.5" />
            Close & Archive Month
          </button>
        </div>
      </div>

      {/* Collapsible Monthly Reconciliation Active Breakdown Section */}
      <AnimatePresence initial={false}>
        {isSectionOpen ? (
          <motion.div
            key="reconciliation-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-4"
          >
            {/* Grid Summary comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Total revenue */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-500">Gross Revenue</span>
                  <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">₱{totalSales.toLocaleString()}</h3>
                </div>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orders:</span>
                    <span className="font-mono text-slate-800">{activeOrders.length} active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collected in Bank:</span>
                    <span className="font-mono text-slate-800">
                      ₱{(activeOrders.reduce((sum, o) => sum + (o.grandTotal - o.remainingBalance), 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total expenses */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-500">Operating Expenses</span>
                  <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">₱{totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Utilities & Rent:</span>
                    <span className="font-mono text-slate-800">₱{(activeExpenses.filter(e => e.category !== 'Materials' && e.category !== 'Maintenance').reduce((s, e) => s + e.amount, 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Raw Supplies:</span>
                    <span className="font-mono text-slate-800">₱{(activeExpenses.filter(e => e.category === 'Materials').reduce((s, e) => s + e.amount, 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Profit share split ledger */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-500">Net Profit Pool</span>
                  <h3 className="text-2xl font-mono font-bold text-emerald-600 mt-1">₱{netProfit.toLocaleString()}</h3>
                </div>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mark (30%):</span>
                    <span className="font-mono text-slate-800 font-medium">₱{shareMark.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kaye (30%):</span>
                    <span className="font-mono text-slate-800 font-medium">₱{shareKaye.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jobelle (30%):</span>
                    <span className="font-mono text-slate-800 font-medium">₱{shareJobelle.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Maintenance (10%):</span>
                    <span className={`font-mono font-medium ${shareMaintenance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      ₱{shareMaintenance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Notice Banner */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-800">Maintenance Policy:</strong> To protect partner dividends, equipment maintenance expenses are charged directly against the 10% Maintenance Fund. The 30% individual partner dividends are calculated from general operating net.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reconciliation-collapsed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-500" />
              <span>Monthly Reconciliation active breakdown is collapsed.</span>
            </div>
            <button
              onClick={() => setIsSectionOpen(true)}
              className="text-slate-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Expand Breakdown</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historical Monthly Archives */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
              Historical Monthly Archives
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {archives.length} {archives.length === 1 ? 'record' : 'records'} archived
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5">Filing Period</th>
                <th className="py-2.5 px-3.5">Revenue</th>
                <th className="py-2.5 px-3.5">Expenses</th>
                <th className="py-2.5 px-3.5">Net Profit</th>
                <th className="py-2.5 px-3.5">Partner Shares (30/30/30/10)</th>
                <th className="py-2.5 px-3.5 text-right">Archived Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archives.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 font-medium text-slate-900">{item.monthYear}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-800">₱{item.totalSales.toLocaleString()}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">₱{item.totalExpenses.toLocaleString()}</td>
                  <td className="py-2.5 px-3.5 font-mono text-emerald-600 font-medium">₱{item.netProfit.toLocaleString()}</td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] font-mono">
                      <span>M: ₱{item.shareMark.toLocaleString()}</span>
                      <span>K: ₱{item.shareKaye.toLocaleString()}</span>
                      <span>J: ₱{item.shareJobelle.toLocaleString()}</span>
                      <span>Fund: ₱{item.shareMaintenance.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs text-right">{item.dateArchived}</td>
                </tr>
              ))}
              {archives.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No records currently in financial archives.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MONTHLY RECONCILIATION ARCHIVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showArchiveModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-slate-200/80 p-5 max-w-md w-full shadow-lg space-y-4 text-left"
            >
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Audit Closure</span>
                <h3 className="font-semibold text-sm text-slate-900 mt-0.5">Run Monthly Close & Archive?</h3>
              </div>

              {archiveStatus === 'success' ? (
                <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">Reconciliation Finalized</h4>
                  <p className="text-xs text-slate-500">
                    Monthly ledger archived and transactions successfully cleared. Collapsing section...
                  </p>
                </div>
              ) : archiveStatus === 'processing' ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-xs text-slate-900">Processing Reconciliation...</h4>
                    <p className="text-[11px] text-slate-500">
                      Recording dividends to archives and clearing active monthly transactions.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Reconcile current active transactions and overhead ledger. This will finalize dividend payouts and append them to historical records.
                  </p>

                  {archiveError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{archiveError}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Sales:</span>
                      <span className="font-mono text-slate-900 font-medium">₱{totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Operating Expenses:</span>
                      <span className="font-mono text-slate-900 font-medium">₱{totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 border-t border-slate-200 pt-1.5 font-medium">
                      <span>Net Payout Pool:</span>
                      <span className="font-mono">₱{netProfit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setShowArchiveModal(false)}
                      className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeArchive}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      Confirm & Archive
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
