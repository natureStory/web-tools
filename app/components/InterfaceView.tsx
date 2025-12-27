import { javascript } from "@codemirror/lang-javascript";
import { useCodeMirror, ViewUpdate } from "@uiw/react-codemirror";
import { EditorState } from "@codemirror/state";
import { useJson } from "~/hooks/useJson";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getEditorSetup } from "~/utilities/codeMirrorSetup";
import { darkTheme, lightTheme } from "~/utilities/codeMirrorTheme";
import { useTheme } from "./ThemeProvider";
import { useJsonColumnViewAPI } from "~/hooks/useJsonColumnView";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { useHotkeys } from "react-hotkeys-hook";

type PathMapping = {
  lineNumber: number;
  path: string;
  propertyName: string;
};

type PropertyInfo = {
  path: string;
  propertyName: string;
};

function jsonToSingleInterface(obj: any, indent = 2): { code: string; pathMappings: PathMapping[] } {
  const propertyInfos: PropertyInfo[] = [];
  
  function getType(value: any, depth: number, currentPath: string): string {
    const currentSpaces = " ".repeat(indent * depth);
    const nextSpaces = " ".repeat(indent * (depth + 1));
    
    if (value === null) {
      return "null";
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "any[]";
      }
      
      const firstItem = value[0];
      if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
        const arrayPath = currentPath ? `${currentPath}.0` : "0";
        const objType = getType(firstItem, depth, arrayPath);
        return `${objType}[]`;
      } else {
        const types = new Set(value.map((v: any) => getType(v, depth, currentPath)));
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
        const propPath = currentPath ? `${currentPath}.${key}` : key;
        const safePropName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        
        // 记录属性信息
        propertyInfos.push({
          path: `$.${propPath}`,
          propertyName: safePropName.replace(/"/g, ''),
        });
        
        const propType = getType(value[key], depth + 1, propPath);
        
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
    const interfaceBody = getType(obj, 1, "");
    let code: string;
    
    if (interfaceBody.startsWith("{")) {
      code = `interface RootInterface ${interfaceBody}`;
    } else {
      code = `type RootInterface = ${interfaceBody};`;
    }
    
    // 解析代码，建立行号到路径的映射
    const pathMappings: PathMapping[] = [];
    const lines = code.split('\n');
    let propertyIndex = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':') && propertyIndex < propertyInfos.length) {
        const match = trimmed.match(/^["']?(\w+)["']?\s*:/);
        if (match) {
          const propName = match[1];
          const info = propertyInfos[propertyIndex];
          
          if (info.propertyName === propName) {
            pathMappings.push({
              lineNumber: index + 1,
              path: info.path,
              propertyName: propName,
            });
            propertyIndex++;
          }
        }
      }
    });
    
    return { code, pathMappings };
  } catch (error) {
    return {
      code: `// 生成 Interface 时出错\n// ${error}`,
      pathMappings: [],
    };
  }
}

export function InterfaceView() {
  const [json] = useJson();
  const { goToNodeId } = useJsonColumnViewAPI();
  const { minimal } = useJsonDoc();
  const editor = useRef(null);
  const [theme] = useTheme();

  const { code: interfaceCode, pathMappings } = useMemo(() => {
    try {
      return jsonToSingleInterface(json);
    } catch (error) {
      console.error("Failed to generate interface:", error);
      return {
        code: `// 生成 Interface 时出错\n// ${error}`,
        pathMappings: [],
      };
    }
  }, [json]);

  const currentSelectedLine = useRef<number | undefined>(undefined);

  const onUpdate = useCallback(
    (update: ViewUpdate) => {
      if (!update.selectionSet) {
        return;
      }

      const range = update.state.selection.ranges[0];
      const line = update.state.doc.lineAt(range.anchor);

      if (
        currentSelectedLine.current &&
        currentSelectedLine.current === line.number
      ) {
        return;
      }

      currentSelectedLine.current = line.number;

      // 查找该行对应的路径
      const mapping = pathMappings.find(m => m.lineNumber === line.number);
      
      if (mapping) {
        goToNodeId(mapping.path, "interface");
      }
    },
    [goToNodeId, pathMappings]
  );

  const extensions = useMemo(() => {
    const setup = getEditorSetup();
    setup.push(javascript({ typescript: true }));
    
    // 添加只读扩展，但保留选择功能
    setup.push(EditorState.readOnly.of(true));
    
    return setup;
  }, []);

  const { setContainer } = useCodeMirror({
    container: editor.current,
    extensions,
    value: interfaceCode,
    editable: true,
    autoFocus: false,
    basicSetup: false,
    theme: theme === "light" ? lightTheme() : darkTheme(),
    onUpdate,
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current, setContainer]);

  // 禁用 Command+R 刷新快捷键
  useHotkeys(
    "meta+r,ctrl+r",
    (e) => {
      e.preventDefault();
    },
    { enableOnTags: ["INPUT", "TEXTAREA", "SELECT"] }
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`${
        minimal ? "h-jsonViewerHeightMinimal" : "h-jsonViewerHeight"
      } overflow-y-auto no-scrollbar`} ref={editor} />
    </div>
  );
}
