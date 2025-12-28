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
      className={`block min-w-[300px] cursor-pointer rounded-lg border-2 border-dashed p-6 text-base transition-all duration-200 ${
        isDragActive
          ? "border-lime-400 bg-lime-500/10 text-lime-300"
          : "border-white/20 bg-white/5 text-slate-300 hover:border-white/40 hover:bg-white/10"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center">
        <ArrowCircleDownIcon
          className={`mr-3 inline h-6 w-6 transition-colors ${
            isDragActive ? "text-lime-400" : "text-slate-400"
          }`}
        />
        <p className="font-medium">
          {isDragActive
            ? "松开以上传文件..."
            : "拖拽 JSON 文件到这里，或点击选择"}
        </p>
      </div>
    </div>
  );
}
