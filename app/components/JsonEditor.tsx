import { CodeEditor } from "./CodeEditor";
import { useJson } from "~/hooks/useJson";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { ViewUpdate } from "@uiw/react-codemirror";
import jsonMap from "json-source-map";
import { JSONHeroPath } from "@jsonhero/path";
import {usePreferences} from '~/components/PreferencesProvider'
import { useFetcher } from "remix";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { match } from "ts-pattern";

export function JsonEditor() {
  const [json, setJson] = useJson();
  const { doc } = useJsonDoc();
  const { selectedNodeId } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const [preferences] = usePreferences();
  const updateDoc = useFetcher();

  const jsonMapped = useMemo(() => {
    return jsonMap.stringify(json, null, preferences?.indent || 2);
  }, [json, preferences]);

  const [editedContent, setEditedContent] = useState(jsonMapped.json);
  const [hasError, setHasError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // 记录上次提交的内容，用于判断是否刚提交完成
  const lastSubmittedContent = useRef<string | null>(null);

  useEffect(() => {
    setEditedContent(jsonMapped.json);
    setHasError(false);
    // 当内容同步完成后，清除同步状态和提交记录
    if (isSyncing) {
      setIsSyncing(false);
      lastSubmittedContent.current = null;
    }
  }, [jsonMapped.json]);

  useEffect(() => {
    if (updateDoc.type === "done" && updateDoc.data && !updateDoc.data.error) {
      // 标记正在同步数据
      setIsSyncing(true);
      // 更新成功，更新本地 JSON
      if (doc.type === "raw" && updateDoc.data.contents) {
        try {
          const newJson = JSON.parse(updateDoc.data.contents);
          setJson(newJson);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [updateDoc, doc.type, setJson]);

  const selection = useMemo<{ start: number; end: number } | undefined>(() => {
    if (!selectedNodeId) {
      return;
    }

    const path = new JSONHeroPath(selectedNodeId);
    const pointer = path.jsonPointer();

    const location = jsonMapped.pointers[pointer];

    if (location) {
      if (location.key) {
        return { start: location.key.pos, end: location.valueEnd.pos };
      }

      return { start: location.value.pos, end: location.valueEnd.pos };
    }
  }, [selectedNodeId, jsonMapped]);

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

      // Find the key if the selected line using jsonMapped.pointers
      const pointerEntry = Object.entries(jsonMapped.pointers).find(
        ([pointer, info]) => {
          return info.value.line === line.number - 1;
        }
      );

      if (!pointerEntry) {
        return;
      }

      const [pointer] = pointerEntry;

      const path = JSONHeroPath.fromPointer(pointer);

      goToNodeId(path.toString(), "editor");
    },
    [goToNodeId, jsonMapped.pointers]
  );

  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value);
    // 验证 JSON 格式
    try {
      JSON.parse(value);
      setHasError(false);
    } catch (e) {
      setHasError(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (hasError) {
      return;
    }

    // 记录本次提交的内容
    lastSubmittedContent.current = editedContent;

    const formData = new FormData();
    formData.append("contents", editedContent);

    updateDoc.submit(formData, {
      method: "post",
      action: `/actions/${doc.id}/update`,
    });
  }, [editedContent, hasError, doc.id, updateDoc]);

  const handleReset = useCallback(() => {
    setEditedContent(jsonMapped.json);
    setHasError(false);
  }, [jsonMapped.json]);

  const isChanged = editedContent !== jsonMapped.json;
  const isReadOnly = doc.readOnly || doc.type !== "raw";
  // 检查是否正在保存：
  // 1. state 不是 idle（正在提交）
  // 2. isSyncing（正在同步数据）
  // 3. 刚保存完成还未同步（type 是 done 且服务器返回的内容是上次提交的内容）
  const isSaving = 
    updateDoc.state !== "idle" || 
    isSyncing || 
    (updateDoc.type === "done" && lastSubmittedContent.current !== null && 
     updateDoc.data?.contents === lastSubmittedContent.current);

  return (
    <div className="flex flex-col h-full">
      {!isReadOnly && (
        <div className="flex justify-end items-center gap-2 px-4 py-2 bg-slate-100 border-b border-slate-300 transition dark:bg-slate-800 dark:border-slate-600">
          {match({ isChanged, hasError, isSaving })
            .with({ isSaving: true }, () => (
              <span className="text-sm text-slate-500">保存中...</span>
            ))
            .with({ hasError: true }, () => (
              <>
                <span className="text-sm text-red-500">JSON 格式错误</span>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition dark:text-slate-300 dark:hover:text-slate-100"
                >
                  重置
                </button>
              </>
            ))
            .with({ isChanged: false }, () => (
              <span className="text-sm text-slate-400">已保存</span>
            ))
            .otherwise(() => (
              <>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition dark:text-slate-300 dark:hover:text-slate-100"
                >
                  重置
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-lime-500 text-white rounded hover:bg-lime-600 transition"
                >
                  保存
                </button>
              </>
            ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          language="json"
          content={editedContent}
          readOnly={isReadOnly}
          onUpdate={onUpdate}
          selection={selection}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
