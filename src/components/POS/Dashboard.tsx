/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, DollarSign, ArrowDownRight, Clipboard, Calendar, Tag, UserCheck, Settings } from 'lucide-react';
import { Order, Expense, UserLog } from '../../types';

interface DashboardProps {
  orders: Order[];
  expenses: Expense[];
  userLogs: UserLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, expenses, userLogs }) => {
  // Today's Date String
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g., "2026-07"

  // Filter active current month orders & expenses
  const currentMonthOrders = orders.filter(o => o.date.startsWith(currentMonthPrefix));
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  // Today's Income (orders with date === todayStr)
  const todayIncome = orders
    .filter(o => o.date === todayStr)
    .reduce((acc, o) => acc + o.grandTotal, 0);

  // Weekly Summary (all orders in last 7 days)
  const last7DaysOrders = orders.filter(o => {
    const orderDate = new Date(o.date);
    const diffTime = Math.abs(new Date().getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  const weeklyRevenue = last7DaysOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  // Monthly Revenue (current month only)
  const monthlyRevenue = currentMonthOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  // Monthly Expenses (current month only)
  const monthlyExpenses = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Monthly Net Profit
  const netProfit = Math.max(0, monthlyRevenue - monthlyExpenses);

  // Profit Sharing Computation:
  // Mark = 30%
  // Kaye = 30%
  // Jobelle = 30%
  // Maintenance = 10%
  const shareMark = netProfit * 0.3;
  const shareKaye = netProfit * 0.3;
  const shareJobelle = netProfit * 0.3;
  const shareMaintenance = netProfit * 0.1;

  // Top Products breakdown (current month only)
  const productSalesMap: { [key: string]: { qty: number; rev: number } } = {};
  currentMonthOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSalesMap[item.product.name]) {
        productSalesMap[item.product.name] = { qty: 0, rev: 0 };
      }
      productSalesMap[item.product.name].qty += item.quantity;
      productSalesMap[item.product.name].rev += item.subtotal;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Sales by Category (current month only)
  const categorySalesMap: { [key: string]: number } = {};
  currentMonthOrders.forEach(o => {
    o.items.forEach(item => {
      const cat = item.product.category;
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.subtotal;
    });
  });

  const categorySales = Object.entries(categorySalesMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time financial stream, partner dividends, sales velocity, and audit trail.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-medium shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Audit Period: {todayStr}</span>
        </div>
      </div>

      {/* Primary KPI Metrics Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Today's Income */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Today's Income</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-semibold text-slate-900 tracking-tight">₱{todayIncome.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cash register today</p>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>7-Day Volume</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-semibold text-slate-900 tracking-tight">₱{weeklyRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Rolling weekly revenue</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Monthly Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-semibold text-emerald-600 tracking-tight">₱{monthlyRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Current month gross billing</p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Monthly Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-semibold text-rose-600 tracking-tight">₱{monthlyExpenses.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Total operational cash out</p>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-300 text-xs font-medium">
            <span>Monthly Net Margin</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">Live</span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-semibold text-white tracking-tight">₱{netProfit.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-1">Net profit (Rev - Exp)</p>
          </div>
        </div>
      </div>

      {/* Profit Sharing Dividend Distribution */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Stakeholder Profit Distribution
            </h2>
            <p className="text-xs text-slate-500">Calculated automatic dividend splits based on current net profit margin.</p>
          </div>
          <div className="text-xs text-slate-500 font-mono font-medium">
            Net Pool: <span className="text-slate-900 font-bold">₱{netProfit.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-4 sm:p-5 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700">Mark</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">30% Partner</span>
            </div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-1">₱{shareMark.toLocaleString()}</div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-800 h-full rounded-full w-[30%]" />
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700">Kaye</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">30% Partner</span>
            </div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-1">₱{shareKaye.toLocaleString()}</div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-800 h-full rounded-full w-[30%]" />
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700">Jobelle</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">30% Partner</span>
            </div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-1">₱{shareJobelle.toLocaleString()}</div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-800 h-full rounded-full w-[30%]" />
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700">Maintenance</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">10% Reserve</span>
            </div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-1">₱{shareMaintenance.toLocaleString()}</div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-600 h-full rounded-full w-[10%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-slate-500" />
                Top Velocity Products
              </h2>
              <p className="text-xs text-slate-500">Highest volume printing items this month.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{topProducts.length} Items</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((p, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                <div className="min-w-0 pr-3">
                  <span className="font-medium text-slate-800 truncate block">{p.name}</span>
                  <span className="text-slate-400 text-[11px]">{p.qty} units fulfilled</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 shrink-0">₱{p.rev.toLocaleString()}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No orders recorded in current billing cycle.
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                Sales by Category
              </h2>
              <p className="text-xs text-slate-500">Proportion of gross billing per print category.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{categorySales.length} Categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {categorySales.map((c, i) => {
              const maxRev = categorySales.reduce((sum, item) => sum + item.amount, 0) || 1;
              const percentage = Math.round((c.amount / maxRev) * 100);

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{c.category}</span>
                    <span className="font-mono text-slate-900">₱{c.amount.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-800 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(2, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categorySales.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No category data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Logs Monitor */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-500" />
              System Audit Trail
            </h2>
            <p className="text-xs text-slate-500">Recent operator transactions and operational updates.</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{userLogs.length} Records</span>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs font-sans pr-1">
          {userLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded">
                  {log.user}
                </span>
                <span className="text-slate-700 font-medium">{log.action}</span>
              </div>
              <span className="text-slate-400 text-[11px] font-mono shrink-0">{log.date} {log.time}</span>
            </div>
          ))}
          {userLogs.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No audit records logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
