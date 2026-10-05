import { createContext, useContext, useEffect, useId, useState } from 'react';

const TooltipContext = createContext(null);

export function PieceTooltipProvider({ children }) {
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const tooltipId = useId();
  const active = hovered?.name ? hovered : focused?.name ? focused : null;
  useEffect(() => {
    function dismiss(event) {
      if (event.key === 'Escape') { setHovered(null); setFocused(null); }
    }
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, []);
  return <TooltipContext.Provider value={{ active, tooltipId, setHovered, setFocused }}>{children}</TooltipContext.Provider>;
}

// The wrapper receives pointer events even when its button is disabled.
export function PieceButton({ name, wrapperClassName, children, ...props }) {
  const { active, tooltipId, setHovered, setFocused } = useContext(TooltipContext);
  const id = useId();
  useEffect(() => {
    const refresh = (previous) => previous?.id === id ? { id, name } : previous;
    setHovered(refresh); setFocused(refresh);
  }, [id, name, setHovered, setFocused]);
  useEffect(() => {
    return () => {
      const clear = (previous) => previous?.id === id ? null : previous;
      setHovered(clear); setFocused(clear);
    };
  }, [id, setHovered, setFocused]);
  const show = (setter) => setter({ id, name });
  const hide = (setter) => setter((previous) => previous?.id === id ? null : previous);
  return <div className={wrapperClassName}
    onPointerEnter={() => show(setHovered)} onPointerLeave={() => hide(setHovered)}
    onFocus={() => show(setFocused)} onBlur={() => hide(setFocused)}>
    <button {...props} aria-describedby={active?.id === id ? tooltipId : undefined}>{children}</button>
  </div>;
}

// A single reserved strip, outside the board and both hands, never covers a piece.
export function PieceTooltip() {
  const { active, tooltipId } = useContext(TooltipContext);
  return <div className="piece-tooltip-strip">
    {active ? <span id={tooltipId} role="tooltip">{active.name}</span>
      : <span className="piece-tooltip-help">Hover or focus a piece to see its English name</span>}
  </div>;
}
