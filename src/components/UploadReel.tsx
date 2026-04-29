import React from 'react';
import { X, Upload, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadReelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, caption: string) => Promise<void>;
  onUpdate?: (reelId: string, updates: { content: string }) => Promise<void>;
  initialData?: { id: string; content: string };
}

export const UploadReel: React.FC<UploadReelProps> = ({ isOpen, onClose, onUpload, onUpdate, initialData }) => {
  const isEditing = !!initialData;
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState(initialData?.content || '');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialData) {
      setCaption(initialData.content);
      setStep(1);
    } else {
      setCaption('');
      setFile(null);
      setPreview(null);
      setStep(1);
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setStatus('error');
        setErrorMessage('Please select a valid video file.');
        return;
      }
      // Increased to 2GB to match server limits for "Reels, movies"
      if (selectedFile.size > 2048 * 1024 * 1024) { 
        setStatus('error');
        setErrorMessage('Video file is too large. Max size is 2GB.');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setErrorMessage(null);
      setStep(2); // Auto proceed to step 2 after file selection
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && !file) return;

    setLoading(true);
    setStep(3); // Show publishing progress
    try {
      if (isEditing && onUpdate && initialData) {
        await onUpdate(initialData.id, { content: caption });
      } else if (file) {
        await onUpload(file, caption);
      }
      
      setStatus('success');
      setErrorMessage(null);
      setTimeout(() => {
        onClose();
        setFile(null);
        setPreview(null);
        setCaption('');
        setStatus('idle');
        setStep(1);
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || `Failed to ${isEditing ? 'update' : 'upload'} reel.`);
      setStep(2); // Go back to details to allow retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-neutral-900 shadow-2xl border border-white/5 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white">{isEditing ? 'Edit Reel' : 'Post Reel'}</h3>
                {!isEditing && (
                  <p className="text-sm text-neutral-400">
                    Step {step} of 3: {
                      step === 1 ? 'Select Video' : 
                      step === 2 ? 'Details' : 'Publishing'
                    }
                  </p>
                )}
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            {!isEditing && (
              <div className="px-8 pt-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-orange-600' : 'bg-neutral-800'}`} />
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {!isEditing ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative aspect-[9/16] max-h-[400px] mx-auto cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
                          file ? 'border-orange-600' : 'border-neutral-800 hover:border-orange-500 bg-neutral-950 shadow-inner'
                        }`}
                      >
                        {preview ? (
                          <video 
                            src={preview} 
                            className="h-full w-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="rounded-full bg-orange-600/10 p-6 text-orange-500 shadow-xl shadow-orange-950/20">
                              <Upload size={48} />
                            </div>
                            <div>
                              <p className="text-xl font-black text-white">Select Video</p>
                              <p className="text-xs text-neutral-500 mt-2">MP4, WebM or Ogg (Max 2GB)</p>
                            </div>
                          </div>
                        )}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="video/*" 
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="rounded-3xl bg-orange-600/10 p-8 border border-orange-600/20 text-center">
                        <Video size={48} className="text-orange-500 mx-auto mb-4" />
                        <p className="text-lg font-black text-white">Editing Metadata</p>
                        <p className="text-sm text-neutral-500 mt-2">Video content cannot be changed. You are editing the caption.</p>
                        <button type="button" onClick={() => setStep(2)} className="mt-6 w-full rounded-2xl bg-orange-600 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/20">Edit Details</button>
                      </div>
                    )}

                    {!isEditing && file && (
                      <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl bg-orange-600 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/20">Continue to Details</button>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Shrunken Preview */}
                    {!isEditing && preview && (
                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-neutral-950 border border-white/5">
                        <div className="h-24 w-16 overflow-hidden rounded-xl bg-black shadow-lg">
                          <video src={preview} className="h-full w-full object-cover" muted />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Video Ready</p>
                          <p className="text-sm font-bold text-white truncate">{file?.name}</p>
                          <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2 hover:text-orange-400 transition-colors">Change Video</button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                        Caption
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a catchy caption..."
                        className="h-32 w-full resize-none rounded-3xl border border-white/5 bg-neutral-950 p-6 text-sm font-medium text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-900 focus:outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="rounded-3xl bg-orange-600/5 p-6 border border-orange-600/10">
                      <div className="flex gap-4">
                        <div className="rounded-full bg-orange-600/20 p-2 h-fit">
                          <Video className="text-orange-500" size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">Reel Tips</p>
                          <p className="text-[10px] leading-relaxed text-orange-200/40 font-medium italic">"Vertical videos (9:16) perform best. Keep it under 60 seconds for maximum engagement."</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {!isEditing && <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-neutral-800 py-4 font-black uppercase tracking-widest text-white hover:bg-neutral-700 transition-all">Back</button>}
                      <button
                        type="submit"
                        disabled={(!isEditing && !file) || loading || status === 'success'}
                        className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isEditing ? 'Update Post' : 'Share Reel'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    {status === 'idle' && (
                      <div className="space-y-6">
                        <div className="relative mx-auto w-24 h-24">
                          <div className="absolute inset-0 rounded-full border-4 border-orange-600/20" />
                          <Loader2 className="animate-spin text-orange-600 absolute inset-0 m-auto" size={48} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-white">Publishing Reel...</p>
                          <p className="text-sm text-neutral-500 mt-2 italic font-medium">Sit tight, we are preparing your video for the screen.</p>
                        </div>
                      </div>
                    )}

                    {status === 'success' && (
                      <div className="space-y-6">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-500"
                        >
                          <CheckCircle2 size={56} />
                        </motion.div>
                        <div>
                          <p className="text-2xl font-black text-white">Success!</p>
                          <p className="text-sm text-neutral-500 mt-2">Your reel is now live for the world to see.</p>
                        </div>
                      </div>
                    )}

                    {status === 'error' && (
                      <div className="space-y-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                          <AlertCircle size={56} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-white">Upload Failed</p>
                          <p className="text-sm text-neutral-500 mt-2 font-medium">{errorMessage}</p>
                          <button 
                            type="button" 
                            onClick={() => setStep(2)}
                            className="mt-6 rounded-2xl bg-neutral-800 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-700 transition-all border border-white/5"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
