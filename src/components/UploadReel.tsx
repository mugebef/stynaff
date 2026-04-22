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
    } else {
      setCaption('');
      setFile(null);
      setPreview(null);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setStatus('error');
        setErrorMessage('Please select a valid video file.');
        return;
      }
      if (selectedFile.size > 500 * 1024 * 1024) { // 500MB limit
        setStatus('error');
        setErrorMessage('Video file is too large. Max size is 500MB.');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && !file) return;

    setLoading(true);
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
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || `Failed to ${isEditing ? 'update' : 'upload'} reel.`);
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
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl border border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <h3 className="text-xl font-bold text-white">{isEditing ? 'Edit Post' : 'Upload Video'}</h3>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Video Preview/Upload Area */}
                {!isEditing ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-[9/16] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                      preview ? 'border-orange-600' : 'border-neutral-800 hover:border-orange-500 bg-neutral-950'
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
                        <div className="rounded-full bg-orange-600/10 p-4 text-orange-500">
                          <Upload size={32} />
                        </div>
                        <div>
                          <p className="font-bold text-white">Select Video</p>
                          <p className="text-xs text-neutral-500">MP4, WebM or Ogg (Max 500MB)</p>
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
                  <div className="rounded-2xl bg-orange-600/10 p-6 border border-orange-600/20 h-full flex flex-col items-center justify-center text-center">
                    <Video size={48} className="text-orange-500 mb-4" />
                    <p className="text-sm font-bold text-white">Editing Metadata</p>
                    <p className="text-xs text-neutral-500 mt-2">Video content cannot be changed. You are editing the caption.</p>
                  </div>
                )}

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
                      className="h-32 w-full resize-none rounded-2xl border border-white/5 bg-neutral-950 p-4 text-sm text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                    />
                  </div>

                  <div className="rounded-2xl bg-orange-600/10 p-4 border border-orange-600/20">
                    <div className="flex gap-3">
                      <Video className="shrink-0 text-orange-500" size={20} />
                      <div>
                        <p className="text-xs font-bold text-orange-400">Reel Tips</p>
                        <p className="text-[10px] text-orange-200/60">Vertical videos (9:16) perform best. Keep it under 60 seconds for maximum engagement.</p>
                      </div>
                    </div>
                  </div>

                  {status === 'success' && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm font-bold text-green-500 border border-green-500/20">
                      <CheckCircle2 size={18} />
                      {isEditing ? 'Reel updated successfully!' : 'Reel uploaded successfully!'}
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex flex-col gap-1 rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-500 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        {isEditing ? 'Update Failed' : 'Upload Failed'}
                      </div>
                      {errorMessage && (
                        <p className="text-[10px] font-normal opacity-80">{errorMessage}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={(!isEditing && !file) || loading || status === 'success'}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Upload size={20} />
                        {isEditing ? 'Update Post' : 'Post Video'}
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
