import { useMemo, useCallback, useState } from "react";
import { useJson } from "./useJson";
import { useJsonDoc } from "./useJsonDoc";
import {
  findDuplicateStrings,
  deduplicateString,
  deduplicateAllStrings,
  DuplicateStringInfo,
} from "~/utilities/deduplicateJsonStrings";
import { updateDocument } from "~/jsonDoc.client";

export function useJsonDeduplicate() {
  const [json, setJson] = useJson();
  const { doc } = useJsonDoc();
  const [isSaving, setIsSaving] = useState(false);

  // 查找所有重复字符串
  const duplicates = useMemo(() => {
    return findDuplicateStrings(json);
  }, [json]);

  // 为特定字符串去重
  const deduplicateSingle = useCallback(
    async (targetValue: string) => {
      const newJson = deduplicateString(json, targetValue);

      // 更新本地状态
      setJson(newJson);

      // 保存到 IndexedDB
      setIsSaving(true);
      try {
        await updateDocument(doc.id, undefined, JSON.stringify(newJson, null, 2));
      } catch (error) {
        console.error("Failed to update document:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [json, doc.id, setJson]
  );

  // 为所有重复字符串去重
  const deduplicateAll = useCallback(async () => {
    const newJson = deduplicateAllStrings(json);

    // 更新本地状态
    setJson(newJson);

    // 保存到 IndexedDB
    setIsSaving(true);
    try {
      await updateDocument(doc.id, undefined, JSON.stringify(newJson, null, 2));
    } catch (error) {
      console.error("Failed to update document:", error);
    } finally {
      setIsSaving(false);
    }
  }, [json, doc.id, setJson]);

  const isReadOnly = doc.readOnly || doc.type !== "raw";

  return {
    duplicates,
    deduplicateSingle,
    deduplicateAll,
    isReadOnly,
    isSaving,
  };
}
