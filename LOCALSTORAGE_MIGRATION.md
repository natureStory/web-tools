# LocalStorage 迁移说明

## 概述

项目已从 Cloudflare KV (DOCUMENTS) 迁移到浏览器端 localStorage 存储，所有数据现在都保存在用户的本地浏览器中。

## 主要变更

### 1. 新文件
- `app/jsonDoc.client.ts` - 客户端数据存储模块，使用 localStorage

### 2. 更新的文件
所有原本使用 `~/jsonDoc.server` 的文件已更新为使用 `~/jsonDoc.client`：
- `app/hooks/useJsonDoc.tsx`
- `app/utilities/xml/createFromRawXml.ts`
- `app/routes/actions/$id/update.ts`
- `app/routes/actions/createFromFile.ts`
- `app/routes/actions/createFromUrl.ts`
- `app/routes/new.tsx`
- `app/routes/j/$id.tsx`
- `app/routes/j/$id[.json].ts`
- `app/routes/api/create[.json].ts`

## API 说明

### 数据存储结构
- 文档键名格式: `jsonhero_doc_{documentId}`
- 索引键名: `jsonhero_index` (存储所有文档 ID 的数组)

### 主要函数

#### 创建文档
```typescript
// 从原始 JSON 创建
const doc = await createFromRawJson(filename: string, contents: string, options?: CreateJsonOptions);

// 从 URL 创建
const doc = await createFromUrl(url: URL, title?: string, options?: CreateJsonOptions);

// 自动识别创建（URL 或 JSON 或 XML）
const doc = await createFromUrlOrRawJson(urlOrJson: string, title?: string);
```

#### 读取文档
```typescript
const doc = await getDocument(id: string);
```

#### 更新文档
```typescript
const doc = await updateDocument(id: string, title?: string, contents?: string);
```

#### 删除文档
```typescript
await deleteDocument(id: string);
```

#### 获取所有文档
```typescript
const allDocs = getAllDocuments();
```

## 数据迁移

由于从远程存储迁移到本地存储，**原有的远程数据不会自动迁移**。用户需要：

1. 如果需要保留旧数据，请在迁移前导出
2. 迁移后，所有新创建的文档都会保存在浏览器 localStorage 中
3. 数据仅存在于创建它的浏览器中

## 注意事项

### localStorage 限制
- 容量限制：通常为 5-10MB（因浏览器而异）
- 数据隔离：不同域名、不同浏览器的数据完全独立
- 清除缓存可能导致数据丢失
- 隐私模式下的数据在关闭窗口后会被清除

### 服务器端代码
- 路由的 `loader` 和 `action` 函数仍在服务器端执行
- 但数据操作（`createFromRawJson` 等）现在直接操作 localStorage
- 这意味着在服务器端执行时，这些函数会检查 `typeof window === "undefined"` 并返回空结果

### 建议
如果需要完全的客户端应用，可以考虑：
1. 将更多逻辑移到 React 组件的 `useEffect` 中
2. 移除不必要的服务器端 `loader`/`action`
3. 使用客户端路由

## 旧文件

- `app/jsonDoc.server.ts` - 已不再使用，但保留以供参考
- 配置文件（`wrangler.toml`, `bindings.d.ts`）中的 DOCUMENTS 引用可以忽略
