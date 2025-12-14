import { JSONHeroPath } from "@jsonhero/path";

export type DuplicateStringInfo = {
  value: string;
  count: number;
  paths: string[]; // JSONHeroPath 格式的路径数组
};

/**
 * 收集 JSON 中所有字符串及其路径
 */
function collectStrings(
  data: unknown,
  currentPath: string,
  collector: Map<string, string[]>
): void {
  if (typeof data === "string") {
    const existing = collector.get(data) || [];
    existing.push(currentPath);
    collector.set(data, existing);
    return;
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      collectStrings(item, `${currentPath}[${index}]`, collector);
    });
    return;
  }

  if (typeof data === "object" && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      collectStrings(value, `${currentPath}.${key}`, collector);
    });
    return;
  }
}

/**
 * 查找所有重复的字符串
 */
export function findDuplicateStrings(json: unknown): DuplicateStringInfo[] {
  const collector = new Map<string, string[]>();
  collectStrings(json, "$", collector);

  const duplicates: DuplicateStringInfo[] = [];

  collector.forEach((paths, value) => {
    if (paths.length > 1) {
      duplicates.push({
        value,
        count: paths.length,
        paths,
      });
    }
  });

  // 按出现次数降序排序
  return duplicates.sort((a, b) => b.count - a.count);
}

/**
 * 根据路径设置值（支持数组和对象）
 */
function setValueByPath(obj: any, pathStr: string, value: any): void {
  // 去掉开头的 $. 或 $
  const cleanPath = pathStr.replace(/^\$\.?/, "");
  if (!cleanPath) {
    return; // 根路径无法设置
  }

  // 解析路径
  const parts: Array<string | number> = [];
  let current = "";
  let inBracket = false;

  for (let i = 0; i < cleanPath.length; i++) {
    const char = cleanPath[i];

    if (char === "[") {
      if (current) {
        parts.push(current);
        current = "";
      }
      inBracket = true;
    } else if (char === "]") {
      if (inBracket && current) {
        parts.push(parseInt(current, 10));
        current = "";
      }
      inBracket = false;
    } else if (char === "." && !inBracket) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  // 遍历到倒数第二个部分
  let target = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    target = target[parts[i]];
  }

  // 设置最后一个部分的值
  const lastPart = parts[parts.length - 1];
  target[lastPart] = value;
}

/**
 * 为特定字符串的所有出现位置添加编号
 */
export function deduplicateString(
  json: unknown,
  targetValue: string
): unknown {
  // 深拷贝 JSON
  const newJson = JSON.parse(JSON.stringify(json));

  // 找到所有该字符串的路径
  const collector = new Map<string, string[]>();
  collectStrings(json, "$", collector);

  const paths = collector.get(targetValue);
  if (!paths || paths.length <= 1) {
    return newJson; // 没有重复，不需要处理
  }

  // 为每个路径添加编号
  paths.forEach((pathStr, index) => {
    const paddedNumber = String(index + 1).padStart(3, "0");
    const newValue = `${targetValue} - ${paddedNumber}`;
    setValueByPath(newJson, pathStr, newValue);
  });

  return newJson;
}

/**
 * 为所有重复字符串添加编号
 */
export function deduplicateAllStrings(json: unknown): unknown {
  let newJson = JSON.parse(JSON.stringify(json));

  const duplicates = findDuplicateStrings(json);

  duplicates.forEach((duplicate) => {
    newJson = deduplicateString(newJson, duplicate.value);
  });

  return newJson;
}
