/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  ShoppingCart,
  Maximize2,
  CheckCircle2,
  Menu,
  X,
  User,
  Shield,
  Layers,
  Image,
  GitMerge,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Package,
  Sliders,
  ExternalLink,
  Search
} from 'lucide-react';
import { PRODUCTS, PORTFOLIO, FAQ_ITEMS, BUSINESS_INFO } from '../utils/data';
import { useToast } from './Toast';
import OrderFormModal from './OrderFormModal';
import { OrderTracking } from './POS/OrderTracking';
import { CustomerDashboard } from './POS/CustomerDashboard';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { LiveChatWidget } from './LiveChatWidget';
import { FacebookReelsSlider } from './FacebookReelsSlider';
import { Order } from '../types';

// Firebase imports
import { db, ordersCol, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const { toast } = useToast();

  // Public orders list for tracking
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Listen to live Firestore orders
    const unsub = onSnapshot(ordersCol, (snapshot) => {
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

    return () => unsub();
  }, []);

  const handleUpdateOrders = async (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    try {
      for (const u of updatedOrders) {
        const prev = orders.find(o => o.id === u.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(u)) {
          const cleanU = sanitizeForFirestore(u);
          await setDoc(doc(db, 'orders', u.id), cleanU);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    }
  };

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Customer Dashboard Portal States
  const [customerView, setCustomerView] = useState<'home' | 'dashboard'>('home');
  const [initialReorderItem, setInitialReorderItem] = useState<{ productName: string; quantity: number; notes: string } | null>(null);

  // Order Portal Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Category filter state for Product Catalog
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('All');
  const [productSearch, setProductSearch] = useState<string>('');

  // Portfolio State
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; desc: string; category?: string } | null>(null);

  // FAQ Accordion State
  const [openFAQId, setOpenFAQId] = useState<string | null>(FAQ_ITEMS[0]?.id || null);

  // CTA Modal State
  const [showCtaModal, setShowCtaModal] = useState(false);

  // Navigation Links
  const navLinks = [
    { id: 'services', label: 'Products & Pricing', icon: ShoppingCart },
    { id: 'why-us', label: 'Quality Standards', icon: Layers },
    { id: 'process', label: 'How It Works', icon: GitMerge },
    { id: 'portfolio', label: 'Client Projects', icon: Image },
    { id: 'tracking', label: 'Track Order', icon: Package },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact & Location', icon: Phone }
  ];

  const handleNavClick = (sectionId: string, view: 'home' | 'dashboard' = 'home') => {
    setCustomerView(view);
    setIsMobileMenuOpen(false);
    if (view === 'home') {
      if (!sectionId || sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  // Extract distinct categories from PRODUCTS
  const productCategories = useMemo(() => {
    const cats = Array.from(new Set(PRODUCTS.map(p => p.category)));
    return ['All', ...cats];
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = selectedProductCategory === 'All' || p.category === selectedProductCategory;
      const matchesSearch = productSearch.trim() === '' || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedProductCategory, productSearch]);

  const portfolioCategories = ['All', 'Corporate', 'Academic', 'Custom Apparel'];
  const filteredPortfolio = useMemo(() => {
    return activeCategory === 'All' 
      ? PORTFOLIO 
      : PORTFOLIO.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <div id="landing-container" className="min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 bg-transparent border-none text-left cursor-pointer transition-opacity hover:opacity-90"
            aria-label="JKM Prime Digital Prints Home"
          >
            <img 
              src="/logo.png" 
              alt="JKM Prime Digital Prints Official Logo" 
              className="w-9 h-9 object-contain rounded-lg border border-slate-100 shadow-2xs" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight block leading-none">
                JKM PRIME
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-sky-600 block font-bold leading-none mt-1">
                Digital Prints
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Portal Button */}
            <button
              onClick={() => handleNavClick('', 'dashboard')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                customerView === 'dashboard'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-2xs'
              }`}
              title="Access Customer Portal & Track Orders"
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY & MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 top-16 bg-slate-900/30 z-30"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-40 p-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleNavClick('', 'dashboard')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Customer Portal</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT */}
      <main className="flex-1">
        {customerView === 'dashboard' ? (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <CustomerDashboard 
              orders={orders}
              onUpdateOrders={handleUpdateOrders}
              onOpenOrderForm={() => {
                setInitialReorderItem(null);
                setIsOrderModalOpen(true);
              }}
              onOpenOrderFormWithReorder={(cartItems) => {
                if (cartItems && cartItems.length > 0) {
                  const firstItem = cartItems[0];
                  setInitialReorderItem({
                    productName: firstItem.productName,
                    quantity: firstItem.quantity,
                    notes: firstItem.notes || ''
                  });
                  setIsOrderModalOpen(true);
                }
              }}
              onBackToHome={() => setCustomerView('home')}
            />
          </div>
        ) : (
          <>
            {/* 2. HERO SECTION */}
            <motion.section 
              id="hero" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white border-b border-slate-200/80 pt-12 pb-16 sm:pt-16 sm:pb-20 relative overflow-hidden"
            >
              {/* Subtle decorative background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  
                  {/* Hero Left Content */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-full text-slate-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Taguig Digital Printing & Custom Apparel Hub</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sky-600 font-mono">Zero Minimum Orders</span>
                    </div>

                    <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[2.85rem] text-slate-900 tracking-tight leading-[1.12]">
                      Commercial-Grade Custom Digital Prints & Apparel.
                    </h1>

                    <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl">
                      Custom Direct-to-Film (DTF) t-shirts, sublimated ceramic mugs, personalized wirebound notebooks, Sintra board displays, and rush document printing. Engineered with commercial dye inks, precision layout proofing, and fast turnaround.
                    </p>

                    {/* Value highlights checklist in SaaS badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Stretchable DTF & Sublimation</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Digital Layout Proof Approval</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Single Piece to Bulk Capacity</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Metro Manila Delivery & Pickup</span>
                      </div>
                    </div>

                    {/* Primary CTAs */}
                    <div className="pt-2 flex flex-wrap gap-3">
                      <a
                        href={BUSINESS_INFO.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors text-center cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-sky-100" />
                        <span>Order on Messenger</span>
                      </a>
                      <button
                        onClick={() => handleNavClick('services')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-300 transition-colors text-center cursor-pointer"
                      >
                        <span>View Products & Pricing</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleNavClick('tracking')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors text-center cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-slate-600" />
                        <span>Track Order</span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Right Visual: SaaS Interactive Product Card */}
                  <div className="lg:col-span-5">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
                            Live Workshop Showcase
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-sky-400">
                          South Signal Taguig
                        </span>
                      </div>

                      {/* Featured Hero Product Card */}
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3]">
                        <img 
                          src="/tshirtcover.jpg" 
                          alt="Customized DTF T-Shirts and Apparel" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 text-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">Featured Product</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">From ₱320 / pc</span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base leading-tight mt-0.5">Custom DTF Apparel & Uniforms</h3>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-1">High-stretch, crack-resistant heat transfers on cotton & dri-fit shirts.</p>
                        </div>
                      </div>

                      {/* Quick SaaS Spec Pills */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block font-mono">Dye / Film</span>
                          <span className="font-bold text-slate-200 text-xs">Ultra-Vivid</span>
                        </div>
                        <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block font-mono">Turnaround</span>
                          <span className="font-bold text-slate-200 text-xs">24-48 Hours</span>
                        </div>
                        <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block font-mono">Proofing</span>
                          <span className="font-bold text-slate-200 text-xs">Free Digital</span>
                        </div>
                      </div>

                      {/* Small preview row */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-1.5 text-center">
                          <img src="/mug2.jpg" alt="Custom Sublimation Mug" className="w-full h-12 object-cover rounded mb-1" referrerPolicy="no-referrer" />
                          <span className="text-[10px] font-semibold text-slate-200 block truncate">Custom Mugs</span>
                          <span className="text-[9px] font-mono text-sky-400">₱90</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-1.5 text-center">
                          <img src="/lyceum.png" alt="Custom Wirebound Notebooks" className="w-full h-12 object-cover rounded mb-1" referrerPolicy="no-referrer" />
                          <span className="text-[10px] font-semibold text-slate-200 block truncate">Notebooks</span>
                          <span className="text-[9px] font-mono text-sky-400">₱79</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-1.5 text-center">
                          <img src="/colored.jpg" alt="Rush Photo Prints" className="w-full h-12 object-cover rounded mb-1" referrerPolicy="no-referrer" />
                          <span className="text-[10px] font-semibold text-slate-200 block truncate">Photo Prints</span>
                          <span className="text-[9px] font-mono text-sky-400">₱15</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </motion.section>

            {/* 2.5 SAAS METRICS STRIP */}
            <section className="bg-slate-50 border-b border-slate-200/80 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white border border-slate-200/70 p-4 rounded-xl text-center shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">500+</span>
                    <span className="text-xs font-medium text-slate-600 mt-0.5 block">Completed Projects</span>
                  </div>
                  <div className="bg-white border border-slate-200/70 p-4 rounded-xl text-center shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-sky-600 block">1 Year</span>
                    <span className="text-xs font-medium text-slate-600 mt-0.5 block">Of Printing Services</span>
                  </div>
                  <div className="bg-white border border-slate-200/70 p-4 rounded-xl text-center shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 block">Growing</span>
                    <span className="text-xs font-medium text-slate-600 mt-0.5 block">Customer Community</span>
                  </div>
                  <div className="bg-white border border-slate-200/70 p-4 rounded-xl text-center shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">Trusted</span>
                    <span className="text-xs font-medium text-slate-600 mt-0.5 block">By Schools, Businesses, & Orgs</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. VALUE PROPOSITION / QUALITY STANDARDS */}
            <motion.section 
              id="why-us" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="py-16 sm:py-20 bg-white border-b border-slate-200"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-3xl mb-12">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold block mb-1">
                    Quality Standards
                  </span>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Reliable Printing Crafted with Commercial Inks and Care
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                    We maintain strict printing tolerances, color accuracy, and material durability on every job.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Commercial Dye & DTF Inks</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Utilizing genuine Epson and Canon ink systems paired with high-adhesion DTF film for vivid color reproduction and wash durability.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Digital Layout Inspection</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Every layout, graphic file, and dimension is checked and confirmed before printing begins to eliminate alignment defects.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Flexible Quantities</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      From single-piece customized birthday gifts and individual mugs to bulk corporate shirts and school notebook distributions.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Transparent Tracking</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Clear production schedules with our integrated online tracker so you always know your order's real-time completion status.
                    </p>
                  </div>

                </div>
              </div>
            </motion.section>

            {/* 4. PRODUCT CATALOG & PRICING */}
            <motion.section 
              id="services" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="py-16 sm:py-24 bg-[#fafafa] border-b border-slate-200/80"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200/60 rounded-md text-sky-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Full Digital Catalog & Pricing</span>
                    </div>
                    <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                      Products & Custom Printing Services
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
                      Select a category below to explore standard specifications, starting rates, and bulk discounts.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search products by name or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Category Filter Pills with count */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 text-xs font-medium no-scrollbar">
                  {productCategories.map((cat) => {
                    const count = cat === 'All' 
                      ? PRODUCTS.length 
                      : PRODUCTS.filter(p => p.category === cat).length;
                    const isSelected = selectedProductCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedProductCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-slate-800 text-sky-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-2xs">
                    No products found matching "<span className="font-semibold text-slate-800">{productSearch}</span>". Try clearing your search query or selecting "All".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <div 
                        key={product.id}
                        className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                      >
                        <div>
                          <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative border-b border-slate-100">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                              referrerPolicy="no-referrer" 
                              loading="lazy"
                            />
                            <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                              {product.category}
                            </div>
                          </div>

                          <div className="p-4 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-sky-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">Starting at</span>
                            <span className="font-mono font-bold text-slate-900 text-base">
                              ₱{product.basePrice.toLocaleString()}
                              <span className="text-[11px] font-normal text-slate-500"> / {product.unit || 'pc'}</span>
                            </span>
                          </div>

                          <a
                            href={`${BUSINESS_INFO.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-600 text-slate-700 hover:text-white border border-slate-200 hover:border-sky-600 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer group/btn"
                          >
                            <span>Inquire</span>
                            <Send className="w-3 h-3 text-slate-400 group-hover/btn:text-white transition-colors" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </motion.section>

            {/* 5. INTERACTIVE PRINT QUALITY COMPARISON */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="py-16 sm:py-20 bg-white border-b border-slate-200"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold block">
                      Quality Comparison
                    </span>
                    <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                      Vivid Color Output & Clean Finishing
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      Drag the interactive slider to compare high-fidelity output against raw graphics. Every design receives precise color grading and balanced heat press dwell times.
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>Use mouse or finger to slide across the sample</span>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <BeforeAfterSlider />
                  </div>

                </div>
              </div>
            </motion.section>

            {/* 6. ORDER PROCESS / HOW IT WORKS */}
            <motion.section 
              id="process" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="py-16 sm:py-24 bg-white border-b border-slate-200/80"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200/60 rounded-md text-sky-700 text-[11px] font-mono font-bold uppercase tracking-wider mx-auto">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Seamless Production Flow</span>
                  </div>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    How We Fulfill Your Print Order
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    A streamlined 4-step pipeline ensuring pixel-perfect color accuracy and rapid turnaround.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                  
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-3 relative hover:border-slate-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">01</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Intake</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Send Inquiries & Files</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Submit your vector files, raster graphics (PDF, PNG, JPG), or design notes via Facebook Messenger or Customer Portal.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-3 relative hover:border-slate-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">02</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Proofing</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Digital Proof Approval</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      We calibrate print dimensions, check color profiles, and send a digital mockup for your final confirmation.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-3 relative hover:border-slate-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">03</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Production</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Precision Production</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Executed on commercial DTF film and sublimation presses with genuine high-density inks for zero peel and crack resistance.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-3 relative hover:border-slate-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">04</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Fulfillment</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Pickup or Delivery</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Securely packed and ready for on-site pickup in South Signal Taguig or express courier delivery anywhere in Metro Manila.
                    </p>
                  </div>

                </div>

              </div>
            </motion.section>

            {/* 7. REAL PRODUCTION REELS SHOWCASE */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="py-16 sm:py-20 bg-slate-900 text-white border-b border-slate-800"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                <div className="max-w-3xl space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold block">
                    Workshop In Action
                  </span>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                    Recent Shop Production Projects
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Watch our actual printing and heat press operations on Facebook Reels.
                  </p>
                </div>

                <FacebookReelsSlider />

              </div>
            </motion.section>

            {/* 8. CLIENT PROJECTS PORTFOLIO */}
            <motion.section 
              id="portfolio" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="py-16 sm:py-24 bg-white border-b border-slate-200/80"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200/60 rounded-md text-sky-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                      <Image className="w-3.5 h-3.5" />
                      <span>Verified Client Portfolio</span>
                    </div>
                    <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                      Selected Client & Organization Projects
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
                      Explore real production batches handcrafted for corporate, academic, and retail clients.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium no-scrollbar">
                    {portfolioCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                          activeCategory === cat
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portfolio Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPortfolio.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxImage({ url: item.imageUrl, title: item.title, desc: item.description, category: item.category })}
                      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-2xs group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                            referrerPolicy="no-referrer" 
                            loading="lazy"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-800 border border-slate-200/80 shadow-2xs">
                            {item.category}
                          </div>
                        </div>

                        <div className="p-4 space-y-1">
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View project details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.section>

            {/* 9. PUBLIC LIVE ORDER TRACKING */}
            <motion.section 
              id="tracking" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="py-16 sm:py-24 bg-[#fafafa] border-b border-slate-200/80 scroll-mt-16"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mb-8 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200/60 rounded-md text-sky-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Real-Time Cloud Lookup</span>
                  </div>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Order Status & Tracking Desk
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Enter your order tracking code (e.g. <span className="font-mono text-slate-800 font-semibold">JKM-20260715-001</span>) or customer name below to check real-time completion status.
                  </p>
                </div>

                <OrderTracking orders={orders} onUpdateOrders={handleUpdateOrders} />
              </div>
            </motion.section>

            {/* 10. FAQ ACCORDION */}
            <motion.section 
              id="faq" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="py-16 sm:py-20 bg-white border-b border-slate-200"
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold block">
                    Information & Policies
                  </span>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Essential guidelines on file formats, rush orders, down payments, and fulfillment.
                  </p>
                </div>

                <div className="space-y-3">
                  {FAQ_ITEMS.map((faq) => {
                    const isOpen = openFAQId === faq.id;
                    return (
                      <div 
                        key={faq.id} 
                        className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-colors"
                      >
                        <button
                          onClick={() => setOpenFAQId(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm sm:text-base pr-4">{faq.question}</span>
                          <span className="p-1 rounded-md bg-white border border-slate-200 shrink-0">
                            {isOpen ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="px-4 sm:px-5 pb-5 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-200/60 pt-3">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

              </div>
            </motion.section>

            {/* 11. CONTACT & LOCATION SECTION */}
            <motion.section 
              id="contact" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="py-16 sm:py-24 bg-[#fafafa] border-b border-slate-200"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Left Column: Business Details & Map */}
                  <div className="lg:col-span-6 space-y-6">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold block mb-1">
                        Direct Inquiries
                      </span>
                      <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                        Contact JKM Prime Digital Prints
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">
                        Have custom design inquiries or bulk quotes? Reach our team directly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">Location</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{BUSINESS_INFO.address}</p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">Mobile Hotline</h4>
                        <p className="text-slate-600 text-xs font-mono">{BUSINESS_INFO.phone}</p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">Email Support</h4>
                        <p className="text-slate-600 text-xs font-mono truncate">{BUSINESS_INFO.email}</p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">Business Hours</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{BUSINESS_INFO.hours}</p>
                      </div>

                    </div>

                    {/* Embedded Google Map */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden h-56 bg-slate-100">
                      <iframe 
                        title="JKM Prime Taguig Location Map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.2472718166564!2d121.05658607590487!3d14.502072279262593!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397cf15c5afebdd%3A0xc31eb5c55be0cbe7!2sSouth%20Signal%2C%20Taguig%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>

                  {/* Right Column: Direct Messenger Action Box */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs h-full flex flex-col justify-between">
                      
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-md text-sky-700 text-xs font-semibold">
                          <Send className="w-3.5 h-3.5" />
                          <span>Guaranteed Fast Response</span>
                        </div>

                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                          Fastest Way to Inquire & Order
                        </h3>

                        <p className="text-slate-600 text-sm leading-relaxed">
                          For instant file review, bulk discounts, rush turnaround confirmations, or layout requests, chat directly with our team on Facebook Messenger.
                        </p>

                        <div className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Representative active during business hours</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span>Instant quotes & digital layout reviews</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>GCash, Bank Transfer & Cash proof validation</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <a
                          href={BUSINESS_INFO.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4 text-sky-100" />
                          <span>Open Facebook Messenger</span>
                        </a>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </motion.section>

            {/* 12. FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
                  
                  {/* Brand Column */}
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2.5">
                      <img src="/logo.png" alt="JKM Prime Digital Prints Official Logo" className="w-8 h-8 object-contain rounded-md" referrerPolicy="no-referrer" />
                      <span className="font-extrabold text-base text-white tracking-tight">
                        JKM PRIME DIGITAL PRINTS
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                      {BUSINESS_INFO.description}
                    </p>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase font-mono text-slate-200 tracking-wider">Navigation</h4>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <button onClick={() => handleNavClick('services')} className="hover:text-white transition-colors cursor-pointer">
                          Products & Pricing
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleNavClick('process')} className="hover:text-white transition-colors cursor-pointer">
                          Order Process
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleNavClick('portfolio')} className="hover:text-white transition-colors cursor-pointer">
                          Client Projects
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleNavClick('tracking')} className="hover:text-white transition-colors cursor-pointer">
                          Track Order
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleNavClick('faq')} className="hover:text-white transition-colors cursor-pointer">
                          FAQ Desk
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Social & Contact */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase font-mono text-slate-200 tracking-wider">Connect</h4>
                    <div className="flex flex-col gap-2 text-xs">
                      <a 
                        href={BUSINESS_INFO.facebook} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Facebook Official Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href={BUSINESS_INFO.instagram} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Instagram Gallery</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 pt-1">
                      Support: {BUSINESS_INFO.phone}
                    </div>
                  </div>

                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                  <span>
                    &copy; {new Date().getFullYear()} JKM Prime Digital Prints. All rights reserved.
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Precision Printing & Apparel • Taguig City
                  </span>
                </div>

              </div>
            </footer>
          </>
        )}
      </main>

      {/* PORTFOLIO LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-3/5 bg-slate-100 flex items-center justify-center max-h-[60vh] md:max-h-[500px]">
                <img 
                  src={lightboxImage.url} 
                  alt={lightboxImage.title} 
                  className="w-full h-full object-contain max-h-[60vh] md:max-h-[500px]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600">
                      {lightboxImage.category || 'Portfolio Showcase'}
                    </span>
                    <button 
                      onClick={() => setLightboxImage(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{lightboxImage.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{lightboxImage.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href={BUSINESS_INFO.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Inquire for Similar Project</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE SUPPORT CHAT WIDGET & ORDER MODAL */}
      <LiveChatWidget />

      <OrderFormModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        initialReorderItem={initialReorderItem}
      />

    </div>
  );
};
