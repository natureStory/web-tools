import { json as jsonLang } from "@codemirror/lang-json";
import {
  EditorView,
  TransactionSpec,
  useCodeMirror,
  ViewUpdate,
} from "@uiw/react-codemirror";
import { useRef, useEffect } from "react";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { getEditorSetup } from "~/utilities/codeMirrorSetup";
import { darkTheme, lightTheme } from "~/utilities/codeMirrorTheme";
import { useTheme } from "./ThemeProvider";
import { useHotkeys } from "react-hotkeys-hook";

export type CodeEditorProps = {
  content: string;
  language?: "json";
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onUpdate?: (update: ViewUpdate) => void;
  selection?: { start: number; end: number };
};

const languages = {
  json: jsonLang,
};

type CodeEditorDefaultProps = Required<
  Omit<CodeEditorProps, "content" | "onChange" | "onUpdate">
>;

const defaultProps: CodeEditorDefaultProps = {
  language: "json",
  readOnly: true,
  selection: { start: 0, end: 0 },
};

export function CodeEditor(opts: CodeEditorProps) {
  const { content, language, readOnly, onChange, onUpdate, selection } = {
    ...defaultProps,
    ...opts,
  };

  const [theme] = useTheme();

  const extensions = getEditorSetup();

  const languageExtension = languages[language];

  extensions.push(languageExtension());

  const editor = useRef(null);
  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    extensions,
    editable: !readOnly,
    contentEditable: !readOnly,
    value: content,
    autoFocus: false,
    theme: theme === "light" ? lightTheme() : darkTheme(),
    indentWithTab: false,
    basicSetup: false,
    onChange,
    onUpdate,
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  // 跟踪上次选择的位置，当 selection 改变时才更新
  const previousSelectionRef = useRef<{ start: number; end: number } | undefined>(undefined);

  useEffect(() => {
    if (!view || !state) {
      return;
    }

    const selectionStart = selection?.start ?? defaultProps.selection.start;
    const selectionEnd = selection?.end ?? defaultProps.selection.end;

    // 检查 selection 是否真的改变了
    const hasChanged = 
      !previousSelectionRef.current ||
      previousSelectionRef.current.start !== selectionStart ||
      previousSelectionRef.current.end !== selectionEnd;

    if (hasChanged) {
      previousSelectionRef.current = { start: selectionStart, end: selectionEnd };

      const transactionSpec: TransactionSpec = {
        selection: { anchor: selectionStart, head: selectionEnd },
        effects: EditorView.scrollIntoView(selectionStart, {
          y: "start",
          yMargin: 100,
        }),
      };

      view.dispatch(transactionSpec);
    }
  }, [selection, view, state]);

  const { minimal } = useJsonDoc();

  useHotkeys(
   "ctrl+a,meta+a,command+a",
   (e) => {
     e.preventDefault();
     view?.dispatch({ selection: { anchor: 0, head: state?.doc.length } });
   },
   [view, state]
 );


  return (
    <div>
      <div
        className={`${
          minimal ? "h-jsonViewerHeightMinimal" : "h-jsonViewerHeight"
        } overflow-y-auto no-scrollbar`}
        ref={editor}
      />
    </div>
  );
}
