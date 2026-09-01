/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Printer, Receipt, Trash2, DollarSign, ArrowRight, CheckCircle2, FileSpreadsheet, FileText, Calendar, Filter, Link, ExternalLink, Edit, X, Download, Eye, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, PaymentMethod, PaymentType } from '../../types';
import { useToast } from '../Toast';
import { INITIAL_ORDERS, PRODUCTS } from '../../utils/data';

interface LiveOrdersProps {
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  userRole: string;
  onViewReceipt: (order: Order) => void;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({ orders, onUpdateOrders, userRole, onViewReceipt }) => {
  const { toast } = useToast();

  const awardLoyaltyPointsIfQualifying = (order: Order) => {
    let minVal = 149;
    let ratio = 10;
    let enabled = true;
    const configRaw = localStorage.getItem('jkm_rewards_config');
    if (configRaw) {
      const parsed = JSON.parse(configRaw);
      enabled = parsed.enabled ?? true;
      minVal = parsed.minOrderValue ?? 149;
      ratio = parsed.pointsRatio ?? 10;
    }

    if (!enabled) return;

    if (order.grandTotal >= minVal) {
      const raw = localStorage.getItem('jkm_customer_accounts_v2');
      if (raw) {
        const customers = JSON.parse(raw);
        let foundAndAwarded = false;
        const updated = customers.map((c: any) => {
          const nameMatch = c.name.toLowerCase().trim() === order.customerName.toLowerCase().trim();
          const contactMatch = order.customerContact && (
            c.email.toLowerCase().trim() === order.customerContact.toLowerCase().trim() || 
            c.phone.trim() === order.customerContact.trim()
          );
          if (nameMatch || contactMatch) {
            const earned = Math.floor(order.grandTotal / ratio);
            const newPoints = (c.points || 0) + earned;
            foundAndAwarded = true;
            toast.success(`Loyalty points accumulated automatically! 🎁 Awarded +${earned} points to customer ${c.name}. (New total: ${newPoints} PTS)`);
            return { ...c, points: newPoints };
          }
          return c;
        });
        if (foundAndAwarded) {
          localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(updated));
          window.dispatchEvent(new StorageEvent('storage', { key: 'jkm_customer_accounts_v2' }));
        }
      }
    }
  };

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<string>('');

  // Editing Order States
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'details' | 'tracking' | 'payment-files'>('details');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerContact, setEditCustomerContact] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editSubtotal, setEditSubtotal] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editDownPayment, setEditDownPayment] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('GCash');
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>('Full Payment');
  const [editDeliveryMethod, setEditDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editSelectedCourier, setEditSelectedCourier] = useState('Lalamove');
  const [editDesignLink, setEditDesignLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  
  // Tracking & Delivery states
  const [editEstimatedCompletionDate, setEditEstimatedCompletionDate] = useState('');
  const [editDeliveryStatus, setEditDeliveryStatus] = useState<any>('Waiting for Shipment');
  const [editDateShipped, setEditDateShipped] = useState('');
  const [editProofOfDelivery, setEditProofOfDelivery] = useState('');
  const [newMilestoneStatus, setNewMilestoneStatus] = useState<OrderStatus>('Order Received');
  const [newMilestoneNote, setNewMilestoneNote] = useState('');
  const [newMilestoneImage, setNewMilestoneImage] = useState('');

  // Settling Balance Modal States
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('GCash');
  const [settleNotes, setSettleNotes] = useState('');

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setActiveEditTab('details');
    setEditCustomerName(order.customerName || '');
    setEditCustomerContact(order.customerContact || '');
    const firstItem = order.items?.[0];
    setEditProductName(firstItem ? firstItem.product.name : 'Customized Print');
    setEditQuantity(firstItem ? firstItem.quantity : 1);
    setEditSubtotal(order.subtotal || 0);
    setEditDiscount(order.discount || 0);
    setEditDownPayment(order.downPaymentAmount || 0);
    setEditPaymentMethod(order.paymentMethod || 'GCash');
    setEditPaymentType(order.paymentType || 'Full Payment');
    setEditDeliveryMethod(order.deliveryMethod || 'pickup');
    setEditDeliveryAddress(order.deliveryAddress || '');
    setEditSelectedCourier(order.selectedCourier || 'Lalamove');
    
    // Extract design link
    let linkVal = order.designLink || '';
    if (!linkVal && order.notes) {
      const linkMatch = order.notes.match(/Design Link:\s*([^\n]+)/i);
      if (linkMatch && linkMatch[1].trim().startsWith('http')) {
        linkVal = linkMatch[1].trim();
      }
    }
    setEditDesignLink(linkVal);
    setEditNotes(order.notes || '');
    setEditStatus(order.status || 'Pending');

    // Initialize tracking fields
    setEditEstimatedCompletionDate(order.estimatedCompletionDate || '');
    setEditDeliveryStatus(order.deliveryStatus || 'Waiting for Shipment');
    setEditDateShipped(order.dateShipped || '');
    setEditProofOfDelivery(order.proofOfDelivery || '');
    setNewMilestoneStatus(order.status || 'Pending');
    setNewMilestoneNote('');
    setNewMilestoneImage('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const qty = Number(editQuantity) || 1;
    const sub = Number(editSubtotal) || 0;
    const disc = Number(editDiscount) || 0;
    const dp = Number(editDownPayment) || 0;
    const grand = Math.max(0, sub - disc);
    const rem = Math.max(0, grand - dp);
    const paid = dp > 0 ? dp : (editStatus === 'Completed' || editPaymentType === 'Fully Paid' || editPaymentType === 'Full Payment' ? grand : 0);
    const payType = editPaymentType;

    // Update notes to preserve other elements but also have design link
    let updatedNotes = editNotes;
    if (editDesignLink.trim()) {
      if (updatedNotes.includes('Design Link:')) {
        updatedNotes = updatedNotes.replace(/Design Link:\s*[^\n]*/i, `Design Link: ${editDesignLink.trim()}`);
      } else {
        updatedNotes = `${updatedNotes}\nDesign Link: ${editDesignLink.trim()}`;
      }
    }

    const updatedOrders = orders.map(o => {
      if (o.id === editingOrder.id) {
        // Prepare items array
        const origItems = [...(o.items || [])];
        if (origItems.length > 0) {
          origItems[0] = {
            ...origItems[0],
            product: {
              ...origItems[0].product,
              name: editProductName
            },
            quantity: qty,
            subtotal: sub,
            notes: editNotes
          };
        } else {
          origItems.push({
            id: `item-${Math.random().toString(36).substring(2, 7)}`,
            product: {
              id: 'custom',
              name: editProductName,
              category: 'Custom',
              price: sub / qty,
              image: '/logo.png',
              materials: [],
              minProcessingDays: 1
            },
            quantity: qty,
            notes: editNotes,
            subtotal: sub
          });
        }

        // Tracking history updates
        let currentTimeline = [...(o.trackingUpdates || [])];
        if (currentTimeline.length === 0) {
          currentTimeline.push({
            status: 'Order Received',
            timestamp: `${o.date} ${o.time}`,
            note: 'Order request received.',
            images: []
          });
        }
        if (o.status !== editStatus) {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          currentTimeline.push({
            status: editStatus,
            timestamp: `${todayStr} ${timeStr}`,
            note: `Fulfillment status changed to: ${editStatus}.`,
            images: []
          });
        }

        const updatedOrder = {
          ...o,
          customerName: editCustomerName.trim(),
          customerContact: editCustomerContact.trim(),
          subtotal: sub,
          discount: disc,
          grandTotal: grand,
          downPaymentAmount: dp,
          remainingBalance: rem,
          amountPaid: paid,
          paymentType: payType as any,
          paymentMethod: editPaymentMethod,
          deliveryMethod: editDeliveryMethod,
          deliveryAddress: editDeliveryMethod === 'delivery' ? editDeliveryAddress : undefined,
          selectedCourier: editDeliveryMethod === 'delivery' ? editSelectedCourier : undefined,
          designLink: editDesignLink.trim() || undefined,
          notes: updatedNotes,
          status: editStatus,
          items: origItems,
          trackingNumber: o.trackingNumber || o.id,
          estimatedCompletionDate: editEstimatedCompletionDate || undefined,
          deliveryStatus: editDeliveryMethod === 'delivery' ? editDeliveryStatus : undefined,
          dateShipped: editDeliveryMethod === 'delivery' && editDateShipped ? editDateShipped : undefined,
          proofOfDelivery: editDeliveryMethod === 'delivery' && editProofOfDelivery ? editProofOfDelivery : undefined,
          trackingUpdates: currentTimeline
        };

        if (editStatus === 'Completed' && o.status !== 'Completed') {
          awardLoyaltyPointsIfQualifying(updatedOrder);
        }

        return updatedOrder;
      }
      return o;
    });

    onUpdateOrders(updatedOrders);
    setEditingOrder(null);
    toast.success(`Order ${editingOrder.id} details updated!`);
    Swal.fire('Updated!', 'Order details have been successfully modified.', 'success');
  };

  const handleApprovePayment = (subId: string) => {
    if (!editingOrder) return;
    const submission = editingOrder.paymentSubmissions?.find(s => s.id === subId);
    if (!submission) return;

    // Create updated submissions array
    const updatedSubmissions = (editingOrder.paymentSubmissions || []).map(s => {
      if (s.id === subId) {
        return { ...s, status: 'Approved' as const };
      }
      return s;
    });

    const approvedAmount = submission.amount;
    const newAmountPaid = (editingOrder.amountPaid || 0) + approvedAmount;
    const newRemaining = Math.max(0, editingOrder.grandTotal - newAmountPaid);
    
    // Determine new payment type
    let newPaymentType = editPaymentType;
    if (newRemaining <= 0) {
      newPaymentType = 'Fully Paid';
    } else {
      newPaymentType = 'Partially Paid';
    }

    // Update down payment field state if this was a partial/downpayment
    setEditDownPayment(prev => prev + approvedAmount);
    setEditPaymentType(newPaymentType);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const nextMilestone = {
      status: 'Payment Verified' as OrderStatus,
      timestamp: `${todayStr} ${timeStr}`,
      note: `Payment Verified & Approved: ₱${approvedAmount.toLocaleString()} via ${submission.method} (Ref: ${submission.referenceNumber}).`,
      images: submission.proofImage ? [submission.proofImage] : []
    };

    const updatedTimeline = [...(editingOrder.trackingUpdates || []), nextMilestone];

    setEditingOrder({
      ...editingOrder,
      amountPaid: newAmountPaid,
      remainingBalance: newRemaining,
      paymentType: newPaymentType,
      paymentSubmissions: updatedSubmissions,
      trackingUpdates: updatedTimeline,
      status: 'Payment Verified'
    });
    setEditStatus('Payment Verified');

    toast.success(`Payment of ₱${approvedAmount.toLocaleString()} approved!`);
  };

  const handleRejectPayment = (subId: string) => {
    if (!editingOrder) return;
    const submission = editingOrder.paymentSubmissions?.find(s => s.id === subId);
    if (!submission) return;

    Swal.fire({
      title: 'Reject Payment Proof',
      text: 'Please enter the reason for rejection:',
      input: 'text',
      inputPlaceholder: 'e.g., Invalid reference number, amount mismatch...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Reject Payment',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value || 'Unspecified reason';
        
        const updatedSubmissions = (editingOrder.paymentSubmissions || []).map(s => {
          if (s.id === subId) {
            return { ...s, status: 'Rejected' as const };
          }
          return s;
        });

        const todayStr = new Date().toLocaleDateString('en-CA');
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const nextMilestone = {
          status: editingOrder.status,
          timestamp: `${todayStr} ${timeStr}`,
          note: `Payment Rejected: ₱${submission.amount.toLocaleString()} via ${submission.method} (Ref: ${submission.referenceNumber}). Reason: ${reason}`,
          images: []
        };

        const updatedTimeline = [...(editingOrder.trackingUpdates || []), nextMilestone];

        setEditingOrder({
          ...editingOrder,
          paymentSubmissions: updatedSubmissions,
          trackingUpdates: updatedTimeline
        });

        toast.error('Payment proof rejected.');
      }
    });
  };

  // Dynamically extract unique available months from the orders
  const availableMonths = Array.from(new Set(orders.map(o => {
    if (o.date && o.date.length >= 7) {
      const yearMonth = o.date.substring(0, 7); // 'YYYY-MM'
      const parts = yearMonth.split('-');
      if (parts.length === 2) {
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        return `${yearMonth}||${label}`;
      }
    }
    return '';
  }))).filter(Boolean).map(item => {
    const [value, label] = (item as string).split('||');
    return { value, label };
  }).sort((a, b) => b.value.localeCompare(a.value));

  // Settle DP balance
  const settleRemainingBalance = (order: Order) => {
    setSettlingOrder(order);
    setSettleAmount(order.remainingBalance);
    setSettleMethod(order.paymentMethod || 'GCash');
    setSettleNotes('');
  };

  // Delete transaction (Manager only)
  const deleteOrder = (orderId: string) => {
    if (userRole !== 'Manager') {
      Swal.fire({
        title: 'Restricted Access',
        text: 'Only managers can delete order records from history.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Delete Order?',
      text: `Are you sure you want to delete order ${orderId}? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = orders.filter(o => o.id !== orderId);
        onUpdateOrders(updated);
        toast.success(`Order ${orderId} removed permanently.`);
        Swal.fire('Deleted!', 'Transaction record has been deleted.', 'success');
      }
    });
  };

  // Update status sequentially
  const updateOrderStatus = (orderId: string, currentStatus: OrderStatus) => {
    const statuses: OrderStatus[] = ['Pending', 'Printing', 'Ready for Pickup', 'Completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;

    if (!nextStatus) {
      toast.info('Order is already fully completed.');
      return;
    }

    Swal.fire({
      title: 'Update Status?',
      text: `Progress order ${orderId} status from "${currentStatus}" to "${nextStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = orders.map(o => {
          if (o.id === orderId) {
            const updatedOrder = { ...o, status: nextStatus };
            if (nextStatus === 'Completed') {
              awardLoyaltyPointsIfQualifying(updatedOrder);
            }
            return updatedOrder;
          }
          return o;
        });
        onUpdateOrders(updated);
        toast.success(`Order ${orderId} updated to ${nextStatus}!`);
      }
    });
  };

  // Admin-controlled update for Payment Status
  const updatePaymentStatus = (order: Order) => {
    Swal.fire({
      title: 'Update Payment Status',
      html: `
        <div class="text-left space-y-2">
          <p class="text-xs text-slate-500 text-left">Update payment status for order <b>${order.id}</b> of <b>${order.customerName}</b></p>
          <p class="text-xs font-semibold text-slate-700 text-left">Order Grand Total: <b>₱${order.grandTotal.toLocaleString()}</b></p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Select & Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#64748b',
      input: 'select',
      inputOptions: {
        'Full Payment': 'Full Payment (Mark as Paid)',
        'Down Payment': 'Down Payment (Log deposit & partial balance)',
        'Pending - Waiting for Payment': 'Pending - Waiting for Payment'
      },
      inputValue: order.paymentType,
      inputPlaceholder: 'Select new payment status',
      inputValidator: (value) => {
        if (!value) {
          return 'You must select a payment status!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const selectedType = result.value as typeof order.paymentType;
        
        if (selectedType === 'Full Payment') {
          const updatedOrders = orders.map(o => {
            if (o.id === order.id) {
              return {
                ...o,
                paymentType: 'Full Payment' as const,
                downPaymentAmount: 0,
                remainingBalance: 0,
                amountPaid: o.grandTotal,
                change: 0
              };
            }
            return o;
          });
          onUpdateOrders(updatedOrders);
          toast.success(`Order ${order.id} updated to Full Payment.`);
          Swal.fire('Updated!', 'Payment status updated to Full Payment.', 'success');
        } else if (selectedType === 'Pending - Waiting for Payment') {
          const updatedOrders = orders.map(o => {
            if (o.id === order.id) {
              return {
                ...o,
                paymentType: 'Pending - Waiting for Payment' as const,
                downPaymentAmount: 0,
                remainingBalance: o.grandTotal,
                amountPaid: 0,
                change: 0
              };
            }
            return o;
          });
          onUpdateOrders(updatedOrders);
          toast.success(`Order ${order.id} updated to Waiting for Payment.`);
          Swal.fire('Updated!', 'Payment status set back to Waiting for Payment.', 'success');
        } else if (selectedType === 'Down Payment') {
          Swal.fire({
            title: 'Log Down Payment Amount',
            text: `Order grand total is ₱${order.grandTotal.toLocaleString()}. How much was collected as down payment?`,
            input: 'number',
            inputPlaceholder: 'Enter amount...',
            showCancelButton: true,
            confirmButtonText: 'Save Down Payment',
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#64748b',
            inputValidator: (val) => {
              const num = parseFloat(val);
              if (isNaN(num) || num < 0) {
                return 'Please enter a valid amount!';
              }
              if (num > order.grandTotal) {
                return 'Down payment cannot exceed Grand Total!';
              }
              return null;
            }
          }).then((amountResult) => {
            if (amountResult.isConfirmed && amountResult.value) {
              const dpAmount = parseFloat(amountResult.value);
              const remaining = order.grandTotal - dpAmount;
              const updatedOrders = orders.map(o => {
                if (o.id === order.id) {
                  return {
                    ...o,
                    paymentType: 'Down Payment' as const,
                    downPaymentAmount: dpAmount,
                    remainingBalance: remaining,
                    amountPaid: dpAmount,
                    change: 0
                  };
                }
                return o;
              });
              onUpdateOrders(updatedOrders);
              toast.success(`Order ${order.id} logged with ₱${dpAmount.toLocaleString()} Down Payment.`);
              Swal.fire('Updated!', `Down payment of ₱${dpAmount.toLocaleString()} saved. Outstanding balance: ₱${remaining.toLocaleString()}.`, 'success');
            }
          });
        }
      }
    });
  };

  // Restore original live orders history demo data
  const restoreDemoData = () => {
    Swal.fire({
      title: 'Restore Demo Orders History?',
      text: 'This will merge or restore the original live orders history database back into your local POS system history!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Restore History',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const existingIds = new Set(orders.map(o => o.id));
        const missingInitial = INITIAL_ORDERS.filter(o => !existingIds.has(o.id));
        const merged = [...orders, ...missingInitial];
        
        onUpdateOrders(merged);
        toast.success('Live orders history database successfully restored!');
        Swal.fire('Restored!', 'The original live orders history data has been restored/merged.', 'success');
      }
    });
  };

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders found to export!');
      return;
    }
    toast.info('Generating Excel/CSV export...');
    
    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Customer Name',
      'Customer Contact',
      'Items Summary',
      'Subtotal',
      'Discount',
      'Grand Total',
      'Payment Type',
      'Payment Method',
      'Downpayment Collected',
      'Remaining Balance',
      'Fulfillment Status',
      'Notes'
    ];

    const rows = filteredOrders.map(o => {
      const itemsSummary = o.items.map(it => `${it.product.name} (Qty: ${it.quantity})`).join('; ');
      return [
        o.id,
        o.date,
        o.time,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerContact || 'N/A',
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.subtotal,
        o.discount,
        o.grandTotal,
        `"${o.paymentType}"`,
        `"${o.paymentMethod}"`,
        o.downPaymentAmount,
        o.remainingBalance,
        `"${o.status}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
       
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JKM_Live_Orders_${selectedMonth !== 'All' ? selectedMonth : 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel/CSV file exported successfully!');
  };

  const exportToPDF = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders found to export!');
      return;
    }
    toast.info('Preparing PDF Report...');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to export PDF reports.');
      return;
    }

    const reportDateStr = new Date().toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalOutstanding = filteredOrders.reduce((sum, o) => sum + o.remainingBalance, 0);

    const rowsHtml = filteredOrders.map(o => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${o.id}</td>
        <td style="padding: 10px;">${o.date} <span style="font-size: 10px; color: #64748b; display: block;">${o.time}</span></td>
        <td style="padding: 10px;">
          <div style="font-weight: bold; color: #0f172a;">${o.customerName}</div>
          <div style="font-size: 10px; color: #64748b;">${o.customerContact || 'N/A'}</div>
        </td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px;">
          ${o.items.map(it => `<div>${it.product.name} &times; ${it.quantity}</div>`).join('')}
        </td>
        <td style="padding: 10px; font-family: monospace; text-align: right; font-weight: bold;">₱${o.grandTotal.toLocaleString()}</td>
        <td style="padding: 10px; font-family: monospace; text-align: right; color: ${o.remainingBalance > 0 ? '#d97706' : '#10b981'}; font-weight: bold;">
          ₱${o.remainingBalance.toLocaleString()}
        </td>
        <td style="padding: 10px; text-align: center;">
          <span style="
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            ${
              o.status === 'Completed' ? 'background-color: #ecfdf5; color: #047857;' :
              o.status === 'Printing' ? 'background-color: #f0f9ff; color: #0369a1;' :
              o.status === 'Ready for Pickup' ? 'background-color: #f5f3ff; color: #4338ca;' :
              'background-color: #fffbeb; color: #b45309;'
            }
          ">${o.status}</span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>JKM Prime Digital Prints - Orders Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.025em;
              color: #0f172a;
              margin: 0;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin: 4px 0 0 0;
            }
            .report-title {
              font-size: 18px;
              font-weight: 700;
              text-align: right;
              margin: 0;
              color: #0ea5e9;
            }
            .metadata {
              font-size: 11px;
              color: #64748b;
              text-align: right;
              margin-top: 5px;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
            }
            .card-label {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.05em;
            }
            .card-val {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 5px;
              font-family: monospace;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 11px;
            }
            th {
              background: #f1f5f9;
              padding: 12px 10px;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 10px;
              color: #475569;
              text-align: left;
              border-bottom: 2px solid #cbd5e1;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 20px;
              margin-top: 50px;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="company-name">JKM PRIME DIGITAL PRINTS</h1>
              <p class="subtitle">Precision Printing &bull; Premium Customization &bull; Fulfillments Report</p>
            </div>
            <div>
              <h2 class="report-title">Orders History Report</h2>
              <div class="metadata">
                Report Generated: <b>${reportDateStr}</b><br/>
                Month Filter: <b>${selectedMonth !== 'All' ? selectedMonth : 'All Months'}</b>
              </div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Selected Orders</div>
              <div class="card-val">${filteredOrders.length}</div>
            </div>
            <div class="card">
              <div class="card-label">Accumulated Revenue</div>
              <div class="card-val" style="color: #0ea5e9;">₱${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Active Balance</div>
              <div class="card-val" style="color: #ea580c;">₱${totalOutstanding.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Order ID</th>
                <th style="width: 15%;">Timestamp</th>
                <th style="width: 20%;">Client Details</th>
                <th style="width: 20%;">Purchased Items</th>
                <th style="width: 10%; text-align: right;">Total Price</th>
                <th style="width: 10%; text-align: right;">Balance</th>
                <th style="width: 10%; text-align: center;">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>JKM PRIME DIGITAL PRINTS &bull; Confidential Internal Report</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesMonth = true;
    if (selectedMonth !== 'All' && o.date) {
      matchesMonth = o.date.startsWith(selectedMonth);
    }

    let matchesSpecificDate = true;
    if (selectedSpecificDate && o.date) {
      matchesSpecificDate = o.date === selectedSpecificDate;
    }

    return matchesStatus && matchesSearch && matchesMonth && matchesSpecificDate;
  });

  const pendingOnlineOrders = orders.filter(
    (o) => o.status === 'Pending' && (o.notes?.includes('[Online Order Request]') || o.designLink)
  );

  return (
    <div className="space-y-4 text-slate-800">
      {pendingOnlineOrders.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-100 text-amber-800 p-2 rounded-lg shrink-0">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-2">
                Pending Online Inquiries ({pendingOnlineOrders.length})
              </p>
              <p className="text-[11px] text-amber-700">
                {pendingOnlineOrders.length} order requests awaiting pricing review, customer files, or payment confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterStatus('Pending');
              setSearchQuery('');
              setSelectedMonth('All');
              setSelectedSpecificDate('');
            }}
            className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            Review Pending
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3.5 shadow-2xs">
        
        {/* Row 1: Search and Export Actions */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or Client Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-colors font-mono"
            />
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={restoreDemoData}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restore / Merge Original Demo Orders History Database"
            >
              <span>Restore Demo Data</span>
            </button>
            <button
              onClick={exportToExcel}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export dynamic filter set as Microsoft Excel sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Compile and download fully stylized PDF audit sheet"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Row 2: Date Filters & Status Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          
          {/* Calendar & Month-Year Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Month Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedSpecificDate('');
                }}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-medium text-slate-800"
              >
                <option value="All">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-xs mr-0.5">Date:</span>
              <input
                type="date"
                value={selectedSpecificDate}
                onChange={(e) => {
                  setSelectedSpecificDate(e.target.value);
                  setSelectedMonth('All');
                }}
                className="bg-transparent focus:outline-none text-slate-800 text-xs font-mono cursor-pointer"
              />
              {selectedSpecificDate && (
                <button
                  onClick={() => setSelectedSpecificDate('')}
                  className="text-slate-400 hover:text-rose-600 text-[10px] ml-1 font-semibold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status Tab Filters */}
          <div className="flex flex-wrap gap-1 w-full md:w-auto justify-start md:justify-end">
            {['All', 'Pending', 'Printing', 'Ready for Pickup', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Orders Table Panel */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] font-semibold border-b border-slate-200/80 tracking-wider">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Customer Details</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total / Balance</th>
                <th className="px-4 py-3">Fulfillment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                let statusStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                if (order.status === 'Pending') statusStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                if (order.status === 'Printing') statusStyle = 'bg-sky-50 text-sky-800 border-sky-200';
                if (order.status === 'Ready for Pickup') statusStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                if (order.status === 'Completed') statusStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">{order.id}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      <span className="block text-slate-700 font-medium">{order.date}</span>
                      <span className="block text-slate-400 text-[10px] mt-0.5">{order.time}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-medium text-slate-900">{order.customerName}</span>
                      {order.customerContact && (
                        <span className="block text-slate-400 text-[10px] font-mono mt-0.5">{order.customerContact}</span>
                      )}
                      
                      {/* Delivery/Pickup Indicator & Details */}
                      {(() => {
                        const isDelivery = order.deliveryMethod === 'delivery' || order.notes?.toLowerCase().includes('delivery method: delivery');
                        const isPickup = order.deliveryMethod === 'pickup' || order.notes?.toLowerCase().includes('delivery method: pickup');
                        
                        let courierVal = order.selectedCourier;
                        let addressVal = order.deliveryAddress;
                        
                        if (isDelivery && !courierVal && order.notes) {
                          const courierMatch = order.notes.match(/Courier Choice:\s*([^\n]+)/i);
                          if (courierMatch) courierVal = courierMatch[1];
                        }
                        if (isDelivery && !addressVal && order.notes) {
                          const addressMatch = order.notes.match(/Delivery Address:\s*([^\n]+)/i);
                          if (addressMatch) addressVal = addressMatch[1];
                        }

                        if (isDelivery) {
                          return (
                            <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-700 space-y-0.5">
                              <span className="font-semibold text-slate-900">Delivery via {courierVal || 'Courier'}</span>
                              <div className="text-slate-500 truncate max-w-[200px]">{addressVal || 'Address not specified'}</div>
                            </div>
                          );
                        } else if (isPickup) {
                          return (
                            <div className="mt-1">
                              <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Store Pickup
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Customer Cloud Design Download Link */}
                      {(() => {
                        let linkVal = order.designLink;
                        if (!linkVal && order.notes) {
                          const linkMatch = order.notes.match(/Design Link:\s*([^\n]+)/i);
                          if (linkMatch && linkMatch[1].trim().startsWith('http')) {
                            linkVal = linkMatch[1].trim();
                          }
                        }
                        if (linkVal) {
                          return (
                            <div className="mt-1.5">
                              <a
                                href={linkVal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                title={linkVal}
                              >
                                <Link className="w-3 h-3" />
                                <span>Artwork File</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-xs">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <span className="block font-medium text-slate-900">₱{order.grandTotal.toLocaleString()}</span>
                      {order.remainingBalance > 0 ? (
                        <span className="block text-amber-700 font-medium">Bal: ₱{order.remainingBalance.toLocaleString()}</span>
                      ) : (
                        <span className="block text-emerald-700 font-medium">Paid</span>
                      )}
                      
                      {/* Payment Status Badge */}
                      <div className="mt-1">
                        {order.paymentType === 'Pending - Waiting for Payment' ? (
                          <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                            Awaiting Payment
                          </span>
                        ) : order.paymentType === 'Down Payment' ? (
                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            Down Payment
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                            Full Settlement
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => updateOrderStatus(order.id, order.status)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${statusStyle} hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current block" />
                        {order.status}
                        {order.status !== 'Completed' && <ArrowRight className="w-2.5 h-2.5 text-current inline" />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(order)}
                          className="text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                          title="Edit Order Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {order.remainingBalance > 0 && (
                          <button
                            onClick={() => settleRemainingBalance(order)}
                            className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer border border-emerald-200"
                            title="Settle Outstanding Downpayment"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[10px]">Settle</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewReceipt(order)}
                          className="text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="Generate printable receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        {userRole === 'Manager' && (
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-rose-600 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT DETAILS MODAL */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 my-8"
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-400">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm uppercase tracking-wide">Edit Order Details</h3>
                    <p className="text-[10px] font-mono tracking-widest text-slate-400 leading-none mt-0.5">Order ID: {editingOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-150 bg-slate-50 px-6">
                <button
                  type="button"
                  onClick={() => setActiveEditTab('details')}
                  className={`py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
                    activeEditTab === 'details'
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  General Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('tracking')}
                  className={`py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
                    activeEditTab === 'tracking'
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Tracking & Milestones
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('payment-files')}
                  className={`py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
                    activeEditTab === 'payment-files'
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Payments & Files
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {activeEditTab === 'details' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Customer Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name</label>
                        <input
                          type="text"
                          required
                          value={editCustomerName}
                          onChange={(e) => setEditCustomerName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      {/* Customer Contact */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                        <input
                          type="text"
                          value={editCustomerContact}
                          onChange={(e) => setEditCustomerContact(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Product Name Dropdown Sourced from POS */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Purchased</label>
                      <select
                        required
                        value={editProductName}
                        onChange={(e) => {
                          setEditProductName(e.target.value);
                          const matched = PRODUCTS.find(p => p.name === e.target.value);
                          if (matched) {
                            setEditSubtotal(matched.basePrice * editQuantity);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                      >
                        <option value="">-- Select Product --</option>
                        {PRODUCTS.map(p => (
                          <option key={p.id} value={p.name}>{p.name} (₱{p.basePrice})</option>
                        ))}
                        <option value="Customized Print">Customized Print</option>
                        {!PRODUCTS.some(p => p.name === editProductName) && editProductName !== 'Customized Print' && editProductName !== '' && (
                          <option value={editProductName}>{editProductName}</option>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Quantity */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={editQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setEditQuantity(val);
                            const matched = PRODUCTS.find(p => p.name === editProductName);
                            if (matched) {
                              setEditSubtotal(matched.basePrice * val);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subtotal (₱)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={editSubtotal}
                          onChange={(e) => setEditSubtotal(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      {/* Discount */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount (₱)</label>
                        <input
                          type="number"
                          min={0}
                          value={editDiscount}
                          onChange={(e) => setEditDiscount(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Down Payment */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Down Payment (₱)</label>
                        <input
                          type="number"
                          min={0}
                          value={editDownPayment}
                          onChange={(e) => setEditDownPayment(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                        <select
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="GCash">GCash</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Payment Type Selection (Conditional for Online orders vs POS) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
                        {editingOrder.id.startsWith('JKM-ONLINE') ? (
                          <select
                            value={editPaymentType}
                            onChange={(e) => setEditPaymentType(e.target.value as PaymentType)}
                            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-600 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            <option value="Pending Payment Verification">Pending Payment Verification</option>
                            <option value="Down Payment Received">Down Payment Received</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Fully Paid">Fully Paid</option>
                            <option value="Payment Settled">Payment Settled</option>
                          </select>
                        ) : (
                          <select
                            value={editPaymentType}
                            onChange={(e) => setEditPaymentType(e.target.value as PaymentType)}
                            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-600 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            <option value="Full Payment">Full Payment (Walk-In)</option>
                            <option value="Down Payment">Down Payment (Walk-In)</option>
                            <option value="Pending - Waiting for Payment">Pending - Waiting for Payment</option>
                          </select>
                        )}
                      </div>

                      {/* Delivery Method */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Method</label>
                        <select
                          value={editDeliveryMethod}
                          onChange={(e) => setEditDeliveryMethod(e.target.value as 'pickup' | 'delivery')}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="pickup">Pick-up at GHQ</option>
                          <option value="delivery">Courier Delivery</option>
                        </select>
                      </div>
                    </div>

                    {editDeliveryMethod === 'delivery' && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-sky-50/50 border border-sky-100 rounded-2xl animate-fadeIn">
                        {/* Courier */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courier</label>
                          <select
                            value={editSelectedCourier}
                            onChange={(e) => setEditSelectedCourier(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            <option value="Lalamove">Lalamove</option>
                            <option value="Joyride">Joyride</option>
                            <option value="Grab">Grab</option>
                            <option value="J&T Express">J&T Express</option>
                          </select>
                        </div>

                        {/* Address */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address</label>
                          <input
                            type="text"
                            value={editDeliveryAddress}
                            onChange={(e) => setEditDeliveryAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Design Cloud Link */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Design Cloud Link</label>
                      <input
                        type="url"
                        placeholder="Paste Drive, Canva, Dropbox, Imgur, etc."
                        value={editDesignLink}
                        onChange={(e) => setEditDesignLink(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes / Instructions</label>
                      <textarea
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>
                ) : activeEditTab === 'tracking' ? (
                  // TRACKING AND MILESTONES TAB
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Estimated Completion Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Completion Date</label>
                        <input
                          type="date"
                          value={editEstimatedCompletionDate}
                          onChange={(e) => setEditEstimatedCompletionDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      {/* Overall Fulfillment Status */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-600 focus:outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Order Received">Order Received</option>
                          <option value="Payment Verified">Payment Verified</option>
                          <option value="Preparing Design">Preparing Design</option>
                          <option value="Waiting for Approval">Waiting for Approval</option>
                          <option value="Printing in Progress">Printing in Progress</option>
                          <option value="Quality Checking">Quality Checking</option>
                          <option value="Ready for Pickup">Ready for Pickup</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {editDeliveryMethod === 'delivery' && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        {/* Delivery Status */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courier State</label>
                          <select
                            value={editDeliveryStatus}
                            onChange={(e) => setEditDeliveryStatus(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none"
                          >
                            <option value="Waiting for Shipment">Waiting for Shipment</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>

                        {/* Date Shipped */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Shipped</label>
                          <input
                            type="date"
                            value={editDateShipped}
                            onChange={(e) => setEditDateShipped(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Progress Milestone Append Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                        <h4 className="font-sans font-black text-xs text-slate-700 uppercase tracking-wider">Add Progress Update (Timeline)</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Milestone</label>
                          <select
                            value={newMilestoneStatus}
                            onChange={(e) => setNewMilestoneStatus(e.target.value as OrderStatus)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          >
                            <option value="Order Received">Order Received</option>
                            <option value="Payment Verified">Payment Verified</option>
                            <option value="Preparing Design">Preparing Design</option>
                            <option value="Waiting for Approval">Waiting for Approval</option>
                            <option value="Printing in Progress">Printing in Progress</option>
                            <option value="Quality Checking">Quality Checking</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Photo Attachment</label>
                          <select
                            value={newMilestoneImage}
                            onChange={(e) => setNewMilestoneImage(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          >
                            <option value="">No Photo Attached</option>
                            <option value="https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=150&auto=format&fit=crop">GCash Payment Verified Screen</option>
                            <option value="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop">Vector Artwork Proofing Layout</option>
                            <option value="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop">Plotter Printing Machine Queue</option>
                            <option value="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=150&auto=format&fit=crop">Sealed Delivery Package Box</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Public Note for Customer</label>
                        <textarea
                          placeholder="Provide details about the progress of this order update..."
                          value={newMilestoneNote}
                          onChange={(e) => setNewMilestoneNote(e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newMilestoneNote.trim()) {
                            toast.error('Please input a milestone remark.');
                            return;
                          }
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          const nextItem = {
                            status: newMilestoneStatus,
                            timestamp: `${todayStr} ${timeStr}`,
                            note: newMilestoneNote.trim(),
                            images: newMilestoneImage ? [newMilestoneImage] : []
                          };

                          const updatedTimeline = [...(editingOrder.trackingUpdates || []), nextItem];
                          setEditingOrder({
                            ...editingOrder,
                            trackingUpdates: updatedTimeline
                          });
                          setEditStatus(newMilestoneStatus);
                          setNewMilestoneNote('');
                          setNewMilestoneImage('');
                          toast.success('Progress milestone added directly!');
                        }}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Append Milestone Update
                      </button>
                    </div>

                    {/* Timeline Tracker Milestones Preview list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Current Milestone Timeline</span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {(!editingOrder.trackingUpdates || editingOrder.trackingUpdates.length === 0) ? (
                          <p className="text-[10px] text-slate-400 italic text-center py-4">No tracking history milestones logged yet.</p>
                        ) : (
                          editingOrder.trackingUpdates.map((m, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-start text-[11px] gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sky-600 uppercase font-mono text-[9px] bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100">{m.status}</span>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold">{m.timestamp}</span>
                                </div>
                                <p className="text-slate-600 leading-normal text-[10px] font-medium">{m.note}</p>
                                {m.images && m.images.length > 0 && (
                                  <div className="flex gap-1.5 pt-1">
                                    {m.images.map((img, iIndex) => (
                                      <img key={iIndex} src={img} alt="Attachment Proof" className="w-8 h-8 rounded object-cover border border-slate-200" />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedTimeline = editingOrder.trackingUpdates?.filter((_, itemI) => itemI !== idx) || [];
                                  setEditingOrder({
                                    ...editingOrder,
                                    trackingUpdates: updatedTimeline
                                  });
                                  toast.success('Milestone removed!');
                                }}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // PAYMENTS & FILES TAB
                  <div className="space-y-6">
                    {/* Customer Uploaded Files */}
                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-3">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <FileText className="w-4 h-4 text-sky-500" />
                        <h4 className="font-sans font-black text-xs text-slate-700 uppercase tracking-wider">Customer Uploaded Files ({editingOrder.uploadedFiles?.length || 0})</h4>
                      </div>

                      {(!editingOrder.uploadedFiles || editingOrder.uploadedFiles.length === 0) ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">No layout or image files uploaded for this order.</p>
                      ) : (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto">
                          {editingOrder.uploadedFiles.map((file, fIdx) => (
                            <div key={fIdx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-[11px] gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 block truncate" title={file.name}>{file.name}</span>
                                <span className="text-slate-400 font-mono text-[9px] block">Size: {file.size || 'Unknown'} • Uploaded: {file.date || 'N/A'}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-sky-50 hover:bg-sky-100 text-sky-600 p-2 rounded-lg transition-colors flex items-center justify-center"
                                  title="Open Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-2 rounded-lg transition-colors flex items-center justify-center"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Submissions */}
                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-3">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-sans font-black text-xs text-slate-700 uppercase tracking-wider">GCash / Bank Payment Proofs ({editingOrder.paymentSubmissions?.length || 0})</h4>
                      </div>

                      {(!editingOrder.paymentSubmissions || editingOrder.paymentSubmissions.length === 0) ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">No manual payment verification requests submitted yet.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                          {editingOrder.paymentSubmissions.map((sub, sIdx) => (
                            <div key={sub.id || sIdx} className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 text-xs block">₱{sub.amount.toLocaleString()} via {sub.method}</span>
                                  <span className="text-slate-500 text-[10px] block font-mono font-bold">Reference Number: {sub.referenceNumber}</span>
                                  <span className="text-slate-400 text-[9px] block">Submitted Date: {sub.date || 'N/A'}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  sub.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : sub.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              {sub.proofImage && (
                                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 relative aspect-[16/9] group max-h-[140px]">
                                  <img 
                                    src={sub.proofImage} 
                                    alt="Payment Receipt Proof" 
                                    className="w-full h-full object-cover"
                                  />
                                  <a
                                    href={sub.proofImage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-bold text-xs"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Full Receipt
                                  </a>
                                </div>
                              )}

                              {sub.status === 'Pending' && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePayment(sub.id)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectPayment(sub.id)}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Auto summary calculation display always visible at the footer */}
                <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-1 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>₱{editSubtotal.toLocaleString()}</span>
                  </div>
                  {editDiscount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount Applied:</span>
                      <span>- ₱{editDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs text-sky-400 border-t border-slate-800 pt-1">
                    <span>Grand Total:</span>
                    <span>₱{Math.max(0, editSubtotal - editDiscount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 border-t border-slate-800/50 pt-1">
                    <span>Amount Received / DP:</span>
                    <span>₱{editDownPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs text-emerald-400 border-t border-slate-800 pt-1">
                    <span>Remaining Balance:</span>
                    <span>₱{Math.max(0, (editSubtotal - editDiscount) - editDownPayment).toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 transition-colors cursor-pointer"
                  >
                    Save & Update Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTLE BALANCE MODAL */}
      <AnimatePresence>
        {settlingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-100" />
                  <div>
                    <h3 className="font-sans font-black text-sm uppercase tracking-wide">Settle Remaining Balance</h3>
                    <p className="text-[10px] text-emerald-100/90 font-mono">Order: {settlingOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettlingOrder(null)}
                  className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!settlingOrder) return;

                  const amt = Number(settleAmount) || 0;
                  if (amt <= 0) {
                    toast.error('Payment amount must be greater than zero.');
                    return;
                  }

                  const updatedOrders = orders.map(o => {
                    if (o.id === settlingOrder.id) {
                      const newAmountPaid = o.amountPaid + amt;
                      const newRemaining = Math.max(0, o.remainingBalance - amt);
                      
                      // Payment status update
                      const isFullyPaid = newRemaining <= 0;
                      const newPayType = isFullyPaid ? 'Fully Paid' : 'Partially Paid';

                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      const currentTimeline = [...(o.trackingUpdates || [])];
                      currentTimeline.push({
                        status: isFullyPaid ? ('Payment Verified' as const) : o.status,
                        timestamp: `${todayStr} ${timeStr}`,
                        note: `Payment of ₱${amt} verified via ${settleMethod}. ${settleNotes ? `Ref: ${settleNotes}.` : ''} Remaining balance: ₱${newRemaining.toLocaleString()}`,
                        images: []
                      });

                      return {
                        ...o,
                        amountPaid: newAmountPaid,
                        remainingBalance: newRemaining,
                        paymentType: newPayType as any,
                        paymentMethod: settleMethod,
                        trackingUpdates: currentTimeline,
                        // If it is fully paid, maybe transition status if ready
                        status: (isFullyPaid && o.status === 'Order Received') ? 'Payment Verified' as const : o.status
                      };
                    }
                    return o;
                  });

                  onUpdateOrders(updatedOrders);
                  setSettlingOrder(null);
                  toast.success(`Payment of ₱${amt} verified & logged!`);
                  Swal.fire({
                    title: 'Payment Logged!',
                    text: `Successfully received ₱${amt} via ${settleMethod}. Order balance is updated.`,
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                  });
                }}
                className="p-6 space-y-4"
              >
                {/* Info summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Customer:</span>
                    <span className="text-slate-800 font-black">{settlingOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Grand Total:</span>
                    <span className="text-slate-800 font-black">₱{settlingOrder.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-200/60 pt-2 text-emerald-600 font-black">
                    <span>Outstanding Balance:</span>
                    <span>₱{settlingOrder.remainingBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Settle Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settle Amount (₱) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={settlingOrder.remainingBalance}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Settle Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method *</label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Settle Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference / Transaction ID / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. GCash Ref: #901239"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSettlingOrder(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                  >
                    Post Payment
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
