import { useJsonDeduplicate } from "~/hooks/useJsonDeduplicate";
import {
  ExclamationIcon,
  DuplicateIcon,
  CheckCircleIcon,
} from "@heroicons/react/outline";
import { EscapeKeyIcon } from "./Icons/EscapeKeyIcon";
import { ArrowKeysUpDownIcon } from "./Icons/ArrowKeysUpDownIcon";
import { LoadingIcon } from "./Icons/LoadingIcon";
import { Body } from "./Primitives/Body";
import { ShortcutIcon } from "./Icons/ShortcutIcon";
import { Mono } from "./Primitives/Mono";
import { useCombobox } from "downshift";
import classnames from "~/utilities/classnames";
import { useRef, useCallback, useState } from "react";
import { useVirtual } from "react-virtual";
import { truncate } from "lodash-es";
import { useHotkeys } from "react-hotkeys-hook";
import { DuplicateStringInfo } from "~/utilities/deduplicateJsonStrings";
import { JSONHeroPath } from "@jsonhero/path";
import { useJson } from "~/hooks/useJson";
import { iconForValue } from "~/utilities/icons";

export function DeduplicatePalette({ onClose }: { onClose?: () => void }) {
  const { duplicates, deduplicateSingle, deduplicateAll, isReadOnly, isSaving } =
    useJsonDeduplicate();
  const [searchQuery, setSearchQuery] = useState("");

  useHotkeys(
    "esc",
    (e) => {
      e.preventDefault();
      onClose?.();
    },
    [onClose]
  );

  const listRef = useRef<HTMLElement>(null);

  // 过滤重复项
  const filteredDuplicates = duplicates.filter((dup) =>
    dup.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowVirtualizer = useVirtual({
    size: filteredDuplicates.length,
    parentRef: listRef,
    estimateSize: useCallback(() => 90, []),
    overscan: 5,
  });

  const cb = useCombobox({
    items: filteredDuplicates,
    circularNavigation: false,
    scrollIntoView: () => {},
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && !isReadOnly && !isSaving) {
        deduplicateSingle(selectedItem.value);
        onClose?.();
      }
    },
    onHighlightedIndexChange: ({ highlightedIndex }) =>
      highlightedIndex !== undefined &&
      rowVirtualizer.scrollToIndex(highlightedIndex),
    onInputValueChange: ({ inputValue }) => setSearchQuery(inputValue ?? ""),
  });

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && onClose && cb.inputValue.length === 0) {
        onClose?.();
      }
    },
    [onClose, cb.inputValue]
  );

  const handleDeduplicateAll = useCallback(() => {
    if (!isReadOnly && !isSaving) {
      deduplicateAll();
      onClose?.();
    }
  }, [deduplicateAll, isReadOnly, isSaving, onClose]);

  return (
    <>
      <div
        {...cb.getComboboxProps()}
        className="max-h-[70vh] px-4 pt-4 overflow-hidden"
      >
        <label
          {...cb.getLabelProps()}
          className="relative text-slate-400 focus-within:text-slate-600 block"
        >
          <DuplicateIcon className="absolute w-7 h-7 top-1/2 transform -translate-y-1/2 left-3 text-slate-700 transition dark:text-white pointer-events-none" />
          <input
            {...cb.getInputProps({ onKeyDown: handleInputKeyDown })}
            type="text"
            spellCheck="false"
            placeholder="筛选重复项…"
            className="w-full pl-12 pr-12 py-4 rounded-sm text-slate-900 bg-slate-100 text-2xl caret-indigo-700 border-indigo-700 transition dark:text-white dark:bg-slate-900 focus:outline-none focus:ring focus:ring-indigo-700"
            disabled={isReadOnly}
          />
        </label>

        <div className="flex flex-col mt-4 mb-2">
          <div className="flex justify-between items-center">
            <div className="results flex">
              {duplicates.length === 0 ? (
                <div className="results-none flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-1 text-green-500"></CheckCircleIcon>
                  <Body className="text-slate-400">没有重复的字符串</Body>
                </div>
              ) : (
                <div className="results-returned">
                  <Body className="text-slate-400">
                    {filteredDuplicates.length === 0
                      ? "没有匹配的结果"
                      : filteredDuplicates.length === 1
                      ? "1 个重复项"
                      : `${filteredDuplicates.length} 个重复项`}
                  </Body>
                </div>
              )}
            </div>
            {duplicates.length > 0 && !isReadOnly && (
              <button
                onClick={handleDeduplicateAll}
                disabled={isSaving}
                className={classnames(
                  "px-3 py-1 rounded text-sm font-medium transition",
                  isSaving
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                )}
              >
                {isSaving ? "处理中..." : "全部去重"}
              </button>
            )}
          </div>
        </div>

        <ul
          {...cb.getMenuProps({ ref: listRef })}
          className="w-full max-h-[calc(70vh-140px)] overflow-y-auto relative"
        >
          <li
            key="total-size"
            style={{ height: rowVirtualizer.totalSize }}
            className="mb-[1rem]"
          />
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const duplicate = filteredDuplicates[virtualRow.index];

            return (
              <DuplicateItem
                key={`${duplicate.value}-${virtualRow.index}`}
                itemProps={cb.getItemProps({
                  item: duplicate,
                  index: virtualRow.index,
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  },
                })}
                duplicate={duplicate}
                isHighlighted={virtualRow.index === cb.highlightedIndex}
                isReadOnly={isReadOnly}
                isSaving={isSaving}
              />
            );
          })}
        </ul>
      </div>
      <div className="flex items-center w-full gap-4 px-3 py-2 border-t-[1px] bg-slate-100 border-slate-200 rounded-br-lg rounded-bl-lg transition dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <ShortcutIcon className="w-4 h-4 text-sm text-slate-900 bg-slate-300 transition duration-75 group-hover:bg-slate-100 dark:bg-slate-500 dark:group-hover:bg-slate-600">
            ⏎
          </ShortcutIcon>
          <Body className="text-slate-700 dakr:text-slate-500">
            {isReadOnly ? "查看" : "去重选中项"}
          </Body>
        </div>
        <div className="flex items-center gap-1">
          <ArrowKeysUpDownIcon className="transition text-slate-300 dark:text-slate-500" />
          <Body className="text-slate-700 dakr:text-slate-500">
            移动选中节点
          </Body>
        </div>
        <div className="flex items-center gap-1">
          <EscapeKeyIcon className="transition text-slate-300 dark:text-slate-500" />
          <Body className="text-slate-700 dakr:text-slate-500">关闭</Body>
        </div>
      </div>
    </>
  );
}

type DuplicateItemProps = {
  itemProps: React.HTMLAttributes<HTMLLIElement>;
  duplicate: DuplicateStringInfo;
  isHighlighted: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
};

function DuplicateItem({
  itemProps,
  duplicate,
  isHighlighted,
  isReadOnly,
  isSaving,
}: DuplicateItemProps) {
  const [json] = useJson();

  return (
    <li
      {...itemProps}
      className={classnames(
        "flex w-full",
        !isReadOnly && !isSaving ? "hover:cursor-pointer" : ""
      )}
    >
      <div
        className={classnames(
          "w-full h-[calc(100%-4px)] mb-2 rounded-sm p-3",
          isHighlighted
            ? "bg-indigo-700"
            : "bg-slate-100 dark:bg-slate-900",
          isReadOnly ? "opacity-60" : ""
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Mono
              className={classnames(
                "text-base font-medium break-all",
                isHighlighted
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              )}
            >
              "{truncate(duplicate.value, { length: 80 })}"
            </Mono>
          </div>
          <div
            className={classnames(
              "ml-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
              isHighlighted
                ? "bg-white/20 text-white"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
            )}
          >
            {duplicate.count} 次
          </div>
        </div>
        <div className="space-y-1">
          {duplicate.paths.slice(0, 3).map((path, idx) => {
            const heroPath = new JSONHeroPath(path);
            const value = heroPath.first(json);
            const ItemIcon = iconForValue(value);

            return (
              <div key={idx} className="flex items-center gap-2">
                <ItemIcon
                  className={classnames(
                    "h-4 w-4 flex-shrink-0",
                    isHighlighted
                      ? "text-white/80"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                />
                <Mono
                  className={classnames(
                    "text-xs truncate",
                    isHighlighted
                      ? "text-white/90"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {path}
                </Mono>
              </div>
            );
          })}
          {duplicate.paths.length > 3 && (
            <Body
              className={classnames(
                "text-xs ml-6",
                isHighlighted
                  ? "text-white/80"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              还有 {duplicate.paths.length - 3} 个位置...
            </Body>
          )}
        </div>
      </div>
    </li>
  );
}
