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
      <div className="flex gap-2">
        <input
          type="text"
          name="jsonUrl"
          id="jsonUrl"
          className="block flex-grow text-base text-white placeholder:text-slate-400 bg-white/10 border border-white/20 rounded-lg py-3 px-4 transition duration-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:bg-white/15"
          placeholder="输入 JSON URL 或粘贴 JSON 内容..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button
          type="submit"
          value="Go"
          className={`inline-flex items-center justify-center px-6 py-3 border border-transparent font-semibold rounded-lg text-slate-900 bg-lime-400 transition-all duration-200 hover:bg-lime-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400 ${
            isButtonDisabled && "disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          disabled={isButtonDisabled}
        >
          {isSubmitting ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "提交"}
        </button>
      </div>
    </form>
  );
}
