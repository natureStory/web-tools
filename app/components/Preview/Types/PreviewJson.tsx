import { useState } from "react";
import { useNavigate } from "remix";
import { CodeViewer } from "~/components/CodeViewer";
import { CopyTextButton } from "~/components/CopyTextButton";
import { Body } from "~/components/Primitives/Body";
import { PreviewBox } from "../PreviewBox";
import { PreviewJson } from "./preview.types";
import { createFromUrl } from "~/jsonDoc.client";

export function PreviewJson({ preview }: { preview: PreviewJson }) {
  const [hovering, setHovering] = useState(false);
  const navigate = useNavigate();

  const handleOpenInTab = async () => {
    try {
      const doc = await createFromUrl(new URL(preview.url));
      // 在新标签页打开
      window.open(`/j/${doc.id}`, '_blank');
    } catch (error) {
      console.error("创建文档出错:", error);
      alert("创建文档失败");
    }
  };

  const code = JSON.stringify(preview.json, null, 2);

  return (
    <PreviewBox className="relative">
      <div
        className="relative w-full h-full"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <CodeViewer code={code} />
        <div
          className={`absolute top-0 flex justify-end pt-1 pr-1 w-full transition ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
        >
          <CopyTextButton
            value={code}
            className="bg-slate-200 hover:bg-slate-300 h-fit mr-1 px-2 py-0.5 rounded-sm transition dark:text-white dark:bg-slate-700 dark:hover:bg-slate-600"
          ></CopyTextButton>
          <button
            onClick={handleOpenInTab}
            className="bg-slate-200 hover:bg-slate-300 h-fit px-2 py-0.5 rounded-sm transition dark:text-white dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Body>Open in tab</Body>
          </button>
        </div>
      </div>
    </PreviewBox>
  );
}
