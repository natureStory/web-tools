import { customRandom } from "nanoid";
import safeFetch from "./utilities/safeFetch";
import createFromRawXml from "./utilities/xml/createFromRawXml";
import isXML from "./utilities/xml/isXML";

type BaseJsonDocument = {
  id: string;
  title: string;
  readOnly: boolean;
};

export type RawJsonDocument = BaseJsonDocument & {
  type: "raw";
  contents: string;
};

export type UrlJsonDocument = BaseJsonDocument & {
  type: "url";
  url: string;
};

export type CreateJsonOptions = {
  ttl?: number;
  readOnly?: boolean;
  injest?: boolean;
  metadata?: any;
};

export type JSONDocument = RawJsonDocument | UrlJsonDocument;

const DB_NAME = "jsonhero_db";
const DB_VERSION = 1;
const STORE_NAME = "documents";

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
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function createFromUrlOrRawJson(
  urlOrJson: string,
  title?: string
): Promise<JSONDocument | undefined> {
  if (isUrl(urlOrJson)) {
    return createFromUrl(new URL(urlOrJson), title);
  }

  if (isJSON(urlOrJson)) {
    return createFromRawJson("未命名", urlOrJson);
  }

  // Wrapper for createFromRawJson to handle XML
  // TODO ? change from urlOrJson to urlOrJsonOrXml
  if (isXML(urlOrJson)) {
    return createFromRawXml("未命名", urlOrJson);
  }
}

export async function createFromUrl(
  url: URL,
  title?: string,
  options?: CreateJsonOptions
): Promise<JSONDocument> {
  if (options?.injest) {
    const response = await safeFetch(url.href);

    if (!response.ok) {
      throw new Error(`Failed to injest ${url.href}`);
    }

    return createFromRawJson(title || url.href, await response.text(), options);
  }

  const docId = createId();

  const doc: JSONDocument = {
    id: docId,
    type: <const>"url",
    url: url.href,
    title: title ?? url.hostname,
    readOnly: options?.readOnly ?? false,
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
      window.dispatchEvent(new Event("documentCreated"));
    } catch (error) {
      console.error("Failed to save document to IndexedDB:", error);
    }
  }

  return doc;
}

export async function createFromRawJson(
  filename: string,
  contents: string,
  options?: CreateJsonOptions
): Promise<JSONDocument> {
  const docId = createId();
  const doc: JSONDocument = {
    id: docId,
    type: <const>"raw",
    contents,
    title: filename,
    readOnly: options?.readOnly ?? false,
  };

  JSON.parse(contents);
  
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
      window.dispatchEvent(new Event("documentCreated"));
    } catch (error) {
      console.error("Failed to save document to IndexedDB:", error);
    }
  }

  return doc;
}

export async function getDocument(
  slug: string
): Promise<JSONDocument | undefined> {
  if (typeof window === "undefined") return undefined;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(slug);
    
    const doc = await new Promise<JSONDocument | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return doc;
  } catch (error) {
    console.error("Failed to get document from IndexedDB:", error);
    return undefined;
  }
}

export async function updateDocument(
  slug: string,
  title?: string,
  contents?: string
): Promise<JSONDocument | undefined> {
  const document = await getDocument(slug);

  if (!document) return;

  let updated: JSONDocument;

  if (document.type === "raw") {
    updated = {
      ...document,
      title: title !== undefined ? title : document.title,
      contents: contents !== undefined ? contents : document.contents,
    };
    // 验证 JSON 格式
    if (contents !== undefined) {
      JSON.parse(contents);
    }
  } else {
    updated = {
      ...document,
      title: title !== undefined ? title : document.title,
    };
  }

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
      window.dispatchEvent(new Event("documentUpdated"));
    } catch (error) {
      console.error("Failed to update document in IndexedDB:", error);
    }
  }

  return updated;
}

export async function deleteDocument(slug: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(slug);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    
    // 触发自定义事件通知文档已删除
    window.dispatchEvent(new Event("documentDeleted"));
  } catch (error) {
    console.error("Failed to delete document from IndexedDB:", error);
  }
}

export async function getAllDocuments(): Promise<JSONDocument[]> {
  if (typeof window === "undefined") return [];
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    const documents = await new Promise<JSONDocument[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return documents;
  } catch (error) {
    console.error("Failed to get all documents from IndexedDB:", error);
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

function isUrl(possibleUrl: string): boolean {
  try {
    new URL(possibleUrl);
    return true;
  } catch {
    return false;
  }
}

function isJSON(possibleJson: string): boolean {
  try {
    JSON.parse(possibleJson);
    return true;
  } catch (e: any) {
    throw new Error(e.message);
  }
}
