import React, { useRef } from "react";

export default function DraggableWindow({
  window,
  getWindowContent,
  onFocus,
  onMove,
  onClose,
  onMinimize,
  z
}) {
  const dragging   = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onFocus && onFocus();
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    windowStart.current = { ...window.pos };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    onMove({
      x: windowStart.current.x + dx,
      y: windowStart.current.y + dy
    });
  };

  const handleMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="gov-window"
      style={{
        position: "absolute",
        left: window.pos.x,
        top: window.pos.y,
        zIndex: z,
        userSelect: dragging.current ? 'none' : 'auto',
      }}
      onMouseDown={onFocus}
    >
      {/* Titelleiste im Win95-Stil */}
      <div
        className="gov-window-titlebar"
        onMouseDown={handleMouseDown}
      >
        <span className="gov-window-title">{window.title}</span>
        <div className="gov-window-buttons">
          <button type="button" onClick={onMinimize} title="Minimieren">_</button>
          <button type="button" onClick={onClose}    title="Schließen">✕</button>
        </div>
      </div>

      {/* Inhalt */}
      <div className="gov-window-content">
        {getWindowContent && getWindowContent(window)}
      </div>
    </div>
  );
}
