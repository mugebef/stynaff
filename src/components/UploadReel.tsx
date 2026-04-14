import React from 'react';
import { X, Upload, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadReelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, caption: string) => Promise<void>;
}

export const UploadReel: React.FC<UploadReelProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await onUpload(file, caption);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setFile(null);
        setPreview(null);
        setCaption('');
        setStatus('idle');
      }, 2000);
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-6">
              <h3 className="text-xl font-bold text-neutral-900">Upload Reel</h3>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Video Preview/Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-[9/16] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                    preview ? 'border-orange-600' : 'border-neutral-200 hover:border-orange-400 bg-neutral-50'
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
                      <div className="rounded-full bg-orange-100 p-4 text-orange-600">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">Select Video</p>
                        <p className="text-xs text-neutral-500">MP4, WebM or Ogg (Max 50MB)</p>
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

                {/* Details Area */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a catchy caption..."
                      className="h-32 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                    />
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <div className="flex gap-3">
                      <Video className="shrink-0 text-orange-600" size={20} />
                      <div>
                        <p className="text-xs font-bold text-orange-900">Reel Tips</p>
                        <p className="text-[10px] text-orange-700/80">Vertical videos (9:16) perform best. Keep it under 60 seconds for maximum engagement.</p>
                      </div>
                    </div>
                  </div>

                  {status === 'success' && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-600">
                      <CheckCircle2 size={18} />
                      Reel uploaded successfully!
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                      <AlertCircle size={18} />
                      Failed to upload reel.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!file || loading || status === 'success'}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Upload size={20} />
                        Post Reel
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
