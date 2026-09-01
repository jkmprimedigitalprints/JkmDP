/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Download, 
  RefreshCcw, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Save, 
  PlusCircle, 
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  Loader2,
  ThumbsUp,
  MessageSquare,
  DollarSign,
  Eye,
  EyeOff,
  Upload,
  Send,
  Paperclip,
  FileText as FileUp,
  Bell,
  Check,
  Info,
  Receipt,
  Printer,
  Image as ImageIcon
} from 'lucide-react';
import { Order, CartItem, Product } from '../../types';
import { useToast } from '../Toast';
import { PRODUCTS } from '../../utils/data';
import { exportElementAsImage, exportElementAsPDF } from '../../utils/exportUtils';

// Firebase Database imports
import { db, customerUploadsCol, supportChatsCol, handleFirestoreError, OperationType, notificationsCol, createDbNotification, DbNotification } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, query, where, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface CustomerDashboardProps {
  orders: Order[];
  onUpdateOrders: (updatedOrders: Order[]) => void;
  onOpenOrderFormWithReorder: (cartItems: CartItem[]) => void;
  onOpenOrderForm?: () => void;
  onBackToHome: () => void;
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

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  orders, 
  onUpdateOrders, 
  onOpenOrderFormWithReorder,
  onOpenOrderForm,
  onBackToHome
}) => {
  const { toast } = useToast();
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regBday, setRegBday] = useState<string>('2000-01-01');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Forgot Password Flow states
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetStep, setResetStep] = useState<'username' | 'security' | 'newPassword'>('username');
  const [resetUsernameOrEmail, setResetUsernameOrEmail] = useState<string>('');
  const [resetBirthday, setResetBirthday] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmNewPassword, setResetConfirmNewPassword] = useState<string>('');
  const [resetAccount, setResetAccount] = useState<CustomerAccount | null>(null);
  const [showResetNewPassword, setShowResetNewPassword] = useState<boolean>(false);
  const [showResetConfirmNewPassword, setShowResetConfirmNewPassword] = useState<boolean>(false);

  // Profile Change Password Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showProfileNewPassword, setShowProfileNewPassword] = useState<boolean>(false);
  const [showProfileConfirmPassword, setShowProfileConfirmPassword] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Active logged-in customer info
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(null);
  const [customerNotifications, setCustomerNotifications] = useState<DbNotification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState<boolean>(false);

  // Active dashboard tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'quotations' | 'uploads' | 'chat'>('overview');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Detail views
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [submittingApproval, setSubmittingApproval] = useState<boolean>(false);

  // General customer uploads state
  const [uploadedFileList, setUploadedFileList] = useState<any[]>([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [globalFileCategory, setGlobalFileCategory] = useState('Logo Artwork');
  const [globalFileName, setGlobalFileName] = useState('');
  const [globalLinkOrderId, setGlobalLinkOrderId] = useState('');
  const [globalFileBase64, setGlobalFileBase64] = useState<string | null>(null);
  const [globalFileReal, setGlobalFileReal] = useState<File | null>(null);

  // Chat Support states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatAttachmentBase64, setChatAttachmentBase64] = useState<string | null>(null);
  const [chatAttachmentName, setChatAttachmentName] = useState<string>('');
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [lastViewedChat, setLastViewedChat] = useState<number>(() => {
    const saved = localStorage.getItem('jkm_customer_last_viewed_chat');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatWidgetOpen) {
      const now = Date.now();
      setLastViewedChat(now);
      localStorage.setItem('jkm_customer_last_viewed_chat', now.toString());
    }
  }, [isChatWidgetOpen, chatMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatWidgetOpen]);

  const unreadChatCount = chatMessages.filter(
    (msg) => msg.senderId === 'admin' && msg.timestamp > lastViewedChat
  ).length;

  // Synchronize customer uploads from Firestore
  useEffect(() => {
    if (!isLoggedIn || !currentCustomer) return;
    
    const q = query(
      customerUploadsCol,
      where('customerId', '==', currentCustomer.id)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by uploadedAt ISO string descending
      list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setUploadedFileList(list);
    }, (err) => {
      console.error("Error loading customer uploads:", err);
    });
    
    return () => unsub();
  }, [isLoggedIn, currentCustomer]);

  // Synchronize support chat messages from Firestore
  useEffect(() => {
    if (!isLoggedIn || !currentCustomer) return;
    
    const q = query(
      supportChatsCol,
      where('chatId', '==', currentCustomer.id)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by timestamp ascending
      list.sort((a, b) => a.timestamp - b.timestamp);
      setChatMessages(list);
    }, (err) => {
      console.error("Error loading chat messages:", err);
    });
    
    return () => unsub();
  }, [isLoggedIn, currentCustomer]);

  // Synchronize customer notifications from Firestore
  useEffect(() => {
    if (!isLoggedIn || !currentCustomer) {
      setCustomerNotifications([]);
      return;
    }
    
    const q = query(
      notificationsCol,
      where('recipientId', '==', currentCustomer.id)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list: DbNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DbNotification);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      setCustomerNotifications(list);
    }, (err) => {
      console.error("Error loading customer notifications:", err);
    });
    
    return () => unsub();
  }, [isLoggedIn, currentCustomer]);

  const triggerFileRead = (file: File, isChat: boolean) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (isChat) {
        setChatAttachmentBase64(base64);
        setChatAttachmentName(file.name);
      } else {
        setGlobalFileBase64(base64);
        setGlobalFileName(file.name);
        setGlobalFileReal(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGlobalFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalFileName) {
      toast.error("Please provide a file name or select a file!");
      return;
    }
    
    setIsUploadingGlobal(true);
    try {
      const today = new Date();
      const fDate = today.toLocaleDateString('en-CA');
      const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const uploadId = `UPL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const newUpload = {
        id: uploadId,
        customerId: currentCustomer!.id,
        customerName: currentCustomer!.name,
        fileName: globalFileName,
        category: globalFileCategory,
        size: globalFileReal ? `${(globalFileReal.size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB',
        url: globalFileBase64 || '/colored.jpg',
        uploadedAt: today.toISOString(),
        orderId: globalLinkOrderId || null
      };
      
      await setDoc(doc(db, 'customer_uploads', uploadId), newUpload);
      
      // Notify Admin of new customer design upload
      await createDbNotification({
        recipientId: 'admin',
        title: 'New Artwork Upload',
        message: `${currentCustomer!.name} uploaded artwork "${globalFileName}" for category "${globalFileCategory}"${globalLinkOrderId ? ` linked to order ${globalLinkOrderId}` : ''}.`,
        type: 'file',
        linkId: globalLinkOrderId || currentCustomer!.id
      });
      
      const logId = `LOG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const newLog = {
        id: logId,
        user: `Customer (${currentCustomer!.name})`,
        action: `Uploaded design asset "${globalFileName}" (${globalFileCategory})`,
        date: fDate,
        time: fTime
      };
      await setDoc(doc(db, 'user_logs', logId), newLog);

      if (globalLinkOrderId) {
        const orderObj = orders.find(o => o.id === globalLinkOrderId);
        if (orderObj) {
          const updatedFile = {
            name: globalFileName,
            url: newUpload.url,
            date: fDate,
            category: globalFileCategory,
            size: newUpload.size
          };
          const updatedFiles = Array.isArray(orderObj.uploadedFiles) 
            ? [...orderObj.uploadedFiles, updatedFile] 
            : [updatedFile];
          
          const newTrackingUpdate = {
            status: orderObj.status,
            timestamp: `${fDate} ${fTime}`,
            note: `General file uploaded and linked: "${globalFileName}"`
          };
          
          const updatedOrders = orders.map(o => {
            if (o.id === globalLinkOrderId) {
              return {
                ...o,
                uploadedFiles: updatedFiles,
                trackingUpdates: [newTrackingUpdate, ...(o.trackingUpdates || [])]
              };
            }
            return o;
          });
          
          onUpdateOrders(updatedOrders);
        }
      }
      
      toast.success("File uploaded successfully and synced to DB!");
      setGlobalFileName('');
      setGlobalFileBase64(null);
      setGlobalFileReal(null);
      setGlobalLinkOrderId('');
    } catch (err) {
      console.error("Failed to upload file:", err);
      toast.error("Error uploading file. Please try again.");
    } finally {
      setIsUploadingGlobal(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !chatAttachmentBase64) return;
    
    const messageId = `MSG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const msgDoc = {
      id: messageId,
      chatId: currentCustomer!.id,
      senderId: currentCustomer!.id,
      senderName: currentCustomer!.name,
      message: newMessageText.trim(),
      timestamp: Date.now(),
      fileAttachment: chatAttachmentBase64 ? {
        name: chatAttachmentName,
        url: chatAttachmentBase64,
        type: chatAttachmentBase64.startsWith('data:image/') ? 'image' : 'file'
      } : null
    };
    
    try {
      await setDoc(doc(db, 'support_chats', messageId), msgDoc);

      // Notify Admin of new support chat message
      await createDbNotification({
        recipientId: 'admin',
        title: `Chat from ${currentCustomer!.name}`,
        message: newMessageText.trim() || `Sent an attachment: ${chatAttachmentName}`,
        type: 'chat',
        linkId: currentCustomer!.id
      });

      setNewMessageText('');
      setChatAttachmentBase64(null);
      setChatAttachmentName('');
    } catch (err) {
      console.error("Failed to send chat message:", err);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // File Upload states (retained for single order detail view link)
  const [uploadCategory, setUploadCategory] = useState<string>('Logo Artwork');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customFileSize, setCustomFileSize] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  // Payment proof states
  const [payAmount, setPayAmount] = useState<string>('');
  const [payRef, setPayRef] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('GCash');
  const [isUploadingPayment, setIsUploadingPayment] = useState<boolean>(false);

  // Change Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Rewards states
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [minOrderValue, setMinOrderValue] = useState(149);
  const [pointsRatio, setPointsRatio] = useState(10);
  const [promoRewardTitle, setPromoRewardTitle] = useState('Free Photo ID Bundle Sheets');
  const [promoRewardPoints, setPromoRewardPoints] = useState(100);
  const [promoRewardDesc, setPromoRewardDesc] = useState('Redeem 100 points for free photo ID bundle sheets.');

  // Receipt view and preloading states
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
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
        console.warn('Could not preload logo.png as base64 in CustomerDashboard. Falling back to relative path.', err);
      }
    };
    loadLogo();
  }, []);

  // Load custom registered accounts and check login session
  useEffect(() => {
    // Standard seeded customer account
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

    const loadRewardsConfig = () => {
      const configRaw = localStorage.getItem('jkm_rewards_config');
      if (configRaw) {
        const parsed = JSON.parse(configRaw);
        setRewardsEnabled(parsed.enabled ?? true);
        setMinOrderValue(parsed.minOrderValue ?? 149);
        setPointsRatio(parsed.pointsRatio ?? 10);
        setPromoRewardTitle(parsed.promoRewardTitle ?? 'Free Photo ID Bundle Sheets');
        setPromoRewardPoints(parsed.promoRewardPoints ?? 100);
        setPromoRewardDesc(parsed.promoRewardDesc ?? 'Redeem 100 points for free photo ID bundle sheets.');
      }
    };

    loadRewardsConfig();

    const savedAccounts = localStorage.getItem('jkm_customer_accounts_v2');
    if (!savedAccounts) {
      localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(seeded));
    }

    const activeSession = localStorage.getItem('jkm_active_customer_session');
    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        // Sync active session fields with current central database info if changed
        if (savedAccounts) {
          const list = JSON.parse(savedAccounts);
          const fresh = list.find((a: any) => a.id === parsed.id);
          if (fresh) {
            setCurrentCustomer(fresh);
            localStorage.setItem('jkm_active_customer_session', JSON.stringify(fresh));
          } else {
            setCurrentCustomer(parsed);
          }
        } else {
          setCurrentCustomer(parsed);
        }
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem('jkm_active_customer_session');
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jkm_rewards_config') {
        loadRewardsConfig();
      } else if (e.key === 'jkm_customer_accounts_v2') {
        const listRaw = localStorage.getItem('jkm_customer_accounts_v2');
        const active = localStorage.getItem('jkm_active_customer_session');
        if (listRaw && active) {
          const list = JSON.parse(listRaw);
          const parsedActive = JSON.parse(active);
          const fresh = list.find((a: any) => a.id === parsedActive.id);
          if (fresh) {
            setCurrentCustomer(fresh);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
      const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

      const cleanUser = username.toLowerCase().trim();
      const found = accounts.find(a => 
        a.username.toLowerCase() === cleanUser || 
        a.email.toLowerCase() === cleanUser
      );
      
      // Seed credentials ('customer' / 'password'), or matching stored custom passwords
      const isCorrectPassword = found && (
        (found.password && password === found.password) ||
        (!found.password && (password === 'password' || password === 'Jkmprime@customer'))
      );

      if (found && isCorrectPassword) {
        setCurrentCustomer(found);
        setIsLoggedIn(true);
        localStorage.setItem('jkm_active_customer_session', JSON.stringify(found));
        toast.success(`Welcome back, ${found.name}!`);
      } else {
        toast.error('Invalid customer credentials. Please check your username/email and password.');
      }
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regConfirmPassword || !regName || !regEmail) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (regUsername.trim().includes(' ')) {
      toast.error('Username must not contain spaces.');
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 4) {
      toast.error('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
      const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

      const cleanUser = regUsername.toLowerCase().trim();
      const cleanEmail = regEmail.toLowerCase().trim();

      if (accounts.some(a => a.username.toLowerCase() === cleanUser)) {
        toast.error('Username already exists. Please choose another.');
        return;
      }

      if (accounts.some(a => a.email.toLowerCase() === cleanEmail)) {
        toast.error('An account is already registered with this email.');
        return;
      }

      const newCust: CustomerAccount = {
        id: `CUST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        username: regUsername.trim(),
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || 'N/A',
        address: regAddress.trim() || 'No saved address',
        points: 10, // Initial sign up bonus points!
        isVIP: false,
        birthday: regBday,
        password: regPassword.trim() // Save password properly!
      };

      const updated = [...accounts, newCust];
      localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: 'jkm_customer_accounts_v2' }));
      
      // Do NOT log in automatically. The user must manually log in.
      setAuthView('login');
      setUsername(regUsername.trim());
      setPassword('');

      // Clear all registration fields
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      setRegBday('2000-01-01');
      setRegPassword('');
      setRegConfirmPassword('');

      toast.success('Registration successful! Please log in to your account manually.');
    }, 1200);
  };

  // Forgot Password Flow Handlers
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsernameOrEmail.trim()) {
      toast.error('Please enter your username or email.');
      return;
    }

    const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
    const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

    const cleanInput = resetUsernameOrEmail.toLowerCase().trim();
    const found = accounts.find(
      a => a.username.toLowerCase() === cleanInput ||
           a.email.toLowerCase() === cleanInput
    );

    if (!found) {
      toast.error('Account not found with that username or email.');
      return;
    }

    setResetAccount(found);
    setResetStep('security');
    toast.info('Account located. Please complete security verification to reset your password.');
  };

  const handleVerifySecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAccount) return;

    if (!resetBirthday) {
      toast.error('Please provide your birthday for verification.');
      return;
    }

    if (resetBirthday !== resetAccount.birthday) {
      toast.error('Birthdate verification failed. Incorrect security details.');
      return;
    }

    setResetStep('newPassword');
    toast.success('Security verification passed! Please set your new password.');
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAccount) return;

    if (!resetNewPassword || !resetConfirmNewPassword) {
      toast.error('Please complete both password fields.');
      return;
    }

    if (resetNewPassword !== resetConfirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (resetNewPassword.length < 4) {
      toast.error('Password must be at least 4 characters long.');
      return;
    }

    const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
    const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    
    const updated = accounts.map(a => {
      if (a.id === resetAccount.id) {
        return {
          ...a,
          password: resetNewPassword.trim()
        };
      }
      return a;
    });

    localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'jkm_customer_accounts_v2' }));

    toast.success('Your password has been successfully reset! You can now log in.');
    setIsResettingPassword(false);
    setResetStep('username');
    setResetUsernameOrEmail('');
    setResetBirthday('');
    setResetNewPassword('');
    setResetConfirmNewPassword('');
    setResetAccount(null);
    setAuthView('login');
  };

  const handleLogout = () => {
    setCurrentCustomer(null);
    setIsLoggedIn(false);
    localStorage.removeItem('jkm_active_customer_session');
    setSelectedOrder(null);
    toast.success('Successfully logged out.');
  };

  // Customer Notification Handlers
  const customerUnreadCount = customerNotifications.filter(n => !n.isRead).length;

  const handleCustomerMarkAllAsRead = async () => {
    try {
      const unreads = customerNotifications.filter(n => !n.isRead);
      const batch = writeBatch(db);
      unreads.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerClearAll = async () => {
    try {
      const batch = writeBatch(db);
      customerNotifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerDismiss = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerNotifClick = async (notif: DbNotification) => {
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
    
    // Route customer to corresponding tab
    if (notif.type === 'chat') {
      setActiveTab('chat');
    } else if (notif.type === 'order') {
      setActiveTab('orders');
      if (notif.linkId) {
        const ord = orders.find(o => o.id === notif.linkId);
        if (ord) {
          setSelectedOrder(ord);
        }
      }
    } else if (notif.type === 'file') {
      setActiveTab('uploads');
    }
    setIsNotifDropdownOpen(false);
  };

  // Filter orders corresponding to the logged in customer
  const customerOrders = React.useMemo(() => {
    if (!currentCustomer) return [];
    // Match by customer name or contact number or email
    const nameLower = currentCustomer.name.toLowerCase();
    const phone = currentCustomer.phone;
    return orders.filter(o => {
      const matchName = o.customerName.toLowerCase().includes(nameLower) || nameLower.includes(o.customerName.toLowerCase());
      const matchPhone = phone && phone !== 'N/A' && o.customerContact?.includes(phone);
      return matchName || matchPhone;
    });
  }, [orders, currentCustomer]);

  // Status mapping to 10 production stages
  const getStageIndex = (status: string): number => {
    const stages = [
      'Pending',
      'Design',
      'Waiting for Approval',
      'Printing',
      'Cutting',
      'Laminating',
      'Assembly',
      'Quality Check',
      'Ready for Pickup',
      'Delivered'
    ];
    // Map existing order status to closer match if not exact
    let mapped = status;
    if (status === 'Order Received') mapped = 'Pending';
    if (status === 'Preparing Design') mapped = 'Design';
    if (status === 'Printing in Progress') mapped = 'Printing';
    if (status === 'Quality Checking') mapped = 'Quality Check';
    if (status === 'Out for Delivery') mapped = 'Ready for Pickup';
    if (status === 'Completed') mapped = 'Delivered';

    const idx = stages.indexOf(mapped);
    return idx >= 0 ? idx : 0;
  };

  const stagesList = [
    'Pending',
    'Design',
    'Approval Waiting',
    'Printing',
    'Cutting',
    'Laminating',
    'Assembly',
    'Quality Check',
    'Ready',
    'Delivered'
  ];

  // Design Approval Actions
  const handleDesignApproval = (orderId: string, approve: boolean) => {
    setSubmittingApproval(true);
    setTimeout(() => {
      setSubmittingApproval(false);
      
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          const nextStatus = approve ? 'Printing' : 'Design';
          const today = new Date();
          const fDate = today.toLocaleDateString('en-CA');
          const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          const newUpdate = {
            status: nextStatus as any,
            timestamp: `${fDate} ${fTime}`,
            note: approve 
              ? `Design approved by customer ${currentCustomer?.name}. Production has automatically continued to printing phase.`
              : `Revision requested by customer: "${revisionNotes}". Re-routed back to design team.`,
            images: []
          };

          return {
            ...o,
            status: nextStatus as any,
            trackingUpdates: [newUpdate, ...(o.trackingUpdates || [])]
          };
        }
        return o;
      });

      onUpdateOrders(updatedOrders);
      
      // Update selectedOrder view
      const foundNew = updatedOrders.find(o => o.id === orderId);
      if (foundNew) setSelectedOrder(foundNew);

      if (approve) {
        toast.success('Design approved! Your order has been advanced to printing.');
      } else {
        toast.warning('Revision request submitted. Our artists are on it.');
      }
      setRevisionNotes('');
    }, 1200);
  };

  // Customer Upload File Action
  const handleUploadFile = (orderId: string, fileName: string, category: string, fileSize: string) => {
    if (!fileName) {
      toast.error('Please specify or browse a file name first!');
      return;
    }
    setIsUploadingFile(true);
    setTimeout(() => {
      setIsUploadingFile(false);
      
      const today = new Date();
      const fDate = today.toLocaleDateString('en-CA');
      const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const newFile = {
        name: fileName,
        url: '/colored.jpg', // simulation url
        date: fDate,
        category: category,
        size: fileSize || '2.4 MB'
      };

      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          const uploadedFiles = Array.isArray(o.uploadedFiles) ? [...o.uploadedFiles, newFile] : [newFile];
          
          const newUpdate = {
            status: o.status,
            timestamp: `${fDate} ${fTime}`,
            note: `Artwork file uploaded by customer: "${fileName}" (Category: ${category}).`
          };

          return {
            ...o,
            uploadedFiles,
            trackingUpdates: [newUpdate, ...(o.trackingUpdates || [])]
          };
        }
        return o;
      });

      onUpdateOrders(updatedOrders);
      
      // Update selectedOrder view
      const foundNew = updatedOrders.find(o => o.id === orderId);
      if (foundNew) setSelectedOrder(foundNew);

      toast.success(`Artwork file "${fileName}" successfully uploaded and linked to order ${orderId}!`);
      setCustomFileName('');
      setCustomFileSize('');
    }, 1500);
  };

  // Customer Submit Payment Action
  const handleSubmitPayment = (orderId: string, amount: number, refNum: string, method: string) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount!');
      return;
    }
    if (!refNum) {
      toast.error('Reference number is required for GCash/Bank verification!');
      return;
    }

    setIsUploadingPayment(true);
    setTimeout(() => {
      setIsUploadingPayment(false);

      const today = new Date();
      const fDate = today.toLocaleDateString('en-CA');
      const fTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const newSubmission = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amount,
        referenceNumber: refNum,
        method: method,
        date: fDate,
        status: 'Pending' as const,
        proofImage: '/gqr.jpg'
      };

      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          const paymentSubmissions = Array.isArray(o.paymentSubmissions) 
            ? [...o.paymentSubmissions, newSubmission] 
            : [newSubmission];

          const newUpdate = {
            status: o.status,
            timestamp: `${fDate} ${fTime}`,
            note: `Submitted payment proof of ₱${amount.toLocaleString()} via ${method}. (Ref: ${refNum}). Pending Admin verification.`
          };

          return {
            ...o,
            paymentSubmissions,
            trackingUpdates: [newUpdate, ...(o.trackingUpdates || [])]
          };
        }
        return o;
      });

      onUpdateOrders(updatedOrders);

      // Update selectedOrder view
      const foundNew = updatedOrders.find(o => o.id === orderId);
      if (foundNew) setSelectedOrder(foundNew);

      toast.success(`Payment proof of ₱${amount.toLocaleString()} submitted! Admin will verify shortly.`);
      setPayAmount('');
      setPayRef('');
    }, 1500);
  };

  // Reorder flow
  const handleReorderClick = (items: CartItem[]) => {
    onOpenOrderFormWithReorder(items);
    toast.success('Items loaded into the checkout ordering form!');
  };

  const handleExportAsImage = async () => {
    const element = document.getElementById("customer-printable-receipt");

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
    const element = document.getElementById("customer-printable-receipt");

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    
    const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
    const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

    const updatedAccounts = accounts.map(a => {
      if (a.id === currentCustomer.id) {
        return {
          ...a,
          name: currentCustomer.name,
          phone: currentCustomer.phone,
          address: currentCustomer.address,
          birthday: currentCustomer.birthday
        };
      }
      return a;
    });

    localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(updatedAccounts));
    localStorage.setItem('jkm_active_customer_session', JSON.stringify(currentCustomer));
    toast.success('Profile details saved successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const accountsRaw = localStorage.getItem('jkm_customer_accounts_v2');
    const accounts: CustomerAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    const accountIndex = accounts.findIndex(a => a.id === currentCustomer.id);
    
    if (accountIndex === -1) {
      toast.error('Account not found.');
      return;
    }

    const account = accounts[accountIndex];
    const expectedOldPassword = account.password || (account.username === 'customer' ? 'password' : 'Jkmprime@customer');

    if (oldPassword !== expectedOldPassword) {
      toast.error('Incorrect current password.');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    accounts[accountIndex] = {
      ...account,
      password: newPassword
    };

    localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(accounts));
    
    const updatedCustomer = {
      ...currentCustomer,
      password: newPassword
    };
    setCurrentCustomer(updatedCustomer);
    localStorage.setItem('jkm_active_customer_session', JSON.stringify(updatedCustomer));

    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    toast.success('Password changed successfully!');
  };

  // Filter list by selected sub-status
  const filteredOrders = customerOrders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'active') {
      return o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled';
    }
    if (orderFilter === 'completed') {
      return o.status === 'Completed' || o.status === 'Delivered';
    }
    if (orderFilter === 'cancelled') {
      return o.status === 'Cancelled';
    }
    return true;
  });

  const liveViewingReceiptOrder = viewingReceiptOrder 
    ? (orders.find(o => o.id === viewingReceiptOrder.id) || viewingReceiptOrder) 
    : null;

  return (
    <div className="w-full text-slate-800">
      
      {/* 
        ========================================================================
        NOT LOGGED IN: LOGIN / REGISTRATION WORKFLOW
        ========================================================================
      */}
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500" />
          
          {isResettingPassword ? (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-sans font-black text-xl text-slate-900 uppercase tracking-tight">Reset Password</h3>
                <p className="text-slate-500 text-xs mt-1">Follow the instructions below to securely recover your account.</p>
              </div>

              {resetStep === 'username' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                    <p className="text-[11px] text-slate-600 leading-normal">
                      <strong>Step 1 of 3: Locate Account</strong><br />
                      Please enter your registered portal username or email address below so we can locate your customer profile.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Username or Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={resetUsernameOrEmail}
                        onChange={(e) => setResetUsernameOrEmail(e.target.value)}
                        placeholder="e.g. customer"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResettingPassword(false);
                        setResetUsernameOrEmail('');
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 cursor-pointer text-center"
                    >
                      Verify Account
                    </button>
                  </div>
                </form>
              )}

              {resetStep === 'security' && resetAccount && (
                <form onSubmit={handleVerifySecurity} className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl">
                    <p className="text-[11px] text-indigo-900 leading-normal font-semibold">
                      <strong>Step 2 of 3: Identity Verification</strong><br />
                      Account found for <span className="text-slate-900">{resetAccount.name}</span>. For your security, enter your registered birthdate to verify your identity.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Your Birthdate</label>
                    <input
                      type="date"
                      required
                      value={resetBirthday}
                      onChange={(e) => setResetBirthday(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('username');
                        setResetBirthday('');
                        setResetAccount(null);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Change Account
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 cursor-pointer text-center"
                    >
                      Verify Birthday
                    </button>
                  </div>
                </form>
              )}

              {resetStep === 'newPassword' && resetAccount && (
                <form onSubmit={handleSaveResetPassword} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                    <p className="text-[11px] text-emerald-900 leading-normal font-semibold">
                      <strong>Step 3 of 3: Choose New Password</strong><br />
                      Identity confirmed! Please set a new, secure password for your account <strong className="text-slate-900">@{resetAccount.username}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showResetNewPassword ? "text" : "password"}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showResetConfirmNewPassword ? "text" : "password"}
                        required
                        value={resetConfirmNewPassword}
                        onChange={(e) => setResetConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmNewPassword(!showResetConfirmNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                      >
                        {showResetConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Save New Password & Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-sans font-black text-2xl text-slate-900 uppercase tracking-tight">Customer Portal</h3>
                <p className="text-slate-500 text-xs mt-1">Access your printing dashboard, track loyalty rewards, and approve proofs.</p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button
                  onClick={() => setAuthView('login')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    authView === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthView('register')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    authView === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {authView === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Username or Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username or Email Address"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPassword(true);
                          setResetStep('username');
                        }}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl">
                    <p className="text-[10px] text-sky-800 leading-normal font-semibold">
                      💡 Seed credentials: Use username <strong className="text-slate-900">customer</strong> and password <strong className="text-slate-900">password</strong> to log in instantly.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In To Dashboard'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="juan123"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="juan@gmail.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="09171234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Home / Delivery Address</label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Street, Barangay, City, Province"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Birthday (Used for Security Pin Recovery) *</label>
                    <input
                      type="date"
                      required
                      value={regBday}
                      onChange={(e) => setRegBday(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? "text" : "password"}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regPassword && regConfirmPassword && regPassword !== regConfirmPassword && (
                    <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      ⚠️ Passwords do not match
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register New Account'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={onBackToHome}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Homepage
            </button>
          </div>
        </div>
      ) : (
        
        // LOGGED IN DASHBOARD
        <div className="space-y-6">
          
          {/* Top Bar with Brand & Live Notification Bell */}
          <div className="bg-white border border-slate-100 rounded-3xl px-6 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans font-black text-slate-950 text-sm tracking-tight uppercase">Customer Workspace</span>
            </div>
            
            {/* Live Notification Bell */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="relative p-2.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-sky-100 flex items-center justify-center"
                  title="Notifications Panel"
                >
                  <Bell className={`w-5 h-5 ${customerUnreadCount > 0 ? 'text-sky-500 animate-bounce' : 'text-slate-500'}`} />
                  {customerUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full leading-none border-2 border-white shadow-xs">
                      {customerUnreadCount}
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
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[450px]"
                      >
                        {/* Dropdown Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-slate-950 text-xs uppercase tracking-wider">My Alerts</span>
                            {customerUnreadCount > 0 && (
                              <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                                {customerUnreadCount} New
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {customerUnreadCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCustomerMarkAllAsRead();
                                }}
                                className="text-[10px] text-sky-600 hover:text-sky-700 font-extrabold cursor-pointer hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            {customerNotifications.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCustomerClearAll();
                                }}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-extrabold cursor-pointer hover:underline"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dropdown List */}
                        <div className="overflow-y-auto divide-y divide-slate-100 max-h-[350px] flex-grow">
                          {customerNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-450 space-y-2">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                                <Bell className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-800">No new alerts</p>
                                <p className="text-[10px] leading-relaxed text-slate-400">
                                  You'll see progress alerts here when our staff update your order status, confirm payments, or reply to chats.
                                </p>
                              </div>
                            </div>
                          ) : (
                            customerNotifications.map((notif) => {
                              const isRead = notif.isRead;
                              let IconComponent = Bell;
                              let iconColor = 'text-slate-500 bg-slate-50';
                              if (notif.type === 'order') {
                                IconComponent = Bell;
                                iconColor = 'text-sky-600 bg-sky-50';
                              } else if (notif.type === 'file') {
                                IconComponent = FileUp;
                                iconColor = 'text-amber-600 bg-amber-50';
                              } else if (notif.type === 'chat') {
                                IconComponent = MessageSquare;
                                iconColor = 'text-emerald-600 bg-emerald-50';
                              } else if (notif.type === 'system') {
                                IconComponent = Info;
                                iconColor = 'text-indigo-600 bg-indigo-50';
                              }

                              return (
                                <div 
                                  key={notif.id} 
                                  className={`p-3.5 flex gap-3 transition-colors hover:bg-slate-50 relative group ${
                                    !isRead ? 'bg-sky-50/15' : ''
                                  }`}
                                >
                                  <div 
                                    className="flex-grow flex gap-3 cursor-pointer min-w-0"
                                    onClick={() => handleCustomerNotifClick(notif)}
                                  >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                                      <IconComponent className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0 flex-grow space-y-0.5 text-left">
                                      <div className="flex justify-between items-start gap-1">
                                        <span className={`text-xs block truncate ${!isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                          {notif.title}
                                        </span>
                                        {!isRead && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5 animate-pulse" />
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                                        {notif.message}
                                      </p>
                                      <span className="text-[9px] font-mono font-bold text-slate-400 block pt-0.5">
                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCustomerDismiss(notif.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all self-center shrink-0 cursor-pointer"
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

              {/* Logout Button in top bar */}
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-rose-100 font-sans"
              >
                Log Out
              </button>
            </div>
          </div>
          
          {/* PROFILE WELCOME CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl border border-slate-800">
            {/* Background design accents */}
            <div className="absolute right-[-5%] top-[-20%] w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 p-3 rounded-2xl shadow-md text-white">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight">{currentCustomer?.name}</h2>
                    {currentCustomer?.isVIP && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Rewards Member
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-400" /> {currentCustomer?.email}
                  </p>
                </div>
              </div>

              {/* LOYALTY POINTS & ACTIONS */}
              <div className="flex items-center gap-4 self-stretch sm:self-auto border-t border-slate-800 pt-4 sm:pt-0 sm:border-none">
                <div className="bg-slate-850/80 px-4 py-2.5 rounded-2xl border border-slate-800/80 text-center flex-1 sm:flex-initial">
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-black block">Loyalty Points</span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <Star className="w-4 h-4 text-sky-400 fill-sky-400" />
                    <span className="font-extrabold font-mono text-base text-sky-400">{currentCustomer?.points} PTS</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 px-4 py-3 rounded-2xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* DASHBOARD SUMMARY METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: TOTAL ORDERS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] font-mono uppercase font-black tracking-wider block">Total Orders</span>
                <span className="font-mono font-black text-2xl text-slate-900 mt-0.5 block">{customerOrders.length}</span>
              </div>
            </div>

            {/* CARD 2: PENDING ORDERS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
              <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] font-mono uppercase font-black tracking-wider block">Pending Orders</span>
                <span className="font-mono font-black text-2xl text-amber-600 mt-0.5 block">
                  {customerOrders.filter(o => ['Waiting for Payment', 'Pending', 'Order Received', 'Waiting for Approval'].includes(o.status)).length}
                </span>
              </div>
            </div>

            {/* CARD 3: ACTIVE ORDERS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl shrink-0">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] font-mono uppercase font-black tracking-wider block">Active Orders</span>
                <span className="font-mono font-black text-2xl text-indigo-600 mt-0.5 block">
                  {customerOrders.filter(o => !['Completed', 'Delivered', 'Cancelled', 'Waiting for Payment'].includes(o.status)).length}
                </span>
              </div>
            </div>

            {/* CARD 4: COMPLETED ORDERS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] font-mono uppercase font-black tracking-wider block">Completed Orders</span>
                <span className="font-mono font-black text-2xl text-emerald-600 mt-0.5 block">
                  {customerOrders.filter(o => ['Completed', 'Delivered'].includes(o.status)).length}
                </span>
              </div>
            </div>
          </div>

          {/* INNER TABS BAR */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-1 overflow-x-auto">
            <div className="flex gap-4 shrink-0">
              <button
                onClick={() => { setActiveTab('overview'); setSelectedOrder(null); }}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 px-1 ${
                  activeTab === 'overview' ? 'border-sky-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 px-1 ${
                  activeTab === 'orders' ? 'border-sky-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                My Orders History ({customerOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setSelectedOrder(null); }}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 px-1 ${
                  activeTab === 'profile' ? 'border-sky-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Saved Profile & Address
              </button>
              <button
                onClick={() => { setActiveTab('uploads'); setSelectedOrder(null); }}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 px-1 ${
                  activeTab === 'uploads' ? 'border-sky-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Upload Files & Artwork
              </button>
              <button
                onClick={() => { setActiveTab('chat'); setSelectedOrder(null); }}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 px-1 ${
                  activeTab === 'chat' ? 'border-sky-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Live Support Chat
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {onOpenOrderForm && (
                <button
                  onClick={onOpenOrderForm}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-sky-600/10 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Place New Order
                </button>
              )}
              <button
                onClick={onBackToHome}
                className="text-sky-600 hover:text-sky-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Store
              </button>
            </div>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* MAIN COMPONENT RENDERER */}
            <div className={`${
              ['profile', 'chat', 'uploads'].includes(activeTab) ? 'lg:col-span-12' : 'lg:col-span-8'
            } space-y-4`}>
              
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Orders Section */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-sans font-black text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <ShoppingBag className="w-4.5 h-4.5 text-sky-500" />
                          Recent Orders
                        </h4>
                        <p className="text-slate-400 text-[10px] mt-0.5">Quickly track and view details of your recent prints.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        View All
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div className="p-8 text-center space-y-3">
                        <ShoppingBag className="w-10 h-10 text-slate-350 mx-auto" />
                        <h4 className="font-bold text-slate-800">No Orders Placed Yet</h4>
                        <p className="text-slate-500 text-xs max-w-xs mx-auto">
                          Ready to bring your designs to life? Click the button above to place your first order!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerOrders.slice(0, 3).map(o => {
                          const stageIdx = getStageIndex(o.status);
                          return (
                            <div
                              key={o.id}
                              onClick={() => { setSelectedOrder(o); setActiveTab('orders'); }}
                              className="group bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-sky-250 rounded-2xl p-4.5 transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-xs text-slate-900">{o.id}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">| {o.date}</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-700">
                                  {o.items.length} {o.items.length === 1 ? 'item' : 'items'} • <span className="font-bold text-slate-900">₱{o.grandTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {o.items.slice(0, 2).map((item, i) => (
                                    <span key={i} className="bg-white text-slate-600 text-[10px] px-2 py-0.5 rounded-lg border border-slate-200">
                                      {item.productName} ({item.quantity}x)
                                    </span>
                                  ))}
                                  {o.items.length > 2 && (
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-lg">
                                      +{o.items.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 self-stretch md:self-auto">
                                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border ${
                                  o.status === 'Completed' || o.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : o.status === 'Cancelled'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                                }`}>
                                  {o.status}
                                </span>
                                <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      o.status === 'Completed' || o.status === 'Delivered'
                                        ? 'bg-emerald-500'
                                        : o.status === 'Cancelled'
                                          ? 'bg-rose-400'
                                          : 'bg-sky-500'
                                    }`}
                                    style={{ width: `${Math.max(10, (stageIdx + 1) * 20)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <>
                  {!selectedOrder ? (
                    <div className="space-y-4">
                      {/* Sub filters */}
                      <div className="flex gap-2">
                        {(['all', 'active', 'completed', 'cancelled'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setOrderFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderFilter === f 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {filteredOrders.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-3">
                          <ShoppingBag className="w-10 h-10 text-slate-350 mx-auto" />
                          <h4 className="font-bold text-slate-800">No Orders Registered</h4>
                          <p className="text-slate-500 text-xs max-w-xs mx-auto">
                            We couldn't find any order transactions matching your profile name or mobile number in our databases.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3.5">
                          {filteredOrders.map(o => {
                            const stageIdx = getStageIndex(o.status);
                            return (
                              <div
                                key={o.id}
                                onClick={() => setSelectedOrder(o)}
                                className="bg-white border border-slate-100 rounded-2xl p-4.5 hover:border-sky-300 shadow-xs cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-extrabold text-sm text-slate-900">{o.id}</span>
                                    {o.paymentType === 'Down Payment' && (
                                      <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-0.5 rounded font-black uppercase">Partially Paid</span>
                                    )}
                                    {o.paymentType === 'Full Payment' && (
                                      <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded font-black uppercase">Fully Paid</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    Placed on {o.date} at {o.time} • {o.items.length} items
                                  </p>
                                  <p className="text-xs text-slate-800 font-bold">
                                    Total Amount: ₱{o.grandTotal.toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none border-slate-50 pt-3 sm:pt-0">
                                  {o.status !== 'Cancelled' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingReceiptOrder(o);
                                      }}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 p-2 rounded-xl border border-sky-100 hover:border-sky-200 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0"
                                      title="View Receipt"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                      <span>Receipt</span>
                                    </button>
                                  )}
                                  <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase block ${
                                      o.status === 'Completed' || o.status === 'Delivered'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : o.status === 'Cancelled'
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'bg-sky-50 text-sky-600'
                                    }`}>
                                      {o.status}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                      Stage: {stageIdx + 1} of 10 ({stagesList[stageIdx]})
                                    </span>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-slate-300 hidden sm:block" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    
                    // SELECTED ORDER DETAILS VIEW (WITH STAGES AND DESIGN APPROVAL)
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to List
                        </button>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setViewingReceiptOrder(selectedOrder)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </button>
                          <span className="font-mono font-black text-sm text-sky-600">{selectedOrder.id}</span>
                        </div>
                      </div>

                      {/* 10-STAGES TIMELINE STEPPER PROGRESS BAR */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-sky-500" />
                            Production Timeline Tracker
                          </h4>
                          <span className="bg-sky-50 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            {selectedOrder.status}
                          </span>
                        </div>

                        {/* Responsive timeline grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                          {stagesList.map((st, i) => {
                            const currentIdx = getStageIndex(selectedOrder.status);
                            const isCompleted = i < currentIdx;
                            const isActive = i === currentIdx;
                            
                            return (
                              <div 
                                key={st} 
                                className={`p-2 rounded-xl text-center border transition-all ${
                                  isActive 
                                    ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/15 scale-102' 
                                    : isCompleted
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                }`}
                              >
                                <span className="font-mono text-[9px] block font-extrabold opacity-80">ST-{i+1}</span>
                                <span className="text-[8px] font-bold block truncate mt-0.5">{st}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* STEP-BY-STEP MILESTONE TIMELINE LOGS */}
                      {selectedOrder.trackingUpdates && selectedOrder.trackingUpdates.length > 0 && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 animate-fadeIn">
                          <h5 className="font-sans font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Clock className="w-4 h-4 text-sky-500" />
                            Activity Log & Milestone History
                          </h5>
                          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                            {selectedOrder.trackingUpdates.map((m, idx) => (
                              <div key={idx} className="relative pl-5 border-l-2 border-slate-200 last:border-l-0 pb-1.5 space-y-1">
                                <span className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 border-2 border-white" />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 uppercase">{m.status}</span>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold">{m.timestamp}</span>
                                </div>
                                {m.note && (
                                  <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">{m.note}</p>
                                )}
                                {m.images && m.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1.5">
                                    {m.images.map((img, iIdx) => (
                                      <a 
                                        key={iIdx} 
                                        href={img} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="relative group aspect-[16/9] w-24 rounded-lg overflow-hidden border border-slate-200 block"
                                      >
                                        <img src={img} alt="Milestone attachment" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Eye className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DESIGN APPROVAL CONTROL WORKSPACE */}
                      {selectedOrder.status === 'Waiting for Approval' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Design Verification & Approval Needed</h5>
                              <p className="text-amber-700 text-xs leading-normal">
                                Our creative artists have uploaded an artwork design proof for your printing job. Please review it below. You can approve to proceed to immediate print, or request adjustments.
                              </p>
                            </div>
                          </div>

                          {/* Design Preview Mock */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold mb-2">Design Proof Attachment Preview</span>
                            <div className="w-full max-w-sm aspect-[4/3] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative">
                              <img 
                                src={selectedOrder.designLink || '/colored.jpg'} 
                                alt="Design Proof Mock" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[1px] flex items-end p-3">
                                <span className="bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                                  PROOF_SPEC_RGB_HIGH_RES.PNG
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Approval inputs */}
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-600 mb-1">
                                Revision Requests / Notes (Only if requesting changes)
                              </label>
                              <textarea
                                rows={2.5}
                                value={revisionNotes}
                                onChange={(e) => setRevisionNotes(e.target.value)}
                                placeholder="Specify text modifications, font/color tweaks, or layout changes..."
                                className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-amber-500 transition-all text-slate-800"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                disabled={submittingApproval}
                                onClick={() => handleDesignApproval(selectedOrder.id, false)}
                                className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 text-xs py-3 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                Request Adjustment
                              </button>
                              <button
                                type="button"
                                disabled={submittingApproval}
                                onClick={() => handleDesignApproval(selectedOrder.id, true)}
                                className="bg-sky-500 hover:bg-sky-600 text-white text-xs py-3 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-sky-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Approve Design Proof
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ORDER DETAILS & SUMMARY CARDS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Fulfillment Details</h5>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-450">Delivery Method:</span>
                              <span className="font-bold text-slate-800 uppercase">
                                {selectedOrder.deliveryMethod === 'pickup' ? 'Store Pickup' : 
                                 selectedOrder.deliveryMethod === 'delivery' ? 'Customer Books Courier' : 
                                 selectedOrder.deliveryMethod || 'Store Pickup'}
                              </span>
                            </div>
                            {(selectedOrder.deliveryMethod === 'delivery' || selectedOrder.deliveryMethod === 'Customer Books Courier') && (
                              <div className="space-y-1 text-right">
                                <span className="text-slate-450 block">Courier & Address:</span>
                                <span className="font-bold text-slate-800 block text-[11px]">{selectedOrder.selectedCourier || 'Lalamove'}</span>
                                <span className="text-slate-500 block text-[10px]">{selectedOrder.deliveryAddress || 'No address specified'}</span>
                              </div>
                            )}
                            {selectedOrder.deliveryMethod === 'Meet Up' && (
                              <div className="space-y-1 text-right">
                                <span className="text-slate-450 block">Meet-Up Location:</span>
                                <span className="text-slate-500 block text-[10px]">{selectedOrder.deliveryAddress || 'No location specified'}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-450">Notes & Instructions:</span>
                              <span className="text-slate-700 italic">{selectedOrder.notes || 'None'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Receipt Ledger</h5>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-450">Discount Applied:</span>
                              <span className="font-mono text-slate-800">₱{selectedOrder.discount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-450">Downpayment Made:</span>
                              <span className="font-mono text-emerald-600 font-bold">₱{selectedOrder.downPaymentAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-50 pt-2 font-bold text-slate-900">
                              <span>Grand Total Amount:</span>
                              <span className="font-mono text-sky-600">₱{selectedOrder.grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Remaining Balance:</span>
                              <span className="font-mono font-bold text-slate-700">₱{selectedOrder.remainingBalance.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setViewingReceiptOrder(selectedOrder)}
                            className="w-full mt-3 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-sky-150 active:scale-95"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>View Printable Invoice Receipt</span>
                          </button>
                        </div>
                      </div>

                      {/* NEW SECTION: CUSTOMER FILE TRANSFER SYSTEM & ARTWORK SUBMISSIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* 1. FILE UPLOAD BOX */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Download className="w-4 h-4 text-sky-500 rotate-180" />
                            File Transfer: Upload Artwork
                          </h5>
                          
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Need custom layouts printed? Select a category and enter file details to link high-resolution PDF or design vector sheets directly to this order.
                          </p>

                          <div className="space-y-2.5 pt-1 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Asset Category</label>
                                <select 
                                  value={uploadCategory}
                                  onChange={(e) => setUploadCategory(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                                >
                                  <option value="Logo Artwork">Logo Artwork</option>
                                  <option value="High-res PDF">High-res PDF</option>
                                  <option value="Custom Instructions">Custom Instructions</option>
                                  <option value="Sintra Reference">Sintra Reference</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">File Size Sim</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 15.4 MB"
                                  value={customFileSize}
                                  onChange={(e) => setCustomFileSize(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">File Name / Label *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. JKM_Stickers_HighRes_Final.pdf"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={isUploadingFile || !customFileName}
                              onClick={() => handleUploadFile(selectedOrder.id, customFileName, uploadCategory, customFileSize)}
                              className="w-full bg-slate-900 hover:bg-slate-850 text-white text-[11px] py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              {isUploadingFile ? 'Uploading Assets...' : 'Upload & Link File'}
                            </button>
                          </div>

                          {/* Render files already uploaded to this order */}
                          {selectedOrder.uploadedFiles && selectedOrder.uploadedFiles.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400 block">Uploaded Assets ({selectedOrder.uploadedFiles.length})</span>
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                                {selectedOrder.uploadedFiles.map((f, i) => (
                                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-slate-800 truncate block">{f.name}</span>
                                      <span className="text-slate-400 block font-mono">{f.category} • {f.size || '2.5 MB'}</span>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase font-mono">Linked</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. SUBMIT PAYMENT BOX */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            GCash & Bank Payment Submission
                          </h5>

                          <p className="text-[11px] text-slate-500 leading-normal">
                            Submit your downpayment or full payment proof receipt here. Admin will instantly verify and credit the balance in real-time.
                          </p>

                          {selectedOrder.remainingBalance <= 0 ? (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3 text-center text-xs font-bold">
                              ✓ Order is fully paid! No balance remaining.
                            </div>
                          ) : (
                            <div className="space-y-2.5 pt-1 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Method</label>
                                  <select 
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                                  >
                                    <option value="GCash">GCash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="BDO Transfer">BDO Transfer</option>
                                    <option value="BPI Transfer">BPI Transfer</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Amount to Submit (₱)</label>
                                  <input 
                                    type="number" 
                                    placeholder={selectedOrder.remainingBalance.toString()}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">GCash / Bank Reference Number *</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 5013 4182 1930 14"
                                  value={payRef}
                                  onChange={(e) => setPayRef(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none font-mono"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={isUploadingPayment || !payRef}
                                onClick={() => handleSubmitPayment(selectedOrder.id, payAmount ? Number(payAmount) : selectedOrder.remainingBalance, payRef, payMethod)}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white text-[11px] py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs uppercase tracking-wider"
                              >
                                {isUploadingPayment ? 'Submitting Receipt...' : 'Submit Payment Proof'}
                              </button>
                            </div>
                          )}

                          {/* Render payments already submitted to this order */}
                          {selectedOrder.paymentSubmissions && selectedOrder.paymentSubmissions.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400 block">Submission History ({selectedOrder.paymentSubmissions.length})</span>
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                                {selectedOrder.paymentSubmissions.map((s, i) => (
                                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-slate-800 block">₱{s.amount.toLocaleString()} via {s.method}</span>
                                      <span className="text-slate-400 block font-mono font-semibold">Ref: {s.referenceNumber}</span>
                                    </div>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase font-mono ${
                                      s.status === 'Approved'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : s.status === 'Rejected'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {s.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CART ITEMS CONTAINER */}
                      <div className="space-y-3">
                        <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Items Ordered</h5>
                        <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                          {selectedOrder.items.map(item => (
                            <div key={item.id} className="p-3.5 flex justify-between items-center bg-slate-50/50">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-slate-900">{item.product.name}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  Quantity: {item.quantity} {item.product.unit || 'Piece'} • Price: ₱{item.product.basePrice}
                                </span>
                                {item.notes && <span className="text-[9px] text-slate-500 italic block">Spec: {item.notes}</span>}
                              </div>
                              <span className="font-mono font-bold text-xs text-slate-800">₱{item.subtotal.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* FOOTER ACTIONS */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={() => handleReorderClick(selectedOrder.items)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Easy Reorder Items
                        </button>
                        
                        <a
                          href="https://m.me/Jkmprimedigitalprints"
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat support
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
                    <h4 className="font-sans font-black text-sm text-slate-900 uppercase tracking-wider mb-4">Edit Profile Settings</h4>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={currentCustomer?.name || ''}
                            onChange={(e) => setCurrentCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Mobile Phone Number</label>
                          <input
                            type="text"
                            required
                            value={currentCustomer?.phone || ''}
                            onChange={(e) => setCurrentCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Saved Delivery Address</label>
                        <input
                          type="text"
                          required
                          value={currentCustomer?.address || ''}
                          onChange={(e) => setCurrentCustomer(prev => prev ? { ...prev, address: e.target.value } : null)}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Birth Date</label>
                          <input
                            type="date"
                            value={currentCustomer?.birthday || ''}
                            onChange={(e) => setCurrentCustomer(prev => prev ? { ...prev, birthday: e.target.value } : null)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          Save Address & Contact
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
                    <h4 className="font-sans font-black text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5 text-slate-900">
                      <Lock className="w-4 h-4 text-sky-500" />
                      Change Account Password
                    </h4>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 pl-4 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">New Password</label>
                          <div className="relative">
                            <input
                              type={showProfileNewPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 pl-4 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowProfileNewPassword(!showProfileNewPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                            >
                              {showProfileNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 mb-1">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showProfileConfirmPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 pl-4 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowProfileConfirmPassword(!showProfileConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                            >
                              {showProfileConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'uploads' && (
                <div className="space-y-6">
                  {/* Upload Box Card */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <h4 className="font-sans font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-sky-500" />
                      Upload Customer Design Assets
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Need custom templates, branding vector files, or high-definition pictures printed? Upload your assets here. Our prepress designers will verify them in real-time and link them to your active projects.
                    </p>

                    <form onSubmit={handleGlobalFileUpload} className="space-y-4">
                      {/* Drag & Drop File Zone */}
                      <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-50 hover:bg-slate-50/50 relative">
                        <input
                          type="file"
                          id="global-file-picker"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) triggerFileRead(file, false);
                          }}
                        />
                        <div className="space-y-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mx-auto">
                            <Upload className="w-5 h-5 text-sky-500" />
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            {globalFileName ? `Selected: ${globalFileName}` : 'Drag & Drop your file or click to browse'}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Supports JPG, PNG, PDF, AI, PSD, and EPS vectors (Max 20MB)
                          </p>
                        </div>
                      </div>

                      {/* Manual input settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Asset Category</label>
                          <select
                            value={globalFileCategory}
                            onChange={(e) => setGlobalFileCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-500 font-semibold"
                          >
                            <option value="Logo Artwork">Logo Artwork</option>
                            <option value="High-res PDF">High-res PDF</option>
                            <option value="Custom Instructions">Custom Instructions</option>
                            <option value="Sintra Reference">Sintra Reference</option>
                            <option value="Receipt / Proof">Receipt / Proof</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Link to Order (Optional)</label>
                          <select
                            value={globalLinkOrderId}
                            onChange={(e) => setGlobalLinkOrderId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-500 font-semibold font-mono"
                          >
                            <option value="">-- No linked order --</option>
                            {customerOrders.map(o => (
                              <option key={o.id} value={o.id}>{o.id} ({o.status})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Filename Override</label>
                          <input
                            type="text"
                            required
                            placeholder="File Label"
                            value={globalFileName}
                            onChange={(e) => setGlobalFileName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-500 font-semibold"
                          />
                        </div>
                      </div>

                      {globalFileBase64 && (
                        <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center gap-3">
                          {globalFileBase64.startsWith('data:image/') ? (
                            <img src={globalFileBase64} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center font-mono text-[9px] text-slate-500 font-bold uppercase">FILE</div>
                          )}
                          <div className="text-[11px] min-w-0 flex-1">
                            <span className="font-bold text-slate-800 block truncate">{globalFileName}</span>
                            <span className="text-slate-400 block font-mono">Ready to upload • {globalFileReal ? `${(globalFileReal.size / 1024).toFixed(0)} KB` : '1.5 MB'}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUploadingGlobal || !globalFileName}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-sky-600/10"
                      >
                        {isUploadingGlobal ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading & Syncing Design Assets...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload & Share with Admin
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Upload List */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <h4 className="font-sans font-black text-xs text-slate-400 uppercase tracking-widest">
                      Your Upload History & Synced Files ({uploadedFileList.length})
                    </h4>

                    {uploadedFileList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 space-y-2">
                        <FileUp className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs">No uploaded files yet. Choose a file above to get started.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {uploadedFileList.map((file) => (
                          <div key={file.id} className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-all flex gap-3 items-start relative group">
                            {file.url && file.url.startsWith('data:image/') ? (
                              <img src={file.url} alt={file.fileName} className="w-12 h-12 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center font-mono text-[9px] text-sky-600 font-bold">
                                <FileUp className="w-4 h-4 mb-0.5 text-sky-500" />
                                DOC
                              </div>
                            )}
                            <div className="min-w-0 flex-1 text-xs">
                              <span className="font-bold text-slate-800 block truncate" title={file.fileName}>{file.fileName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{file.category} • {file.size || '1.5 MB'}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(file.uploadedAt).toLocaleString()}</span>
                              {file.orderId && (
                                <span className="inline-block mt-1 bg-sky-50 text-sky-700 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold">
                                  Linked to {file.orderId}
                                </span>
                              )}
                            </div>
                            <a
                              href={file.url}
                              download={file.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 hover:border-sky-500 rounded-lg text-slate-500 hover:text-sky-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Download Asset"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[580px]">
                  {/* Chat Header */}
                  <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-xs font-black">
                          JKM
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <span className="font-bold text-xs block">JKM Prime Digital Prints Support</span>
                        <span className="text-[10px] text-sky-350 block font-medium">Real-Time Connected • Typically replies in minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400 p-6">
                        <MessageSquare className="w-10 h-10 text-slate-300" />
                        <h5 className="font-bold text-slate-700 text-sm">Start a Conversation</h5>
                        <p className="text-xs max-w-xs leading-relaxed">
                          Ask for design updates, pricing inquiries, production timelines, or custom print requests right here.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isAdmin = msg.senderId === 'admin';
                        return (
                          <div key={msg.id || i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] space-y-1`}>
                              <div className={`text-[9px] font-bold text-slate-400 px-1 ${isAdmin ? 'text-left' : 'text-right'}`}>
                                {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                                isAdmin 
                                  ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
                                  : 'bg-sky-600 text-white rounded-tr-none'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                
                                {msg.fileAttachment && (
                                  <div className="mt-2 pt-2 border-t border-slate-100/10 text-left">
                                    {msg.fileAttachment.type === 'image' ? (
                                      <a href={msg.fileAttachment.url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                                        <img src={msg.fileAttachment.url} alt="Attachment" className="max-h-[160px] w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold gap-1">
                                          <Eye className="w-3.5 h-3.5" /> View Image
                                        </span>
                                      </a>
                                    ) : (
                                      <a href={msg.fileAttachment.url} download={msg.fileAttachment.name} target="_blank" rel="noreferrer" className="bg-slate-900/10 hover:bg-slate-900/20 px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold truncate">
                                        <FileUp className="w-4 h-4 text-sky-500 shrink-0" />
                                        <span className="truncate flex-1">{msg.fileAttachment.name}</span>
                                        <Download className="w-3.5 h-3.5" />
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

                  {/* Chat Input form */}
                  <form onSubmit={handleSendChatMessage} className="bg-white border-t border-slate-100 p-3 space-y-2">
                    {chatAttachmentBase64 && (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          {chatAttachmentBase64.startsWith('data:image/') ? (
                            <img src={chatAttachmentBase64} alt="Attachment" className="w-8 h-8 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-[8px] font-bold text-sky-700">FILE</div>
                          )}
                          <span className="font-bold text-slate-700 truncate max-w-[200px]">{chatAttachmentName}</span>
                        </div>
                        <button type="button" onClick={() => { setChatAttachmentBase64(null); setChatAttachmentName(''); }} className="text-[10px] text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 rounded">Remove</button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex items-center">
                        <input
                          type="file"
                          id="chat-file-picker"
                          className="absolute inset-0 opacity-0 cursor-pointer w-8"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) triggerFileRead(file, true);
                          }}
                        />
                        <button
                          type="button"
                          className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl text-slate-550 transition-all cursor-pointer"
                          title="Attach Photo or Document"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Type your message here..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
                      />

                      <button
                        type="submit"
                        disabled={!newMessageText.trim() && !chatAttachmentBase64}
                        className="bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-sky-600/10 flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

            {/* RIGHT: DASHBOARD METRICS / VIP BENEFITS */}
            {!['profile', 'chat', 'uploads'].includes(activeTab) && (
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-md">
                  <h5 className="font-sans font-black text-xs text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-indigo-400 text-indigo-400 animate-pulse" />
                    Customer Rewards Program
                  </h5>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Earn points automatically with completed orders of <strong>₱{minOrderValue}</strong> or more.
                  </p>
                  
                  <div className="space-y-2.5 mt-4 text-[11px]">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Get <strong>1 Point</strong> for every <strong>₱{pointsRatio} spent</strong> on qualified completed orders.</span>
                    </div>
                    {rewardsEnabled && (
                      <>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Active Promo: <strong>{promoRewardTitle}</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 italic">{promoRewardDesc} (Requires <strong>{promoRewardPoints} PTS</strong>)</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Points accumulate automatically on order completion.</span>
                    </div>
                  </div>
                </div>

                {/* QUICK STORE STATS */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Fulfillment Summary</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                      <span className="text-slate-400 text-[9px] font-bold block">Active Jobs</span>
                      <span className="font-mono font-black text-lg text-slate-800">
                        {customerOrders.filter(o => o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                      <span className="text-slate-400 text-[9px] font-bold block">Past Prints</span>
                      <span className="font-mono font-black text-lg text-emerald-600">
                        {customerOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* FULL RECEIPT OVERLAY PREVIEW MODAL */}
      <AnimatePresence>
        {liveViewingReceiptOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:absolute print:inset-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col relative print:shadow-none print:border-none print:max-h-none print:w-full"
            >
              
              {/* Header non print controls */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100 print:hidden shrink-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-500" />
                  Your Customer Receipt
                </span>
                <button
                  onClick={() => setViewingReceiptOrder(null)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Close receipt"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Invoice body */}
              <div id="customer-printable-receipt" className="p-6 sm:p-8 overflow-y-auto text-slate-700 space-y-4 text-xs font-mono">
                
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
                 <div className="space-y-1.5 text-[11px] text-slate-600">
                   <div className="flex justify-between gap-4">
                     <span className="shrink-0">CUSTOMER NAME:</span>
                     <span className="font-bold text-slate-900 uppercase text-right">{liveViewingReceiptOrder.customerName}</span>
                   </div>
                   {liveViewingReceiptOrder.customerContact && (
                     <div className="flex justify-between gap-4">
                       <span className="shrink-0">CONTACT NO:</span>
                       <span className="font-bold text-slate-900 text-right">{liveViewingReceiptOrder.customerContact}</span>
                     </div>
                   )}
                   <div className="flex justify-between gap-4">
                     <span className="shrink-0">DATE & TIME:</span>
                     <span className="text-right">{liveViewingReceiptOrder.date} | {liveViewingReceiptOrder.time}</span>
                   </div>
                   <div className="flex justify-between gap-4">
                     <span className="shrink-0">ORDER INVOICE:</span>
                     <span className="font-bold text-slate-900 text-right">{liveViewingReceiptOrder.id}</span>
                   </div>
                   {liveViewingReceiptOrder.trackingNumber && (
                     <div className="flex justify-between gap-4 text-sky-600 font-bold">
                       <span className="shrink-0">TRACKING NO:</span>
                       <span className="font-mono text-xs select-all bg-sky-50 px-1 border border-sky-100 rounded text-right">{liveViewingReceiptOrder.trackingNumber}</span>
                     </div>
                   )}
                   <div className="flex justify-between gap-4">
                     <span className="shrink-0">FULFILLMENT STATE:</span>
                     <span className="font-black text-sky-600 uppercase text-[10px] text-right">{liveViewingReceiptOrder.status}</span>
                   </div>

                   {/* Fulfillment details (Pickup vs Delivery) */}
                   <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 mt-1">
                     <span className="shrink-0">DELIVERY METHOD:</span>
                     <span className="font-bold uppercase text-slate-900 text-right">
                       {liveViewingReceiptOrder.deliveryMethod === 'pickup' || liveViewingReceiptOrder.deliveryMethod === 'Store Pickup' ? '🏢 Store Pickup' : 
                        liveViewingReceiptOrder.deliveryMethod === 'Meet Up' ? '🤝 Meet Up' : '🚚 Courier Delivery'}
                     </span>
                   </div>
                   {(liveViewingReceiptOrder.deliveryMethod === 'delivery' || liveViewingReceiptOrder.deliveryMethod === 'Customer Books Courier') && (
                     <>
                       <div className="flex justify-between gap-4 text-slate-500">
                         <span className="shrink-0">SELECTED COURIER:</span>
                         <span className="font-bold text-slate-800 uppercase text-right">{liveViewingReceiptOrder.selectedCourier || 'Lalamove'}</span>
                       </div>
                       <div className="flex justify-between gap-4 text-slate-500">
                         <span className="shrink-0">DELIVERY LOCATION:</span>
                         <span className="font-bold text-slate-800 uppercase text-right max-w-[200px] break-words">
                           {liveViewingReceiptOrder.deliveryAddress || 'No Address Provided'}
                         </span>
                       </div>
                     </>
                   )}
                   {liveViewingReceiptOrder.deliveryMethod === 'Meet Up' && (
                     <div className="flex justify-between gap-4 text-slate-500">
                       <span className="shrink-0">MEET-UP LOCATION:</span>
                       <span className="font-bold text-slate-800 uppercase text-right max-w-[200px] break-words">
                         {liveViewingReceiptOrder.deliveryAddress || 'No Location Provided'}
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
                    {liveViewingReceiptOrder.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs text-slate-800">
                        <div className="flex justify-between gap-4 font-bold text-slate-900">
                          <span className="max-w-[250px] break-words">{item.product?.name || 'Product Item'} × {item.quantity}</span>
                          <span className="shrink-0">₱{item.subtotal.toLocaleString()}</span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded pl-2 font-sans font-semibold break-words max-w-full">
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
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0">Subtotal Stream:</span>
                    <span className="text-right">₱{liveViewingReceiptOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {liveViewingReceiptOrder.discount > 0 && (
                    <div className="flex justify-between gap-4 text-rose-500 font-bold">
                      <span className="shrink-0">Discount Deduction:</span>
                      <span className="text-right">-₱{liveViewingReceiptOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-slate-900 font-black text-sm">
                    <span className="shrink-0">Grand Total:</span>
                    <span className="text-right">₱{liveViewingReceiptOrder.grandTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="py-1">
                    <svg className="w-full h-[2px]" width="100%" height="2">
                      <line x1="0" y1="1" x2="100%" y2="1" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                  </div>
                  
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0">Payment Formula:</span>
                    <span className="font-bold text-slate-900 uppercase text-right">{liveViewingReceiptOrder.paymentType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0">Payment Status:</span>
                    <span className="font-bold text-sky-600 uppercase text-right">
                      {liveViewingReceiptOrder.remainingBalance <= 0 ? 'Fully Paid' : 'Partially Paid'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0">Settling Method:</span>
                    <span className="font-bold text-slate-900 uppercase text-right">{liveViewingReceiptOrder.paymentMethod}</span>
                  </div>
                  
                  {liveViewingReceiptOrder.paymentType === 'Down Payment' && (
                    <>
                      <div className="flex justify-between gap-4 text-sky-600 font-bold">
                        <span className="shrink-0">Down Payment Collected:</span>
                        <span className="text-right">₱{liveViewingReceiptOrder.downPaymentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-rose-500 font-bold">
                        <span className="shrink-0">Balance Outstanding:</span>
                        <span className="text-right">₱{liveViewingReceiptOrder.remainingBalance.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between gap-4 font-bold text-slate-900">
                    <span className="shrink-0">Amount Handed Over:</span>
                    <span className="text-right">₱{liveViewingReceiptOrder.amountPaid.toLocaleString()}</span>
                  </div>
                  {liveViewingReceiptOrder.change > 0 && (
                    <div className="flex justify-between gap-4 text-emerald-600 font-black">
                      <span className="shrink-0">Change Refund:</span>
                      <span className="text-right">₱{liveViewingReceiptOrder.change.toLocaleString()}</span>
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

    </div>
  );
};
