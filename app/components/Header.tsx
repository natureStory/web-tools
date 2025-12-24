import { ShareIcon, PlusIcon, TrashIcon } from "@heroicons/react/outline";
import { DocumentTitle } from "./DocumentTitle";
import { DiscordIconTransparent } from "./Icons/DiscordIconTransparent";
import { EmailIconTransparent } from "./Icons/EmailIconTransparent";
import { GithubStar } from "./UI/GithubStar";
import { Logo } from "./Icons/Logo";
import { Share } from "./Share";
import { NewDocument } from "./NewDocument";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./UI/Popover";
import { useNavigate } from "remix";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { LogoTriggerdotdev } from "./Icons/LogoTriggerdotdev";
import { deleteDocument } from "~/jsonDoc.client";

export function Header() {
  const { doc } = useJsonDoc();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm("确定要永久删除这个文档吗？此操作无法撤销。")) {
      return;
    }

    try {
      await deleteDocument(doc.id);
      navigate("/");
    } catch (error) {
      console.error("删除文档出错:", error);
      alert("删除失败");
    }
  };

  return (
    <header className="flex items-center justify-between w-screen h-[40px] bg-indigo-700 dark:bg-slate-800 border-b-[1px] border-slate-600">
      <div className="flex pl-2 gap-1 sm:gap-1.5 pt-0.5 h-8 justify-center items-center">
        <div className="w-20 sm:w-24">
          <Logo />
        </div>
        {/* <p className="text-slate-300 text-sm font-sans">by</p> */}
        {/* <LogoTriggerdotdev className="w-16 sm:w-20 opacity-80 hover:opacity-100  transition duration-300" /> */}
      </div>
      <DocumentTitle />
      <ol className="flex text-sm items-center gap-2 px-4">
        {!doc.readOnly && (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center py-1 bg-slate-200 text-slate-800 bg-opacity-80 text-base font-bold px-2 rounded uppercase hover:cursor-pointer hover:bg-opacity-100 transition"
          >
            <TrashIcon className="w-4 h-4 mr-0.5"></TrashIcon>
            删除
          </button>
        )}

        <Popover>
          <PopoverTrigger>
            <button className="flex items-center justify-center bg-lime-500 text-slate-800 bg-opacity-90 text-base font-bold px-2 py-1 rounded uppercase hover:cursor-pointer hover:bg-opacity-100 transition">
              <PlusIcon className="w-4 h-4 mr-0.5"></PlusIcon>
              新建
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" sideOffset={8}>
            <NewDocument />
            <PopoverArrow
              className="fill-current text-indigo-700"
              offset={20}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger>
            <button className="flex items-center justify-center py-1 bg-slate-200 text-slate-800 bg-opacity-90 text-base font-bold px-2 rounded uppercase hover:cursor-pointer hover:bg-opacity-100 transition">
              <ShareIcon className="w-4 h-4 mr-1"></ShareIcon>
              分享
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" sideOffset={8}>
            <Share />
            <PopoverArrow
              className="fill-current text-indigo-700"
              offset={20}
            />
          </PopoverContent>
        </Popover>

        {/* <li className="opacity-90 transition hover:cursor-pointer hover:opacity-100">
          <GithubStar />
        </li>
        <li className="opacity-90 transition hover:cursor-pointer hover:opacity-100">
          <a href="https://discord.gg/JtBAxBr2m3" target="_blank">
            <DiscordIconTransparent />
          </a>
        </li> */}
      </ol>
    </header>
  );
}
