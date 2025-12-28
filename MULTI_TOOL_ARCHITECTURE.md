# 多工具架构设计文档

## 概述

首页已重新设计为可扩展的多工具平台架构，支持通过 Tabs 切换不同的在线工具。当前默认工具为 JSON 格式化工具，并为将来的工具扩展（如 URL 处理、Base64 编码、Hash 计算等）预留了接口。

## 架构设计

### 核心组件

```
app/components/Home/
├── HomeHeroSection.tsx          # 主页面组件
├── ToolTabs.tsx                 # 工具选项卡组件
├── SavedDocumentsList.tsx       # JSON 文档列表（复用）
└── tools/                       # 工具模块目录
    ├── index.ts                 # 统一导出
    ├── toolsConfig.tsx          # 工具配置文件
    ├── JsonTool.tsx             # JSON 工具
    └── UrlTool.tsx              # URL 工具（示例）
```

### 1. 工具配置系统 (`toolsConfig.tsx`)

所有工具在这里统一配置，便于管理和扩展。

```typescript
export interface ToolConfig {
  id: string;              // 工具唯一标识
  name: string;            // 工具名称
  icon: ReactNode;         // 工具图标
  description: string;     // 简短描述
  comingSoon?: boolean;    // 是否即将推出
}
```

#### 当前已配置工具

| 工具 | ID | 状态 | 描述 |
|-----|-----|------|------|
| JSON | `json` | ✅ 可用 | 格式化和查看 JSON 数据 |
| URL | `url` | 🚧 即将推出 | URL 编码和解析 |
| Base64 | `base64` | 🚧 即将推出 | Base64 编码和解码 |
| Hash | `hash` | 🚧 即将推出 | MD5/SHA 哈希计算 |
| 时间戳 | `timestamp` | 🚧 即将推出 | 时间戳转换 |
| 颜色转换 | `color` | 🚧 即将推出 | RGB/HEX 颜色转换 |

### 2. 工具选项卡组件 (`ToolTabs.tsx`)

可复用的 Tabs 组件，提供统一的工具切换界面。

**功能特性：**
- ✅ 响应式设计，自动换行
- ✅ 活动状态高亮（lime-400 边框）
- ✅ Hover 效果和平滑过渡动画
- ✅ 支持"即将推出"标记
- ✅ 图标 + 文字描述的卡片式设计
- ✅ 自定义渲染内容（Render Props）

**使用方式：**

```tsx
<ToolTabs tools={toolsConfig} defaultTool="json">
  {(activeToolId) => (
    <div>{renderToolContent(activeToolId)}</div>
  )}
</ToolTabs>
```

### 3. 工具实现模块

每个工具都是一个独立的 React 组件，放在 `tools/` 目录下。

#### JSON 工具 (`JsonTool.tsx`)

完整实现的 JSON 处理工具：
- 左侧：上传和输入区域（复用 `NewFile` 组件）
- 右侧：最近文档列表（复用 `SavedDocumentsList` 组件）
- 双列响应式布局

#### URL 工具 (`UrlTool.tsx`)

示例占位页面，展示未来功能：
- URL 编码/解码
- URL 解析
- 参数管理
- 批量处理

## 如何添加新工具

### 步骤 1：创建工具组件

在 `app/components/Home/tools/` 目录下创建新文件，例如 `Base64Tool.tsx`：

```tsx
export function Base64Tool() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Base64 编码/解码
        </h2>
        
        {/* 你的工具界面 */}
        <textarea 
          className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white"
          placeholder="输入文本..."
        />
        
        <button className="mt-4 px-6 py-3 bg-lime-400 text-slate-900 rounded-lg font-semibold">
          编码
        </button>
      </div>
    </div>
  );
}
```

### 步骤 2：添加工具配置

在 `toolsConfig.tsx` 中添加配置：

```tsx
{
  id: "base64",
  name: "Base64",
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* 你的图标 SVG */}
    </svg>
  ),
  description: "编码和解码",
  comingSoon: false, // 设置为 false 表示可用
}
```

### 步骤 3：在主页面中注册

在 `HomeHeroSection.tsx` 的 `renderToolContent` 函数中添加 case：

```tsx
const renderToolContent = (toolId: string) => {
  switch (toolId) {
    case "json":
      return <JsonTool />;
    case "url":
      return <UrlTool />;
    case "base64":
      return <Base64Tool />; // 新增
    default:
      return <ComingSoonPlaceholder />;
  }
};
```

### 步骤 4：导出工具（可选）

在 `tools/index.ts` 中添加导出：

```tsx
export { Base64Tool } from "./Base64Tool";
```

## UI 设计规范

### 配色方案

| 元素 | 样式类 | 用途 |
|------|--------|------|
| 主背景 | `bg-gradient-to-br from-[rgb(56,52,139)] ...` | 渐变紫色背景 |
| 卡片背景 | `bg-white/5` | 半透明白色 |
| 活动标签 | `border-lime-400` | Lime 绿色强调 |
| 文字 | `text-white`, `text-slate-300` | 白色/浅灰色 |
| Hover | `hover:bg-white/10` | 交互反馈 |

### 布局规范

- **容器最大宽度**: `max-w-7xl` (JSON 工具), `max-w-4xl` (单列工具)
- **卡片圆角**: `rounded-2xl` (大卡片), `rounded-lg` (小元素)
- **内边距**: `p-8` (卡片), `p-4` (小元素)
- **间距**: `gap-8` (移动端), `gap-12` (桌面端)

### 响应式断点

- **移动端**: 单列布局
- **桌面端** (`lg:`): 双列布局

## 状态管理

### 工具切换

- 通过 `useState` 管理当前活动工具
- 切换时有淡入动画 (`animate-fadeIn`)
- 默认显示 JSON 工具

### 数据持久化

- JSON 工具使用 IndexedDB（已有实现）
- 其他工具根据需要可使用 localStorage 或 IndexedDB

## 优势

### 1. 可扩展性
- 模块化设计，每个工具独立开发
- 统一配置管理，易于维护
- 清晰的文件结构

### 2. 用户体验
- 一目了然的工具选择界面
- 平滑的切换动画
- "即将推出"标记引导用户期待

### 3. 开发体验
- 简单的添加流程（4 步即可）
- 类型安全（TypeScript）
- 组件复用（布局、样式）

## 示例：完整的工具实现

以下是一个假想的时间戳转换工具示例：

```tsx
// app/components/Home/tools/TimestampTool.tsx
import { useState } from "react";

export function TimestampTool() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [dateString, setDateString] = useState("");

  const handleConvertToDate = () => {
    const date = new Date(timestamp);
    setDateString(date.toLocaleString("zh-CN"));
  };

  const handleConvertToTimestamp = () => {
    const date = new Date(dateString);
    setTimestamp(date.getTime());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">
          时间戳转换
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 时间戳转日期 */}
          <div>
            <label className="block text-slate-300 mb-2">时间戳</label>
            <input
              type="number"
              value={timestamp}
              onChange={(e) => setTimestamp(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
            />
            <button
              onClick={handleConvertToDate}
              className="mt-3 w-full px-4 py-2 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300"
            >
              转换为日期
            </button>
          </div>

          {/* 日期转时间戳 */}
          <div>
            <label className="block text-slate-300 mb-2">日期时间</label>
            <input
              type="text"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              placeholder="2024-01-01 12:00:00"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
            />
            <button
              onClick={handleConvertToTimestamp}
              className="mt-3 w-full px-4 py-2 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300"
            >
              转换为时间戳
            </button>
          </div>
        </div>

        {/* 结果展示 */}
        {dateString && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-slate-400 text-sm mb-1">转换结果</p>
            <p className="text-white font-mono">{dateString}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 未来规划

### 近期计划
- [ ] 实现 URL 编码/解码工具
- [ ] 实现 Base64 编码/解码工具
- [ ] 实现 Hash 计算工具

### 长期计划
- [ ] 添加工具搜索功能
- [ ] 工具使用历史记录
- [ ] 工具收藏/常用标记
- [ ] 导出/导入功能
- [ ] 批量处理能力
- [ ] API 支持

## 技术栈

- **React**: UI 组件
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式系统
- **Remix**: 路由和加载
- **IndexedDB**: 本地数据存储（JSON 工具）

## 性能优化

1. **代码分割**: 每个工具可以按需加载
2. **组件复用**: 共享布局和样式组件
3. **懒加载**: 大型工具可以使用 React.lazy
4. **缓存**: 工具状态可以保存在 localStorage

## 注意事项

1. 所有工具 ID 必须唯一
2. 工具组件应该是自包含的，不依赖外部状态
3. 保持一致的 UI 风格和交互模式
4. 为工具添加适当的错误处理
5. 考虑移动端的使用体验

## 总结

这个多工具架构为项目提供了良好的扩展基础，可以轻松添加新的在线工具。通过统一的配置和清晰的组件结构，开发者可以专注于工具的核心功能实现，而不用担心 UI 集成问题。

