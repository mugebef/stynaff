import React from 'react';
import { X, Play, CreditCard, Lock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMediaSource } from '../utils';

interface MoviePlayerProps {
  movie: any;
  isTrailer: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (movie: any) => void;
  hasAccess: boolean;
}

export const MoviePlayer: React.FC<MoviePlayerProps> = ({ 
  movie, 
  isTrailer, 
  isOpen, 
  onClose, 
  onPurchase,
  hasAccess
}) => {
  const [showPurchaseOverlay, setShowPurchaseOverlay] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setShowPurchaseOverlay(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isOpen]);

  if (!movie) return null;

  const videoUrl = isTrailer ? movie.trailerUrl : movie.videoUrl;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoEnded = () => {
    if (isTrailer && !hasAccess) {
      setShowPurchaseOverlay(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-8"
        >
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-[110] rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all shadow-2xl"
          >
            <X size={32} />
          </button>

          <div className="relative aspect-video w-full max-w-6xl overflow-hidden md:rounded-[32px] bg-neutral-950 shadow-2xl ring-1 ring-white/10">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={getMediaSource(videoUrl)}
                  controls={false}
                  autoPlay={!showPurchaseOverlay}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  className="h-full w-full object-contain"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) videoRef.current.play();
                      else videoRef.current.pause();
                    }
                  }}
                  onError={(e) => {
                    const video = e.currentTarget;
                    console.warn("Movie playback error:", video.error?.message);
                    if (!video.dataset.retried) {
                      video.dataset.retried = 'true';
                      setTimeout(() => {
                        video.load();
                      }, 1000);
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Custom Controls / Timing Bar */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-8 pt-20">
                  <div className="group relative w-full">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 transition-all focus:outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-600 shadow-xl"
                    />
                    <motion.div 
                      className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-orange-600 pointer-events-none"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] md:text-sm font-bold text-white/70 uppercase tracking-widest">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-4">
                      {isTrailer && <span className="text-orange-500">Preview Mode</span>}
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Center Play Button Overlay */}
                <AnimatePresence>
                  {videoRef.current?.paused && !showPurchaseOverlay && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="flex h-20 w-20 md:h-32 md:w-32 items-center justify-center rounded-full bg-orange-600/40 text-white backdrop-blur-md">
                        <Play size={40} className="md:w-16 md:h-16" fill="currentColor" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-neutral-500">
                <Info size={64} className="mb-4" />
                <p className="text-xl font-bold">Video not available</p>
              </div>
            )}

            {isTrailer && !hasAccess && !showPurchaseOverlay && (
              <div className="absolute bottom-20 right-8 z-20">
                <button
                  onClick={() => onPurchase(movie)}
                  className="flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-2xl hover:bg-orange-700 transition-all active:scale-95"
                >
                  <CreditCard size={18} />
                  Unlock Full Movie
                </button>
              </div>
            )}

            <AnimatePresence>
              {showPurchaseOverlay && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex flex-col items-center gap-6 text-center p-10 rounded-[40px] bg-neutral-900/90 border border-white/10 shadow-2xl max-w-md mx-4"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-600/20 text-orange-500 ring-4 ring-orange-600/10">
                      <Lock size={40} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Trailer Ended</h3>
                      <p className="text-neutral-400 leading-relaxed font-medium">
                        Ready for the full experience? Unlock this blockbuster now and enjoy the complete story!
                      </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                      <button
                        onClick={() => onPurchase(movie)}
                        className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-orange-600 px-10 py-5 text-xl font-black text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <CreditCard size={24} />
                        Unlock for {movie.price} Points
                      </button>
                      <button
                        onClick={() => {
                          setShowPurchaseOverlay(false);
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            videoRef.current.play();
                          }
                        }}
                        className="text-sm font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors py-2"
                      >
                        Replay Trailer
                      </button>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      One-time purchase • Lifetime access
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center hidden md:block">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">{movie.title}</h2>
            <p className="text-neutral-400 max-w-xl line-clamp-2 font-medium">{movie.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
