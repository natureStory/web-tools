import { useNavigate } from "remix";
import { createFromUrl } from "~/jsonDoc.client";

export function ExampleUrl({
  url,
  title,
  displayTitle,
}: {
  url: string;
  title: string;
  displayTitle?: string;
}) {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const doc = await createFromUrl(new URL(url), title);
      navigate(`/j/${doc.id}`);
    } catch (error) {
      console.error("创建文档出错:", error);
      alert("创建文档失败");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-slate-900 px-4 py-2 rounded-md whitespace-nowrap text-lime-300 transition hover:text-lime-500"
    >
      {displayTitle ?? title}
    </button>
  );
}
