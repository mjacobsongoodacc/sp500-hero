import { memo } from 'react';

interface Props {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls = memo(function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
}: Props) {
  return (
    <div className="zoom-controls">
      <button
        className="zoom-btn"
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
      <span className="zoom-level">{zoom.toFixed(1)}×</span>
      <button
        className="zoom-btn"
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
});
