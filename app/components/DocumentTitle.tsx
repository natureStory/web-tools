import { PencilAltIcon } from "@heroicons/react/outline";
import { useRef, useState } from "react";
import { match } from "ts-pattern";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { updateDocument } from "~/jsonDoc.client";

export function DocumentTitle() {
  const { doc } = useJsonDoc();
  const [editedTitle, setEditedTitle] = useState(doc.title);
  const [isSaving, setIsSaving] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editedTitle === doc.title || !editedTitle) return;
    
    setIsSaving(true);
    
    try {
      await updateDocument(doc.id, editedTitle);
      ref.current?.blur();
      // 更新成功后，需要重新加载页面以获取最新数据
      window.location.reload();
    } catch (error) {
      console.error("更新标题出错:", error);
      alert(error instanceof Error ? error.message : "更新失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (doc.readOnly) {
    return (
      <div
        className="flex justify-center items-center w-full"
        title={doc.title}
      >
        <span
          className={
            "min-w-[15vw] border-none text-ellipsis text-slate-300 px-2 pl-10 py-1 rounded-sm bg-transparent placeholder:text-slate-400 focus:bg-black/30 focus:outline-none focus:border-none hover:cursor-text transition dark:bg-transparent dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:bg-black dark:focus:bg-opacity-10"
          }
        >
          {doc.title}
        </span>
      </div>
    );
  } else {
    return (
      <form onSubmit={handleSubmit}>
        <div
          className="flex justify-center items-center w-full"
          title={doc.title}
        >
          <label className="relative block group">
            <PencilAltIcon className="h-5 w-5 absolute top-1/2 transform -translate-y-1/2 left-3 text-white opacity-0 transition pointer-events-none group-hover:opacity-80 group-focus:opacity-80" />
            <input
              ref={ref}
              className={
                "min-w-[15vw] border-none text-ellipsis text-slate-300 px-2 pl-10 py-1 rounded-sm bg-transparent placeholder:text-slate-400 focus:bg-black/30 focus:outline-none focus:border-none hover:bg-black hover:bg-opacity-30 hover:cursor-text transition dark:bg-transparent dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:bg-black dark:focus:bg-opacity-10 dark:hover:bg-black dark:hover:bg-opacity-10"
              }
              type="text"
              name="title"
              spellCheck="false"
              placeholder="Name your JSON file"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={isSaving}
            />
          </label>

          {match(editedTitle)
            .with(doc.title, () => (
              <p className="ml-2 text-transparent">Save</p>
            ))
            .with("", () => (
              <button
                type="button"
                className="ml-2 text-lime-500 hover:text-lime-600 transition"
                onClick={() => setEditedTitle(doc.title)}
              >
                Reset
              </button>
            ))
            .otherwise(() => (
              <button
                type="submit"
                className="ml-2 text-lime-500 hover:text-lime-600 transition"
                disabled={isSaving}
              >
                {isSaving ? "..." : "Save"}
              </button>
            ))}
        </div>
      </form>
    );
  }
}
