import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Award, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  DollarSign, 
  FileUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Star, 
  Plus,
  Trash2,
  ExternalLink,
  ThumbsUp,
  AlertCircle,
  ChevronRight,
  Send,
  Paperclip,
  Download,
  Eye,
  EyeOff,
  Lock,
  Key,
  Loader2,
  ShoppingCart
} from 'lucide-react';
import { Order } from '../../types';
import { useToast } from '../Toast';

// Firebase imports
import { db, customerUploadsCol, supportChatsCol, createDbNotification } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';

interface CustomersModuleProps {
  orders: Order[];
  onUpdateOrders: (updatedOrders: Order[]) => void;
}

interface CustomerAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  isVIP: boolean;
  birthday: string;
  password?: string;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({ orders, onUpdateOrders }) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'profiles' | 'chat' | 'transfers' | 'payments' | 'rewards'>('profiles');
  
  // Delete account confirmation states
  const [customerToDelete, setCustomerToDelete] = useState<CustomerAccount | null>(null);
  const [confirmDeleteCheckbox, setConfirmDeleteCheckbox] = useState(false);
  
  // Admin credentials reset states
  const [adminResetPassword, setAdminResetPassword] = useState('');
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  
  // Real-time Chat Support & Global Uploads states
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [adminUploads, setAdminUploads] = useState<any[]>([]);
  const [adminNewMessage, setAdminNewMessage] = useState('');
  const [adminChatAttachment, setAdminChatAttachment] = useState<string | null>(null);
  const [adminChatAttachmentName, setAdminChatAttachmentName] = useState('');

  // Load general uploads and chat messages for the selected customer in real-time
  useEffect(() => {
    if (!selectedCustomer) {
      setAdminUploads([]);
      setAdminChats([]);
      return;
    }

    // 1. Fetch uploaded assets
    const qUploads = query(
      customerUploadsCol,
      where('customerId', '==', selectedCustomer.id)
    );
    const unsubUploads = onSnapshot(qUploads, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setAdminUploads(list);
    }, (err) => {
      console.error("Error loading admin customer uploads:", err);
    });

    // 2. Fetch chat support messages
    const qChats = query(
      supportChatsCol,
      where('chatId', '==', selectedCustomer.id)
    );
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => a.timestamp - b.timestamp);
      setAdminChats(list);
    }, (err) => {
      console.error("Error loading admin support chats:", err);
    });

    return () => {
      unsubUploads();
      unsubChats();
    };
  }, [selectedCustomer]);

  const handleAdminSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || (!adminNewMessage.trim() && !adminChatAttachment)) return;

    const messageId = `MSG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const msgDoc = {
      id: messageId,
      chatId: selectedCustomer.id,
      senderId: 'admin',
      senderName: 'Admin Team',
      message: adminNewMessage.trim(),
      timestamp: Date.now(),
      fileAttachment: adminChatAttachment ? {
        name: adminChatAttachmentName,
        url: adminChatAttachment,
        type: adminChatAttachment.startsWith('data:image/') ? 'image' : 'file'
      } : null
    };

    try {
      await setDoc(doc(db, 'support_chats', messageId), msgDoc);
      
      // Notify customer of admin support reply
      await createDbNotification({
        recipientId: selectedCustomer.id,
        title: 'New Support Message',
        message: adminNewMessage.trim() || `Sent an attachment: ${adminChatAttachmentName}`,
        type: 'chat',
        linkId: selectedCustomer.id
      });

      setAdminNewMessage('');
      setAdminChatAttachment(null);
      setAdminChatAttachmentName('');
    } catch (err) {
      console.error("Failed to send admin chat message:", err);
      toast.error("Failed to send reply. Please try again.");
    }
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    if (!messageId) return;
    try {
      await deleteDoc(doc(db, 'support_chats', messageId));
      toast.success('Message deleted successfully');
    } catch (err) {
      console.error('Error deleting chat message:', err);
      toast.error('Failed to delete message');
    }
  };

  const handleAdminFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminChatAttachment(reader.result as string);
      setAdminChatAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };
  
  // Edit mode details
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editPoints, setEditPoints] = useState(0);

  // New Customer Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBirthday, setNewBirthday] = useState('1995-01-01');
  const [newUsername, setNewUsername] = useState('');

  // Rewards configuration state
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [minOrderValue, setMinOrderValue] = useState(149);
  const [pointsRatio, setPointsRatio] = useState(10); // 1 point per 10 PHP spent
  const [promoRewardTitle, setPromoRewardTitle] = useState('Free Photo ID Bundle Sheets');
  const [promoRewardPoints, setPromoRewardPoints] = useState(100);
  const [promoRewardDesc, setPromoRewardDesc] = useState('Redeem 100 points for free photo ID bundle sheets.');

  // Load customer list
  const loadCustomers = () => {
    const raw = localStorage.getItem('jkm_customer_accounts_v2');
    if (raw) {
      setCustomers(JSON.parse(raw));
    } else {
      // Seed default customer if empty
      const seeded: CustomerAccount[] = [
        {
          id: 'CUST-001',
          username: 'customer',
          name: 'Juan dela Cruz',
          email: 'juan.delacruz@gmail.com',
          phone: '09171234567',
          address: '128 Orchid St, Barangay Signal Village, Taguig City',
          points: 240,
          isVIP: true,
          birthday: '1995-08-15'
        }
      ];
      localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(seeded));
      setCustomers(seeded);
    }
  };

  useEffect(() => {
    loadCustomers();

    const configRaw = localStorage.getItem('jkm_rewards_config');
    if (configRaw) {
      const parsed = JSON.parse(configRaw);
      setRewardsEnabled(parsed.enabled ?? true);
      setMinOrderValue(parsed.minOrderValue ?? 149);
      setPointsRatio(parsed.pointsRatio ?? 10);
      setPromoRewardTitle(parsed.promoRewardTitle ?? 'Free Photo ID Bundle Sheets');
      setPromoRewardPoints(parsed.promoRewardPoints ?? 100);
      setPromoRewardDesc(parsed.promoRewardDesc ?? 'Redeem 100 points for free photo ID bundle sheets.');
    } else {
      const defaultConfig = {
        enabled: true,
        minOrderValue: 149,
        pointsRatio: 10,
        promoRewardTitle: 'Free Photo ID Bundle Sheets',
        promoRewardPoints: 100,
        promoRewardDesc: 'Redeem 100 points for free photo ID bundle sheets.'
      };
      localStorage.setItem('jkm_rewards_config', JSON.stringify(defaultConfig));
    }
    
    // Add event listener to sync in real time when storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jkm_customer_accounts_v2') {
        loadCustomers();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync back to local storage and trigger event
  const saveCustomerList = (newList: CustomerAccount[]) => {
    localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(newList));
    setCustomers(newList);
    // Dispatches storage event for other tabs to update in real time
    window.dispatchEvent(new StorageEvent('storage', { key: 'jkm_customer_accounts_v2' }));
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Select customer and populate edit fields
  const handleSelectCustomer = (cust: CustomerAccount) => {
    setSelectedCustomer(cust);
    setIsEditing(false);
    setEditName(cust.name);
    setEditEmail(cust.email);
    setEditPhone(cust.phone);
    setEditAddress(cust.address);
    setEditBirthday(cust.birthday);
    setEditPoints(cust.points);
  };

  // Toggle Rewards status
  const toggleVIP = (custId: string) => {
    const updated = customers.map(c => {
      if (c.id === custId) {
        const nextVIP = !c.isVIP;
        toast.success(`${c.name} is now ${nextVIP ? 'a Promotional Account' : 'a Standard Customer'}`);
        return { ...c, isVIP: nextVIP };
      }
      return c;
    });
    saveCustomerList(updated);
    if (selectedCustomer && selectedCustomer.id === custId) {
      setSelectedCustomer({ ...selectedCustomer, isVIP: !selectedCustomer.isVIP });
    }
  };

  const handleSaveRewardsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      enabled: rewardsEnabled,
      minOrderValue: Number(minOrderValue),
      pointsRatio: Number(pointsRatio),
      promoRewardTitle,
      promoRewardPoints: Number(promoRewardPoints),
      promoRewardDesc
    };
    localStorage.setItem('jkm_rewards_config', JSON.stringify(config));
    window.dispatchEvent(new StorageEvent('storage', { key: 'jkm_rewards_config' }));
    toast.success('Customer rewards program configuration saved successfully!');
  };

  // Save edited customer profile details
  const handleSaveProfile = () => {
    if (!selectedCustomer) return;
    const updated = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          name: editName,
          email: editEmail,
          phone: editPhone,
          address: editAddress,
          birthday: editBirthday,
          points: Number(editPoints)
        };
      }
      return c;
    });
    saveCustomerList(updated);
    setSelectedCustomer({
      ...selectedCustomer,
      name: editName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      birthday: editBirthday,
      points: Number(editPoints)
    });
    setIsEditing(false);
    toast.success('Customer profile details updated successfully!');
  };

  // Reset or change customer password by admin
  const handleAdminResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!adminResetPassword.trim()) {
      toast.error('Please enter a new password.');
      return;
    }
    if (adminResetPassword.trim().length < 4) {
      toast.error('Password must be at least 4 characters long.');
      return;
    }

    const updated = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          password: adminResetPassword.trim()
        };
      }
      return c;
    });

    saveCustomerList(updated);
    setSelectedCustomer({
      ...selectedCustomer,
      password: adminResetPassword.trim()
    });
    setAdminResetPassword('');
    toast.success(`Password for ${selectedCustomer.name} updated successfully!`);
  };

  // Add new customer account
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newUsername) {
      toast.error('Name, Email and Username are required!');
      return;
    }

    if (customers.some(c => c.username.toLowerCase() === newUsername.toLowerCase().trim())) {
      toast.error('Username already exists!');
      return;
    }

    const newCust: CustomerAccount = {
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      username: newUsername.toLowerCase().trim(),
      name: newName,
      email: newEmail,
      phone: newPhone || 'N/A',
      address: newAddress || 'N/A',
      points: 0,
      isVIP: false,
      birthday: newBirthday
    };

    const updated = [...customers, newCust];
    saveCustomerList(updated);
    toast.success(`Account created successfully for ${newName}!`);
    setShowAddModal(false);
    
    // Clear fields
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewAddress('');
    setNewUsername('');
  };

  // Trigger delete account confirmation modal
  const handleDeleteCustomer = (custId: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setCustomerToDelete(cust);
      setConfirmDeleteCheckbox(false);
    }
  };

  // Execute actual deletion
  const executeDeleteCustomer = () => {
    if (!customerToDelete) return;
    const updated = customers.filter(c => c.id !== customerToDelete.id);
    saveCustomerList(updated);
    setSelectedCustomer(null);
    setCustomerToDelete(null);
    setConfirmDeleteCheckbox(false);
    toast.success('Customer account deleted successfully!');
  };

  // Get specific orders belonging to selected customer
  const customerOrders = React.useMemo(() => {
    if (!selectedCustomer) return [];
    const nameLower = selectedCustomer.name.toLowerCase();
    const phone = selectedCustomer.phone;
    return orders.filter(o => {
      const matchName = o.customerName.toLowerCase().includes(nameLower) || nameLower.includes(o.customerName.toLowerCase());
      const matchPhone = phone && phone !== 'N/A' && o.customerContact?.includes(phone);
      return matchName || matchPhone;
    });
  }, [orders, selectedCustomer]);

  // Aggregate files uploaded by customer across all their orders
  const customerUploadedFiles = React.useMemo(() => {
    const files: { orderId: string; name: string; url: string; date: string; category: string; size: string }[] = [];
    customerOrders.forEach(order => {
      if (order.uploadedFiles && Array.isArray(order.uploadedFiles)) {
        order.uploadedFiles.forEach(f => {
          files.push({
            orderId: order.id,
            ...f
          });
        });
      }
    });
    return files;
  }, [customerOrders]);

  // Aggregate all GCash or Bank payment submissions pending approval
  const customerPaymentSubmissions = React.useMemo(() => {
    const subs: { orderId: string; id: string; amount: number; referenceNumber: string; method: string; date: string; status: 'Pending' | 'Approved' | 'Rejected'; proofImage?: string }[] = [];
    customerOrders.forEach(order => {
      if (order.paymentSubmissions && Array.isArray(order.paymentSubmissions)) {
        order.paymentSubmissions.forEach(p => {
          subs.push({
            orderId: order.id,
            ...p
          });
        });
      }
    });
    return subs;
  }, [customerOrders]);

  // Approve a submitted payment proof
  const handleApprovePayment = (orderId: string, subId: string, amountPaid: number) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        // Mark payment submission as Approved
        const updatedSubs = (order.paymentSubmissions || []).map(sub => {
          if (sub.id === subId) {
            return { ...sub, status: 'Approved' as const };
          }
          return sub;
        });

        // Credit payment to the order financials
        const nextAmountPaid = order.amountPaid + amountPaid;
        const nextBalance = Math.max(0, order.grandTotal - nextAmountPaid);
        const nextPaymentType = nextBalance === 0 ? 'Full Payment' : 'Down Payment';

        const today = new Date();
        const fDate = today.toLocaleDateString('en-CA');
        const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const trackingUpdate = {
          status: order.status,
          timestamp: `${fDate} ${fTime}`,
          note: `GCash/Bank Payment proof approved by Admin: ₱${amountPaid.toLocaleString()} credited. Remaining balance is now ₱${nextBalance.toLocaleString()}`
        };

        return {
          ...order,
          amountPaid: nextAmountPaid,
          remainingBalance: nextBalance,
          paymentType: nextPaymentType as any,
          paymentSubmissions: updatedSubs,
          trackingUpdates: [trackingUpdate, ...(order.trackingUpdates || [])]
        };
      }
      return order;
    });

    onUpdateOrders(updatedOrders);
    toast.success('Payment proof approved! Balance has been credited successfully.');
  };

  // Reject a submitted payment proof
  const handleRejectPayment = (orderId: string, subId: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedSubs = (order.paymentSubmissions || []).map(sub => {
          if (sub.id === subId) {
            return { ...sub, status: 'Rejected' as const };
          }
          return sub;
        });

        const today = new Date();
        const fDate = today.toLocaleDateString('en-CA');
        const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const trackingUpdate = {
          status: order.status,
          timestamp: `${fDate} ${fTime}`,
          note: `Payment proof rejected by Admin. Please double check reference details or upload a clearer receipt.`
        };

        return {
          ...order,
          paymentSubmissions: updatedSubs,
          trackingUpdates: [trackingUpdate, ...(order.trackingUpdates || [])]
        };
      }
      return order;
    });

    onUpdateOrders(updatedOrders);
    toast.warning('Payment submission marked as rejected.');
  };

  // Aggregate pending payments across ALL orders for the general dashboard overview
  const allPendingPaymentSubmissions = React.useMemo(() => {
    const list: { customerName: string; customerId: string; orderId: string; id: string; amount: number; referenceNumber: string; method: string; date: string; status: 'Pending' | 'Approved' | 'Rejected' }[] = [];
    orders.forEach(order => {
      if (order.paymentSubmissions && Array.isArray(order.paymentSubmissions)) {
        order.paymentSubmissions.forEach(p => {
          if (p.status === 'Pending') {
            list.push({
              customerName: order.customerName,
              customerId: order.customerContact || 'N/A',
              orderId: order.id,
              ...p
            });
          }
        });
      }
    });
    return list;
  }, [orders]);

  // Navigate directly to a customer portal profile
  const handleSelectCustomerByDetails = (customerName: string, customerPhone?: string) => {
    const nameLower = customerName.toLowerCase();
    const found = customers.find(c => {
      const matchName = c.name.toLowerCase().includes(nameLower) || nameLower.includes(c.name.toLowerCase());
      const matchPhone = customerPhone && customerPhone !== 'N/A' && c.phone?.includes(customerPhone);
      return matchName || matchPhone;
    });
    if (found) {
      setSelectedCustomer(found);
      setIsEditing(false);
      setActiveTab('profiles');
    } else {
      toast.info(`Note: "${customerName}" has no registered Customer Portal account yet. Create one with the "Add Customer Portal" button.`);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              Customer Accounts & Portals
            </h2>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">Manage customer portals, loyalty rewards, file assets, and payment proof approvals.</p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {selectedCustomer && (
            <button
              onClick={() => setSelectedCustomer(null)}
              className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              All Portals
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* TABS BAR */}
      <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-lg border border-slate-200/80 no-scrollbar">
        {([
          { id: 'profiles', label: 'Portals & Profiles', icon: Users },
          { id: 'chat', label: 'Support Chat', icon: Send },
          { id: 'transfers', label: 'File Assets', icon: FileUp },
          { id: 'payments', label: 'Payment Proofs', icon: DollarSign },
          { id: 'rewards', label: 'Loyalty & Rewards', icon: Award },
        ] as const).map(tab => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'payments' && allPendingPaymentSubmissions.length > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {allPendingPaymentSubmissions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {['profiles', 'chat', 'transfers'].includes(activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* CUSTOMERS SIDEBAR LIST (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
          
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, email, phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
            />
          </div>

          {/* CUSTOMERS LIST CONTAINER */}
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No customer portal accounts found.
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-900'}`}>{cust.name}</span>
                        {cust.isVIP && (
                          <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>VIP</span>
                        )}
                      </div>
                      <span className={`text-[10px] block font-mono truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{cust.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-[10px] font-medium block font-mono ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>{cust.points} pts</span>
                        <span className={`text-[8px] block uppercase font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{cust.id}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CUSTOMER INTEGRATION PROFILE WORKSPACE (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4">
              
              {/* SECTION A: PROFILE CARD */}
              {activeTab === 'profiles' && (
                <>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{selectedCustomer.name}</h3>
                        <span className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1.5 py-0.5 rounded">
                          {selectedCustomer.id}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">Username: <span className="font-mono text-slate-600 font-medium">{selectedCustomer.username}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVIP(selectedCustomer.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer border ${
                        selectedCustomer.isVIP
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {selectedCustomer.isVIP ? 'VIP Promo Active' : 'Grant VIP Promo'}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* FIELDS FOR EDITING / DETAILS */}
                {isEditing ? (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Customer Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Birthday</label>
                        <input
                          type="date"
                          value={editBirthday}
                          onChange={(e) => setEditBirthday(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Loyalty Points</label>
                        <input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">Delivery / Billing Address</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Email</span>
                          <span className="font-medium text-slate-800">{selectedCustomer.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Phone</span>
                          <span className="font-medium text-slate-800 font-mono">{selectedCustomer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Birthdate</span>
                          <span className="font-medium text-slate-800 font-mono">{selectedCustomer.birthday}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Delivery Address</span>
                          <span className="font-medium text-slate-700 block leading-normal">{selectedCustomer.address}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-semibold">{selectedCustomer.points} Points</span>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-slate-700 hover:text-slate-950 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION A.1: PORTAL ACCESS & SECURITY CONTROLS */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Key className="w-4 h-4 text-slate-600" />
                  Portal Access & Credentials
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Portal Username</span>
                      <span className="font-mono font-medium text-slate-900 text-xs">@{selectedCustomer.username}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Account Password</span>
                      {selectedCustomer.password ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
                            {showAdminResetPassword ? selectedCustomer.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAdminResetPassword(!showAdminResetPassword)}
                            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Show/Hide Password"
                          >
                            {showAdminResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs mt-0.5 block">Default ('password')</span>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleAdminResetPasswordSubmit} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">Set New Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type={showAdminResetPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={adminResetPassword}
                          onChange={(e) => setAdminResetPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md pl-7.5 pr-8 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminResetPassword(!showAdminResetPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showAdminResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 rounded-md text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Update Password
                    </button>
                  </form>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Administrative overrides update credentials immediately. Communicate changes securely to the customer.
                </p>
              </div>
              </>
              )}

              {/* SECTION B: SUBMITTED PAYMENTS PENDING VERIFICATION */}
              {activeTab === 'payments' && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <DollarSign className="w-4 h-4 text-slate-700" />
                  Payment Proof Submissions
                </h4>

                {customerPaymentSubmissions.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">No GCash or Bank payment submissions have been made yet by this customer.</p>
                ) : (
                  <div className="space-y-2.5">
                    {customerPaymentSubmissions.map((sub, i) => {
                      const isPending = sub.status === 'Pending';
                      return (
                        <div key={i} className="border border-slate-200/80 rounded-lg p-3.5 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">₱{sub.amount.toLocaleString()}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">{sub.method}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : sub.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-slate-500">Ref: <span className="font-mono text-slate-800 font-medium">{sub.referenceNumber}</span></p>
                            <p className="text-[10px] text-slate-400 font-mono">Date: {sub.date} • Order: {sub.orderId}</p>
                          </div>

                          {isPending && (
                            <div className="flex gap-1.5 self-stretch sm:self-auto justify-end">
                              <button
                                onClick={() => handleRejectPayment(sub.orderId, sub.id)}
                                className="bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => handleApprovePayment(sub.orderId, sub.id, sub.amount)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* SECTION C: CUSTOMER UPLOADED ARTWORK FILES */}
              {activeTab === 'transfers' && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-slate-700" />
                    File Transfers & Design Assets
                  </h4>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                    {adminUploads.length + customerUploadedFiles.length} Assets
                  </span>
                </div>

                {/* 1. General Dashboard Uploads (Real-Time from Firestore) */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 block">General Portal Uploads ({adminUploads.length})</span>
                  
                  {adminUploads.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-4 bg-slate-50 rounded-lg border border-slate-200/80">No general dashboard files uploaded by this customer.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminUploads.map((file) => (
                        <div key={file.id} className="border border-slate-200/80 rounded-lg p-3 bg-white flex gap-2.5 relative">
                          {file.url && file.url.startsWith('data:image/') ? (
                            <img src={file.url} alt={file.fileName} className="w-10 h-10 object-cover rounded border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex flex-col items-center justify-center font-mono text-[9px] text-slate-600 font-medium shrink-0">
                              <FileUp className="w-3.5 h-3.5 mb-0.5 text-slate-500" />
                              FILE
                            </div>
                          )}
                          <div className="min-w-0 flex-1 text-xs space-y-0.5">
                            <span className="font-medium text-slate-900 block truncate" title={file.fileName}>{file.fileName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{file.category} • {file.size || '1.5 MB'}</span>
                            {file.orderId && (
                              <span className="inline-block bg-slate-100 text-slate-700 text-[8px] font-mono px-1 py-0.2 rounded">
                                Order: {file.orderId}
                              </span>
                            )}
                            <div className="pt-1 flex gap-2">
                              <a
                                href={file.url}
                                download={file.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-900 hover:text-slate-700 font-medium text-[10px] flex items-center gap-1 hover:underline"
                              >
                                Download <Download className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Order Specific Files */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 block">Order-Linked Assets ({customerUploadedFiles.length})</span>
                  
                  {customerUploadedFiles.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-4 bg-slate-50 rounded-lg border border-slate-200/80">No artwork has been attached to specific orders yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customerUploadedFiles.map((file, idx) => (
                        <div key={idx} className="border border-slate-200/80 rounded-lg p-3 bg-white flex flex-col justify-between space-y-2">
                          <div className="space-y-1 text-xs">
                            <span className="text-[9px] bg-slate-100 text-slate-700 font-mono font-medium px-1.5 py-0.5 rounded block w-fit">
                              {file.category}
                            </span>
                            <span className="font-medium text-slate-900 block truncate" title={file.name}>{file.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{file.size} • Order <span className="font-mono font-medium text-slate-700">{file.orderId}</span></span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400 font-mono text-[10px]">{file.date}</span>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-900 hover:text-slate-700 font-medium flex items-center gap-1"
                            >
                              Download <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* SECTION C.5: REAL-TIME SUPPORT CHAT WORKSPACE */}
              {activeTab === 'chat' && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-slate-700" />
                    Support Chat: {selectedCustomer.name}
                  </h4>
                  <span className="text-emerald-700 bg-emerald-50 text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-emerald-200">
                    Live Channel
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-[380px]">
                  {/* Message Feed */}
                  <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50/50 space-y-2.5">
                    {adminChats.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-1 text-slate-400 p-4">
                        <FileUp className="w-6 h-6 text-slate-300" />
                        <h6 className="font-medium text-slate-700 text-xs">No Chat History</h6>
                        <p className="text-[11px] max-w-xs leading-normal">
                          Send a message to coordinate proofing approval or print specifications.
                        </p>
                      </div>
                    ) : (
                      adminChats.map((msg, i) => {
                        const isSelf = msg.senderId === 'admin';
                        return (
                          <div key={msg.id || i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[85%] space-y-0.5">
                              <div className={`text-[9px] font-medium text-slate-400 px-1 flex items-center gap-1.5 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                <span>{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChatMessage(msg.id)}
                                  className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer flex items-center gap-0.5"
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-2.5 h-2.5 inline" />
                                </button>
                              </div>
                              <div className={`p-2.5 rounded-lg text-xs leading-normal ${
                                isSelf
                                  ? 'bg-slate-900 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                
                                {msg.fileAttachment && (
                                  <div className="mt-2 pt-2 border-t border-slate-100/20 text-left space-y-1.5">
                                    {msg.fileAttachment.type === 'image' ? (
                                      <div className="space-y-1">
                                        <a href={msg.fileAttachment.url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded border border-slate-200">
                                          <img src={msg.fileAttachment.url} alt="Attachment" className="max-h-[140px] w-full object-cover rounded" referrerPolicy="no-referrer" />
                                        </a>
                                        <a 
                                          href={msg.fileAttachment.url} 
                                          download={msg.fileAttachment.name || "image.png"}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 transition-colors"
                                        >
                                          <Download className="w-3 h-3 text-slate-600" /> Save Image
                                        </a>
                                      </div>
                                    ) : (
                                      <a href={msg.fileAttachment.url} download={msg.fileAttachment.name} target="_blank" rel="noreferrer" className="bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded flex items-center gap-2 text-[10px] font-medium truncate text-slate-800">
                                        <FileUp className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                        <span className="truncate flex-1">{msg.fileAttachment.name}</span>
                                        <Download className="w-3 h-3 text-slate-600" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleAdminSendChat} className="bg-white p-2 border-t border-slate-200 space-y-1.5">
                    {adminChatAttachment && (
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{adminChatAttachmentName}</span>
                        </div>
                        <button type="button" onClick={() => { setAdminChatAttachment(null); setAdminChatAttachmentName(''); }} className="text-[10px] text-rose-600 font-medium px-1.5 py-0.5 hover:bg-rose-50 rounded">Remove</button>
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <div className="relative flex items-center">
                        <input
                          type="file"
                          id="admin-chat-file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-7"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAdminFileRead(file);
                          }}
                        />
                        <button
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Attach file"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder={`Reply to ${selectedCustomer.name}...`}
                        value={adminNewMessage}
                        onChange={(e) => setAdminNewMessage(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                      />

                      <button
                        type="submit"
                        disabled={!adminNewMessage.trim() && !adminChatAttachment}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-md transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              )}

              {/* SECTION D: ORDER HISTORY & PRODUCTION TRACKER */}
              {activeTab === 'profiles' && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Clock className="w-4 h-4 text-slate-700" />
                  Order History & Status
                </h4>

                {customerOrders.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">No orders registered under this customer account.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(o => (
                      <div key={o.id} className="border border-slate-200/80 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{o.id}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              o.status === 'Completed' || o.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800'
                                : o.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-slate-400 font-mono text-[10px]">{o.date} {o.time} • {o.items.length} items</p>
                          <p className="font-medium text-slate-800 font-mono text-xs">Total: ₱{o.grandTotal.toLocaleString()} • Paid: ₱{o.amountPaid.toLocaleString()} • Bal: ₱{o.remainingBalance.toLocaleString()}</p>
                        </div>

                        <div className="text-right text-xs shrink-0 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200/80 sm:self-auto self-start">
                          <span className="text-[9px] text-slate-400 block font-medium">Delivery</span>
                          <span className="font-medium text-slate-800 block text-xs">{o.deliveryMethod || 'Pickup'}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{o.selectedCourier || 'In-store'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'profiles' ? (
                <>
                  {/* Recent Customer Portal Orders */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-slate-600" />
                        <div>
                          <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Recent Portal Orders</h4>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">Latest 5</span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center space-y-1 text-slate-400">
                        <ShoppingCart className="w-6 h-6 text-slate-300" />
                        <p className="text-xs font-medium text-slate-700">No portal orders yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="border border-slate-200/80 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{order.id}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  order.status === 'Completed' || order.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : order.status === 'Cancelled'
                                    ? 'bg-rose-50 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                Customer: <button 
                                  onClick={() => handleSelectCustomerByDetails(order.customerName, order.customerContact)}
                                  className="font-medium text-slate-900 hover:underline"
                                >
                                  {order.customerName}
                                </button>
                              </p>
                              <p className="text-slate-400 font-mono text-[10px]">{order.date} • {order.items.length} items</p>
                              <p className="font-medium text-slate-800 font-mono text-xs">Total: ₱{order.grandTotal.toLocaleString()} • Bal: ₱{order.remainingBalance.toLocaleString()}</p>
                            </div>

                            <button
                              onClick={() => handleSelectCustomerByDetails(order.customerName, order.customerContact)}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1"
                            >
                              View Account <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center shadow-2xs flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-3">
                    {activeTab === 'chat' ? (
                      <Send className="w-4 h-4 text-slate-600" />
                    ) : (
                      <FileUp className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Select a Customer Account</h3>
                  <p className="text-slate-400 text-xs max-w-sm mt-1 leading-normal">
                    Select a customer from the left list to inspect {
                      activeTab === 'chat'
                        ? 'support chat history and direct messages'
                        : 'uploaded file assets and linked artwork'
                    }.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      )}

      {/* PAYMENTS APPROVAL TAB CONTENT */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-700" />
                Payment Proof Submissions
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Verify and reconcile GCash & Bank transfer receipts uploaded by portal customers.</p>
            </div>
            
            {selectedCustomer && (
              <button
                onClick={() => { setSelectedCustomer(null); setIsEditing(false); }}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Show All Pending Payments
              </button>
            )}
          </div>

          {selectedCustomer ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex justify-between items-center text-xs text-slate-700">
                <div>
                  Viewing payments for <strong className="text-slate-900">{selectedCustomer.name}</strong>.
                </div>
                <button 
                  onClick={() => { setSelectedCustomer(null); setIsEditing(false); }}
                  className="text-slate-900 hover:underline font-medium cursor-pointer"
                >
                  View All
                </button>
              </div>

              {customerPaymentSubmissions.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No GCash or Bank payment submissions have been made yet by this customer.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerPaymentSubmissions.map((sub, i) => {
                    const isPending = sub.status === 'Pending';
                    return (
                      <div key={i} className="border border-slate-200/80 rounded-lg p-3.5 bg-white flex flex-col justify-between gap-3">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">₱{sub.amount.toLocaleString()}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">{sub.method}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              sub.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800'
                                : sub.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-slate-500">Ref: <span className="font-mono font-medium text-slate-800 select-all">{sub.referenceNumber}</span></p>
                          <p className="text-[10px] text-slate-400 font-mono">Date: {sub.date} • Order: {sub.orderId}</p>
                        </div>

                        {isPending && (
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleRejectPayment(sub.orderId, sub.id)}
                              className="w-1/2 bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-700 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprovePayment(sub.orderId, sub.id, sub.amount)}
                              className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {allPendingPaymentSubmissions.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center space-y-1.5 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-700">All payments are reconciled</p>
                  <p className="text-[10px] text-slate-400 max-w-sm">Any GCash or bank receipts submitted in customer portals will appear here for review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {allPendingPaymentSubmissions.map(sub => (
                    <div key={sub.id} className="border border-slate-200/80 rounded-lg p-3.5 bg-white flex flex-col justify-between gap-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono block">PORTAL USER</span>
                            <button 
                              onClick={() => handleSelectCustomerByDetails(sub.customerName, sub.customerId)}
                              className="font-medium text-xs text-slate-900 hover:underline text-left block truncate cursor-pointer"
                            >
                              {sub.customerName}
                            </button>
                            <span className="text-[10px] text-slate-400 block font-mono">{sub.customerId}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-slate-900 block">₱{sub.amount.toLocaleString()}</span>
                            <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                              {sub.method}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded p-2 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ref Number</span>
                            <span className="font-mono font-medium text-slate-800 block select-all truncate max-w-[140px]">{sub.referenceNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Order ID</span>
                            <span className="font-mono font-medium text-slate-700 block">{sub.orderId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Submitted</span>
                            <span className="text-slate-600 font-mono block">{sub.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectPayment(sub.orderId, sub.id)}
                          className="w-1/3 bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-700 text-[11px] font-medium py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprovePayment(sub.orderId, sub.id, sub.amount)}
                          className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium py-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LOYALTY & REWARDS CONFIGURATION TAB CONTENT */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-700" />
                Loyalty & Rewards Program
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Configure automated points accrual, minimum spend thresholds, and promotional rewards.</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={rewardsEnabled} 
                onChange={(e) => setRewardsEnabled(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900"></div>
              <span className="ml-2 text-xs font-medium text-slate-700">
                {rewardsEnabled ? 'Program Active' : 'Program Disabled'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveRewardsConfig} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <label className="block text-xs font-medium text-slate-700">Minimum Qualifying Amount (₱)</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">₱</span>
                  <input 
                    type="number" 
                    value={minOrderValue} 
                    onChange={(e) => setMinOrderValue(Number(e.target.value))} 
                    placeholder="149"
                    className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-900"
                    disabled={!rewardsEnabled}
                  />
                </div>
                <p className="text-[10px] text-slate-400">Minimum grand total required for an order to qualify for points.</p>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <label className="block text-xs font-medium text-slate-700">Points Ratio (1 pt per X PHP)</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">₱</span>
                  <input 
                    type="number" 
                    value={pointsRatio} 
                    onChange={(e) => setPointsRatio(Number(e.target.value))} 
                    placeholder="10"
                    className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-900"
                    disabled={!rewardsEnabled}
                  />
                </div>
                <p className="text-[10px] text-slate-400">Multiplier ratio. E.g., ₱10 spent earns 1 Point.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-3">
              <h5 className="text-xs font-semibold text-slate-900">Featured Redeemable Offer</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-medium text-slate-500">Offer Title</label>
                  <input 
                    type="text" 
                    value={promoRewardTitle} 
                    onChange={(e) => setPromoRewardTitle(e.target.value)} 
                    placeholder="e.g. Free Photo ID Bundle"
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                    disabled={!rewardsEnabled}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-slate-500">Points Needed</label>
                  <input 
                    type="number" 
                    value={promoRewardPoints} 
                    onChange={(e) => setPromoRewardPoints(Number(e.target.value))} 
                    placeholder="100"
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-900"
                    disabled={!rewardsEnabled}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-medium text-slate-500">Terms & Redemption Instructions</label>
                <textarea 
                  value={promoRewardDesc} 
                  onChange={(e) => setPromoRewardDesc(e.target.value)} 
                  placeholder="Describe how customers can claim this offer..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 leading-normal"
                  disabled={!rewardsEnabled}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!rewardsEnabled}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
              >
                Save Rewards Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW CUSTOMER PORTAL MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-slate-700" />
                  Add Customer Account
                </h4>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. juandelacruz"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Juan dela Cruz"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="juan@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="09171234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={newBirthday}
                      onChange={(e) => setNewBirthday(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900 font-mono"
                    />
                  </div>
                  <div className="flex items-end text-[10px] text-slate-400 italic pb-1.5">
                    Default password: 'password'
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Street, Barangay, City, Province"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODERN DELETE CUSTOMER ACCOUNT CONFIRMATION ALERT */}
        {customerToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl p-5"
            >
              {/* Close Button top-right */}
              <button
                onClick={() => setCustomerToDelete(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>

              {/* Warning Header */}
              <div className="flex flex-col items-center text-center mt-1">
                <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mb-3 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                
                <h4 className="font-semibold text-slate-900 text-base">
                  Delete Customer Account?
                </h4>
                
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Permanently delete account for <span className="font-semibold text-slate-800">{customerToDelete.name}</span> ({customerToDelete.username}). Points balance (<span className="text-slate-800 font-mono font-medium">{customerToDelete.points} pts</span>) will be removed.
                </p>
              </div>

              {/* Protection Checklist */}
              <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmDeleteCheckbox}
                    onChange={(e) => setConfirmDeleteCheckbox(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-slate-900 h-3.5 w-3.5"
                  />
                  <span className="text-xs text-slate-600">
                    I confirm that this account deletion is permanent.
                  </span>
                </label>
              </div>

              {/* Buttons with proper hierarchy */}
              <div className="flex gap-2 justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="w-1/2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!confirmDeleteCheckbox}
                  onClick={executeDeleteCustomer}
                  className={`w-1/2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    confirmDeleteCheckbox
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
