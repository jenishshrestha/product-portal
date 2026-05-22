import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { Button } from "@shared/components/ui/Button";
import { cn } from "@shared/lib/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BoldIcon,
  Heading2Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  RedoIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ label, onClick, active, disabled, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-7 rounded-[4px] text-muted-foreground hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

/**
 * Minimal toolbar for the RichTextEditor. Tracks selection format (so bold
 * / italic / H2 / list buttons stay active when the cursor is inside a
 * formatted region) and funnels every action through Lexical commands so
 * the editor history + plugins stay in sync.
 */
export function RichTextEditorToolbar() {
  const [editor] = useLexicalComposerContext();

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<"paragraph" | "h2">("paragraph");
  const [hasLink, setHasLink] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }
    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : ($findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent();
            return parent !== null && parent.getKey() === "root";
          }) ?? anchorNode.getTopLevelElementOrThrow());

    setBlockType($isHeadingNode(element) && element.getTag() === "h2" ? "h2" : "paragraph");

    const link = $findMatchingParent(anchorNode, (node) => $isLinkNode(node));
    setHasLink(link !== null);
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateToolbar]);

  function toggleBlockType(next: "paragraph" | "h2") {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      if (next === "h2") {
        $setBlocksType(selection, () => $createHeadingNode("h2"));
      } else {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }

  function toggleLink() {
    if (hasLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    const url = window.prompt("Link URL");
    if (!url) {
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }

  return (
    <div className="flex items-center gap-0.5 border-b border-border-subtle bg-muted/40 px-1.5 py-1">
      <ToolbarButton
        label="Undo"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <UndoIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <RedoIcon className="size-3.5" />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden />
      <ToolbarButton
        label="Bold"
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <BoldIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <ItalicIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden />
      <ToolbarButton
        label="Heading"
        active={blockType === "h2"}
        onClick={() => toggleBlockType(blockType === "h2" ? "paragraph" : "h2")}
      >
        <Heading2Icon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        <ListIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        <ListOrderedIcon className="size-3.5" />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden />
      <ToolbarButton
        label={hasLink ? "Remove link" : "Insert link"}
        active={hasLink}
        onClick={toggleLink}
      >
        <LinkIcon className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}
