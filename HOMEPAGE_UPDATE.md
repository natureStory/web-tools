# 首页 UI 优化更新

## 更新概述

本次更新对首页进行了全面的 UI 优化，并添加了 IndexedDB 中 JSON 文件的列表展示功能。

## 主要变更

### 1. 全新的首页设计 (`HomeHeroSection.tsx`)

- **渐变背景**: 使用了紫色渐变背景，营造现代感
- **双列布局**: 
  - 左侧：上传和输入区域
  - 右侧：最近文档列表
- **响应式设计**: 在移动端自动切换为单列布局
- **特性标签**: 展示核心功能（本地存储、快速搜索、树形视图、格式化）

### 2. 文档列表组件 (`SavedDocumentsList.tsx`)

新增的文档列表组件，具有以下功能：

#### 核心功能
- ✅ 展示所有存储在 IndexedDB 中的 JSON 文件
- ✅ 显示文档标题和类型（文件/URL）
- ✅ Hover 预览：鼠标悬停时显示 JSON 内容预览（桌面端）
- ✅ 点击打开：直接跳转到文档查看页面
- ✅ 删除功能：支持快速删除文档（带确认）

#### 高级功能
- 🔍 **搜索功能**: 当文档数量 > 3 时自动显示搜索框
- 📊 **实时更新**: 使用自定义事件监听文档的创建/删除/更新
- 🎨 **优雅动画**: Hover 效果、过渡动画
- 📱 **响应式**: 预览功能仅在大屏幕显示

### 3. 表单组件优化

#### `DragAndDropForm.tsx`
- 更现代的拖拽区域设计
- 增强的视觉反馈（拖拽时变色）
- 更清晰的提示文字

#### `UrlForm.tsx`
- 圆角设计，更友好的视觉效果
- 加载状态显示（旋转图标）
- 改进的按钮样式（lime 配色）

### 4. 新增 Hook (`useDocumentsList.tsx`)

创建了自定义 Hook 来管理文档列表：

```typescript
const { documents, loading, refresh } = useDocumentsList();
```

功能：
- 自动加载文档列表
- 监听文档变更事件（创建、更新、删除）
- 自动刷新列表
- 加载状态管理

### 5. 事件系统优化 (`jsonDoc.client.ts`)

在所有文档操作中添加了事件触发：

- `documentCreated`: 文档创建时触发
- `documentUpdated`: 文档更新时触发
- `documentDeleted`: 文档删除时触发

这确保了 UI 的实时更新。

## 新增文件

1. `/app/components/Home/SavedDocumentsList.tsx` - 文档列表组件
2. `/app/hooks/useDocumentsList.tsx` - 文档列表管理 Hook

## 修改文件

1. `/app/components/Home/HomeHeroSection.tsx` - 重新设计首页布局
2. `/app/components/DragAndDropForm.tsx` - 优化拖拽表单样式
3. `/app/components/UrlForm.tsx` - 优化 URL 表单样式
4. `/app/jsonDoc.client.ts` - 添加事件触发机制

## UI 特性

### 配色方案
- 主色调：紫色渐变 (`from-[rgb(56,52,139)] via-[rgb(66,62,159)] to-[rgb(76,72,179)]`)
- 强调色：lime 绿色 (`lime-300`, `lime-400`)
- 背景：半透明白色 (`bg-white/5`, `bg-white/10`)
- 边框：半透明白色 (`border-white/10`, `border-white/20`)

### 交互效果
- Hover 高亮
- 平滑过渡动画
- 自定义滚动条样式
- 响应式布局

## 使用说明

### 上传 JSON
1. 在左侧区域输入 JSON URL 或直接粘贴 JSON 内容
2. 或拖拽 JSON 文件到拖拽区域
3. 点击提交，自动跳转到查看页面

### 查看文档列表
1. 右侧自动显示所有已保存的文档
2. 鼠标悬停可预览内容（桌面端）
3. 点击任意文档可打开查看
4. 点击垃圾桶图标可删除文档

### 搜索文档
1. 当文档数量超过 3 个时，搜索框自动显示
2. 输入关键词即可过滤文档
3. 支持搜索标题和 URL

## 技术亮点

1. **IndexedDB 集成**: 完整的本地存储解决方案
2. **事件驱动**: 使用自定义事件实现组件间通信
3. **性能优化**: useMemo 缓存过滤结果
4. **TypeScript**: 完整的类型支持
5. **无障碍性**: 语义化 HTML 和 ARIA 标签

## 浏览器兼容性

- ✅ Chrome/Edge (推荐)
- ✅ Firefox
- ✅ Safari
- ℹ️ 需要支持 IndexedDB 的现代浏览器

## 未来可能的增强

- [ ] 文档排序选项（按名称、创建时间等）
- [ ] 批量操作（批量删除、导出）
- [ ] 标签/分类系统
- [ ] 文档大小显示
- [ ] 更详细的预览信息
- [ ] 拖拽排序

