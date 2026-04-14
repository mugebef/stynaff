import React from 'react';
import { X, Upload, Film, Loader2, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadMovieProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { title: string; description: string; movieFile: File; trailerFile?: File; thumbnailFile: File }) => Promise<void>;
}

export const UploadMovie: React.FC<UploadMovieProps> = ({ isOpen, onClose, onUpload }) => {
  const [movieFile, setMovieFile] = React.useState<File | null>(null);
  const [trailerFile, setTrailerFile] = React.useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieFile || !thumbnailFile || !title) return;

    setLoading(true);
    try {
      await onUpload({ title, description, movieFile, trailerFile: trailerFile || undefined, thumbnailFile });
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
    setStatus('idle');
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
            className="relative w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-neutral-900">Upload to Blockbuster</h3>
                <p className="text-sm text-neutral-500">Share your cinematic masterpiece with Africa.</p>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-3 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Left Column: Files */}
                <div className="space-y-6">
                  {/* Thumbnail Upload */}
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Movie Poster (Thumbnail)</label>
                    <div 
                      onClick={() => document.getElementById('thumb-input')?.click()}
                      className={`relative aspect-[2/3] cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
                        thumbnailFile ? 'border-orange-600' : 'border-neutral-200 hover:border-orange-400 bg-neutral-50'
                      }`}
                    >
                      {thumbnailFile ? (
                        <img src={URL.createObjectURL(thumbnailFile)} className="h-full w-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                          <Film size={32} className="text-neutral-300" />
                          <p className="text-xs font-bold text-neutral-500">Click to upload poster</p>
                        </div>
                      )}
                      <input id="thumb-input" type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {/* Trailer Upload */}
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Trailer (Optional)</label>
                    <div 
                      onClick={() => document.getElementById('trailer-input')?.click()}
                      className={`relative rounded-2xl border-2 border-dashed p-4 transition-all ${
                        trailerFile ? 'border-orange-600 bg-orange-50' : 'border-neutral-200 hover:border-orange-400 bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PlayCircle size={24} className={trailerFile ? 'text-orange-600' : 'text-neutral-300'} />
                        <span className="text-xs font-bold text-neutral-600">
                          {trailerFile ? trailerFile.name : 'Upload Trailer Video'}
                        </span>
                      </div>
                      <input id="trailer-input" type="file" accept="video/*" className="hidden" onChange={(e) => setTrailerFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Movie Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter movie title"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm font-bold focus:border-orange-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this movie about?"
                      className="h-32 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-medium focus:border-orange-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Full Movie File</label>
                    <div 
                      onClick={() => document.getElementById('movie-input')?.click()}
                      className={`relative rounded-2xl border-2 border-dashed p-6 transition-all ${
                        movieFile ? 'border-orange-600 bg-orange-50' : 'border-neutral-200 hover:border-orange-400 bg-neutral-50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Upload size={24} className={movieFile ? 'text-orange-600' : 'text-neutral-300'} />
                        <span className="text-xs font-bold text-neutral-600">
                          {movieFile ? movieFile.name : 'Select Full Movie Video'}
                        </span>
                      </div>
                      <input id="movie-input" type="file" accept="video/*" required className="hidden" onChange={(e) => setMovieFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {status === 'success' && (
                    <div className="flex items-center gap-2 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-600">
                      <CheckCircle2 size={20} />
                      Movie uploaded successfully!
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
                      <AlertCircle size={20} />
                      Failed to upload movie.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!movieFile || !thumbnailFile || !title || loading || status === 'success'}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 py-5 text-lg font-black uppercase tracking-widest text-white shadow-2xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
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
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
