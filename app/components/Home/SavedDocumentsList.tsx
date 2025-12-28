import { useState, useMemo } from "react";
import { Link } from "remix";
import { JSONDocument, deleteDocument } from "~/jsonDoc.client";
import { useDocumentsList } from "~/hooks/useDocumentsList";

export function SavedDocumentsList() {
  const { documents, loading } = useDocumentsList();
  const [searchQuery, setSearchQuery] = useState("");
  
  // 过滤文档
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      (doc.type === "url" && doc.url.toLowerCase().includes(query))
    );
  }, [documents, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("确定要删除这个文档吗？")) {
      try {
        await deleteDocument(docId);
        // 触发自定义事件通知文档已删除
        window.dispatchEvent(new Event("documentDeleted"));
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    }
  };

  const getPreviewContent = (doc: JSONDocument): string => {
    if (doc.type === "raw") {
      try {
        const parsed = JSON.parse(doc.contents);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return doc.contents;
      }
    }
    return `URL: ${doc.url}`;
  };

  const getDocumentIcon = (doc: JSONDocument) => {
    if (doc.type === "url") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-300">暂无文档</h3>
        <p className="mt-1 text-sm text-slate-400">上传或输入 URL 来创建你的第一个文档</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">
          最近 JSON 文件 ({filteredDocuments.length})
        </h2>
      </div>
      
      {/* 搜索框 */}
      {documents.length > 3 && (
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-9 pr-9 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 文档列表 */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">没有找到匹配的文档</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-start justify-between gap-3 p-3 border-b border-white/10">
                <Link
                  to={`/j/${doc.id}`}
                  className="flex items-start gap-3 flex-1 min-w-0 group"
                >
                  <div className="text-lime-300 mt-0.5 flex-shrink-0">
                    {getDocumentIcon(doc)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium group-hover:text-lime-300 transition-colors">
                      {doc.title || "未命名文档"}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {doc.type === "url" ? (
                        <span className="truncate block">{doc.url}</span>
                      ) : (
                        <span>JSON 文件</span>
                      )}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* 预览内容 - 始终显示 */}
              <div className="p-3 bg-black/20 max-h-[300px] overflow-y-auto">
                <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all custom-scrollbar">
                  {getPreviewContent(doc)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

