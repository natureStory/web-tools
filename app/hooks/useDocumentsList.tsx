import { useEffect, useState, useCallback } from "react";
import { getAllDocuments, JSONDocument } from "~/jsonDoc.client";

export function useDocumentsList() {
  const [documents, setDocuments] = useState<JSONDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getAllDocuments();
      // 按创建时间排序（最新的在前面）
      setDocuments(docs.reverse());
    } catch (error) {
      console.error("Failed to load documents:", error);
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

    window.addEventListener("documentCreated", handleDocumentChange);
    window.addEventListener("documentDeleted", handleDocumentChange);
    window.addEventListener("documentUpdated", handleDocumentChange);

    return () => {
      window.removeEventListener("documentCreated", handleDocumentChange);
      window.removeEventListener("documentDeleted", handleDocumentChange);
      window.removeEventListener("documentUpdated", handleDocumentChange);
    };
  }, [loadDocuments]);

  return { documents, loading, refresh: loadDocuments };
}

