import { useState, useCallback, useRef, useEffect } from "react";
import { useJsonDoc } from "./useJsonDoc";
import { useJson } from "./useJson";
import { JSONHeroPath } from "@jsonhero/path";
import { updateDocument } from "~/jsonDoc.client";

export function useNodeEdit(nodeId: string) {
  const [json, setJson] = useJson();
  const { doc } = useJsonDoc();
  const [isSaving, setIsSaving] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取当前节点的值
  const getCurrentValue = useCallback(() => {
    try {
      const path = new JSONHeroPath(nodeId);
      const value = path.first(json);
      
      // 对象和数组不支持行内编辑
      if (typeof value === "object" && value !== null) {
        return undefined;
      }
      
      if (typeof value === "string") {
        return value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      } else if (value === null) {
        return "null";
      }
      
      return undefined;
    } catch (e) {
      console.error("Error getting current value:", e);
      return undefined;
    }
  }, [nodeId, json]);

  // 开始编辑
  const startEdit = useCallback(() => {
    const currentValue = getCurrentValue();
    if (currentValue === undefined) {
      return; // 不支持编辑复杂类型
    }
    
    setEditValue(currentValue);
    setIsEditing(true);
    setHasError(false);
  }, [getCurrentValue]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
    setHasError(false);
  }, []);

  // 验证并转换值
  const validateAndConvertValue = useCallback((inputValue: string): { valid: boolean; value?: any } => {
    try {
      const path = new JSONHeroPath(nodeId);
      const currentValue = path.first(json);
      const currentType = typeof currentValue;

      // 如果是 null，尝试解析 JSON
      if (currentValue === null) {
        if (inputValue === "null") {
          return { valid: true, value: null };
        }
        // 尝试作为 JSON 解析
        try {
          const parsed = JSON.parse(inputValue);
          return { valid: true, value: parsed };
        } catch (e) {
          // 作为字符串处理
          return { valid: true, value: inputValue };
        }
      }

      // 根据原类型验证和转换
      switch (currentType) {
        case "string":
          return { valid: true, value: inputValue };
        
        case "number":
          const num = Number(inputValue);
          if (isNaN(num)) {
            return { valid: false };
          }
          return { valid: true, value: num };
        
        case "boolean":
          const lowerValue = inputValue.toLowerCase();
          if (lowerValue !== "true" && lowerValue !== "false") {
            return { valid: false };
          }
          return { valid: true, value: lowerValue === "true" };
        
        default:
          return { valid: false };
      }
    } catch (e) {
      return { valid: false };
    }
  }, [nodeId, json]);

  // 保存编辑
  const saveEdit = useCallback(async () => {
    const validation = validateAndConvertValue(editValue);
    
    if (!validation.valid) {
      setHasError(true);
      return;
    }

    try {
      setIsSaving(true);
      
      // 使用函数式更新确保基于最新状态
      const newJson = await new Promise<any>((resolve) => {
        setJson((currentJson: any) => {
          // 创建 JSON 的新副本（深拷贝）
          const updated = JSON.parse(JSON.stringify(currentJson));
          
          // 更新新的 JSON 副本
          const path = new JSONHeroPath(nodeId);
          path.set(updated, validation.value);
          
          resolve(updated);
          return updated;
        });
      });
      
      // 保存到 IndexedDB
      await updateDocument(doc.id, undefined, JSON.stringify(newJson, null, 2));
      
      setIsEditing(false);
      setEditValue("");
      setHasError(false);
    } catch (e) {
      console.error("Save edit error:", e);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, nodeId, doc.id, setJson, validateAndConvertValue]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const isReadOnly = doc.readOnly || doc.type !== "raw";
  const canEdit = !isReadOnly && getCurrentValue() !== undefined;

  return {
    isEditing,
    editValue,
    hasError,
    canEdit,
    isSaving,
    inputRef,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditValue,
    handleKeyDown,
  };
}
