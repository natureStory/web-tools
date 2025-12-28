# 快速开始：添加新工具

本指南将帮助你在 5 分钟内添加一个新的在线工具。

## 4 步添加新工具

### 第 1 步：创建工具组件

在 `app/components/Home/tools/` 目录创建你的工具组件文件。

**示例：创建 `Base64Tool.tsx`**

```tsx
export function Base64Tool() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Base64 编码/解码
        </h2>
        
        {/* 你的工具内容 */}
        <div className="space-y-4">
          <textarea 
            className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
            placeholder="输入要编码的文本..."
          />
          
          <button className="px-6 py-3 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-all">
            编码
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 第 2 步：添加工具配置

编辑 `app/components/Home/tools/toolsConfig.tsx`，在 `toolsConfig` 数组中添加你的工具：

```tsx
{
  id: "base64",                    // 唯一 ID
  name: "Base64",                  // 显示名称
  icon: (                          // SVG 图标
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  description: "编码和解码",        // 简短描述
  comingSoon: false,               // 是否可用
}
```

💡 **图标资源**: 可以从 [Heroicons](https://heroicons.com/) 复制 SVG 代码。

### 第 3 步：注册工具路由

编辑 `app/components/Home/HomeHeroSection.tsx`，在 `renderToolContent` 函数中添加你的工具：

```tsx
const renderToolContent = (toolId: string) => {
  switch (toolId) {
    case "json":
      return <JsonTool />;
    case "url":
      return <UrlTool />;
    case "base64":               // 新增
      return <Base64Tool />;     // 新增
    default:
      return <ComingSoonPlaceholder />;
  }
};
```

别忘了在文件顶部导入：

```tsx
import { Base64Tool } from "./tools/Base64Tool";
```

### 第 4 步：（可选）更新导出

编辑 `app/components/Home/tools/index.ts`：

```tsx
export { Base64Tool } from "./Base64Tool";
```

## 完成！🎉

现在访问首页，你应该能看到新添加的工具了！

## 常用模板

### 单列工具模板

适用于简单的转换工具：

```tsx
export function MyTool() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">工具标题</h2>
        
        {/* 工具内容 */}
        
      </div>
    </div>
  );
}
```

### 双列工具模板

适用于需要左右对比的工具：

```tsx
export function MyTool() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      {/* 左列 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">输入</h3>
        {/* 内容 */}
      </div>

      {/* 右列 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">输出</h3>
        {/* 内容 */}
      </div>
    </div>
  );
}
```

### 带状态的工具模板

```tsx
import { useState } from "react";

export function MyTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleConvert = () => {
    // 你的转换逻辑
    setOutput(input.toUpperCase());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">工具标题</h2>
        
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
            placeholder="输入文本..."
          />
          
          <button
            onClick={handleConvert}
            className="px-6 py-3 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-all"
          >
            转换
          </button>

          {output && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-slate-400 text-sm mb-2">结果：</p>
              <p className="text-white font-mono break-all">{output}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 样式指南

### 常用 Tailwind 类

| 用途 | 类名 |
|------|------|
| 卡片背景 | `bg-white/5` |
| 卡片边框 | `border border-white/10` |
| 输入框 | `bg-white/10 border-white/20` |
| 主按钮 | `bg-lime-400 text-slate-900 hover:bg-lime-300` |
| 标题文字 | `text-white` |
| 描述文字 | `text-slate-400` |
| 圆角 | `rounded-lg` (小), `rounded-2xl` (大) |

### 响应式设计

```tsx
// 移动端单列，桌面端双列
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

// 移动端小字，桌面端大字
<h1 className="text-3xl lg:text-5xl">

// 移动端隐藏，桌面端显示
<div className="hidden lg:block">
```

## 调试技巧

### 检查配置是否正确

1. 确保 `toolsConfig.tsx` 中的 `id` 唯一
2. 确保 `comingSoon` 设置为 `false`
3. 检查 `HomeHeroSection.tsx` 中的 `case` 语句

### 测试工具

```bash
# 启动开发服务器
npm run dev

# 访问首页
# http://localhost:3000
```

### 常见问题

**Q: 工具标签显示但点击无反应？**
- 检查 `comingSoon` 是否为 `true`
- 检查 `renderToolContent` 中是否添加了对应的 case

**Q: 工具内容不显示？**
- 检查组件导入是否正确
- 检查组件是否正确导出
- 查看浏览器控制台是否有错误

**Q: 样式不生效？**
- 确保使用了 Tailwind CSS 类名
- 检查是否有拼写错误
- 尝试添加 `!` 强制覆盖，如 `!bg-white`

## 下一步

- 📖 阅读 [MULTI_TOOL_ARCHITECTURE.md](./MULTI_TOOL_ARCHITECTURE.md) 了解架构详情
- 🎨 查看现有工具代码学习最佳实践
- 🚀 开始构建你的工具！

## 需要帮助？

- 查看 `JsonTool.tsx` 作为参考
- 查看 `UrlTool.tsx` 作为占位页面示例
- 阅读架构文档了解更多细节

