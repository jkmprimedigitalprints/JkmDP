import React, { useState, useRef } from 'react';

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left mouse button clicked/held
      handleMove(e.clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 select-none cursor-ew-resize"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
    >
      {/* Before Image (Raw file) */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80" 
          alt="Before Editing" 
          className="w-full h-full object-cover filter blur-[1.2px] saturate-[85%] contrast-[95%] brightness-[95%]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase px-3 py-1.5 rounded-lg border border-white/10 z-10">
          Before Editing (Lower Quality)
        </div>
      </div>

      {/* After Image (Enhanced & Sharp Output) */}
      <div 
        className="absolute inset-0 z-10"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img 
          src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80" 
          alt="After Editing" 
          className="w-full h-full object-cover filter saturate-[110%] contrast-[105%] brightness-[102%]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-sky-500 text-white text-[10px] font-mono font-bold uppercase px-3 py-1.5 rounded-lg shadow-md border border-sky-400/25 z-20">
          After Editing (Sharp & Clear)
        </div>
      </div>

      {/* Slider Divider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg z-30"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-white text-slate-800 border-2 border-sky-500 flex items-center justify-center text-xs font-black shadow-md select-none">
          ↔
        </div>
      </div>
    </div>
  );
};
