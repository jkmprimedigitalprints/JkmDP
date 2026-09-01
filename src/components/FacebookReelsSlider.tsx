import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Film, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, landingPageReelsCol } from '../lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { DEFAULT_REELS } from '../utils/data';

interface ReelItem {
  id: string;
  title: string;
  facebookUrl: string;
  order?: number;
}

export function FacebookReelsSlider() {
  const [reels, setReels] = useState<ReelItem[]>(DEFAULT_REELS);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Swipe detection states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time synchronization of Reels from Firestore
  useEffect(() => {
    const unsub = onSnapshot(landingPageReelsCol, (snapshot) => {
      if (!snapshot.empty) {
        const list: ReelItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title || 'JKM Prime Reel',
            facebookUrl: data.facebookUrl || `https://www.facebook.com/reel/${docSnap.id}`,
            order: data.order ?? 0
          });
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setReels(list);
      } else {
        // Fallback to localStorage if any or default
        const saved = localStorage.getItem('jkm_reels_list');
        if (saved) {
          try {
            setReels(JSON.parse(saved));
          } catch (e) {
            setReels(DEFAULT_REELS);
          }
        } else {
          setReels(DEFAULT_REELS);
        }
      }
    }, (err) => {
      console.warn("Notice: Using fallback reels data:", err);
      const saved = localStorage.getItem('jkm_reels_list');
      if (saved) {
        try {
          setReels(JSON.parse(saved));
        } catch (e) {
          setReels(DEFAULT_REELS);
        }
      } else {
        setReels(DEFAULT_REELS);
      }
    });

    return () => unsub();
  }, []);

  const getVisibleSlides = () => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return 2;
    return 3;
  };

  const visibleSlides = getVisibleSlides();
  const maxIndex = Math.max(0, reels.length - visibleSlides);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="w-full relative space-y-6">
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
            Swipe or use arrows • {reels.length > 0 ? currentIndex + 1 : 0} to {Math.min(currentIndex + visibleSlides, reels.length)} of {reels.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-2.5 rounded-xl border transition-all ${
              currentIndex === 0
                ? 'border-slate-800 text-slate-600 bg-slate-900/40 cursor-not-allowed'
                : 'border-slate-700 text-white bg-slate-800 hover:bg-slate-750 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title="Previous Reels"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className={`p-2.5 rounded-xl border transition-all ${
              currentIndex >= maxIndex
                ? 'border-slate-800 text-slate-600 bg-slate-900/40 cursor-not-allowed'
                : 'border-slate-700 text-white bg-slate-800 hover:bg-slate-750 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title="Next Reels"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reel Carousel Track */}
      <div 
        className="overflow-hidden relative rounded-2xl md:rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 md:p-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 pointer-events-none z-10" />
        
        <div className="relative overflow-hidden w-full">
          <motion.div
            className="flex gap-4 md:gap-6"
            animate={{ x: `-${currentIndex * (100 / visibleSlides)}%` }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            style={{
              width: `${(Math.max(reels.length, 1) / visibleSlides) * 100}%`
            }}
          >
            {reels.map((reel) => {
              // Extract numeric reel ID for embed iframe
              let reelId = reel.id;
              const match = reel.facebookUrl.match(/(?:\/reel\/|\/videos\/|\/watch\/\?v=)(\d+)/);
              if (match && match[1]) {
                reelId = match[1];
              }

              return (
                <div 
                  key={reel.id} 
                  className="relative flex flex-col bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group hover:border-sky-500/50 transition-colors duration-300"
                  style={{
                    width: `calc(${100 / Math.max(reels.length, 1)}% - ${(16 * (visibleSlides - 1)) / visibleSlides}px)`
                  }}
                >
                  {/* Phone Mockup Frame Header */}
                  <div className="bg-slate-950 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="font-bold text-sky-400 truncate max-w-[180px]">{reel.title}</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                  </div>

                  {/* Vertical Video Viewport (9:16 Aspect ratio container) */}
                  <div className="relative aspect-[9/16] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                    <iframe
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reel.facebookUrl)}&show_text=false&width=280`}
                      className="w-full h-full absolute inset-0 z-20 border-0"
                      scrolling="no"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                  </div>

                  {/* Actions Bar & Direct Click Watch Option */}
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-2 relative z-10">
                    <a
                      href={reel.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-800 hover:bg-sky-600/25 hover:text-sky-400 text-slate-300 border border-slate-700/60 font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>Watch Reel</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Embedded browser check notice */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 max-w-2xl mx-auto">
        <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 leading-normal font-medium">
          <strong>Tip:</strong> If some Facebook Reel live previews are restricted by your browser's tracking protections or privacy extensions, click the <strong>"Watch Reel"</strong> button under any video to open JKM Prime's original post on Facebook in a new tab.
        </p>
      </div>
    </div>
  );
}
