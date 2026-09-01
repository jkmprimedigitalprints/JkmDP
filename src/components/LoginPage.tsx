/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  KeyRound, 
  CheckCircle2, 
  Layers, 
  Server,
  Zap
} from 'lucide-react';
import { useToast } from './Toast';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: (username: string, role: 'Staff' | 'Manager') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding, onLoginSuccess }) => {
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!username.trim()) {
      toast.error('Please enter your admin username or email.');
      return;
    }

    if (!password) {
      toast.error('Please enter your admin password.');
      return;
    }

    // Trigger loading state
    setIsLoading(true);
    toast.info('Authenticating admin session...');

    const cleanUserLower = username.trim().toLowerCase();
    
    // Check if entered credentials match the default administrative accounts
    const isDefaultAdmin = 
      cleanUserLower === 'jkm prime digital prints' || 
      cleanUserLower === 'jkmprime' || 
      cleanUserLower === 'admin' ||
      cleanUserLower === 'printxpress602@gmail.com';

    // Retrieve any custom passwords stored locally
    const savedPasswordsRaw = localStorage.getItem('jkm_admin_passwords');
    const savedPasswords = savedPasswordsRaw ? JSON.parse(savedPasswordsRaw) : {};
    const savedAdminPassword = savedPasswords[cleanUserLower] || savedPasswords['admin'] || localStorage.getItem('jkm_admin_custom_password') || 'Jkmprime@2027';

    const isValidAdminPassword = 
      password === 'Jkmprime@2027' || 
      password === savedAdminPassword;

    // Convert short username to a valid email format if needed
    let email = username.trim();
    if (!email.includes('@')) {
      email = `${email.toLowerCase().replace(/\s+/g, '')}@jkmprime.com`;
    }

    // A. Bulletproof fallback for default administrative credentials
    if (isDefaultAdmin && isValidAdminPassword) {
      const displayName = username.trim() === 'admin' ? 'Manager' : username.trim();
      const role = 'Manager';

      // Attempt background sync with Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr) {
            console.warn("Background auto-provisioning of default credentials failed:", createErr);
          }
        }
      }

      toast.success('Admin verified! Redirecting to Workspace...');
      setTimeout(() => {
        onLoginSuccess(displayName, role);
      }, 350);
      return;
    }

    // B. Standard Firebase Authentication Flow for custom/registered admin credentials
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const displayName = user.email ? user.email.split('@')[0] : 'Manager';
      const role = 'Manager';

      toast.success('Login Successful! Welcome back.');
      setTimeout(() => {
        onLoginSuccess(displayName, role);
      }, 350);
    } catch (err: any) {
      console.warn("Firebase authentication failed for admin user:", err.code);
      setIsLoading(false);

      let errorMsg = 'Invalid admin username or password. Please verify and retry.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect password. Please verify and retry.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid username or email format.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'Admin account not found. Please verify your credentials.';
      }
      toast.error(errorMsg);
    }
  };

  const handleForgotPassword = () => {
    toast.info('To reset master credentials, contact the system administrator or consult offline terminal docs.');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-sky-500 selection:text-white">
      
      {/* Background Architectural Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Public Storefront</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-slate-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cloud POS v2.4 Active</span>
        </div>
      </div>

      {/* Main SaaS Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10 my-8">
        
        {/* Left Side: SaaS Brand & Platform Highlights (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-r border-slate-800 relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
                <img src="/logo.png" alt="JKM Prime Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">JKM Prime Prints</h1>
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-semibold">
                  Management Engine
                </span>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Real-Time Production Sync</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Live queues for DTF printing, mug sublimation, rush photos, and materials inventory.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Administrative Security & Control</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Exclusive master access for sales analytics, order management, material audits, and print queues.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Server className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Taguig, Metro Manila</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Encrypted</span>
            </span>
          </div>
        </div>

        {/* Right Side: Modern SaaS Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-slate-900/60">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Header on Mobile/Form */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-md text-sky-400 text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Administrator Access Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Admin Sign In
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Enter your administrative credentials to manage POS operations, inventory, and analytics.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    disabled={isLoading}
                    autoComplete="username"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 accent-sky-500 cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Action */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Authenticating Admin...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Admin Workspace</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Authorized Administrator Access Only. Sessions are secured with 256-bit encryption.
              </p>
            </div>
          </motion.div>
        </div>

      </div>

    </div>
  );
};

