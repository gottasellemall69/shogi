import { useLayoutEffect, useRef } from 'react';

// Measure the unscaled layout, including controls that appear during play.
// ResizeObserver also handles font loading, viewport changes and longer messages.
export default function GameViewport({ children }) {
  const viewport = useRef(null);
  const content = useRef(null);
  useLayoutEffect(() => {
    const frame = viewport.current;
    const layout = content.current;
    function fit() {
      const scale = Math.min(1, frame.clientHeight / layout.offsetHeight, frame.clientWidth / layout.offsetWidth);
      layout.style.setProperty('--game-scale', String(scale));
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(layout);
    return () => observer.disconnect();
  }, []);
  return <div className="game-viewport" ref={viewport}>
    <div className="game-layout" ref={content}>{children}</div>
  </div>;
}
