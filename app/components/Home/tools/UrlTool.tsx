import { useState, useEffect } from "react";
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
        className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 placeholder:text-slate-400"
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
              className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 placeholder:text-slate-400"
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
            className={`border rounded p-1.5 text-xs font-medium focus:outline-none transition-colors ${
              type === 'object' 
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200 focus:border-purple-400' 
                : type === 'array' 
                ? 'bg-blue-500/20 border-blue-400/40 text-blue-200 focus:border-blue-400'
                : 'bg-white/10 border-white/20 text-white focus:border-lime-400'
            }`}
            style={{ width: '90px' }}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="object">{ } 对象</option>
            <option value="array">[ ] 数组</option>
          </select>

          {/* 值输入 (非复杂类型) */}
          {!isComplex && renderPrimitiveInput(key, value)}

          {/* 复杂类型显示 */}
          {isComplex && (
            <div className={`flex-1 rounded p-1.5 text-xs font-medium flex items-center gap-2 ${
              isArray(value) 
                ? 'bg-blue-500/10 border border-blue-400/30 text-blue-300' 
                : 'bg-purple-500/10 border border-purple-400/30 text-purple-300'
            }`}>
              <span className="font-mono font-bold">
                {isArray(value) ? '[' : '{'}
              </span>
              <span>
                {isArray(value) ? `数组 · ${value.length} 项` : `对象 · ${isObject(value) ? Object.keys(value).length : 0} 个字段`}
              </span>
              <span className="font-mono font-bold">
                {isArray(value) ? ']' : '}'}
              </span>
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
          <div className={`ml-6 mt-2 pl-3 border-l-2 ${
            isArray(value) ? 'border-blue-400/40' : 'border-purple-400/40'
          }`}>
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
          className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 text-xs font-medium transition-colors bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 rounded px-2 py-1"
        >
          <PlusIcon className="w-3 h-3" />
          <span className="font-mono font-bold mr-1">{`{}`}</span>
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
          className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 text-xs font-medium transition-colors bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 rounded px-2 py-1"
        >
          <PlusIcon className="w-3 h-3" />
          <span className="font-mono font-bold mr-1">{`[]`}</span>
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
  
  const [expandedNestedUrls, setExpandedNestedUrls] = useState<Record<number, boolean>>({});
  
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
                  className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                  className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                <div key={index} className="mb-3">
                  <div className="flex gap-2 items-start group relative">
                    <div style={{ flex: '1' }}>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => updateQueryParam(index, e.target.value, value)}
                        placeholder="Key"
                        className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <div style={{ flex: '2' }} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateQueryParam(index, key, e.target.value)}
                        placeholder="Value"
                        className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
                      />
                      {isUrl(value) && (
                        <button
                          onClick={() => setExpandedNestedUrls(prev => ({ ...prev, [index]: !prev[index] }))}
                          className="px-2 py-1.5 bg-lime-400/20 hover:bg-lime-400/30 text-lime-400 rounded text-xs font-medium transition-colors border border-lime-400/30 flex items-center gap-1"
                          title={expandedNestedUrls[index] ? "收起" : "展开解析"}
                        >
                          {expandedNestedUrls[index] ? (
                            <>
                              <ChevronDownIcon className="w-3 h-3" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronRightIcon className="w-3 h-3" />
                              解析
                            </>
                          )}
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
                  
                  {/* 嵌套 URL 解析器（折叠展开） */}
                  {isUrl(value) && expandedNestedUrls[index] && (
                    <div className="mt-3 ml-4 p-4 bg-white/10 rounded-lg border border-lime-400/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-lime-400/30"></div>
                        <span className="text-lime-400 text-xs font-medium">嵌套 URL 解析</span>
                        <div className="h-px flex-1 bg-lime-400/30"></div>
                      </div>
                      <NestedUrlParser 
                        initialUrl={decodeURIComponent(value)}
                        onUrlChange={(newUrl) => {
                          updateQueryParam(index, key, encodeURIComponent(newUrl));
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
  const [expandedNestedUrls, setExpandedNestedUrls] = useState<Record<number, boolean>>({}); // 嵌套 URL 展开状态
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

    // 提取 URL - 改进版，支持URL在任意位置
    // 首先尝试匹配引号包裹的URL（包括最后的位置）
    let urlMatch = curlCommand.match(/['"]?(https?:\/\/[^'"\s\\]+)['"]?(?:\s|\\|\||$)/i);
    if (urlMatch) {
      result.url = urlMatch[1];
      result.queryParams = parseUrlParams(result.url);
    } else {
      // 如果没找到，尝试传统位置（curl命令后紧跟）
      urlMatch = curlCommand.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'">\s\\]+)['"]?/i);
      if (urlMatch) {
        result.url = urlMatch[1].replace(/^['"]|['"]$/g, "");
        result.queryParams = parseUrlParams(result.url);
      }
    }

    // 提取方法
    const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
    }

    // 提取请求头 - 改进版，支持header值中包含引号
    // 使用更智能的正则，匹配 -H '...' 或 -H "..."
    const headerRegex = /-H\s+(['"])((?:(?!\1).|\\.)*)\1/gi;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
      const headerContent = headerMatch[2];
      const colonIndex = headerContent.indexOf(':');
      if (colonIndex > 0) {
        const key = headerContent.substring(0, colonIndex).trim();
        const value = headerContent.substring(colonIndex + 1).trim();
        result.headers.push({ key, value });
      }
    }

    // 提取 Cookie (-b 或 --cookie 参数)
    const cookieMatch = curlCommand.match(/(?:-b|--cookie)\s+['"]([^'"]+)['"]/i);
    if (cookieMatch) {
      result.headers.push({ key: 'Cookie', value: cookieMatch[1].trim() });
    }

    // 提取请求体 - 支持 -d, --data, --data-raw, --data-binary
    // 使用非贪婪匹配，支持多行和转义字符
    let bodyMatch = curlCommand.match(/(?:-d|--data(?:-raw|-binary)?)\s+(['"])([\s\S]*?)\1(?:\s|\\|$)/m);
    
    // 如果上面的匹配失败，尝试更宽松的匹配（用于处理复杂的换行情况）
    if (!bodyMatch) {
      bodyMatch = curlCommand.match(/(?:-d|--data(?:-raw|-binary)?)\s+(['"])([\s\S]+?)\1/);
    }
    
    if (bodyMatch) {
      // 提取的 body 可能包含 shell 转义，需要处理
      let rawBody = bodyMatch[2];
      
      // 处理 shell 转义字符（如 \' ）
      // 注意：只处理常见的转义，避免过度处理
      rawBody = rawBody.replace(/\\'/g, "'").replace(/\\"/g, '"');
      
      result.body = rawBody;
      
      // 先尝试作为 JSON 解析
      try {
        const parsed = JSON.parse(result.body);
        result.body = JSON.stringify(parsed, null, 2);
      } catch (jsonError) {
        // JSON 解析失败，再尝试作为 URL 编码的表单数据
        // 只有当包含 = 和 & 且不像 JSON 时才尝试
        if (result.body.includes('=') && result.body.includes('&') && 
            !result.body.trim().startsWith('{') && !result.body.trim().startsWith('[')) {
          try {
            // 解析 URL 编码的表单数据
            const params = new URLSearchParams(result.body);
            const decoded: Record<string, string> = {};
            params.forEach((value, key) => {
              // 尝试解析值是否为JSON
              try {
                decoded[key] = JSON.parse(decodeURIComponent(value));
              } catch {
                decoded[key] = decodeURIComponent(value);
              }
            });
            result.body = JSON.stringify(decoded, null, 2);
          } catch {
            // 保持原样
          }
        }
        // 如果都不是，保持原样
      }
      
      if (!result.method || result.method === "GET") {
        result.method = "POST";
      }
    } else {
      // 尝试匹配没有引号的情况（如 -d key=value 或 -d @file）
      const simpleDataMatch = curlCommand.match(/(?:-d|--data(?:-raw|-binary)?)\s+([^'"\s\\]+)/);
      if (simpleDataMatch) {
        result.body = simpleDataMatch[1];
        // 如果是 @file 格式，保持原样
        if (!result.body.startsWith('@')) {
          // 尝试解析为表单数据
          if (result.body.includes('=')) {
            try {
              const params = new URLSearchParams(result.body);
              const decoded: Record<string, string> = {};
              params.forEach((value, key) => {
                decoded[key] = decodeURIComponent(value);
              });
              result.body = JSON.stringify(decoded, null, 2);
            } catch {
              // 保持原样
            }
          }
        }
        if (!result.method || result.method === "GET") {
          result.method = "POST";
        }
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

    // 提取 URL - 支持模板字符串和普通字符串
    const urlMatch = fetchCode.match(/fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/);
    if (urlMatch) {
      result.url = urlMatch[1];
      result.queryParams = parseUrlParams(result.url);
    }

    // 提取方法
    const methodMatch = fetchCode.match(/['"]?method['"]?\s*:\s*['"](\w+)['"]/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
    }

    // 提取请求头 - 改进版，更灵活地匹配结束位置
    // 匹配 headers: { ... } 使用括号计数来找到正确的结束位置
    const headersStartMatch = fetchCode.match(/['"]?headers['"]?\s*:\s*\{/);
    if (headersStartMatch) {
      const startIndex = headersStartMatch.index! + headersStartMatch[0].length;
      let braceCount = 1;
      let endIndex = startIndex;
      
      // 查找匹配的结束花括号
      for (let i = startIndex; i < fetchCode.length && braceCount > 0; i++) {
        if (fetchCode[i] === '{') braceCount++;
        if (fetchCode[i] === '}') braceCount--;
        endIndex = i;
      }
      
      if (braceCount === 0) {
        const headersStr = fetchCode.substring(startIndex, endIndex);
        // 匹配所有的 key: value 对
        const headerPairs = headersStr.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g);
        for (const match of headerPairs) {
          result.headers.push({ key: match[1], value: match[2] });
        }
      }
    }

    // 提取请求体
    // 先尝试匹配 JSON.stringify，支持对象和数组
    let bodyMatch = fetchCode.match(/['"]?body['"]?\s*:\s*JSON\.stringify\s*\(\s*([\[{][\s\S]*?[\]}])\s*\)/);
    if (bodyMatch) {
      try {
        // 尝试直接解析为 JSON
        const parsed = JSON.parse(bodyMatch[1]);
        result.body = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // 如果失败，可能是因为有 JavaScript 表达式，尝试简单清理
        try {
          // 移除尾随逗号（JavaScript 允许但 JSON 不允许）
          const cleaned = bodyMatch[1].replace(/,(\s*[}\]])/g, '$1');
          const parsed = JSON.parse(cleaned);
          result.body = JSON.stringify(parsed, null, 2);
        } catch {
          result.body = bodyMatch[1];
        }
      }
    } else {
      // 尝试匹配字符串格式（包括转义的 JSON 字符串）
      // 匹配到非转义的引号为止
      bodyMatch = fetchCode.match(/['"]?body['"]?\s*:\s*['"]((?:[^'"\\]|\\.)*)['"]/)
      if (bodyMatch) {
        let bodyStr = bodyMatch[1];
        // 处理转义字符
        bodyStr = bodyStr.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
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

    // 转义单引号，用于 shell 命令
    const escapeShellSingleQuote = (str: string) => {
      return str.replace(/'/g, "'\\''");
    };

    let curl = `curl -X ${parsed.method} '${escapeShellSingleQuote(parsed.url)}'`;

    parsed.headers.forEach(({ key, value }) => {
      if (key && value) {
        curl += ` \\\n  -H '${escapeShellSingleQuote(key)}: ${escapeShellSingleQuote(value)}'`;
      }
    });

    if (parsed.body) {
      curl += ` \\\n  -d '${escapeShellSingleQuote(parsed.body)}'`;
    }

    return curl;
  };

  // 生成 fetch 代码
  const generateFetch = (): string => {
    if (!parsed.url) return "";

    // 转义 JavaScript 字符串中的特殊字符
    const escapeJsString = (str: string) => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };

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
        // 不是 JSON，需要转义
        options.body = `'${escapeJsString(parsed.body)}'`;
      }
    }

    // 转义 URL
    const escapedUrl = escapeJsString(parsed.url);
    let fetchCode = `fetch('${escapedUrl}', ${JSON.stringify(options, null, 2)})`;

    // 处理 body 的特殊格式
    if (parsed.body) {
      try {
        JSON.parse(parsed.body);
        fetchCode = fetchCode.replace(
          `"body": "JSON.stringify(${parsed.body})"`,
          `body: JSON.stringify(${parsed.body})`
        );
      } catch {
        const escapedBody = escapeJsString(parsed.body);
        fetchCode = fetchCode.replace(
          `"body": "'${escapedBody}'"`,
          `body: '${escapedBody}'`
        );
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
    return Math.max(lines, 3); // 最小 3 行，无最大限制
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
            className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white font-mono text-sm resize-y min-h-[120px] focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                    className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs font-mono focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
                            style={{ flex: '1' }}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeader(index, key, e.target.value)}
                            placeholder="Value"
                            className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
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
                        <div key={index} className="mb-3">
                          <div className="flex gap-2 items-start group relative">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => updateQueryParam(index, e.target.value, value)}
                              placeholder="Key"
                              className="bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
                              style={{ flex: '1' }}
                            />
                            <div style={{ flex: '2' }} className="flex gap-2">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateQueryParam(index, key, e.target.value)}
                                placeholder="Value"
                                className="flex-1 bg-white/10 border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors placeholder:text-slate-400"
                              />
                              {isUrl(value) && (
                                <button
                                  onClick={() => setExpandedNestedUrls(prev => ({ ...prev, [index]: !prev[index] }))}
                                  className="px-2 py-1.5 bg-lime-400/20 hover:bg-lime-400/30 text-lime-400 rounded text-xs font-medium transition-colors border border-lime-400/30 flex items-center gap-1 whitespace-nowrap"
                                  title={expandedNestedUrls[index] ? "收起" : "展开解析"}
                                >
                                  {expandedNestedUrls[index] ? (
                                    <>
                                      <ChevronDownIcon className="w-3 h-3" />
                                      收起
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRightIcon className="w-3 h-3" />
                                      解析
                                    </>
                                  )}
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
                          
                          {/* 嵌套 URL 解析器（折叠展开） */}
                          {isUrl(value) && expandedNestedUrls[index] && (
                            <div className="mt-3 ml-4 p-4 bg-white/10 rounded-lg border border-lime-400/30">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-lime-400/30"></div>
                                <span className="text-lime-400 text-xs font-medium">嵌套 URL 解析</span>
                                <div className="h-px flex-1 bg-lime-400/30"></div>
                              </div>
                              <NestedUrlParser 
                                initialUrl={decodeURIComponent(value)}
                                onUrlChange={(newUrl) => {
                                  updateQueryParam(index, key, encodeURIComponent(newUrl));
                                }}
                              />
                            </div>
                          )}
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
                        className="w-full bg-white/10 border border-white/20 rounded p-2 text-white font-mono text-xs resize-y focus:outline-none focus:border-lime-400 transition-colors overflow-y-auto placeholder:text-slate-400"
                        style={{ minHeight: '120px' }}
                      />
                    )}

                    {/* 表单模式 */}
                    {bodyEditMode === 'form' && (
                      <div className="bg-white/10 border border-white/20 rounded p-3">
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
      </div>
    </div>
  );
}
