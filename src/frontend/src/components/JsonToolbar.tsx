import {
  Check,
  CodeXml,
  Copy,
  Download,
  Expand,
  FoldVertical,
  Lightbulb,
  ListOrdered,
  Maximize2,
  Minimize2,
  Shrink,
  Trash2,
  UnfoldVertical,
} from "lucide-react";
import type { ReactNode } from "react";

import type { JsonViewMode } from "../types";

interface JsonToolbarProps {
  view: JsonViewMode;
  hasJson: boolean;
  showLineNumbers: boolean;
  preserveEscapes: boolean;
  copied: boolean;
  allCollapsed: boolean;
  fullscreen: boolean;
  onCompress: () => void;
  onToggleXml: () => void;
  onToggleLineNumbers: () => void;
  onClear: () => void;
  onSave: () => void;
  onCopy: () => void;
  onToggleCollapse: () => void;
  onLoadExample: () => void;
  onPreserveEscapesChange: (next: boolean) => void;
  onToggleFullscreen: () => void;
}

export function JsonToolbar({
  view,
  hasJson,
  showLineNumbers,
  preserveEscapes,
  copied,
  allCollapsed,
  fullscreen,
  onCompress,
  onToggleXml,
  onToggleLineNumbers,
  onClear,
  onSave,
  onCopy,
  onToggleCollapse,
  onLoadExample,
  onPreserveEscapesChange,
  onToggleFullscreen,
}: JsonToolbarProps) {
  const minified = view === "minified";
  const xml = view === "xml";

  return (
    <div className="json-toolbar">
      <div className="json-toolbar__group">
        <ToolbarButton
          label={minified ? "格式化" : "压缩"}
          active={minified}
          disabled={!hasJson}
          onClick={onCompress}
        >
          {minified ? <Expand size={16} /> : <Shrink size={16} />}
        </ToolbarButton>
        <ToolbarButton
          label={xml ? "转JSON" : "转XML"}
          active={xml}
          disabled={!hasJson}
          onClick={onToggleXml}
        >
          <CodeXml size={16} />
        </ToolbarButton>
        <ToolbarButton
          label={showLineNumbers ? "隐藏行号" : "显示行号"}
          active={showLineNumbers}
          onClick={onToggleLineNumbers}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton label="清空" onClick={onClear}>
          <Trash2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="保存" disabled={!hasJson} onClick={onSave}>
          <Download size={16} />
        </ToolbarButton>
        <ToolbarButton label={copied ? "已复制" : "复制"} disabled={!hasJson} onClick={onCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </ToolbarButton>
        <ToolbarButton
          label={allCollapsed ? "展开" : "折叠"}
          active={allCollapsed}
          disabled={!hasJson}
          onClick={onToggleCollapse}
        >
          {allCollapsed ? <UnfoldVertical size={16} /> : <FoldVertical size={16} />}
        </ToolbarButton>
        <ToolbarButton label="示例" onClick={onLoadExample}>
          <Lightbulb size={16} />
        </ToolbarButton>

        <label className="json-toolbar__option">
          <input
            type="checkbox"
            className="json-toolbar__checkbox"
            checked={preserveEscapes}
            onChange={(event) => onPreserveEscapesChange(event.target.checked)}
          />
          <span className="json-toolbar__option-text">保留转义</span>
        </label>
      </div>

      <div className="json-toolbar__spacer" />

      <ToolbarButton
        label={fullscreen ? "退出全屏" : "全屏"}
        active={fullscreen}
        onClick={onToggleFullscreen}
      >
        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </ToolbarButton>
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={active ? "json-toolbar__button json-toolbar__button--active" : "json-toolbar__button"}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
