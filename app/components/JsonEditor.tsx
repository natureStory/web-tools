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
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { match } from "ts-pattern";
import { updateDocument } from "~/jsonDoc.client";

export function JsonEditor() {
  const [json, setJson] = useJson();
  const { doc } = useJsonDoc();
  const { selectedNodeId } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const [preferences] = usePreferences();
  const [isSavingState, setIsSavingState] = useState(false);

  const jsonMapped = useMemo(() => {
    return jsonMap.stringify(json, null, preferences?.indent || 2);
  }, [json, preferences]);

  const [editedContent, setEditedContent] = useState(jsonMapped.json);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setEditedContent(jsonMapped.json);
    setHasError(false);
  }, [jsonMapped.json]);

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

  const handleSave = useCallback(async () => {
    if (hasError) {
      return;
    }

    setIsSavingState(true);
    try {
      // 保存到 IndexedDB
      await updateDocument(doc.id, undefined, editedContent);
      
      // 更新本地 JSON 状态
      try {
        const newJson = JSON.parse(editedContent);
        setJson(newJson);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      alert("保存失败");
    } finally {
      setIsSavingState(false);
    }
  }, [editedContent, hasError, doc.id, setJson]);

  const handleReset = useCallback(() => {
    setEditedContent(jsonMapped.json);
    setHasError(false);
  }, [jsonMapped.json]);

  const isChanged = editedContent !== jsonMapped.json;
  const isReadOnly = doc.readOnly || doc.type !== "raw";
  const isSaving = isSavingState;

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
