import { useState } from "react";
import { useNavigate } from "remix";
import { createFromUrlOrRawJson } from "~/jsonDoc.client";

export type UrlFormProps = {
  className?: string;
};

export function UrlForm({ className }: UrlFormProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isButtonDisabled = !inputValue.length || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue) return;
    
    setIsSubmitting(true);
    
    try {
      const doc = await createFromUrlOrRawJson(inputValue);
      if (doc) {
        navigate(`/j/${doc.id}`);
      } else {
        alert("创建文档失败，请检查输入的内容");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("创建文档出错:", error);
      alert(error instanceof Error ? error.message : "创建文档失败");
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${className}`}
    >
      <div className="flex">
        <input
          type="text"
          name="jsonUrl"
          id="jsonUrl"
          className="block flex-grow text-base text-slate-200 placeholder:text-slate-300 bg-slate-900/40 border border-slate-600 rounded-l-sm py-2 px-3 transition duration-300 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="输入 JSON URL 或粘贴 JSON 内容..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button
          type="submit"
          value="Go"
          className={`inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-r-sm text-white bg-lime-500 transition hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 ${
            isButtonDisabled && "disabled:opacity-50 disabled:hover:bg-lime-500"
          }`}
          disabled={isButtonDisabled}
        >
          {isSubmitting ? "..." : "提交"}
        </button>
      </div>
    </form>
  );
}
