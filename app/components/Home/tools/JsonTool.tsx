import { NewFile } from "~/components/NewFile";
import { SavedDocumentsList } from "../SavedDocumentsList";

export function JsonTool() {
  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <NewFile />
      </div>

      {/* 最近文档列表 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <SavedDocumentsList />
      </div>
    </div>
  );
}

