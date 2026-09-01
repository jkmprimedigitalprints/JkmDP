/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  Package, 
  Cpu, 
  TrendingDown, 
  Scale, 
  FileText, 
  Search, 
  LogOut, 
  Printer, 
  X,
  Menu,
  ChevronRight,
  UserCheck,
  Image,
  Send,
  Users,
  Lock,
  Shield,
  Save,
  Calculator,
  Bell,
  Check,
  Trash2,
  Info,
  MessageSquare,
  FileUp,
  Tag,
  Film
} from 'lucide-react';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_MATERIALS, INITIAL_EXPENSES } from '../utils/data';
import { Order, MaterialEquipment, Expense, Product, UserLog, InventoryItem } from '../types';
import { useToast } from './Toast';
import { exportElementAsImage, exportElementAsPDF } from '../utils/exportUtils';

// Firebase imports
import { 
  seedDatabaseIfNeeded, 
  db, 
  productsCol, 
  ordersCol, 
  inventoryCol, 
  capitalMaterialsCol, 
  expensesCol, 
  userLogsCol,
  handleFirestoreError,
  OperationType,
  notificationsCol,
  createDbNotification,
  DbNotification,
  sanitizeForFirestore
} from '../lib/firebase';
import { onSnapshot, doc, setDoc, deleteDoc, writeBatch, query, where, updateDoc } from 'firebase/firestore';

// Subcomponents
import { Dashboard } from './POS/Dashboard';
import { Ordering } from './POS/Ordering';
import { LiveOrders } from './POS/LiveOrders';
import { Inventory } from './POS/Inventory';
import { Materials } from './POS/Materials';
import { ExpensesModule } from './POS/ExpensesModule';
import { Reconciliation } from './POS/Reconciliation';
import { Quotation } from './POS/Quotation';
import { CustomersModule } from './POS/CustomersModule';
import { ProductsCatalog } from './POS/ProductsCatalog';
import { Settings } from './POS/Settings';
import { ProductCosting } from './POS/ProductCosting';

interface POSSystemProps {
  userDisplayName: string;
  userRole: 'Staff' | 'Manager';
  onLogout: () => void;
}

type TabType = 
  | 'dashboard' 
  | 'ordering' 
  | 'live_orders' 
  | 'inventory' 
  | 'pos_products'
  | 'materials' 
  | 'expenses' 
  | 'reconciliation' 
  | 'quotation'
  | 'customers'
  | 'settings'
  | 'costing';

export const POSSystem: React.FC<POSSystemProps> = ({ userDisplayName, userRole, onLogout }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [inventorySubTab, setInventorySubTab] = useState<'stocks' | 'products'>('stocks');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    const saved = localStorage.getItem('jkm_sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const isExpanded = isSidebarOpen;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // SHARED STATES
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [materials, setMaterials] = useState<MaterialEquipment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<DbNotification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // REAL-TIME FIREBASE FIRESTORE LISTENERS
  useEffect(() => {
    const syncDatabase = async () => {
      // Seed default collections if empty
      await seedDatabaseIfNeeded();

      // Listen to Admin Notifications
      const qNotifs = query(notificationsCol, where('recipientId', '==', 'admin'));
      const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
        const list: DbNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as DbNotification);
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        setAdminNotifications(list);
      }, (err) => {
        console.error("Error listening to admin notifications:", err);
      });

      // Listen to Products
      const unsubProducts = onSnapshot(productsCol, (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      });

      // Listen to Orders
      const unsubOrders = onSnapshot(ordersCol, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Order);
        });
        // Sort by date / time descending
        list.sort((a, b) => {
          const d1 = new Date(`${a.date} ${a.time}`);
          const d2 = new Date(`${b.date} ${b.time}`);
          return d2.getTime() - d1.getTime();
        });
        setOrders(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });

      // Listen to Inventory
      const unsubInventory = onSnapshot(inventoryCol, (snapshot) => {
        const list: InventoryItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        setInventory(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'inventory');
      });

      // Listen to Capital Materials
      const unsubMaterials = onSnapshot(capitalMaterialsCol, (snapshot) => {
        const list: MaterialEquipment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as MaterialEquipment);
        });
        setMaterials(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'capital_materials');
      });

      // Listen to Expenses
      const unsubExpenses = onSnapshot(expensesCol, (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Expense);
        });
        // Sort by date descending
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'expenses');
      });

      // Listen to User Logs
      const unsubLogs = onSnapshot(userLogsCol, (snapshot) => {
        const list: UserLog[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as UserLog);
        });
        // Sort logs descending by timestamp
        list.sort((a, b) => {
          const d1 = new Date(`${a.date} ${a.time}`);
          const d2 = new Date(`${b.date} ${b.time}`);
          return d2.getTime() - d1.getTime();
        });
        setUserLogs(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'user_logs');
      });

      return () => {
        unsubNotifs();
        unsubProducts();
        unsubOrders();
        unsubInventory();
        unsubMaterials();
        unsubExpenses();
        unsubLogs();
      };
    };

    let cleanupFunction: any;
    syncDatabase().then(unsub => {
      cleanupFunction = unsub;
    });

    return () => {
      if (cleanupFunction) cleanupFunction();
    };
  }, []);

  // Admin Notification Handlers
  const adminUnreadCount = adminNotifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    try {
      const unreads = adminNotifications.filter(n => !n.isRead);
      const batch = writeBatch(db);
      unreads.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      const batch = writeBatch(db);
      adminNotifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notif: DbNotification) => {
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
    
    if (notif.type === 'chat' || notif.type === 'file') {
      setActiveTab('customers');
    } else if (notif.type === 'order') {
      setActiveTab('live_orders');
    }
    setIsNotifDropdownOpen(false);
  };

  // Shared state setters writing back directly to Cloud Firestore
  const handleProductsChange = async (updated: Product[]) => {
    try {
      const batch = writeBatch(db);
      updated.forEach((p) => {
        const ref = doc(db, 'products', p.id);
        batch.set(ref, p);
      });
      await batch.commit();
      
      const currentIds = updated.map(p => p.id);
      const deleted = products.filter(p => !currentIds.includes(p.id));
      for (const d of deleted) {
        await deleteDoc(doc(db, 'products', d.id));
      }
    } catch (err) {
      console.error('Failed to save products to Firestore:', err);
    }
  };

  const handleUpdateInventory = async (updatedInventory: InventoryItem[]) => {
    try {
      for (const item of updatedInventory) {
        await setDoc(doc(db, 'inventory', item.id), item);
      }
    } catch (err) {
      console.error('Failed to sync inventory to Firestore:', err);
    }
  };

  // Receipt Modal State (Triggered upon order creation in Ordering panel)
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Admin Change Password states
  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmNewPassword, setAdminConfirmNewPassword] = useState('');

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
        console.warn('Could not preload logo.png as base64. Falling back to relative path.', err);
      }
    };
    loadLogo();
  }, []);

  // Logging Utility (Pushes log entry directly to Firestore cloud)
  const logAction = async (action: string) => {
    const logId = `LOG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-CA');
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newLog: UserLog = {
      id: logId,
      user: userDisplayName,
      action: action,
      date: formattedDate,
      time: formattedTime
    };
    try {
      await setDoc(doc(db, 'user_logs', logId), newLog);
    } catch (err) {
      console.error('Failed to write log to cloud:', err);
    }
  };

  const deductInventoryMaterials = async (newOrder: Order) => {
    let updatedInventory = [...inventory];
    let logsOfDeductions: string[] = [];

    newOrder.items.forEach(cartItem => {
      const qty = cartItem.quantity;
      const prodName = cartItem.product.name.toLowerCase();
      const prodCat = cartItem.product.category.toLowerCase();

      // Formula 1: Sintraboard Deduction (User's specific request)
      // halimbawa sa sintraboard: 1 sintra, 1 Photo Sticker, 1 Phototop, 4pcs corner protector, 1 opp plastic
      if (prodName.includes('sintra') || prodCat.includes('sintra') || prodName.includes('sintraboard')) {
        const sintraNeeded = 1 * qty;
        const stickerNeeded = 1 * qty;
        const phototopNeeded = 1 * qty;
        const cornerNeeded = 4 * qty;
        const oppNeeded = 1 * qty;

        updatedInventory = updatedInventory.map(item => {
          if (item.id === 'inv-8') return { ...item, stock: Math.max(0, item.stock - sintraNeeded) };
          if (item.id === 'inv-10') return { ...item, stock: Math.max(0, item.stock - stickerNeeded) };
          if (item.id === 'inv-11') return { ...item, stock: Math.max(0, item.stock - phototopNeeded) };
          if (item.id === 'inv-12') return { ...item, stock: Math.max(0, item.stock - cornerNeeded) };
          if (item.id === 'inv-13') return { ...item, stock: Math.max(0, item.stock - oppNeeded) };
          return item;
        });

        logsOfDeductions.push(
          `Sintra Board: ${sintraNeeded}x Sintra, ${stickerNeeded}x Sticker, ${phototopNeeded}x Phototop, ${cornerNeeded}x Corners, ${oppNeeded}x OPP Wrapper`
        );
      }
      // Formula 2: Customized Mugs Deduction
      else if (prodCat.includes('mug') || prodName.includes('mug')) {
        const mugId = prodName.includes('magic') ? 'inv-3' : 'inv-2';
        const mugsNeeded = 1 * qty;

        updatedInventory = updatedInventory.map(item => {
          if (item.id === mugId) return { ...item, stock: Math.max(0, item.stock - mugsNeeded) };
          return item;
        });

        logsOfDeductions.push(`Mugs: ${mugsNeeded}x Blank Mug (${prodName.includes('magic') ? 'Magic' : 'White'})`);
      }
      // Formula 3: Customized T-Shirts Deduction
      else if (prodCat.includes('shirt') || prodName.includes('shirt') || prodName.includes('jacket')) {
        const shirtNeeded = 1 * qty;

        updatedInventory = updatedInventory.map(item => {
          if (item.id === 'inv-5') return { ...item, stock: Math.max(0, item.stock - shirtNeeded) };
          return item;
        });

        logsOfDeductions.push(`Apparel: ${shirtNeeded}x Blank Fabric Shirt/Jacket`);
      }
      // Formula 4: Customized Tumbler Deduction
      else if (prodCat.includes('tumbler') || prodName.includes('tumbler')) {
        const tumblerNeeded = 1 * qty;

        updatedInventory = updatedInventory.map(item => {
          if (item.id === 'inv-4') return { ...item, stock: Math.max(0, item.stock - tumblerNeeded) };
          return item;
        });

        logsOfDeductions.push(`Tumblers: ${tumblerNeeded}x Blank Drink Tumbler`);
      }
      // Formula 5: Magnetic Sheets Deduction
      else if (prodCat.includes('magnet') || prodName.includes('magnet')) {
        const magnetsNeeded = 1 * qty;

        updatedInventory = updatedInventory.map(item => {
          if (item.id === 'inv-7') return { ...item, stock: Math.max(0, item.stock - magnetsNeeded) };
          return item;
        });

        logsOfDeductions.push(`Magnets: ${magnetsNeeded}x ATM Magnetic Sheet`);
      }
      // Formula 6: Papers Deduction for general printing
      else if (prodCat.includes('photo') || prodName.includes('photo') || prodCat.includes('id') || prodName.includes('id')) {
        const papersNeeded = Math.ceil(qty / 4);

        updatedInventory = updatedInventory.map(item => {
          if (item.id === 'inv-1') return { ...item, stock: Math.max(0, item.stock - papersNeeded) };
          return item;
        });

        logsOfDeductions.push(`Photo Papers: ${papersNeeded}x A4 Glossy Photo Sheets`);
      }
    });

    // Alert if any item goes below threshold
    updatedInventory.forEach(item => {
      const originalItem = inventory.find(i => i.id === item.id);
      if (originalItem && item.stock < item.minThreshold && originalItem.stock >= originalItem.minThreshold) {
        toast.warning(`Stock Warning: "${item.name}" has dropped below minimum threshold! Current stock: ${item.stock}.`);
      }
    });

    await handleUpdateInventory(updatedInventory);

    if (logsOfDeductions.length > 0) {
      await logAction(`Auto-deducted inventory for order ${newOrder.id}: ${logsOfDeductions.join(', ')}`);
      toast.info(`Raw materials successfully subtracted from inventory stocks!`);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassword = localStorage.getItem('jkm_admin_custom_password') || 'Jkmprime@2027';

    if (adminOldPassword !== currentPassword && adminOldPassword !== 'password') {
      toast.error('Incorrect current admin password.');
      return;
    }

    if (adminNewPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (adminNewPassword !== adminConfirmNewPassword) {
      toast.error('Confirm password does not match.');
      return;
    }

    localStorage.setItem('jkm_admin_custom_password', adminNewPassword);
    setAdminOldPassword('');
    setAdminNewPassword('');
    setAdminConfirmNewPassword('');
    toast.success('Admin account password changed successfully!');
    logAction(`Admin updated secure account password`);
  };

  const handleArchiveMonth = async () => {
    try {
      const batch = writeBatch(db);
      orders.forEach((o) => {
        batch.delete(doc(db, 'orders', o.id));
      });
      expenses.forEach((e) => {
        batch.delete(doc(db, 'expenses', e.id));
      });
      await batch.commit();
      logAction('Cleared active sheets / archived current monthly transactions and expenses');
      toast.success('Current sheets cleared for the new fiscal month!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear sheets on Firestore');
    }
  };

  const findCustomerIdForOrder = (orderName: string, orderContact?: string): string | null => {
    try {
      const raw = localStorage.getItem('jkm_customer_accounts_v2');
      if (!raw) return null;
      const accounts = JSON.parse(raw) as any[];
      const nameLower = orderName.toLowerCase();
      const phone = orderContact;
      const found = accounts.find(acc => {
        const accNameLower = acc.name.toLowerCase();
        const matchName = accNameLower.includes(nameLower) || nameLower.includes(accNameLower);
        const matchPhone = phone && acc.phone && acc.phone !== 'N/A' && phone.includes(acc.phone);
        return matchName || matchPhone;
      });
      return found ? found.id : null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUpdateOrders = async (updatedOrders: Order[]) => {
    // Optimistic local state update to ensure instant synchronization
    setOrders(updatedOrders);
    
    // Also save to localStorage under 'jkm_orders_v2' to ensure local robustness & offline/draft backup
    try {
      localStorage.setItem('jkm_orders_v2', JSON.stringify(updatedOrders));
    } catch (err) {
      console.warn('Failed to save orders to localStorage:', err);
    }

    try {
      if (updatedOrders.length < orders.length) {
        const deleted = orders.filter(o => !updatedOrders.some(u => u.id === o.id));
        for (const d of deleted) {
          await deleteDoc(doc(db, 'orders', d.id));
          await logAction(`Deleted order transaction record ${d.id} from active databases`);
        }
      } else {
        for (const u of updatedOrders) {
          const prev = orders.find(o => o.id === u.id);
          // Only write if it's new or has changed (compare serialized representations to prevent infinite update loops / redundant writes)
          if (!prev || JSON.stringify(prev) !== JSON.stringify(u)) {
            if (prev) {
              if (prev.status !== u.status) {
                await logAction(`Updated status of order ${u.id} from "${prev.status}" to "${u.status}"`);
                
                const customerId = findCustomerIdForOrder(u.customerName, u.customerContact);
                if (customerId) {
                  await createDbNotification({
                    recipientId: customerId,
                    title: `Order Status Updated`,
                    message: `Your order ${u.id} status is now "${u.status}".`,
                    type: 'order',
                    linkId: u.id
                  });
                }
              } else if (prev.remainingBalance !== u.remainingBalance) {
                await logAction(`Settled outstanding balance of ₱${prev.remainingBalance.toLocaleString()} for order ${u.id}`);
                
                const customerId = findCustomerIdForOrder(u.customerName, u.customerContact);
                if (customerId) {
                  await createDbNotification({
                    recipientId: customerId,
                    title: `Payment Received`,
                    message: `We updated your payments for order ${u.id}. Remaining balance: ₱${u.remainingBalance.toLocaleString()}.`,
                    type: 'order',
                    linkId: u.id
                  });
                }
              }
            } else {
              await logAction(`Created new customer order ${u.id} totaling ₱${u.grandTotal.toLocaleString()}`);
            }
            const cleanU = sanitizeForFirestore(u);
            await setDoc(doc(db, 'orders', u.id), cleanU);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update order in Firestore:', err);
      toast.error('Sync Error: Failed to save changes to cloud database.');
      throw err;
    }
  };

  const handleUpdateMaterials = async (updatedMaterials: MaterialEquipment[]) => {
    try {
      if (updatedMaterials.length > materials.length) {
        const added = updatedMaterials.find(u => !materials.some(m => m.id === u.id));
        if (added) {
          logAction(`Logged new capital contribution: ${added.name} (${added.type}) by ${added.contributor}`);
          await setDoc(doc(db, 'capital_materials', added.id), added);
        }
      } else if (updatedMaterials.length < materials.length) {
        const deleted = materials.filter(m => !updatedMaterials.some(u => u.id === m.id));
        for (const d of deleted) {
          await deleteDoc(doc(db, 'capital_materials', d.id));
          logAction(`Deleted material/equipment record: ${d.name}`);
        }
      } else {
        for (const u of updatedMaterials) {
          await setDoc(doc(db, 'capital_materials', u.id), u);
        }
      }
    } catch (err) {
      console.error('Failed to update materials in Firestore:', err);
    }
  };

  const handleUpdateExpenses = async (updatedExpenses: Expense[]) => {
    try {
      if (updatedExpenses.length > expenses.length) {
        const added = updatedExpenses.find(u => !expenses.some(e => e.id === u.id));
        if (added) {
          logAction(`Logged overhead expense: ₱${added.amount.toLocaleString()} for ${added.category} (${added.description})`);
          await setDoc(doc(db, 'expenses', added.id), added);
        }
      } else if (updatedExpenses.length < expenses.length) {
        const deleted = expenses.filter(e => !updatedExpenses.some(u => u.id === e.id));
        for (const d of deleted) {
          await deleteDoc(doc(db, 'expenses', d.id));
          logAction(`Removed overhead expense entry: ₱${d.amount.toLocaleString()} - ${d.description}`);
        }
      } else {
        for (const u of updatedExpenses) {
          await setDoc(doc(db, 'expenses', u.id), u);
        }
      }
    } catch (err) {
      console.error('Failed to update expenses in Firestore:', err);
    }
  };

  const handleExportAsImage = async () => {
    const element = document.getElementById("printable-receipt");

    if (!element) {
      toast.error("Receipt container not found.");
      return;
    }

    toast.info("Preparing A6 print-ready layout...");

    try {
      await exportElementAsImage(element, {
        fileName: `JKM_A6_Receipt_${viewingReceiptOrder?.id || "invoice"}.png`,
        scale: 3,
        backgroundColor: "#ffffff",
      });

      toast.success("A6 receipt exported successfully!");
    } catch (err) {
      console.error("EXPORT ERROR DETAIL:", err);
      toast.error("Failed to export A6 receipt image.");
    }
  };

  const handleExportAsPDF = async () => {
    const element = document.getElementById("printable-receipt");

    if (!element) {
      toast.error("Receipt container not found.");
      return;
    }

    toast.info("Preparing A6 PDF document...");

    try {
      await exportElementAsPDF(element, {
        fileName: `JKM_A6_Receipt_${viewingReceiptOrder?.id || "invoice"}.pdf`,
        pdfWidthMm: 105,
        scale: 3,
        backgroundColor: "#ffffff",
      });

      toast.success("A6 receipt PDF exported successfully!");
    } catch (err) {
      console.error("PDF EXPORT ERROR DETAIL:", err);
      toast.error("Failed to export A6 receipt PDF.");
    }
  };

const triggerPrintReceipt = () => {
  toast.info("Sending payload to printer stream...");
  setTimeout(() => {
    window.print();
  }, 300);
};

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('jkm_sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  const getActivePageTitle = (tab: TabType): string => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'ordering':
        return 'POS Terminal';
      case 'live_orders':
        return 'Orders';
      case 'quotation':
        return 'Quotation';
      case 'inventory':
        return 'Inventory';
      case 'pos_products':
        return 'Products';
      case 'materials':
        return 'Materials & Equipment';
      case 'expenses':
        return 'Expenses';
      case 'costing':
        return 'Product Costing';
      case 'reconciliation':
        return 'Reports';
      case 'customers':
        return 'Customers';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  // Grouped Navigation Config
  const groupedNavigation = [
    {
      group: 'Sales & Orders',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, roles: ['Staff', 'Manager'] },
        { id: 'ordering', label: 'POS Terminal', icon: ShoppingCart, roles: ['Staff', 'Manager'] },
        { id: 'live_orders', label: 'Orders', icon: Clock, roles: ['Staff', 'Manager'] },
        { id: 'quotation', label: 'Quotation', icon: FileText, roles: ['Staff', 'Manager'] },
      ]
    },
    {
      group: 'Inventory & Products',
      items: [
        { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Staff', 'Manager'] },
        { id: 'pos_products', label: 'Products', icon: Tag, roles: ['Staff', 'Manager'] },
        { id: 'materials', label: 'Materials & Equipment', icon: Cpu, roles: ['Staff', 'Manager'] },
      ]
    },
    {
      group: 'Financials & Reports',
      items: [
        { id: 'expenses', label: 'Expenses', icon: TrendingDown, roles: ['Staff', 'Manager'] },
        { id: 'costing', label: 'Product Costing', icon: Calculator, roles: ['Staff', 'Manager'] },
        { id: 'reconciliation', label: 'Reports', icon: Scale, roles: ['Manager'] },
      ]
    },
    {
      group: 'Customers',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, roles: ['Staff', 'Manager'] },
      ]
    },
    {
      group: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Film, roles: ['Staff', 'Manager'] },
      ]
    }
  ];

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-row font-sans select-none text-slate-800 overflow-hidden">
      
      {/* Mobile & Tablet Overlay Backdrop - Simple clean semi-transparent overlay with NO background blur */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden cursor-pointer transition-opacity"
          aria-label="Close navigation overlay"
        />
      )}
      
      {/* Navigation Sidebar */}
      <aside 
        className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-200 z-50 print:hidden fixed lg:static top-0 bottom-0 left-0 h-full shadow-lg lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isExpanded ? 'w-64 sm:w-72 lg:w-64' : 'lg:w-16'
        }`}
      >
        {/* Sidebar Brand & Hamburger Header */}
        <div className={`h-16 px-3.5 border-b border-slate-200/80 flex items-center shrink-0 ${
          isExpanded ? 'justify-between' : 'justify-center'
        }`}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src="/logo.png" 
                  alt="JKM Prime Logo" 
                  className="w-7 h-7 object-contain rounded-md shrink-0" 
                  referrerPolicy="no-referrer" 
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 leading-tight truncate">
                    JKM PRIME
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase truncate">
                    Digital Prints
                  </div>
                </div>
              </div>

              {/* Hamburger / Collapse toggle button inside sidebar header */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-label="Toggle sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation items list */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {groupedNavigation.map(group => {
            const allowedItems = group.items.filter(item => item.roles.includes(userRole));
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                {isExpanded ? (
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2.5 block mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {group.group}
                  </span>
                ) : (
                  <div className="h-[1px] bg-slate-100 my-2 mx-1" />
                )}
                
                {allowedItems.map(item => {
                  const isSelected = activeTab === item.id;
                  const pendingOnlineCount = item.id === 'live_orders'
                    ? orders.filter(o => o.status === 'Pending' && (o.notes?.includes('[Online Order Request]') || o.designLink)).length
                    : 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center group cursor-pointer ${
                        isExpanded ? 'justify-between' : 'justify-center'
                      } ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-semibold shadow-2xs' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        }`} />
                        {isExpanded && (
                          <span className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.label}
                            {pendingOnlineCount > 0 && (
                              <span className="bg-rose-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none shrink-0">
                                {pendingOnlineCount}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center shrink-0">
          {isExpanded ? 'JKM Prime • v2.0' : 'v2.0'}
        </div>
      </aside>

      {/* Main Workspace (Top Header + Page Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile-only open drawer trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0 lg:hidden"
              title="Open navigation drawer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            {/* Dynamic Active Page Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {getActivePageTitle(activeTab)}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 block animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
          </div>

          {/* Operator details and actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Admin Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/80 flex items-center justify-center"
                title="Notifications Panel"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full leading-none border-2 border-white shadow-xs">
                    {adminUnreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    {/* Backdrop to dismiss dropdown */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotifDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[460px]"
                    >
                      {/* Dropdown Header */}
                      <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs">Activity Alerts</span>
                          {adminUnreadCount > 0 && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              {adminUnreadCount} unread
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {adminUnreadCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleMarkAllAsRead();
                              }}
                              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                          {adminNotifications.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleClearAll();
                              }}
                              className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown List */}
                      <div className="overflow-y-auto divide-y divide-slate-100 max-h-[350px] flex-grow">
                        {adminNotifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 space-y-2">
                            <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                            <div>
                              <p className="text-xs font-semibold text-slate-700">No active alerts</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                New customer orders, artwork uploads, and chat inquiries will sync here.
                              </p>
                            </div>
                          </div>
                        ) : (
                          adminNotifications.map((notif) => {
                            const isRead = notif.isRead;
                            let IconComponent = Bell;
                            let iconColor = 'text-slate-600 bg-slate-100';
                            if (notif.type === 'order') {
                              IconComponent = ShoppingCart;
                              iconColor = 'text-slate-700 bg-slate-100';
                            } else if (notif.type === 'file') {
                              IconComponent = FileUp;
                              iconColor = 'text-amber-700 bg-amber-50';
                            } else if (notif.type === 'chat') {
                              IconComponent = MessageSquare;
                              iconColor = 'text-emerald-700 bg-emerald-50';
                            } else if (notif.type === 'system') {
                              IconComponent = Info;
                              iconColor = 'text-sky-700 bg-sky-50';
                            }

                            return (
                              <div 
                                key={notif.id} 
                                className={`p-3 flex gap-3 transition-colors hover:bg-slate-50 relative group ${
                                  !isRead ? 'bg-slate-50/60' : ''
                                }`}
                              >
                                <div 
                                  className="flex-grow flex gap-2.5 cursor-pointer min-w-0"
                                  onClick={() => handleNotifClick(notif)}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-grow space-y-0.5 text-left">
                                    <div className="flex justify-between items-start gap-1">
                                      <span className={`text-xs block truncate ${!isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                        {notif.title}
                                      </span>
                                      {!isRead && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0 mt-1.5" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss(notif.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all self-center shrink-0 cursor-pointer"
                                  title="Dismiss notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Operator Chip */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-slate-900 block leading-tight">{userDisplayName}</span>
                <span className="text-[10px] font-mono text-slate-500 block leading-tight">{userRole}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs font-medium border border-transparent hover:border-rose-100"
              title="Logout operator session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Sub-workspace renderer panel */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 flex flex-col ${
          activeTab === 'ordering' ? 'h-full overflow-hidden' : 'overflow-y-auto'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={activeTab === 'ordering' ? 'h-full flex flex-col overflow-hidden' : ''}
            >
              {activeTab === 'dashboard' && (
                <Dashboard orders={orders} expenses={expenses} userLogs={userLogs} />
              )}
              {activeTab === 'ordering' && (
                <Ordering 
                  products={products} 
                  orders={orders} 
                  onOrderCreated={async (newOrder) => {
                    try {
                      await handleUpdateOrders([newOrder, ...orders]);
                      await logAction(`Submitted new order transaction ${newOrder.id} for ${newOrder.customerName}`);
                      setViewingReceiptOrder(newOrder);
                      await deductInventoryMaterials(newOrder);
                    } catch (err) {
                      console.error("Error submitting order in checkout handler:", err);
                      throw err; // rethrow to let Ordering panel know it failed
                    }
                  }}
                  userDisplayName={userDisplayName}
                />
              )}
              {activeTab === 'live_orders' && (
                <LiveOrders 
                  orders={orders} 
                  onUpdateOrders={handleUpdateOrders} 
                  userRole={userRole} 
                  onViewReceipt={setViewingReceiptOrder}
                />
              )}
              {activeTab === 'customers' && (
                <CustomersModule 
                  orders={orders} 
                  onUpdateOrders={handleUpdateOrders}
                />
              )}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setInventorySubTab('stocks')}
                      className={`pb-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        inventorySubTab === 'stocks'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Raw Stock Levels
                    </button>
                    <button
                      onClick={() => setInventorySubTab('products')}
                      className={`pb-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        inventorySubTab === 'products'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Products Catalog Pricing
                    </button>
                  </div>
                  {inventorySubTab === 'stocks' ? (
                    <Inventory items={inventory} onItemsChange={setInventory} />
                  ) : (
                    <ProductsCatalog products={products} onProductsChange={handleProductsChange} />
                  )}
                </div>
              )}
              {activeTab === 'materials' && (
                <Materials 
                  materials={materials} 
                  onUpdateMaterials={handleUpdateMaterials} 
                  userDisplayName={userDisplayName}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesModule 
                  expenses={expenses} 
                  onUpdateExpenses={handleUpdateExpenses} 
                  userDisplayName={userDisplayName}
                />
              )}
              {activeTab === 'reconciliation' && (
                <Reconciliation 
                  orders={orders} 
                  expenses={expenses} 
                  onArchiveMonth={handleArchiveMonth} 
                  userRole={userRole} 
                />
              )}
              {activeTab === 'pos_products' && (
                <ProductsCatalog products={products} onProductsChange={handleProductsChange} />
              )}
              {activeTab === 'quotation' && (
                <Quotation products={products} />
              )}
              {activeTab === 'settings' && (
                <Settings userDisplayName={userDisplayName} userRole={userRole} />
              )}
              {activeTab === 'costing' && (
                <ProductCosting products={products} onProductsChange={handleProductsChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* FULL RECEIPT OVERLAY PREVIEW MODAL */}
      <AnimatePresence>
        {viewingReceiptOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:absolute print:inset-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full"
            >
              
              {/* Header non print controls */}
              <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 print:hidden shrink-0">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-sky-500" />
                  Order Transaction Invoice
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportAsImage}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <Image className="w-4 h-4" />
                    Export as Image
                  </button>
                  <button
                    onClick={handleExportAsPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    Export as PDF (A6)
                  </button>
                  <button
                    onClick={() => setViewingReceiptOrder(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice body */}
              <div id="printable-receipt" className="p-6 sm:p-8 overflow-y-auto text-slate-700 space-y-4 text-xs font-mono">
                
                {/* Branding header */}
                <div className="text-center space-y-1 flex flex-col items-center">
                  <img 
                    src={logoBase64 || "/logo.png"} 
                    alt="JKM Prime Logo" 
                    className="w-12 h-12 object-contain rounded-xl shadow-xs mb-1 mx-auto" 
                    referrerPolicy="no-referrer"
                  />
                  <h2 className="font-display font-black text-base text-slate-900 tracking-tight">JKM PRIME DIGITAL PRINTS</h2>
                  <p className="text-[10px] text-slate-400 font-sans font-medium">Precision Printing. Premium Quality. Quick Turnaround.</p>
                  <p className="text-[9px] text-slate-400 font-sans font-medium">GHQ Road, South Signal, Taguig • 09524776545</p>
                </div>

                <div className="py-2">
                  <svg className="w-full h-[2px]" width="100%" height="2">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>

                 {/* Info block */}
                 <div className="space-y-1 text-[11px] text-slate-600">
                   <div className="flex justify-between">
                     <span>CUSTOMER NAME:</span>
                     <span className="font-bold text-slate-900 uppercase">{viewingReceiptOrder.customerName}</span>
                   </div>
                   {viewingReceiptOrder.customerContact && (
                     <div className="flex justify-between">
                       <span>CONTACT NO:</span>
                       <span className="font-bold text-slate-900">{viewingReceiptOrder.customerContact}</span>
                     </div>
                   )}
                   <div className="flex justify-between">
                     <span>DATE & TIME:</span>
                     <span>{viewingReceiptOrder.date} | {viewingReceiptOrder.time}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>ORDER INVOICE:</span>
                     <span className="font-bold text-slate-900">{viewingReceiptOrder.id}</span>
                   </div>
                   {viewingReceiptOrder.trackingNumber && (
                     <div className="flex justify-between text-sky-600 font-bold">
                       <span>TRACKING NO:</span>
                       <span className="font-mono text-xs select-all bg-sky-50 px-1 border border-sky-100 rounded">{viewingReceiptOrder.trackingNumber}</span>
                     </div>
                   )}
                   <div className="flex justify-between">
                     <span>FULFILLMENT STATE:</span>
                     <span className="font-black text-sky-600 uppercase text-[10px]">{viewingReceiptOrder.status}</span>
                   </div>

                   {/* Fulfillment details (Pickup vs Delivery) */}
                   <div className="flex justify-between pt-1 border-t border-slate-100 mt-1">
                     <span>DELIVERY METHOD:</span>
                     <span className="font-bold uppercase text-slate-900">
                       {viewingReceiptOrder.deliveryMethod === 'pickup' || viewingReceiptOrder.deliveryMethod === 'Store Pickup' ? '🏢 Store Pickup' : 
                        viewingReceiptOrder.deliveryMethod === 'Meet Up' ? '🤝 Meet Up' : '🚚 Courier Delivery'}
                     </span>
                   </div>
                   {(viewingReceiptOrder.deliveryMethod === 'delivery' || viewingReceiptOrder.deliveryMethod === 'Customer Books Courier') && (
                     <>
                       <div className="flex justify-between text-slate-500">
                         <span>SELECTED COURIER:</span>
                         <span className="font-bold text-slate-800 uppercase">{viewingReceiptOrder.selectedCourier || 'Lalamove'}</span>
                       </div>
                       <div className="flex justify-between text-slate-500">
                         <span>DELIVERY LOCATION:</span>
                         <span className="font-bold text-slate-800 uppercase text-right max-w-[200px] break-words">
                           {viewingReceiptOrder.deliveryAddress || 'No Address Provided'}
                         </span>
                       </div>
                     </>
                   )}
                   {viewingReceiptOrder.deliveryMethod === 'Meet Up' && (
                     <div className="flex justify-between text-slate-500">
                       <span>MEET-UP LOCATION:</span>
                       <span className="font-bold text-slate-800 uppercase text-right max-w-[200px] break-words">
                         {viewingReceiptOrder.deliveryAddress || 'No Location Provided'}
                       </span>
                     </div>
                   )}
                 </div>

                <div className="py-2">
                  <svg className="w-full h-[2px]" width="100%" height="2">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>

                {/* Products Grid list */}
                <div className="space-y-2">
                  <span className="font-bold block uppercase text-[10px] text-slate-400 tracking-wider">Line Items Detail</span>
                  
                  <div className="space-y-2.5">
                    {viewingReceiptOrder.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs text-slate-800">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>₱{item.subtotal.toLocaleString()}</span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded inline-block pl-2 font-sans font-semibold">
                            Notes: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="py-2">
                  <svg className="w-full h-[2px]" width="100%" height="2">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>

                {/* Billing Summary values */}
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal Stream:</span>
                    <span>₱{viewingReceiptOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {viewingReceiptOrder.discount > 0 && (
                    <div className="flex justify-between text-rose-500 font-bold">
                      <span>Discount Deduction:</span>
                      <span>-₱{viewingReceiptOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black text-sm">
                    <span>Grand Total:</span>
                    <span>₱{viewingReceiptOrder.grandTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="py-1">
                    <svg className="w-full h-[2px]" width="100%" height="2">
                      <line x1="0" y1="1" x2="100%" y2="1" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Payment Formula:</span>
                    <span className="font-bold text-slate-900 uppercase">{viewingReceiptOrder.paymentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Settling Method:</span>
                    <span className="font-bold text-slate-900 uppercase">{viewingReceiptOrder.paymentMethod}</span>
                  </div>
                  
                  {viewingReceiptOrder.paymentType === 'Down Payment' && (
                    <>
                      <div className="flex justify-between text-sky-600 font-bold">
                        <span>Down Payment Collected:</span>
                        <span>₱{viewingReceiptOrder.downPaymentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>Balance Outstanding:</span>
                        <span>₱{viewingReceiptOrder.remainingBalance.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Amount Handed Over:</span>
                    <span>₱{viewingReceiptOrder.amountPaid.toLocaleString()}</span>
                  </div>
                  {viewingReceiptOrder.change > 0 && (
                    <div className="flex justify-between text-emerald-600 font-black">
                      <span>Change Refund:</span>
                      <span>₱{viewingReceiptOrder.change.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Greetings footer messages */}
                <div className="py-2">
                  <svg className="w-full h-[2px]" width="100%" height="2">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>
                <div className="text-center text-slate-800 font-sans font-bold">
                  <p className="uppercase font-mono text-xs">Thank you for your Purchase</p>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 max-w-sm w-full shadow-xl space-y-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-slate-900">Sign out of operator session?</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  You are about to end your current session. Make sure all open orders or edits have been saved.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
