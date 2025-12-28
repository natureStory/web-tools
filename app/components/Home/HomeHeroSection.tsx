import { ToolTabs } from "./ToolTabs";
import { toolsConfig } from "./tools/toolsConfig";
import { JsonTool } from "./tools/JsonTool";
import { UrlTool } from "./tools/UrlTool";

export function HomeHeroSection() {
  const renderToolContent = (toolId: string) => {
    switch (toolId) {
      case "json":
        return <JsonTool />;
      case "url":
        return <UrlTool />;
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-2xl text-center">
              <h3 className="text-2xl font-semibold text-white mb-3">即将推出</h3>
              <p className="text-slate-400">这个工具正在开发中，敬请期待...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-[rgb(56,52,139)] via-[rgb(66,62,159)] to-[rgb(76,72,179)] h-screen flex flex-col overflow-hidden">
      {/* 工具选项卡 */}
      <ToolTabs tools={toolsConfig} defaultTool="json">
        {(activeToolId) => (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              <div className="animate-fadeIn">
                {renderToolContent(activeToolId)}
              </div>
            </div>
          </div>
        )}
      </ToolTabs>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
