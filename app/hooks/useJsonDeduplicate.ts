import { useMemo, useCallback } from "react";
import { useFetcher } from "remix";
import { useJson } from "./useJson";
import { useJsonDoc } from "./useJsonDoc";
import {
  findDuplicateStrings,
  deduplicateString,
  deduplicateAllStrings,
  DuplicateStringInfo,
} from "~/utilities/deduplicateJsonStrings";

export function useJsonDeduplicate() {
  const [json, setJson] = useJson();
  const { doc } = useJsonDoc();
  const updateDoc = useFetcher();

  // 查找所有重复字符串
  const duplicates = useMemo(() => {
    return findDuplicateStrings(json);
  }, [json]);

  // 为特定字符串去重
  const deduplicateSingle = useCallback(
    (targetValue: string) => {
      const newJson = deduplicateString(json, targetValue);

      // 更新本地状态
      setJson(newJson);

      // 提交到服务器
      const formData = new FormData();
      formData.append("contents", JSON.stringify(newJson, null, 2));

      updateDoc.submit(formData, {
        method: "post",
        action: `/actions/${doc.id}/update`,
      });
    },
    [json, doc.id, updateDoc, setJson]
  );

  // 为所有重复字符串去重
  const deduplicateAll = useCallback(() => {
    const newJson = deduplicateAllStrings(json);

    // 更新本地状态
    setJson(newJson);

    // 提交到服务器
    const formData = new FormData();
    formData.append("contents", JSON.stringify(newJson, null, 2));

    updateDoc.submit(formData, {
      method: "post",
      action: `/actions/${doc.id}/update`,
    });
  }, [json, doc.id, updateDoc, setJson]);

  const isReadOnly = doc.readOnly || doc.type !== "raw";
  const isSaving = updateDoc.state !== "idle";

  return {
    duplicates,
    deduplicateSingle,
    deduplicateAll,
    isReadOnly,
    isSaving,
  };
}
