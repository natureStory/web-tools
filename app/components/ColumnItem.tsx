import { ChevronRightIcon, PencilIcon } from "@heroicons/react/outline";
import { Mono } from "./Primitives/Mono";
import { memo, useEffect, useMemo, useRef } from "react";
import { ColumnViewNode } from "~/useColumnView";
import { colorForItemAtPath } from "~/utilities/colors";
import { Body } from "./Primitives/Body";
import { useNodeEdit } from "~/hooks/useNodeEdit";
import { JSONHeroPath } from "@jsonhero/path";
import { inferType } from "@jsonhero/json-infer-types";
import { formatValue } from "~/utilities/formatter";

export type ColumnItemProps = {
  item: ColumnViewNode;
  json: unknown;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick?: (id: string) => void;
};

function ColumnItemElement({
  item,
  json,
  isSelected,
  isHighlighted,
  onClick,
}: ColumnItemProps) {
  const htmlElement = useRef<HTMLDivElement>(null);
  const {
    isEditing,
    editValue,
    hasError,
    canEdit,
    isSaving,
    inputRef,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditValue,
    handleKeyDown,
  } = useNodeEdit(item.id);

  const showArrow = item.children.length > 0;

  const stateStyle = useMemo<string>(() => {
    if (isHighlighted) {
      return "bg-slate-300 text-slate-700 hover:bg-slate-400 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[15%] dark:text-slate-100";
    }

    if (isSelected) {
      return "bg-slate-200 hover:bg-slate-300 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[5%] dark:hover:bg-white dark:hover:bg-opacity-[10%] dark:text-slate-200";
    }

    return "hover:bg-slate-100 transition duration-75 ease-out dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:text-slate-400";
  }, [isSelected, isHighlighted]);

  const iconColor = useMemo<string>(
    () => colorForItemAtPath(item.id, json),
    [item.id, json]
  );

  // 动态计算 subtitle，确保显示最新的值
  const subtitle = useMemo<string | undefined>(() => {
    try {
      const path = new JSONHeroPath(item.id);
      const value = path.first(json);
      const info = inferType(value);
      return formatValue(info);
    } catch (e) {
      return item.subtitle;
    }
  }, [item.id, item.subtitle, json]);

  useEffect(() => {
    if (isSelected || isHighlighted) {
      htmlElement.current?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    }
  }, [isSelected, isHighlighted]);

  return (
    <div
      className={`flex h-9 items-center justify-items-stretch mx-1 px-1 py-1 my-1 rounded-sm ${stateStyle} ${isEditing ? 'ring-2 ring-lime-500' : ''}`}
      onClick={() => !isEditing && onClick && onClick(item.id)}
      onDoubleClick={(e) => {
        if (canEdit && !isEditing) {
          e.preventDefault();
          e.stopPropagation();
          startEdit();
        }
      }}
      ref={htmlElement}
    >
      <div className="w-4 flex-none flex-col justify-items-center">
        {item.icon && (
          <item.icon
            className={`h-5 w-5 ${
              isSelected && isHighlighted
                ? "text-slate-900 dark:text-slate-300"
                : "text-slate-500"
            }`}
          />
        )}
      </div>

      <div className="flex flex-grow flex-shrink items-baseline justify-between truncate">
        <Body className="flex-grow flex-shrink-0 pl-3 pr-2 ">{item.title}</Body>
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className={`flex-grow px-2 py-0.5 text-sm rounded border ${
                hasError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-lime-500'
              } focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500`}
              disabled={isSaving}
            />
            {isSaving && (
              <span className="text-xs text-slate-400">保存中...</span>
            )}
            {hasError && (
              <span className="text-xs text-red-500">格式错误</span>
            )}
          </div>
        ) : (
          <>
            {subtitle && (
              <Mono
                className={`truncate pr-1 transition duration-75 ${
                  isHighlighted
                    ? "text-gray-500 dark:text-slate-100"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {subtitle}
              </Mono>
            )}
            {canEdit && isHighlighted && !showArrow && (
              <span 
                title="点击编辑"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startEdit();
                }}
                className="cursor-pointer"
              >
                <PencilIcon
                  className="flex-none w-3 h-3 text-gray-400 ml-1 opacity-60 hover:opacity-100 transition-opacity"
                />
              </span>
            )}
          </>
        )}
      </div>

      {showArrow && !isEditing && (
        <ChevronRightIcon className="flex-none w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

export const ColumnItem = ColumnItemElement;
