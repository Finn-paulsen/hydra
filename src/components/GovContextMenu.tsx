import React, { useEffect, useRef } from "react";
import "./govContextMenu.css";

export default function GovContextMenu({ x, y, options, onClose }) {
  const menuRef = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleEsc(e) {
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
