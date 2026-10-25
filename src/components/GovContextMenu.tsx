import React, { useEffect, useRef } from "react";
import "./govContextMenu.css";

interface GovContextMenuOption { label: React.ReactNode; disabled?: boolean; onClick?: () => void }
interface GovContextMenuProps { x: number; y: number; options: GovContextMenuOption[]; onClose: () => void }

export default function GovContextMenu({ x, y, options, onClose }: GovContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="gov-context-menu"
      ref={menuRef}
      style={{ left: x, top: y }}
    >
      {options.map((opt, i) => (
        <div
          key={i}
          className={
            "gov-context-menu-item" + (opt.disabled ? " disabled" : "")
          }
          onClick={() => !opt.disabled && opt.onClick && opt.onClick()}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}
