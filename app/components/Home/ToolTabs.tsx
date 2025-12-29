import { useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "@remix-run/react";

export interface ToolConfig {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  comingSoon?: boolean;
}

interface ToolTabsProps {
  tools: ToolConfig[];
  defaultTool?: string;
  onTabChange?: (toolId: string) => void;
  children: (activeToolId: string) => ReactNode;
}

export function ToolTabs({ tools, defaultTool, onTabChange, children }: ToolTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 验证并获取有效的初始 tab
  const getValidTab = (tabId: string | null): string => {
    if (tabId) {
      const isValid = tools.some(tool => tool.id === tabId && !tool.comingSoon);
      if (isValid) return tabId;
    }
    return defaultTool || tools[0]?.id;
  };
  
  // 从 URL 参数读取初始 tab，如果无效则使用默认值
  const [activeTab, setActiveTab] = useState(() => getValidTab(searchParams.get("tab")));
  
  // 标记是否已经初始化（避免 URL 变化时重复更新状态）
  const [isInitialized, setIsInitialized] = useState(false);

  // 只在首次挂载时从 URL 读取初始值
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const defaultValue = defaultTool || tools[0]?.id;
    
    // 如果 URL 中有默认值的参数，清除它
    if (tabFromUrl === defaultValue) {
      setSearchParams({}, { replace: true });
    }
    
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  const handleTabChange = (toolId: string) => {
    const defaultValue = defaultTool || tools[0]?.id;
    
    setActiveTab(toolId);
    
    // 更新 URL 参数
    if (toolId === defaultValue) {
      // 如果是默认值，移除 tab 参数
      setSearchParams({}, { replace: true });
    } else {
      // 如果不是默认值，添加 tab 参数
      setSearchParams({ tab: toolId }, { replace: true });
    }
    
    onTabChange?.(toolId);
  };

  return (
    <>
      {/* Tab 导航 */}
      <div className="flex-shrink-0 backdrop-blur-md bg-[rgb(56,52,139)]/90 shadow-lg shadow-black/20 border-b border-white/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 网站名 */}
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-white font-bold text-lg">Web Tools</span>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-white/30 hidden sm:block"></div>

            {/* 工具 Tabs */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => !tool.comingSoon && handleTabChange(tool.id)}
                  disabled={tool.comingSoon}
                  title={tool.comingSoon ? `${tool.name} - ${tool.description} (即将推出)` : `${tool.name} - ${tool.description}`}
                  className={`
                    relative group flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
                    ${activeTab === tool.id
                      ? "bg-white/20 text-white border-2 border-lime-400 shadow-lg shadow-lime-400/20"
                      : tool.comingSoon
                        ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10 opacity-50"
                        : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white border border-white/20 hover:border-lime-400/50"
                    }
                  `}
                >
                  <span className={`
                    flex-shrink-0 transition-colors duration-200
                    ${activeTab === tool.id 
                      ? "text-lime-400" 
                      : tool.comingSoon 
                        ? "text-slate-600" 
                        : "text-slate-400 group-hover:text-lime-400"
                    }
                  `}>
                    {tool.icon}
                  </span>
                  <span>{tool.name}</span>
                  {tool.comingSoon && (
                    <span className="text-xs text-slate-500">
                      (即将推出)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab 内容 */}
      {children(activeTab)}
    </>
  );
}

