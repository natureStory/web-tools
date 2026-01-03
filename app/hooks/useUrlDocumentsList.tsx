import { useEffect, useState, useCallback } from "react";
import { getAllUrlDocuments, UrlDocument } from "~/urlDoc.client";

export function useUrlDocumentsList() {
  const [documents, setDocuments] = useState<UrlDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getAllUrlDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to load URL documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();

    // 监听自定义事件以刷新文档列表
    const handleDocumentChange = () => {
      loadDocuments();
    };

    window.addEventListener("urlDocumentCreated", handleDocumentChange);
    window.addEventListener("urlDocumentDeleted", handleDocumentChange);
    window.addEventListener("urlDocumentUpdated", handleDocumentChange);

    return () => {
      window.removeEventListener("urlDocumentCreated", handleDocumentChange);
      window.removeEventListener("urlDocumentDeleted", handleDocumentChange);
      window.removeEventListener("urlDocumentUpdated", handleDocumentChange);
    };
  }, [loadDocuments]);

  return { documents, loading, refresh: loadDocuments };
}

