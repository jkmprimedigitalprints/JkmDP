/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, TrendingDown, Calendar, Star, LogOut, ArrowRight, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';
import { Expense } from '../../types';
import { useToast } from '../Toast';

interface ExpensesProps {
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
  userDisplayName: string;
}

export const ExpensesModule: React.FC<ExpensesProps> = ({ expenses, onUpdateExpenses, userDisplayName }) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // New Modern React Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('Materials');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Compute expenses KPI details
  const totalExpensesVal = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Highest single expense
  const highestExpense = expenses.length > 0 
    ? Math.max(...expenses.map(e => e.amount)) 
    : 0;

  // Monthly Expenses (Assuming current list handles rolling month)
  const currentMonthExpenses = totalExpensesVal; 

  // Today's Date String
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  // Today's Expenses
  const todayExpensesVal = expenses
    .filter(e => e.date === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  const handleAddNewExpense = () => {
    setFormCategory('Materials');
    setFormAmount('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(formAmount) || 0;

    if (amountNum <= 0) {
      toast.error('Amount must be greater than zero!');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Description is required!');
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: todayStr,
      loggedBy: userDisplayName,
      category: formCategory,
      amount: amountNum,
      description: formDescription.trim()
    };

    onUpdateExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
    toast.success(`Expense logged successfully: ₱${amountNum.toLocaleString()}`);
  };

  const handleDeleteExpense = (id: string, amount: number) => {
    Swal.fire({
      title: 'Delete Expense Log?',
      text: `Are you sure you want to delete this expense log of ₱${amount}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = expenses.filter(e => e.id !== id);
        onUpdateExpenses(updated);
        toast.success(`Expense log removed.`);
      }
    });
  };

  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

  const filtered = expenses.filter(e => {
    const matchCat = catFilter === 'All' || e.category === catFilter;
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                        e.category.toLowerCase().includes(search.toLowerCase()) || 
                        e.loggedBy.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Today's Expenses</span>
          <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{todayExpensesVal.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Logged outflows today</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Monthly Total Expenses</span>
          <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{currentMonthExpenses.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Aggregate monthly outflow</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Highest Outflow</span>
          <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{highestExpense.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Largest operational transaction</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Estimated Reserve</span>
          <h3 className="font-mono text-xl font-bold text-slate-900 mt-2">₱{(totalExpensesVal * 0.4).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Average operational reserve</p>
        </div>
      </div>

      {/* Control row */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:max-w-xl">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, category, or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
            />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900 w-full sm:w-auto shrink-0"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddNewExpense}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Expense Entry
        </button>
      </div>

      {/* Expenses list */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5">Expense ID</th>
                <th className="py-2.5 px-3.5">Category</th>
                <th className="py-2.5 px-3.5">Amount</th>
                <th className="py-2.5 px-3.5">Logged By</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Description</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs">#{item.id}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-900 font-medium">₱{item.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                      {item.loggedBy}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-xs">{item.date}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 text-xs max-w-xs truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => handleDeleteExpense(item.id, item.amount)}
                      className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1 rounded border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Permanently remove expense log"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No expense logs recorded matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* MODERN LOG OPERATIONAL EXPENSE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
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
                  <TrendingDown className="w-4 h-4 text-slate-700" />
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Log Operational Expense</h3>
                    <p className="text-[11px] text-slate-400">Outflow record ledger</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitExpense} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-900 focus:bg-white font-medium"
                  >
                    <option value="Materials">Materials & Paper Supplies</option>
                    <option value="Electricity">Electricity Utility</option>
                    <option value="Internet & Comms">Internet & Comms</option>
                    <option value="Shop Rent">Shop Space Rental</option>
                    <option value="Maintenance">Equipment Maintenance</option>
                    <option value="Marketing">Social Ads / Marketing</option>
                    <option value="Salaries">Labor & Staff Salaries</option>
                    <option value="Others">Miscellaneous Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Value (₱) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₱</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="1500"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expense Description / Notes *</label>
                  <textarea
                    required
                    placeholder="e.g. Replenished Epson Yellow Ink bottle"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white resize-none font-medium"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    Record Expense
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
