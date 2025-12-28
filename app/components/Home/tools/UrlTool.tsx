export function UrlTool() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-2xl text-center">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-3">URL 处理工具</h3>
        <p className="text-slate-400 mb-6">
          即将推出强大的 URL 处理功能
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2">URL 编码/解码</h4>
            <p className="text-slate-400 text-sm">快速编码和解码 URL 参数</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2">URL 解析</h4>
            <p className="text-slate-400 text-sm">分析和提取 URL 各个部分</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2">参数管理</h4>
            <p className="text-slate-400 text-sm">添加、删除和修改 URL 参数</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2">批量处理</h4>
            <p className="text-slate-400 text-sm">批量转换和处理 URL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

