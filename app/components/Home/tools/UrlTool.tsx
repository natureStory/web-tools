import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ClipboardIcon, CheckIcon, ExternalLinkIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "@heroicons/react/outline";

interface ParsedRequest {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body?: string;
  queryParams: Array<{ key: string; value: string }>;
}

// 请求体编辑模式
type BodyEditMode = 'source' | 'form';

// JSON 值类型
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

// Modal 组件
function NestedUrlModal({ url, onClose, onUpdate }: { url: string; onClose: () => void; onUpdate?: (oldUrl: string, newUrl: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [updatedUrl, setUpdatedUrl] = useState(url);

  // 禁止背景滚动
  useEffect(() => {
    setMounted(true);
    
    // 保存原始的 overflow 值
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // 计算滚动条宽度
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // 禁止滚动并补偿滚动条宽度
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    // 清理函数：恢复原始值
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const handleClose = () => {
    // 如果 URL 已更新，通知父组件
    if (updatedUrl !== url && onUpdate) {
      onUpdate(url, updatedUrl);
    }
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <div 
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 100
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgb(15, 23, 42)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 固定的标题栏 */}
        <div 
          style={{
            flexShrink: 0,
            backgroundColor: 'rgb(15, 23, 42)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem'
          }}
        >
          <h3 className="text-white font-semibold">嵌套 URL 解析</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* 可滚动的内容区域 */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem'
          }}
        >
          <NestedUrlParser 
            initialUrl={url}
            onUrlChange={setUpdatedUrl}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// 递归 JSON 表单编辑器组件
function JsonFormEditor({ 
  data, 
  onChange, 
  path = [] 
}: { 
  data: JsonValue; 
  onChange: (newData: JsonValue) => void;
  path?: string[];
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isObject = (value: any): value is JsonObject => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isArray = (value: any): value is JsonArray => {
    return Array.isArray(value);
  };

  const getType = (value: JsonValue): string => {
    if (value === null) return 'null';
    if (isArray(value)) return 'array';
    if (isObject(value)) return 'object';
    return typeof value;
  };

  const updateValue = (key: string | number, newValue: JsonValue) => {
    if (isObject(data)) {
      onChange({ ...data, [key]: newValue });
    } else if (isArray(data)) {
      const newArray = [...data];
      newArray[key as number] = newValue;
      onChange(newArray);
    }
  };

  const updateKey = (oldKey: string, newKey: string) => {
    if (isObject(data) && oldKey !== newKey) {
      const newData: JsonObject = {};
      Object.entries(data).forEach(([k, v]) => {
        newData[k === oldKey ? newKey : k] = v;
      });
      onChange(newData);
    }
  };

  const deleteItem = (key: string | number) => {
    if (isObject(data)) {
      const newData = { ...data };
      delete newData[key as string];
      onChange(newData);
    } else if (isArray(data)) {
      onChange(data.filter((_, i) => i !== key));
    }
  };

  const addItem = () => {
    if (isObject(data)) {
      onChange({ ...data, '': '' });
    } else if (isArray(data)) {
      onChange([...data, '']);
    }
  };

  const changeValueType = (key: string | number, newType: string) => {
    let newValue: JsonValue;
    switch (newType) {
      case 'string':
        newValue = '';
        break;
      case 'number':
        newValue = 0;
        break;
      case 'boolean':
        newValue = false;
        break;
      case 'null':
        newValue = null;
        break;
      case 'object':
        newValue = {};
        break;
      case 'array':
        newValue = [];
        break;
      default:
        newValue = '';
    }
    updateValue(key, newValue);
  };

  const renderPrimitiveInput = (key: string | number, value: JsonValue) => {
    const type = getType(value);
    
    if (type === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => updateValue(key, e.target.value === 'true')}
          className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    if (type === 'null') {
      return (
        <input
          type="text"
          value="null"
          disabled
          className="flex-1 bg-white/5 border border-white/20 rounded p-1.5 text-slate-400 text-xs"
        />
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          value={value as number}
          onChange={(e) => updateValue(key, parseFloat(e.target.value) || 0)}
          className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400"
        />
      );
    }

    return (
      <input
        type="text"
        value={value as string}
        onChange={(e) => updateValue(key, e.target.value)}
        placeholder="Value"
        className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400"
      />
    );
  };

  const renderItem = (key: string | number, value: JsonValue, index: number) => {
    const type = getType(value);
    const isComplex = type === 'object' || type === 'array';
    const fullPath = [...path, String(key)].join('.');
    const isCollapsed = collapsed[fullPath];

    return (
      <div key={index} className="group relative">
        <div className="flex gap-2 items-start mb-1">
          {/* 折叠按钮 */}
          {isComplex && (
            <button
              onClick={() => toggleCollapse(fullPath)}
              className="mt-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-3 h-3" />
              ) : (
                <ChevronDownIcon className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Key 输入 (对象) 或 索引显示 (数组) */}
          {isObject(data) ? (
            <input
              type="text"
              value={key}
              onChange={(e) => updateKey(key as string, e.target.value)}
              placeholder="Key"
              className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400"
              style={{ width: '120px' }}
            />
          ) : (
            <div className="bg-white/5 border border-white/20 rounded p-1.5 text-slate-400 text-xs" style={{ width: '40px', textAlign: 'center' }}>
              {key}
            </div>
          )}

          {/* 类型选择器 */}
          <select
            value={type}
            onChange={(e) => changeValueType(key, e.target.value)}
            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400"
            style={{ width: '80px' }}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {/* 值输入 (非复杂类型) */}
          {!isComplex && renderPrimitiveInput(key, value)}

          {/* 复杂类型显示 */}
          {isComplex && (
            <div className="flex-1 bg-white/5 border border-white/20 rounded p-1.5 text-slate-400 text-xs">
              {isArray(value) ? `Array[${value.length}]` : `Object{${isObject(value) ? Object.keys(value).length : 0}}`}
            </div>
          )}

          {/* 删除按钮 */}
          <button
            onClick={() => deleteItem(key)}
            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors border border-red-400/30 opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>

        {/* 嵌套内容 */}
        {isComplex && !isCollapsed && (
          <div className="ml-6 mt-2 pl-3 border-l-2 border-white/10">
            <JsonFormEditor
              data={value}
              onChange={(newValue) => updateValue(key, newValue)}
              path={[...path, String(key)]}
            />
          </div>
        )}
      </div>
    );
  };

  if (isObject(data)) {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value], index) => renderItem(key, value, index))}
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
        >
          <PlusIcon className="w-3 h-3" />
          添加字段
        </button>
      </div>
    );
  }

  if (isArray(data)) {
    return (
      <div className="space-y-2">
        {data.map((value, index) => renderItem(index, value, index))}
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
        >
          <PlusIcon className="w-3 h-3" />
          添加项
        </button>
      </div>
    );
  }

  return null;
}

// 嵌套 URL 解析器组件
function NestedUrlParser({ initialUrl, onUrlChange }: { initialUrl: string; onUrlChange?: (newUrl: string) => void }) {
  const [parsed, setParsed] = useState<ParsedRequest>(() => {
    const result: ParsedRequest = {
      method: "GET",
      url: initialUrl,
      headers: [],
      body: "",
      queryParams: [],
    };
    
    // 解析 URL 参数，保持原始顺序
    try {
      const urlObj = new URL(initialUrl);
      const params: Array<{ key: string; value: string }> = [];
      urlObj.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      result.queryParams = params;
    } catch {
      // URL 无效
    }
    
    return result;
  });
  
  const [nestedModalUrl, setNestedModalUrl] = useState<string | null>(null);
  
  // 检测值是否是 URL
  const isUrl = (value: string): boolean => {
    try {
      const decoded = decodeURIComponent(value);
      return decoded.match(/^https?:\/\//) !== null;
    } catch {
      return false;
    }
  };

  // 更新查询参数
  const updateQueryParam = (index: number, newKey: string, value: string) => {
    const newParams = [...parsed.queryParams];
    newParams[index] = { key: newKey, value };
    
    // 更新 URL
    try {
      const urlObj = new URL(parsed.url);
      urlObj.search = '';
      newParams.forEach(({ key, value: val }) => {
        if (key && val) {
          urlObj.searchParams.append(key, val);
        }
      });
      const newUrl = urlObj.toString();
      setParsed({ ...parsed, url: newUrl, queryParams: newParams });
      
      // 通知父组件 URL 已更新
      if (onUrlChange) {
        onUrlChange(newUrl);
      }
    } catch {
      setParsed({ ...parsed, queryParams: newParams });
    }
  };

  // 删除查询参数
  const deleteQueryParam = (index: number) => {
    const newParams = parsed.queryParams.filter((_, i) => i !== index);
    
    // 更新 URL
    try {
      const urlObj = new URL(parsed.url);
      urlObj.search = '';
      newParams.forEach(({ key, value: val }) => {
        if (key && val) {
          urlObj.searchParams.append(key, val);
        }
      });
      const newUrl = urlObj.toString();
      setParsed({ ...parsed, url: newUrl, queryParams: newParams });
      
      // 通知父组件 URL 已更新
      if (onUrlChange) {
        onUrlChange(newUrl);
      }
    } catch {
      setParsed({ ...parsed, queryParams: newParams });
    }
  };

  // 添加查询参数
  const addQueryParam = () => {
    setParsed({
      ...parsed,
      queryParams: [...parsed.queryParams, { key: "", value: "" }],
    });
  };
  
  // 解析 URL 组件
  const urlComponents = (() => {
    try {
      const urlObj = new URL(parsed.url);
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port,
        pathname: urlObj.pathname,
        hash: urlObj.hash,
      };
    } catch {
      return {
        protocol: "",
        hostname: "",
        port: "",
        pathname: "",
        hash: "",
      };
    }
  })();

  // 更新 URL 组件
  const updateUrlComponent = (field: string, value: string) => {
    try {
      const urlObj = new URL(parsed.url);
      switch (field) {
        case 'protocol':
          urlObj.protocol = value;
          break;
        case 'hostname':
          urlObj.hostname = value;
          break;
        case 'port':
          urlObj.port = value;
          break;
        case 'pathname':
          urlObj.pathname = value;
          break;
        case 'hash':
          urlObj.hash = value;
          break;
      }
      const newUrl = urlObj.toString();
      setParsed({ ...parsed, url: newUrl });
      
      // 通知父组件 URL 已更新
      if (onUrlChange) {
        onUrlChange(newUrl);
      }
    } catch (err) {
      console.error('URL 更新失败:', err);
    }
  };
  
  return (
    <>
      <div className="space-y-4">
        {/* 请求信息 */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <h4 className="text-lime-400 font-semibold text-xs mb-2">URL 信息</h4>
          <div className="flex gap-2">
            {/* Protocol */}
            <div className="w-24">
              <label className="block text-slate-400 text-xs mb-1">Protocol</label>
              <input
                type="text"
                value={urlComponents.protocol}
                onChange={(e) => updateUrlComponent('protocol', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>
            
            {/* Hostname */}
            <div className="flex-1">
              <label className="block text-slate-400 text-xs mb-1">Hostname</label>
              <input
                type="text"
                value={urlComponents.hostname}
                onChange={(e) => updateUrlComponent('hostname', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>
            
            {/* Port */}
            <div className="w-20">
              <label className="block text-slate-400 text-xs mb-1">Port</label>
              <input
                type="text"
                value={urlComponents.port}
                onChange={(e) => updateUrlComponent('port', e.target.value)}
                placeholder="默认"
                className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>
            
            {/* Path */}
            <div className="flex-1">
              <label className="block text-slate-400 text-xs mb-1">Path</label>
              <input
                type="text"
                value={urlComponents.pathname}
                onChange={(e) => updateUrlComponent('pathname', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>
            
            {/* Hash */}
            <div className="w-32">
              <label className="block text-slate-400 text-xs mb-1">Hash</label>
              <input
                type="text"
                value={urlComponents.hash}
                onChange={(e) => updateUrlComponent('hash', e.target.value)}
                placeholder="可选"
                className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>
          </div>
        </div>
        
        {/* 查询参数 */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lime-400 font-semibold text-xs">查询参数</h4>
            <button
              onClick={addQueryParam}
              className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
            >
              + 添加
            </button>
          </div>
          <div className="space-y-3">
            {parsed.queryParams.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-4">暂无查询参数</p>
            ) : (
              parsed.queryParams.map(({ key, value }, index) => (
                <div key={index} className="flex gap-2 items-start group relative">
                  <div style={{ flex: '1' }}>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateQueryParam(index, e.target.value, value)}
                      placeholder="Key"
                      className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                    />
                  </div>
                  <div style={{ flex: '2' }} className="flex gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateQueryParam(index, key, e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                    />
                    {isUrl(value) && (
                      <button
                        onClick={() => setNestedModalUrl(decodeURIComponent(value))}
                        className="px-2 py-1.5 bg-lime-400/20 hover:bg-lime-400/30 text-lime-400 rounded text-xs font-medium transition-colors border border-lime-400/30 flex items-center gap-1"
                        title="解析嵌套 URL"
                      >
                        <ExternalLinkIcon className="w-3 h-3" />
                        解析
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteQueryParam(index)}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold shadow-lg"
                    style={{ width: '12px', height: '12px', fontSize: '9px', lineHeight: '12px' }}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* 递归嵌套 Modal */}
      {nestedModalUrl && (
        <NestedUrlModal
          url={nestedModalUrl}
          onClose={() => setNestedModalUrl(null)}
          onUpdate={(oldUrl, newUrl) => {
            // 更新查询参数中的嵌套 URL
            const newParams = parsed.queryParams.map(param => {
              try {
                const decoded = decodeURIComponent(param.value);
                if (decoded === oldUrl) {
                  return { ...param, value: encodeURIComponent(newUrl) };
                }
              } catch {}
              return param;
            });
            
            // 更新主 URL
            try {
              const urlObj = new URL(parsed.url);
              urlObj.search = '';
              newParams.forEach(({ key, value }) => {
                if (key && value) {
                  urlObj.searchParams.append(key, value);
                }
              });
              setParsed({ ...parsed, url: urlObj.toString(), queryParams: newParams });
            } catch {}
          }}
        />
      )}
    </>
  );
}

export function UrlTool() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedRequest>({
    method: "GET",
    url: "",
    headers: [],
    body: "",
    queryParams: [],
  });
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showHeaders, setShowHeaders] = useState(false); // 控制请求头显示
  const [nestedModalUrl, setNestedModalUrl] = useState<string | null>(null); // 嵌套 URL Modal
  const [bodyEditMode, setBodyEditMode] = useState<BodyEditMode>('form'); // 请求体编辑模式，默认为表单模式
  const [bodyFormData, setBodyFormData] = useState<JsonValue>({}); // 表单模式的数据

  // 解析 URL 参数，保持原始顺序
  const parseUrlParams = (url: string): Array<{ key: string; value: string }> => {
    try {
      const urlObj = new URL(url);
      const params: Array<{ key: string; value: string }> = [];
      urlObj.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      return params;
    } catch {
      return [];
    }
  };

  // 解析 curl 命令
  const parseCurl = (curlCommand: string): ParsedRequest => {
    const result: ParsedRequest = {
      method: "GET",
      url: "",
      headers: [],
      body: "",
      queryParams: [],
    };

    // 提取 URL
    const urlMatch = curlCommand.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'">\s]+)['"]?/i);
    if (urlMatch) {
      result.url = urlMatch[1].replace(/^['"]|['"]$/g, "");
      result.queryParams = parseUrlParams(result.url);
    }

    // 提取方法
    const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
    }

    // 提取请求头
    const headerMatches = curlCommand.matchAll(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/gi);
    for (const match of headerMatches) {
      result.headers.push({ key: match[1].trim(), value: match[2].trim() });
    }

    // 提取请求体
    const bodyMatch = curlCommand.match(/(?:-d|--data(?:-raw)?)\s+(['"])(.+?)\1/s);
    if (bodyMatch) {
      result.body = bodyMatch[2];
      // 尝试格式化 JSON
      try {
        const parsed = JSON.parse(result.body);
        result.body = JSON.stringify(parsed, null, 2);
      } catch {
        // 保持原样
      }
      if (!result.method || result.method === "GET") {
        result.method = "POST";
      }
    }

    return result;
  };

  // 解析 fetch 代码
  const parseFetch = (fetchCode: string): ParsedRequest => {
    const result: ParsedRequest = {
      method: "GET",
      url: "",
      headers: [],
      body: "",
      queryParams: [],
    };

    // 提取 URL
    const urlMatch = fetchCode.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);
    if (urlMatch) {
      result.url = urlMatch[1];
      result.queryParams = parseUrlParams(result.url);
    }

    // 提取方法
    const methodMatch = fetchCode.match(/['"]?method['"]?\s*:\s*['"](\w+)['"]/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
    }

    // 提取请求头 - 改进的正则，支持多行和嵌套
    const headersMatch = fetchCode.match(/['"]?headers['"]?\s*:\s*\{([\s\S]*?)\n\s*\}/);
    if (headersMatch) {
      const headersStr = headersMatch[1];
      // 匹配所有的 key: value 对
      const headerPairs = headersStr.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g);
      for (const match of headerPairs) {
        result.headers.push({ key: match[1], value: match[2] });
      }
    }

    // 提取请求体
    // 先尝试匹配 JSON.stringify
    let bodyMatch = fetchCode.match(/['"]?body['"]?\s*:\s*JSON\.stringify\s*\(\s*(\{[\s\S]*?\})\s*\)/);
    if (bodyMatch) {
      try {
        const parsed = JSON.parse(bodyMatch[1]);
        result.body = JSON.stringify(parsed, null, 2);
      } catch {
        result.body = bodyMatch[1];
      }
    } else {
      // 尝试匹配字符串格式（包括转义的 JSON 字符串）
      // 匹配到非转义的引号为止
      bodyMatch = fetchCode.match(/['"]?body['"]?\s*:\s*['"]((?:[^'"\\]|\\.)*)['"]/)
      if (bodyMatch) {
        let bodyStr = bodyMatch[1];
        // 处理转义字符
        bodyStr = bodyStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        // 尝试解析和格式化 JSON
        try {
          const parsed = JSON.parse(bodyStr);
          result.body = JSON.stringify(parsed, null, 2);
        } catch {
          result.body = bodyStr;
        }
      }
    }

    return result;
  };

  // 解析 URL
  const parseUrl = (url: string): ParsedRequest => {
    const result: ParsedRequest = {
      method: "GET",
      url: url,
      headers: [],
      body: "",
      queryParams: parseUrlParams(url),
    };
    return result;
  };

  // 主解析函数
  const handleParse = () => {
    const trimmedInput = input.trim();
    let result: ParsedRequest;

    if (trimmedInput.startsWith("curl")) {
      result = parseCurl(trimmedInput);
      setShowHeaders(true); // curl 默认显示请求头
    } else if (trimmedInput.includes("fetch(")) {
      result = parseFetch(trimmedInput);
      setShowHeaders(true); // fetch 默认显示请求头
    } else {
      result = parseUrl(trimmedInput);
      setShowHeaders(false); // 纯 URL 默认隐藏请求头
    }

    setParsed(result);
    
    // 如果有请求体，尝试解析为表单数据
    if (result.body) {
      try {
        const jsonData = JSON.parse(result.body);
        setBodyFormData(jsonData);
      } catch {
        // 非 JSON 数据，保持为空对象
        setBodyFormData({});
      }
    }
  };

  // 从表单数据同步到源码
  const syncFormToSource = (formData: JsonValue) => {
    try {
      const jsonString = JSON.stringify(formData, null, 2);
      setParsed({ ...parsed, body: jsonString });
    } catch (err) {
      console.error('同步失败:', err);
    }
  };

  // 从源码同步到表单
  const syncSourceToForm = () => {
    try {
      if (parsed.body) {
        const jsonData = JSON.parse(parsed.body);
        setBodyFormData(jsonData);
      }
    } catch (err) {
      console.error('解析失败:', err);
    }
  };

  // 切换编辑模式
  const switchBodyEditMode = (mode: BodyEditMode) => {
    if (mode === 'form' && bodyEditMode === 'source') {
      // 从源码切换到表单，同步数据
      syncSourceToForm();
    } else if (mode === 'source' && bodyEditMode === 'form') {
      // 从表单切换到源码，同步数据
      syncFormToSource(bodyFormData);
    }
    setBodyEditMode(mode);
  };

  // 更新表单数据
  const updateBodyFormData = (newData: JsonValue) => {
    setBodyFormData(newData);
    syncFormToSource(newData);
  };

  // 生成 curl 命令
  const generateCurl = (): string => {
    if (!parsed.url) return "";

    let curl = `curl -X ${parsed.method} '${parsed.url}'`;

    parsed.headers.forEach(({ key, value }) => {
      if (key && value) {
        curl += ` \\\n  -H '${key}: ${value}'`;
      }
    });

    if (parsed.body) {
      curl += ` \\\n  -d '${parsed.body}'`;
    }

    return curl;
  };

  // 生成 fetch 代码
  const generateFetch = (): string => {
    if (!parsed.url) return "";

    const options: any = {
      method: parsed.method,
    };

    if (parsed.headers.length > 0) {
      const headersObj: Record<string, string> = {};
      parsed.headers.forEach(({ key, value }) => {
        if (key && value) {
          headersObj[key] = value;
        }
      });
      if (Object.keys(headersObj).length > 0) {
        options.headers = headersObj;
      }
    }

    if (parsed.body) {
      try {
        // 尝试解析为 JSON
        JSON.parse(parsed.body);
        options.body = `JSON.stringify(${parsed.body})`;
      } catch {
        options.body = `'${parsed.body}'`;
      }
    }

    let fetchCode = `fetch('${parsed.url}', ${JSON.stringify(options, null, 2)})`;

    // 处理 body 的特殊格式
    if (parsed.body) {
      try {
        JSON.parse(parsed.body);
        fetchCode = fetchCode.replace(
          `"body": "JSON.stringify(${parsed.body})"`,
          `body: JSON.stringify(${parsed.body})`
        );
      } catch {
        fetchCode = fetchCode.replace(`"body": "'${parsed.body}'"`, `body: '${parsed.body}'`);
      }
    }

    fetchCode += "\n  .then(response => response.json())\n  .then(data => console.log(data));";

    return fetchCode;
  };

  // 生成完整 URL
  const generateUrl = (): string => {
    if (!parsed.url) return "";

    try {
      const urlObj = new URL(parsed.url);
      // 清空现有参数
      urlObj.search = "";
      // 添加更新后的参数，保持顺序
      parsed.queryParams.forEach(({ key, value }) => {
        if (key && value) {
          urlObj.searchParams.append(key, value);
        }
      });
      return urlObj.toString();
    } catch {
      return parsed.url;
    }
  };

  // 更新请求头
  const updateHeader = (index: number, newKey: string, value: string) => {
    const newHeaders = [...parsed.headers];
    newHeaders[index] = { key: newKey, value };
    setParsed({ ...parsed, headers: newHeaders });
  };

  // 删除请求头
  const deleteHeader = (index: number) => {
    const newHeaders = parsed.headers.filter((_, i) => i !== index);
    setParsed({ ...parsed, headers: newHeaders });
  };

  // 添加请求头
  const addHeader = () => {
    setParsed({
      ...parsed,
      headers: [...parsed.headers, { key: "", value: "" }],
    });
  };

  // 更新查询参数
  const updateQueryParam = (index: number, newKey: string, value: string) => {
    const newParams = [...parsed.queryParams];
    newParams[index] = { key: newKey, value };
    
    // 更新 URL
    try {
      const urlObj = new URL(parsed.url);
      urlObj.search = '';
      newParams.forEach(({ key, value: val }) => {
        if (key && val) {
          urlObj.searchParams.append(key, val);
        }
      });
      const newUrl = urlObj.toString();
      setParsed({ ...parsed, url: newUrl, queryParams: newParams });
    } catch {
      setParsed({ ...parsed, queryParams: newParams });
    }
  };

  // 删除查询参数
  const deleteQueryParam = (index: number) => {
    const newParams = parsed.queryParams.filter((_, i) => i !== index);
    
    // 更新 URL
    try {
      const urlObj = new URL(parsed.url);
      urlObj.search = '';
      newParams.forEach(({ key, value: val }) => {
        if (key && val) {
          urlObj.searchParams.append(key, val);
        }
      });
      const newUrl = urlObj.toString();
      setParsed({ ...parsed, url: newUrl, queryParams: newParams });
    } catch {
      setParsed({ ...parsed, queryParams: newParams });
    }
  };

  // 添加查询参数
  const addQueryParam = () => {
    setParsed({
      ...parsed,
      queryParams: [...parsed.queryParams, { key: "", value: "" }],
    });
  };

  // 检测值是否是 URL
  const isUrl = (value: string): boolean => {
    try {
      const decoded = decodeURIComponent(value);
      return decoded.match(/^https?:\/\//) !== null;
    } catch {
      return false;
    }
  };

  // 计算请求体的行数
  const calculateBodyRows = (body: string): number => {
    if (!body) return 3; // 空内容默认 3 行
    const lines = body.split('\n').length;
    return Math.min(Math.max(lines, 3), 30); // 最小 6 行，最大 30 行
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 解析 URL 组件
  const parseUrlComponents = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port,
        pathname: urlObj.pathname,
        hash: urlObj.hash,
      };
    } catch {
      return {
        protocol: "",
        hostname: "",
        port: "",
        pathname: "",
        hash: "",
      };
    }
  };

  const urlComponents = parseUrlComponents(parsed.url);

  // 更新 URL 组件
  const updateUrlComponent = (field: string, value: string) => {
    try {
      const urlObj = new URL(parsed.url);
      switch (field) {
        case 'protocol':
          urlObj.protocol = value;
          break;
        case 'hostname':
          urlObj.hostname = value;
          break;
        case 'port':
          urlObj.port = value;
          break;
        case 'pathname':
          urlObj.pathname = value;
          break;
        case 'hash':
          urlObj.hash = value;
          break;
      }
      setParsed({ ...parsed, url: urlObj.toString() });
    } catch (err) {
      // 如果 URL 无效，仍然更新状态
      console.error('URL 更新失败:', err);
    }
  };

  return (
    <div>
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">URL 工具</h2>

        {/* 输入区域 */}
        <div className="mb-6">
          <label className="block text-slate-300 mb-2 text-sm font-medium">
            输入 URL / curl / fetch
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="示例:&#10;https://api.example.com/users?page=1&#10;或&#10;curl -X POST 'https://api.example.com/data' -H 'Content-Type: application/json' -d '{&quot;key&quot;:&quot;value&quot;}'&#10;或&#10;fetch('https://api.example.com/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({key: 'value'}) })"
            className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white font-mono text-sm resize-y min-h-[120px] focus:outline-none focus:border-lime-400 transition-colors"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleParse}
              className="px-6 py-2.5 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-colors"
            >
              解析
            </button>
            
            {/* 复制按钮 */}
            {parsed.url && (
              <>
                <button
                  onClick={() => copyToClipboard(generateCurl(), "curl")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20 flex items-center gap-2 text-sm"
                >
                  {copiedType === "curl" ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      复制为 curl
                    </>
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(generateFetch(), "fetch")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20 flex items-center gap-2 text-sm"
                >
                  {copiedType === "fetch" ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      复制为 fetch
                    </>
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(generateUrl(), "url")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20 flex items-center gap-2 text-sm"
                >
                  {copiedType === "url" ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      复制为 URL
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 解析结果 */}
        {parsed.url && (
          <div className="space-y-4">

            {/* 请求信息 - 横向排列 */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-4">
              <h3 className="text-lime-400 font-semibold text-xs mb-2">请求信息</h3>
              <div className="flex gap-2">
                {/* 请求方法 */}
                <div className="w-24">
                  <label className="block text-slate-400 text-xs mb-1">Method</label>
                  <select
                    value={parsed.method}
                    onChange={(e) => setParsed({ ...parsed, method: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>

                {/* Protocol */}
                <div className="w-24">
                  <label className="block text-slate-400 text-xs mb-1">Protocol</label>
                  <input
                    type="text"
                    value={urlComponents.protocol}
                    onChange={(e) => updateUrlComponent('protocol', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                {/* Hostname */}
                <div className="flex-1">
                  <label className="block text-slate-400 text-xs mb-1">Hostname</label>
                  <input
                    type="text"
                    value={urlComponents.hostname}
                    onChange={(e) => updateUrlComponent('hostname', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                {/* Port */}
                <div className="w-20">
                  <label className="block text-slate-400 text-xs mb-1">Port</label>
                  <input
                    type="text"
                    value={urlComponents.port}
                    onChange={(e) => updateUrlComponent('port', e.target.value)}
                    placeholder="默认"
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                {/* Pathname */}
                <div className="flex-1">
                  <label className="block text-slate-400 text-xs mb-1">Path</label>
                  <input
                    type="text"
                    value={urlComponents.pathname}
                    onChange={(e) => updateUrlComponent('pathname', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                {/* Hash */}
                <div className="w-32">
                  <label className="block text-slate-400 text-xs mb-1">Hash</label>
                  <input
                    type="text"
                    value={urlComponents.hash}
                    onChange={(e) => updateUrlComponent('hash', e.target.value)}
                    placeholder="可选"
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 添加请求头按钮（当请求头隐藏时显示） */}
            {!showHeaders && (
              <div className="mb-4">
                <button
                  onClick={() => setShowHeaders(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-white/20"
                >
                  + 展开请求头
                </button>
              </div>
            )}

            {/* 两列布局 */}
            <div 
              className="gap-4"
              style={{ 
                display: 'grid',
                gridTemplateColumns: showHeaders ? '1fr 2fr' : '1fr'
              }}
            >
              {/* 左列：请求头 */}
              {showHeaders && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lime-400 font-semibold text-xs">请求头</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addHeader}
                        className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
                      >
                        + 添加
                      </button>
                      <button
                        onClick={() => setShowHeaders(false)}
                        className="text-slate-400 hover:text-slate-300 text-xs font-medium transition-colors"
                      >
                        隐藏
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {parsed.headers.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">暂无请求头</p>
                    ) : (
                      parsed.headers.map(({ key, value }, index) => (
                        <div key={index} className="flex gap-2 group relative">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateHeader(index, e.target.value, value)}
                            placeholder="Key"
                            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                            style={{ flex: '1' }}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeader(index, key, e.target.value)}
                            placeholder="Value"
                            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                            style={{ flex: '2' }}
                          />
                          <button
                            onClick={() => deleteHeader(index)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold shadow-lg"
                            style={{ width: '12px', height: '12px', fontSize: '9px', lineHeight: '12px' }}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 右列：查询参数和请求体 */}
              <div className="space-y-3">
                {/* 查询参数 */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lime-400 font-semibold text-xs">查询参数</h3>
                    <button
                      onClick={addQueryParam}
                      className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
                    >
                      + 添加
                    </button>
                  </div>
                  <div className="space-y-3">
                    {parsed.queryParams.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">暂无查询参数</p>
                    ) : (
                      parsed.queryParams.map(({ key, value }, index) => (
                        <div key={index} className="flex gap-2 items-start group relative">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateQueryParam(index, e.target.value, value)}
                            placeholder="Key"
                            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                            style={{ flex: '1' }}
                          />
                          <div style={{ flex: '2' }} className="flex gap-2">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateQueryParam(index, key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                            />
                            {isUrl(value) && (
                              <button
                                onClick={() => setNestedModalUrl(decodeURIComponent(value))}
                                className="px-2 py-1.5 bg-lime-400/20 hover:bg-lime-400/30 text-lime-400 rounded text-xs font-medium transition-colors border border-lime-400/30 flex items-center gap-1 whitespace-nowrap"
                                title="解析嵌套 URL"
                              >
                                <ExternalLinkIcon className="w-3 h-3" />
                                解析
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => deleteQueryParam(index)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold shadow-lg"
                            style={{ width: '12px', height: '12px', fontSize: '9px', lineHeight: '12px' }}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 请求体（仅 POST/PUT/PATCH 显示） */}
                {parsed.method !== "GET" && parsed.method !== "HEAD" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lime-400 font-semibold text-xs">请求体</h3>
                      <div className="flex gap-2 items-center">
                        {/* 模式切换按钮 */}
                        <div className="flex bg-white/5 rounded border border-white/20 overflow-hidden">
                          <button
                            onClick={() => switchBodyEditMode('source')}
                            className={`px-3 py-1 text-xs font-medium transition-colors ${
                              bodyEditMode === 'source'
                                ? 'bg-lime-400 text-slate-900'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            源码
                          </button>
                          <button
                            onClick={() => switchBodyEditMode('form')}
                            className={`px-3 py-1 text-xs font-medium transition-colors ${
                              bodyEditMode === 'form'
                                ? 'bg-lime-400 text-slate-900'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            表单
                          </button>
                        </div>
                        
                        {/* 格式化按钮 (仅源码模式显示) */}
                        {bodyEditMode === 'source' && (
                          <button
                            onClick={() => {
                              try {
                                const formatted = JSON.stringify(JSON.parse(parsed.body || ""), null, 2);
                                setParsed({ ...parsed, body: formatted });
                              } catch {
                                // JSON 格式不正确，不做处理
                              }
                            }}
                            className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
                          >
                            格式化
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 源码模式 */}
                    {bodyEditMode === 'source' && (
                      <textarea
                        value={parsed.body}
                        onChange={(e) => setParsed({ ...parsed, body: e.target.value })}
                        placeholder="JSON 或文本数据"
                        rows={calculateBodyRows(parsed.body || "")}
                        className="w-full bg-white/10 border border-white/20 rounded p-2 text-white font-mono text-xs resize-y focus:outline-none focus:border-lime-400 transition-colors overflow-y-auto"
                        style={{ maxHeight: '600px', minHeight: '120px' }}
                      />
                    )}

                    {/* 表单模式 */}
                    {bodyEditMode === 'form' && (
                      <div className="bg-white/10 border border-white/20 rounded p-3 max-h-[600px] overflow-y-auto">
                        {parsed.body && parsed.body.trim() ? (
                          <JsonFormEditor
                            data={bodyFormData}
                            onChange={updateBodyFormData}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-slate-400 text-xs mb-3">请求体为空</p>
                            <button
                              onClick={() => {
                                const initialData = {};
                                setBodyFormData(initialData);
                                setParsed({ ...parsed, body: JSON.stringify(initialData, null, 2) });
                              }}
                              className="px-4 py-2 bg-lime-400/20 hover:bg-lime-400/30 text-lime-400 rounded text-xs font-medium transition-colors border border-lime-400/30"
                            >
                              创建 JSON 对象
                            </button>
                          </div>
                        )}
                      </div>
                    )}
          </div>
                )}
          </div>
          </div>

          </div>
        )}
        
        {/* 嵌套 URL Modal */}
        {nestedModalUrl && (
          <NestedUrlModal
            url={nestedModalUrl}
            onClose={() => setNestedModalUrl(null)}
            onUpdate={(oldUrl, newUrl) => {
              // 查找并更新查询参数中的嵌套 URL
              const newParams = parsed.queryParams.map(param => {
                try {
                  const decoded = decodeURIComponent(param.value);
                  if (decoded === oldUrl) {
                    return { ...param, value: newUrl };
                  }
                } catch {}
                return param;
              });
              
              setParsed({ ...parsed, queryParams: newParams });
            }}
          />
        )}
      </div>
    </div>
  );
}
