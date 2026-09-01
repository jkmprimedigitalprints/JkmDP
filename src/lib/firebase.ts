/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { Product, Order, InventoryItem, MaterialEquipment, Expense, UserLog } from '../types';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_MATERIALS, PRELOADED_MATERIALS, DEFAULT_REELS } from '../utils/data';

// Initialize Firebase App
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, config.firestoreDatabaseId);

// Initialize Auth
import { getAuth } from 'firebase/auth';
export const auth = getAuth(app);

// Collection references
export const productsCol = collection(db, 'products');
export const ordersCol = collection(db, 'orders');
export const inventoryCol = collection(db, 'inventory');
export const capitalMaterialsCol = collection(db, 'capital_materials');
export const expensesCol = collection(db, 'expenses');
export const userLogsCol = collection(db, 'user_logs');
export const materialsLibraryCol = collection(db, 'materials_library');
export const customerUploadsCol = collection(db, 'customer_uploads');
export const supportChatsCol = collection(db, 'support_chats');
export const notificationsCol = collection(db, 'notifications');
export const landingPageReelsCol = collection(db, 'landing_page_reels');

export interface DbNotification {
  id: string;
  recipientId: string; // 'admin' or customerId
  title: string;
  message: string;
  type: 'order' | 'file' | 'chat' | 'system';
  timestamp: number;
  isRead: boolean;
  linkId?: string;
}

export async function createDbNotification(notification: Omit<DbNotification, 'id' | 'timestamp' | 'isRead'>) {
  try {
    const id = `NTF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newNotif: DbNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      isRead: false
    };
    await setDoc(doc(db, 'notifications', id), newNotif);
    return id;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// Custom operation types and error reporting for security rule diagnostic flows
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safely sanitize objects for firestore by removing undefined values
export const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

// Seed default data if collections are empty
export async function seedDatabaseIfNeeded() {
  // 1. Seed Products
  try {
    const prodSnap = await getDocs(productsCol);
    if (prodSnap.empty) {
      console.log('Seeding products to Firestore...');
      const batch = writeBatch(db);
      PRODUCTS.forEach((p) => {
        const dRef = doc(productsCol, p.id);
        batch.set(dRef, p);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Products seeding note:', e);
  }

  // 2. Seed Orders
  try {
    const orderSnap = await getDocs(ordersCol);
    if (orderSnap.empty) {
      console.log('Seeding orders to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ORDERS.forEach((o) => {
        const dRef = doc(ordersCol, o.id);
        batch.set(dRef, o);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Orders seeding note:', e);
  }

  // 3. Seed Inventory with Preloaded Materials
  try {
    const invSnap = await getDocs(inventoryCol);
    if (invSnap.empty) {
      console.log('Seeding preloaded materials to inventory in Firestore...');
      const batch = writeBatch(db);
      PRELOADED_MATERIALS.forEach((m) => {
        const dRef = doc(inventoryCol, m.id);
        batch.set(dRef, m);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Inventory seeding note:', e);
  }

  // 4. Seed Capital Materials / Equipment
  try {
    const matSnap = await getDocs(capitalMaterialsCol);
    if (matSnap.empty) {
      console.log('Seeding capital materials to Firestore...');
      const batch = writeBatch(db);
      INITIAL_MATERIALS.forEach((m) => {
        const dRef = doc(capitalMaterialsCol, m.id);
        batch.set(dRef, m);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Capital materials seeding note:', e);
  }

  // 5. Seed Materials Library for Costing Module
  try {
    const libSnap = await getDocs(materialsLibraryCol);
    if (libSnap.empty) {
      console.log('Seeding costing materials library...');
      const batch = writeBatch(db);
      PRELOADED_MATERIALS.forEach((m) => {
        const dRef = doc(materialsLibraryCol, m.id);
        const costingItem = {
          id: m.id,
          name: m.name,
          category: m.category,
          unit: m.unit,
          costPerPiece: m.price,
          costPerSheet: m.price,
          costPerMeter: 0,
          costPerRoll: 0,
          supplier: 'JKM Official Supplier',
          notes: `Packaging: ${m.packaging} - ₱${m.price}`,
          price: m.price,
          packaging: m.packaging,
          stock: m.stock,
          minThreshold: m.minThreshold
        };
        batch.set(dRef, costingItem);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Materials library seeding note:', e);
  }

  // 6. Seed Landing Page Reels
  try {
    const reelsSnap = await getDocs(landingPageReelsCol);
    if (reelsSnap.empty) {
      console.log('Seeding landing page reels to Firestore...');
      const batch = writeBatch(db);
      DEFAULT_REELS.forEach((reel, index) => {
        const dRef = doc(landingPageReelsCol, reel.id);
        batch.set(dRef, {
          ...reel,
          order: index
        });
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Landing page reels seeding note:', e);
  }
}
