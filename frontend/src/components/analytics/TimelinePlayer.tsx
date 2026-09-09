import React, { useState, useEffect, useRef } from 'react';
import { TimelineSnapshot } from '../../types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, Calendar, FastForward } from 'lucide-react';

interface TimelinePlayerProps {
  snapshots: TimelineSnapshot[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  snapshots,
  currentIndex,
  onSelectIndex
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1 = 2000ms, 2 = 1000ms, 0.5 = 3500ms
  const timerRef = useRef<any>(null);

  const activeSnapshot = snapshots[currentIndex] || snapshots[0];

  const currentIndexRef = useRef<number>(currentIndex);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(2500 / playbackSpeed);
      timerRef.current = setInterval(() => {
        const next = currentIndexRef.current + 1;
        if (next >= snapshots.length) {
          setIsPlaying(false);
        } else {
          onSelectIndex(next);
        }
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, snapshots.length, onSelectIndex]);

  const handleTogglePlay = () => {
    if (!isPlaying && currentIndex >= snapshots.length - 1) {
      onSelectIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    if (currentIndex > 0) onSelectIndex(currentIndex - 1);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentIndex < snapshots.length - 1) onSelectIndex(currentIndex + 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    onSelectIndex(0);
  };

  if (!snapshots || snapshots.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-3 shadow-md">
      {/* Top Header: Snapshot Date & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/80">
            <Clock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {activeSnapshot?.date}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Step {currentIndex + 1} of {snapshots.length}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">
              {activeSnapshot?.title}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 max-w-sm hidden sm:block">
            {activeSnapshot?.description}
          </p>
          <div className="flex items-center justify-end gap-3 text-[11px] font-mono mt-1 text-slate-400">
            <span>{activeSnapshot?.catchments?.length || 0} Catchments Evaluated</span>
            <span>•</span>
            <span className="text-red-400">{activeSnapshot?.events_active?.length || 0} Active Scars</span>
          </div>
        </div>
      </div>

      {/* Progress Dots / Steps */}
      <div className="grid grid-cols-6 gap-2 pt-1">
        {snapshots.map((snap, idx) => {
          const isCurrent = idx === currentIndex;
          const isPassed = idx < currentIndex;
          return (
            <button
              key={snap.snapshot_id}
              onClick={() => {
                setIsPlaying(false);
                onSelectIndex(idx);
              }}
              className={`p-2 text-left rounded border transition-all text-xs ${
                isCurrent
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm'
                  : isPassed
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:bg-slate-900'
              }`}
            >
              <div className="font-mono text-[10px] font-semibold">{snap.date}</div>
              <div className="truncate text-[11px] font-medium mt-0.5">{snap.title.split(':')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset to Beginning"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleStepBack}
            disabled={currentIndex === 0}
            title="Step Backward"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-700"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-semibold text-xs border transition-colors ${
              isPlaying
                ? 'bg-red-950 text-red-200 border-red-700 hover:bg-red-900'
                : 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={14} /> Pause
              </>
            ) : (
              <>
                <Play size={14} /> Play Timeline
              </>
            )}
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentIndex === snapshots.length - 1}
            title="Step Forward"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-700"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Speed:</span>
          {[0.5, 1, 2].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] border transition-colors ${
                playbackSpeed === speed
                  ? 'bg-blue-600 text-white border-blue-500 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
