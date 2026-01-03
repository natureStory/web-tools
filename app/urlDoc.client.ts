import { customRandom } from "nanoid";

export type UrlDocument = {
  id: string;
  title: string;
  url: string;
  method: string;
  headers: Array<{ key: string; value: string }>;
  body?: string;
  queryParams: Array<{ key: string; value: string }>;
  createdAt: number;
};

const DB_NAME = "url_tool_db";
const DB_VERSION = 1;
const STORE_NAME = "url_documents";

// IndexedDB 辅助函数
function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

export async function saveUrlDocument(
  url: string,
  method: string,
  headers: Array<{ key: string; value: string }>,
  body: string,
  queryParams: Array<{ key: string; value: string }>,
  title?: string
): Promise<UrlDocument> {
  const docId = createId();
  
  // 从URL中提取主机名作为默认标题
  let defaultTitle = "未命名 URL";
  try {
    const urlObj = new URL(url);
    defaultTitle = urlObj.hostname;
  } catch {
    // URL无效，使用默认标题
  }

  const doc: UrlDocument = {
    id: docId,
    title: title || defaultTitle,
    url,
    method,
    headers,
    body,
    queryParams,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(doc);
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
      
      // 触发自定义事件通知文档已创建
      window.dispatchEvent(new Event("urlDocumentCreated"));
    } catch (error) {
      console.error("Failed to save URL document to IndexedDB:", error);
    }
  }

  return doc;
}

export async function getUrlDocument(
  id: string
): Promise<UrlDocument | undefined> {
  if (typeof window === "undefined") return undefined;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    const doc = await new Promise<UrlDocument | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return doc;
  } catch (error) {
    console.error("Failed to get URL document from IndexedDB:", error);
    return undefined;
  }
}

export async function updateUrlDocument(
  id: string,
  updates: Partial<Omit<UrlDocument, "id" | "createdAt">>
): Promise<UrlDocument | undefined> {
  const document = await getUrlDocument(id);

  if (!document) return;

  const updated: UrlDocument = {
    ...document,
    ...updates,
  };

  if (typeof window !== "undefined") {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(updated);
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
      
      // 触发自定义事件通知文档已更新
      window.dispatchEvent(new Event("urlDocumentUpdated"));
    } catch (error) {
      console.error("Failed to update URL document in IndexedDB:", error);
    }
  }

  return updated;
}

export async function deleteUrlDocument(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    
    // 触发自定义事件通知文档已删除
    window.dispatchEvent(new Event("urlDocumentDeleted"));
  } catch (error) {
    console.error("Failed to delete URL document from IndexedDB:", error);
  }
}

export async function getAllUrlDocuments(): Promise<UrlDocument[]> {
  if (typeof window === "undefined") return [];
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    const documents = await new Promise<UrlDocument[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    // 按创建时间排序（最新的在前面）
    return documents.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Failed to get all URL documents from IndexedDB:", error);
    return [];
  }
}

function createId(): string {
  const nanoid = customRandom(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    12,
    (bytes: number): Uint8Array => {
      const array = new Uint8Array(bytes);
      crypto.getRandomValues(array);
      return array;
    }
  );
  return nanoid();
}

