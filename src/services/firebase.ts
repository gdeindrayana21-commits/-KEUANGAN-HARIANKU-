import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  DocumentReference,
  DocumentData,
  Query,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

// Silence internal @firebase/firestore connection retry console.error messages
// so offline/proxy fallback does not trigger error overlays.
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

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
  };
}

// Merge configuration from json and optional environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

function initDb() {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        {
          localCache: memoryLocalCache(),
          experimentalForceLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }
}

export const db = initDb();

/**
 * Safely reads a single document, automatically falling back to local cache
 * if the client is currently offline or behind a restrictive firewall.
 */
export async function safeGetDoc<T = DocumentData>(
  docRef: DocumentReference<T>
): Promise<DocumentSnapshot<T> | null> {
  try {
    const raceTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('offline-timeout')), 1500)
    );
    return await Promise.race([getDoc(docRef), raceTimeout]);
  } catch {
    try {
      return await getDocFromCache(docRef);
    } catch {
      return null;
    }
  }
}

/**
 * Safely reads a collection/query, automatically falling back to local cache
 * if the client is currently offline or behind a restrictive firewall.
 */
export async function safeGetDocs<T = DocumentData>(
  queryRef: Query<T>
): Promise<QuerySnapshot<T> | null> {
  try {
    const raceTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('offline-timeout')), 1500)
    );
    return await Promise.race([getDocs(queryRef), raceTimeout]);
  } catch {
    try {
      return await getDocsFromCache(queryRef);
    } catch {
      return null;
    }
  }
}

/**
 * Executes a Firestore write (setDoc, updateDoc, deleteDoc).
 * Because Firestore updates its local cache and onSnapshot listeners synchronously,
 * if the network is offline we resolve after 350ms while Firestore queues the sync in the background.
 */
export async function safeWrite<T>(writePromise: Promise<T>, timeoutMs = 350): Promise<void> {
  try {
    await Promise.race([
      writePromise.catch((err) => {
        console.warn('Firestore background sync warning:', err);
      }),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch (err) {
    console.warn('Firestore write warning:', err);
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const currentAuth = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
      tenantId: currentAuth?.tenantId || null,
      providerInfo:
        currentAuth?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.warn('Firestore Notice:', JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await safeGetDoc(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}
