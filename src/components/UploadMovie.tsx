import React from 'react';
import { X, Upload, Film, Loader2, CheckCircle2, AlertCircle, PlayCircle, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageCropper } from './ImageCropper';

interface UploadMovieProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { title: string; description: string; movieFile: File; trailerFile?: File; thumbnailFile: File; price: number }) => Promise<void>;
}

export const UploadMovie: React.FC<UploadMovieProps> = ({ isOpen, onClose, onUpload }) => {
  const [step, setStep] = React.useState(1);
  const [movieFile, setMovieFile] = React.useState<File | null>(null);
  const [trailerFile, setTrailerFile] = React.useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);
  const [isCropping, setIsCropping] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState(50);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieFile || !thumbnailFile || !title) return;

    if (movieFile.size > 500 * 1024 * 1024) {
      setStatus('error');
      alert('Movie file is too large. Max size is 500MB.');
      return;
    }

    setLoading(true);
    try {
      await onUpload({ title, description, movieFile, trailerFile: trailerFile || undefined, thumbnailFile, price });
      setStatus('success');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovieFile(null);
    setTrailerFile(null);
    setThumbnailFile(null);
    setTitle('');
    setDescription('');
    setPrice(50);
    setStep(1);
    setStatus('idle');
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

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
            className="relative w-full max-w-2xl overflow-hidden rounded-[40px] bg-neutral-900 shadow-2xl my-8 border border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white">Upload to Blockbuster</h3>
                <p className="text-sm text-neutral-400">Step {step} of 4: {
                  step === 1 ? 'Basic Info' : 
                  step === 2 ? 'Media Assets' : 
                  step === 3 ? 'Full Movie' : 'Pricing & Publish'
                }</p>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-3 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-8">
              {/* Image Cropper Modal Layer */}
              <AnimatePresence>
                {isCropping && thumbnailPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-[110] bg-neutral-900 p-8 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-black text-white">Adjust Poster Zoom</h4>
                      <button onClick={() => setIsCropping(false)} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                      <ImageCropper 
                        image={thumbnailPreview} 
                        aspect={2/3}
                        onCropComplete={(croppedArea, croppedAreaPixels) => {
                          // We'll store the pixels for later if we want real cropping, 
                          // but for now we'll just allow the UI interaction.
                          // Real cropping: setCroppedPixels(croppedAreaPixels);
                        }} 
                      />
                    </div>
                    
                    <div className="mt-8 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsCropping(false)}
                        className="flex-1 rounded-2xl bg-orange-600 py-4 font-bold text-white shadow-xl shadow-orange-900/20"
                      >
                        Apply & Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="mb-8 flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-orange-600' : 'bg-neutral-800'}`} />
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Movie Title</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter movie title"
                          className="w-full rounded-2xl border border-white/5 bg-neutral-950 px-5 py-4 text-sm font-bold text-white focus:border-orange-600 focus:bg-neutral-900 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="What is this movie about?"
                          className="h-32 w-full resize-none rounded-2xl border border-white/5 bg-neutral-950 p-5 text-sm font-medium text-white focus:border-orange-600 focus:bg-neutral-900 focus:outline-none transition-all"
                        />
                      </div>
                      <button type="button" onClick={nextStep} disabled={!title} className="w-full rounded-2xl bg-orange-600 py-4 font-bold text-white disabled:opacity-50">Next Step</button>
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
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Movie Poster</label>
                          <div 
                            className={`relative aspect-[2/3] w-full overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
                              thumbnailFile ? 'border-orange-600' : 'border-white/5 bg-neutral-950'
                            }`}
                          >
                            {thumbnailPreview ? (
                              <div className="group relative h-full w-full">
                                <img src={thumbnailPreview} className="h-full w-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    type="button"
                                    onClick={() => setIsCropping(true)}
                                    className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-orange-700 transition-all"
                                  >
                                    <Maximize2 size={16} />
                                    Zoom & Crop
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                  className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md hover:bg-red-500 transition-all"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => document.getElementById('thumb-input')?.click()}
                                className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:border-orange-500 transition-all"
                              >
                                <Film size={32} className="text-neutral-700" />
                                <p className="text-xs font-bold text-neutral-500">Click to upload poster</p>
                              </div>
                            )}
                            <input 
                              id="thumb-input" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setThumbnailFile(file);
                                  setThumbnailPreview(URL.createObjectURL(file));
                                  setIsCropping(true);
                                }
                              }} 
                            />
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Trailer (Optional)</label>
                            <div 
                              onClick={() => document.getElementById('trailer-input')?.click()}
                              className={`relative rounded-2xl border-2 border-dashed p-4 transition-all ${
                                trailerFile ? 'border-orange-600 bg-orange-600/10' : 'border-white/5 hover:border-orange-500 bg-neutral-950'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <PlayCircle size={24} className={trailerFile ? 'text-orange-500' : 'text-neutral-700'} />
                                <span className="text-xs font-bold text-neutral-400 truncate">
                                  {trailerFile ? trailerFile.name : 'Upload Trailer Video'}
                                </span>
                              </div>
                              <input id="trailer-input" type="file" accept="video/*" className="hidden" onChange={(e) => setTrailerFile(e.target.files?.[0] || null)} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button type="button" onClick={prevStep} className="flex-1 rounded-2xl bg-neutral-800 py-4 font-bold text-white">Back</button>
                        <button type="button" onClick={nextStep} disabled={!thumbnailFile} className="flex-[2] rounded-2xl bg-orange-600 py-4 font-bold text-white disabled:opacity-50">Next Step</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Full Movie File</label>
                        <div 
                          onClick={() => document.getElementById('movie-input')?.click()}
                          className={`relative rounded-2xl border-2 border-dashed p-12 transition-all ${
                            movieFile ? 'border-orange-600 bg-orange-600/10' : 'border-white/5 hover:border-orange-500 bg-neutral-950'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4 text-center">
                            <Upload size={48} className={movieFile ? 'text-orange-500' : 'text-neutral-700'} />
                            <div>
                              <p className="text-sm font-bold text-white">
                                {movieFile ? movieFile.name : 'Select Full Movie Video'}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">Max file size: 500MB</p>
                            </div>
                          </div>
                          <input id="movie-input" type="file" accept="video/*" required className="hidden" onChange={(e) => setMovieFile(e.target.files?.[0] || null)} />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button type="button" onClick={prevStep} className="flex-1 rounded-2xl bg-neutral-800 py-4 font-bold text-white">Back</button>
                        <button type="button" onClick={nextStep} disabled={!movieFile} className="flex-[2] rounded-2xl bg-orange-600 py-4 font-bold text-white disabled:opacity-50">Next Step</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Access Fee (Points)</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full rounded-2xl border border-white/5 bg-neutral-950 px-5 py-4 text-sm font-bold text-white focus:border-orange-600 focus:bg-neutral-900 focus:outline-none transition-all"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">POINTS</span>
                        </div>
                        <p className="mt-2 text-[10px] text-neutral-500">Users will need to pay this amount to unlock the full movie.</p>
                      </div>

                      {status === 'success' && (
                        <div className="flex items-center gap-2 rounded-2xl bg-orange-600/10 p-4 text-sm font-bold text-orange-500">
                          <CheckCircle2 size={20} />
                          Movie uploaded successfully!
                        </div>
                      )}

                      {status === 'error' && (
                        <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-500">
                          <AlertCircle size={20} />
                          Failed to upload movie.
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button type="button" onClick={prevStep} className="flex-1 rounded-2xl bg-neutral-800 py-4 font-bold text-white">Back</button>
                        <button
                          type="submit"
                          disabled={!movieFile || !thumbnailFile || !title || loading || status === 'success'}
                          className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-orange-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            <>
                              <Film size={24} />
                              Publish Movie
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
