import { ArrowCircleDownIcon } from "@heroicons/react/outline";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "remix";
import { createFromRawJson } from "~/jsonDoc.client";

export function DragAndDropForm() {
  const navigate = useNavigate();

  const onDrop = useCallback(
    async (acceptedFiles: Array<File>) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const firstFile = acceptedFiles[0];

      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = async () => {
        if (reader.result == null) {
          return;
        }

        let jsonValue: string | undefined = undefined;

        if (typeof reader.result === "string") {
          jsonValue = reader.result;
        } else {
          const decoder = new TextDecoder("utf-8");
          jsonValue = decoder.decode(reader.result);
        }

        if (!jsonValue) {
          alert("无法读取文件内容");
          return;
        }

        try {
          const doc = await createFromRawJson(firstFile.name, jsonValue);
          navigate(`/j/${doc.id}`);
        } catch (error) {
          console.error("创建文档出错:", error);
          alert(error instanceof Error ? error.message : "创建文档失败");
        }
      };
      reader.readAsArrayBuffer(firstFile);
    },
    [navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: onDrop,
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1,
    multiple: false,
    accept: "application/json",
  });

  return (
    <div
      {...getRootProps()}
      className="block min-w-[300px] cursor-pointer rounded-md border-2 border-dashed border-slate-600 bg-slate-900/40 p-4 text-base text-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
    >
      <input {...getInputProps()} />
      <div className="flex items-center">
        <ArrowCircleDownIcon
          className={`mr-3 inline h-6 w-6 ${
            isDragActive ? "text-lime-500" : ""
          }`}
        />
        <p className={`${isDragActive ? "text-lime-500" : ""}`}>
          {isDragActive
            ? "现在拖拽打开它…"
            : "拖拽 JSON 文件到这里, 或点击选择"}
        </p>
      </div>
    </div>
  );
}
