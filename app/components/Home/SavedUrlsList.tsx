import { useState, useMemo } from "react";
import { deleteUrlDocument, UrlDocument } from "~/urlDoc.client";
import { useUrlDocumentsList } from "~/hooks/useUrlDocumentsList";
import { TrashIcon, ExternalLinkIcon } from "@heroicons/react/outline";

interface SavedUrlsListProps {
  onLoadUrl?: (doc: UrlDocument) => void;
}

export function SavedUrlsList({ onLoadUrl }: SavedUrlsListProps) {
  const { documents, loading } = useUrlDocumentsList();
  const [searchQuery, setSearchQuery] = useState("");
  
  // 过滤文档
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.url.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("确定要删除这个 URL 吗？")) {
      try {
        await deleteUrlDocument(docId);
      } catch (error) {
        console.error("Failed to delete URL document:", error);
      }
    }
  };

  const handleLoadUrl = (doc: UrlDocument) => {
    if (onLoadUrl) {
      onLoadUrl(doc);
    }
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-300">暂无保存的 URL</h3>
        <p className="mt-1 text-sm text-slate-400">解析 URL 后点击保存按钮来保存</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">
          保存的 URL ({filteredDocuments.length})
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
          <p className="text-slate-400 text-sm">没有找到匹配的 URL</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden hover:border-lime-400/30 transition-colors">
              {/* 标题栏 */}
              <div className="flex items-start justify-between gap-3 p-3 border-b border-white/10">
                <button
                  onClick={() => handleLoadUrl(doc)}
                  className="flex items-start gap-3 flex-1 min-w-0 group text-left"
                >
                  <div className="text-lime-300 mt-0.5 flex-shrink-0">
                    <ExternalLinkIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium group-hover:text-lime-300 transition-colors">
                      {doc.title || "未命名 URL"}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">
                      {doc.url}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        doc.method === 'GET' ? 'bg-blue-500/20 text-blue-300' :
                        doc.method === 'POST' ? 'bg-green-500/20 text-green-300' :
                        doc.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                        doc.method === 'DELETE' ? 'bg-red-500/20 text-red-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {doc.method}
                      </span>
                      {doc.queryParams.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {doc.queryParams.length} 个参数
                        </span>
                      )}
                      {doc.headers.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {doc.headers.length} 个请求头
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                  title="删除"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {/* 预览内容 */}
              <div className="p-3 bg-black/20">
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  {doc.queryParams.length > 0 && (
                    <div>
                      <span className="text-lime-400">查询参数:</span>
                      <div className="ml-2 mt-1 space-y-0.5">
                        {doc.queryParams.slice(0, 3).map((param, idx) => (
                          <div key={idx} className="text-slate-400 truncate">
                            {param.key}: {param.value}
                          </div>
                        ))}
                        {doc.queryParams.length > 3 && (
                          <div className="text-slate-500">
                            ...还有 {doc.queryParams.length - 3} 个参数
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

