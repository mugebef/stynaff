import React from 'react';
import { Radio, Users, MessageCircle, Heart, Share2, MoreHorizontal, Shield, Send, X, Camera, Mic, MicOff, CameraOff, MonitorStop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, orderBy, limit, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export const Live: React.FC = () => {
  const [selectedStream, setSelectedStream] = React.useState<any>(null);
  const [isGoingLive, setIsGoingLive] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [streamTitle, setStreamTitle] = React.useState('');
  const [streamCategory, setStreamCategory] = React.useState('General');
  const [streams, setStreams] = React.useState<any[]>([]);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isCameraOn, setIsCameraOn] = React.useState(true);
  const [isMicOn, setIsMicOn] = React.useState(true);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Listen to all live streams
  React.useEffect(() => {
    const q = query(collection(db, 'live_streams'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStreams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Listen to comments for selected stream
  React.useEffect(() => {
    if (!selectedStream) {
      setComments([]);
      return;
    }
    const q = query(
      collection(db, `live_streams/${selectedStream.id}/comments`),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [selectedStream?.id]);

  // Ensure video stream is attached to video element when it becomes available
  React.useEffect(() => {
    if (selectedStream?.isMine && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      console.log("Attaching stream to videoRef...");
      videoRef.current.srcObject = streamRef.current;
    }
  });

  // Start camera when a stream is started by the user
  React.useEffect(() => {
    if (selectedStream?.isMine && !streamRef.current) {
      console.log("Stream isMine and no streamRef, starting camera...");
      startCamera();
    }
    // Cleanup when stream ends
    return () => {
      if (!selectedStream) {
        stopCamera();
      }
    };
  }, [selectedStream]);

  const startCamera = async () => {
    try {
      console.log("Checking for mediaDevices...");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser.");
      }

      console.log("requesting getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log("getUserMedia success:", stream.id);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      } else {
        console.warn("videoRef.current is null even after stream start attempt");
        // We can try again in a short bit if needed, but the useEffect should handle the next render
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      alert(`Could not access camera/microphone: ${err.message}. Please ensure permissions are granted.`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      console.log("Stopping camera tracks...");
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartStream = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to start stream with title:", streamTitle);
    
    if (!streamTitle) {
      alert("Please enter a stream title.");
      return;
    }

    if (!auth.currentUser) {
      alert("You must be signed in to go live.");
      return;
    }

    setIsStarting(true);
    
    try {
      console.log("Adding stream document to Firestore...");
      const streamDoc = await addDoc(collection(db, 'live_streams'), {
        title: streamTitle,
        category: streamCategory,
        streamerId: auth.currentUser.uid,
        streamerName: auth.currentUser.displayName || 'Anonymous',
        streamerPhoto: auth.currentUser.photoURL || '',
        viewers: 0,
        status: 'live',
        createdAt: serverTimestamp(),
      });

      console.log("Stream document added successfully, ID:", streamDoc.id);

      const newStream = {
        id: streamDoc.id,
        title: streamTitle,
        category: streamCategory,
        streamerId: auth.currentUser.uid,
        isMine: true
      };
      
      setIsGoingLive(false);
      setSelectedStream(newStream);
      // No longer calling startCamera() here, useEffect will handle it
    } catch (err: any) {
      console.error("Critical error starting live stream:", err);
      alert(`Could not start live stream: ${err.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!selectedStream?.id) return;
    try {
      if (selectedStream.isMine) {
        await deleteDoc(doc(db, 'live_streams', selectedStream.id));
        stopCamera();
      }
      setSelectedStream(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedStream || !auth.currentUser) return;

    try {
      await addDoc(collection(db, `live_streams/${selectedStream.id}/comments`), {
        text: newComment,
        user: auth.currentUser.displayName || 'Anonymous',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-2 md:px-4 py-4 md:py-8">
      {/* Go Live Modal */}
      <AnimatePresence>
        {isGoingLive && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsGoingLive(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-neutral-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-white/5 shadow-2xl"
            >
              <h2 className="text-2xl md:text-3xl font-black text-white italic mb-6">Start Live Stream</h2>
              <form onSubmit={handleStartStream} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Stream Title</label>
                  <input 
                    type="text" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="What are you doing today?"
                    className="w-full rounded-2xl bg-neutral-950 border border-white/5 px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Category</label>
                  <select 
                    value={streamCategory}
                    onChange={(e) => setStreamCategory(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-950 border border-white/5 px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all font-bold appearance-none"
                  >
                    <option>General</option>
                    <option>Music</option>
                    <option>Tech</option>
                    <option>Lifestyle</option>
                    <option>Gaming</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={isStarting}
                  className="w-full rounded-2xl bg-orange-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isStarting ? 'Setting up stream...' : 'Go Live Now'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedStream ? (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
          {/* Stream Player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl bg-black shadow-2xl border border-white/5">
              {selectedStream.isMine ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <img 
                      src={selectedStream.streamerPhoto || "https://picsum.photos/seed/live/800/600"} 
                      className="h-full w-full object-cover opacity-30 grayscale" 
                      alt="" 
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 text-red-500">
                        <Radio size={40} className="animate-pulse" />
                      </div>
                      <p className="text-xl font-black text-white italic">WATCHING LIVE</p>
                      <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-2">{selectedStream.streamerName}</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* Overlays */}
              <div className="absolute left-4 top-4 md:left-6 md:top-6 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-lg z-20">
                <span className="h-1.5 w-1.5 md:h-2 md:w-2 animate-pulse rounded-full bg-white"></span>
                Live
              </div>
              
              <div className="absolute right-4 top-4 md:right-6 md:top-6 flex flex-col gap-2 z-20">
                {selectedStream.isMine && (
                  <>
                    <button onClick={toggleCamera} className="rounded-full bg-black/50 p-2 md:p-3 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                      {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} className="text-red-500" />}
                    </button>
                    <button onClick={toggleMic} className="rounded-full bg-black/50 p-2 md:p-3 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                      {isMicOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
                    </button>
                  </>
                )}
              </div>

              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-center gap-4 z-20">
                <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-white backdrop-blur-md border border-white/10">
                  <Users size={14} />
                  {selectedStream.viewers || 0}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">{selectedStream.title}</h1>
                <p className="text-xs md:text-sm text-neutral-500 font-bold uppercase tracking-widest">Streaming in {selectedStream.category}</p>
              </div>
              <button 
                onClick={handleEndStream}
                className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all active:scale-95 ${selectedStream.isMine ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {selectedStream.isMine ? <MonitorStop size={18} /> : <X size={18} />}
                {selectedStream.isMine ? 'End Stream' : 'Leave'}
              </button>
            </div>
          </div>

          {/* Live Chat */}
          <div className="flex h-[400px] md:h-[600px] flex-col rounded-[24px] md:rounded-3xl border border-white/5 bg-neutral-900 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-600/5 to-transparent pointer-events-none" />
            <div className="border-b border-white/5 p-4 md:p-6 relative z-10">
              <h3 className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-white">
                <MessageCircle size={18} className="text-orange-500" />
                Live Chat
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar relative z-10">
              {comments.length === 0 && (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">No comments yet. Be the first!</p>
                </div>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-neutral-500 uppercase">
                    {comment.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{comment.user}</span>
                      <span className="text-[8px] text-neutral-600 font-bold uppercase">
                        {comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-medium">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 md:p-6 border-t border-white/5 relative z-10">
              <form onSubmit={handleSendComment} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Say something nice..."
                  className="flex-1 rounded-xl bg-neutral-950 border border-white/10 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="rounded-xl bg-orange-600 p-2.5 text-white hover:bg-orange-700 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Live Streams</h1>
              <p className="text-sm md:text-lg text-neutral-500 font-medium mt-1">Real-time interactions from across the continent.</p>
            </div>
            <button 
              onClick={() => setIsGoingLive(true)}
              className="flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_15px_30px_rgba(234,88,12,0.3)] transition-all hover:bg-orange-700 active:scale-95 self-start md:self-auto"
            >
              <Radio size={20} strokeWidth={3} />
              Go Live
            </button>
          </div>

          {streams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-[40px] bg-neutral-900/30 border border-white/5">
              <div className="h-24 w-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6 text-neutral-600">
                <Radio size={48} />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">No one is live right now</h3>
              <p className="text-neutral-500 mt-2">Check back later or be the first to go live!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {streams.map((stream) => (
                <motion.div 
                  key={stream.id}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedStream({ ...stream, isMine: stream.streamerId === auth.currentUser?.uid })}
                  className="group cursor-pointer overflow-hidden rounded-[32px] border border-white/5 bg-neutral-900 shadow-xl transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-orange-600/30"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={stream.streamerPhoto || `https://picsum.photos/seed/${stream.id}/800/600`} 
                      alt={stream.title} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute left-4 top-4 md:left-5 md:top-5 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg z-10">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
                      Direct Live
                    </div>
                    
                    <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[8px] md:text-[10px] font-black text-white backdrop-blur-md border border-white/10 uppercase tracking-widest">
                      <Users size={12} />
                      {stream.viewers || 0}
                    </div>
                  </div>
                  <div className="p-5 md:p-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-lg bg-orange-600/10 px-2.5 py-1 text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] border border-orange-600/20">
                        {stream.category}
                      </span>
                    </div>
                    <h3 className="mb-6 line-clamp-1 text-lg font-black text-white italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors uppercase">{stream.title}</h3>
                    <div className="flex items-center justify-between border-t border-white/5 pt-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-800 ring-2 ring-white/5 shadow-lg">
                          {stream.streamerPhoto && <img src={stream.streamerPhoto} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{stream.streamerName}</span>
                          <span className="text-[8px] font-bold text-neutral-500 uppercase mt-0.5">Verified Streamer</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="rounded-xl p-2.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                          <Heart size={18} />
                        </button>
                        <button className="rounded-xl p-2.5 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
