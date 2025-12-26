import { CodeViewer } from "./CodeViewer";
import { useJson } from "~/hooks/useJson";
import { useMemo } from "react";

function jsonToSingleInterface(obj: any, indent = 2): string {
  const spaces = " ".repeat(indent);
  
  function getType(value: any, depth: number): string {
    const currentSpaces = " ".repeat(indent * depth);
    const nextSpaces = " ".repeat(indent * (depth + 1));
    
    if (value === null) {
      return "null";
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "any[]";
      }
      
      // 检查数组元素类型
      const firstItem = value[0];
      if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
        // 对象数组，生成内联接口
        const objType = getType(firstItem, depth);
        return `${objType}[]`;
      } else {
        // 基本类型数组
        const types = new Set(value.map((v: any) => getType(v, depth)));
        if (types.size === 1) {
          return `${Array.from(types)[0]}[]`;
        }
        return `(${Array.from(types).join(" | ")})[]`;
      }
    }
    
    if (typeof value === "object") {
      const properties = Object.keys(value);
      if (properties.length === 0) {
        return "{}";
      }
      
      const props = properties.map(key => {
        const propType = getType(value[key], depth + 1);
        const safePropName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        return `${nextSpaces}${safePropName}: ${propType};`;
      }).join("\n");
      
      return `{\n${props}\n${currentSpaces}}`;
    }
    
    switch (typeof value) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "undefined":
        return "undefined";
      default:
        return "any";
    }
  }
  
  try {
    const interfaceBody = getType(obj, 1);
    
    // 如果是对象，格式化为接口
    if (interfaceBody.startsWith("{")) {
      return `interface RootInterface ${interfaceBody}`;
    }
    
    // 如果是其他类型，用 type 别名
    return `type RootInterface = ${interfaceBody};`;
  } catch (error) {
    return `// 生成 Interface 时出错\n// ${error}`;
  }
}

export function InterfaceView() {
  const [json] = useJson();

  const interfaceCode = useMemo(() => {
    try {
      return jsonToSingleInterface(json);
    } catch (error) {
      console.error("Failed to generate interface:", error);
      return `// 生成 Interface 时出错\n// ${error}`;
    }
  }, [json]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <CodeViewer code={interfaceCode} lang="typescript" />
      </div>
    </div>
  );
}

