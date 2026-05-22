import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { cn } from "@shared/lib/utils";
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from "lexical";
import { useCallback, useRef } from "react";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";

interface RichTextEditorProps {
  /** HTML string. Parsed once on mount — pass a new `key` prop to reset. */
  value?: string;
  /** Emitted as an HTML string whenever the editor content changes. */
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Lexical-based rich-text editor. Reads initial value as HTML, emits HTML
 * via `onChange` so the whole thing drops into a React Hook Form field
 * without a serialization layer on either side.
 *
 * **Reset semantics:** Lexical initializes from `value` once per mount. To
 * reset the editor (e.g. a form reset on Edit open), remount the component
 * with a new `key` — this is simpler than maintaining a bidirectional sync
 * that can race with its own emissions.
 */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Start typing…",
  disabled = false,
  "aria-invalid": ariaInvalid,
  id,
  name,
  className,
}: RichTextEditorProps) {
  const initialValueRef = useRef(value);
  const lastEmittedHtmlRef = useRef<string | undefined>(value);

  const handleChange = useCallback(
    (_editorState: EditorState, editor: LexicalEditor) => {
      editor.update(() => {
        const html = $generateHtmlFromNodes(editor, null);
        if (html === lastEmittedHtmlRef.current) {
          return;
        }
        lastEmittedHtmlRef.current = html;
        onChange(html);
      });
    },
    [onChange],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "product-rich-text",
        // Theme classes are optional — we rely on `prose`-style utility
        // classes on the ContentEditable wrapper for baseline typography.
        theme: {
          paragraph: "mb-2 last:mb-0",
          heading: {
            h2: "mb-2 mt-4 first:mt-0 text-base font-semibold",
          },
          list: {
            ul: "list-disc pl-5",
            ol: "list-decimal pl-5",
            listitem: "mb-1 last:mb-0",
          },
          link: "text-primary underline-offset-2 hover:underline",
          text: {
            bold: "font-semibold",
            italic: "italic",
            underline: "underline",
          },
        },
        editable: !disabled,
        nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
        onError(error) {
          if (import.meta.env.DEV) {
            console.error("[rich-text] lexical error:", error);
          }
        },
        editorState: (editor) => {
          const html = initialValueRef.current;
          if (!html) {
            return;
          }
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().select();
          $insertNodes(nodes);
        },
      }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          ariaInvalid &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        <RichTextEditorToolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                aria-invalid={ariaInvalid}
                aria-label={name}
                onBlur={onBlur}
                className="min-h-[140px] w-full px-3.5 py-3 text-sm leading-relaxed outline-none"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-3.5 top-3 text-sm text-muted-foreground">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <EditableSync disabled={disabled} />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        </div>
      </div>
    </LexicalComposer>
  );
}

/**
 * Propagates `disabled` prop changes into Lexical's internal editable flag
 * after initial mount. Without this the `editable` config option only
 * applies on first render.
 */
function EditableSync({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  editor.setEditable(!disabled);
  return null;
}
