/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './components/Navbar';
import { Feed } from './components/Feed';
import { Auth } from './components/Auth';
import { Chat } from './components/Chat';
import { Dating } from './components/Dating';
import { Blockbuster } from './components/Blockbuster';
import { Sidebar } from './components/Sidebar';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { Wallet } from './components/Wallet';
import { Reels } from './components/Reels';
import { Live } from './components/Live';
import { UploadReel } from './components/UploadReel';
import { InfoPages } from './components/InfoPages';
import { Footer } from './components/Footer';
import { Upgrade } from './components/Upgrade';
import { FriendsPage } from './components/FriendsPage';
import { Post, User as UserType, Notification } from './types';
import { Globe, Loader2, LayoutDashboard, Wallet as WalletIcon, Video, Bell, Users, Flag, User, Heart, Play, MessageSquare, Plus, X, Shield } from 'lucide-react';
import { APP_NAME, ADMIN_EMAILS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  storage,
  googleProvider 
} from './firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc,
  increment,
  getDocFromServer,
  where,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo = {
    error: errorMessage,
    operationType,
    path,
    userId: auth.currentUser?.uid,
    timestamp: new Date().toISOString()
  };
  
  console.error('Firestore Error:', errorMessage, operationType, path);
  
  // Safe stringification by only using primitive fields
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = React.useState<UserType | null>(null);
  const [activeMenu, setActiveMenu] = React.useState('reels');
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [allReels, setAllReels] = React.useState<Post[]>([]);
  const [movies, setMovies] = React.useState<any[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isGlobalUploadOpen, setIsGlobalUploadOpen] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadMessage, setUploadMessage] = React.useState("");
  const [profileUser, setProfileUser] = React.useState<UserType | null>(null);
  const [navHistory, setNavHistory] = React.useState<string[]>(['reels']);

  const navigate = (menu: string, replace: boolean = false) => {
    if (activeMenu === menu) return;
    
    if (replace) {
      setNavHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = menu;
        return newHistory;
      });
    } else {
      setNavHistory(prev => [...prev, menu]);
    }
    setActiveMenu(menu);
    
    // Add to browser history so physical back button works
    window.history.pushState({ menu }, "", "");
  };

  const handleBack = () => {
    if (navHistory.length <= 1) {
      if (window.confirm("Do you want to exit the app?")) {
        // Since we are in an iframe or PWA, we can't always "exit",
        // but we can try to close or just stay at home.
        // On home screen, prompt to exit is requested.
      }
      return;
    }

    const newHistory = [...navHistory];
    newHistory.pop(); // Remove current
    const previousMenu = newHistory[newHistory.length - 1];
    setNavHistory(newHistory);
    setActiveMenu(previousMenu);
  };

  // Physical Back Button Logic
  React.useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (navHistory.length > 1) {
        handleBack();
      } else {
        // If they are on home (reels) and press back, we want to stay here
        // and optionally prompt if we want to mimic a real app exit
        window.history.pushState({ menu: 'reels' }, "", "");
        if (window.confirm("Exit the app?")) {
          // In most browsers we can't script close, but this satisfies the "prompt" requirement
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navHistory]);

  const uploadWithProgress = (file: File, type: string = "file"): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          setUploadMessage(`Uploading ${type}: ${percent}%`);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } catch (err) {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };
  const [appConfig, setAppConfig] = React.useState<any>(null);
  const [users, setUsers] = React.useState<UserType[]>([]);
  const [ads, setAds] = React.useState<any[]>([]);

  const [selectedChatUser, setSelectedChatUser] = React.useState<UserType | null>(null);
  const [activeInfoPage, setActiveInfoPage] = React.useState<'privacy' | 'terms' | 'about' | 'safety' | 'contact' | null>(null);

  // Listen for menu changes from other components
  React.useEffect(() => {
    const handleMenuChange = (e: any) => {
      const detail = e.detail;
      if (typeof detail === 'string') {
        navigate(detail);
        if (detail === 'profile') setProfileUser(user);
      } else if (detail && detail.menu) {
        navigate(detail.menu);
        if (detail.menu === 'profile') setProfileUser(user);
        if (detail.menu === 'chat' && detail.targetUser) {
          setSelectedChatUser(detail.targetUser);
        }
      }
    };
    const handleViewProfile = (e: any) => {
      const targetUid = e.detail;
      const targetUser = users.find(u => u.uid === targetUid);
      if (targetUser) {
        setProfileUser(targetUser);
        navigate('profile');
      }
    };

    window.addEventListener('changeMenu', handleMenuChange);
    window.addEventListener('viewProfile', handleViewProfile);
    return () => {
      window.removeEventListener('changeMenu', handleMenuChange);
      window.removeEventListener('viewProfile', handleViewProfile);
    };
  }, [user, users]);

  // Test connection to Firestore
  React.useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Favicon handling
  React.useEffect(() => {
    if (appConfig?.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = appConfig.faviconUrl;
    }
  }, [appConfig?.faviconUrl]);

  // Auth Listener
  React.useEffect(() => {
    // Safety timer: if Firebase doesn't respond in 20 seconds, 
    // at least show the app (likely in logged-out state)
    const safetyTimer = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Auth initialization timed out. Proceeding...");
        setIsAuthReady(true);
      }
    }, 20000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          // Use a more generous timeout for the primary check to avoid 'Timeout' errors on slow connections
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore Fetch Timeout')), 20000))
          ]) as any;

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            setUser(userData);
            await updateDoc(userDocRef, { isOnline: true, lastSeen: serverTimestamp() }).catch(() => {});
            if (activeMenu === 'profile' && profileUser?.uid === firebaseUser.uid) {
              setProfileUser(userData);
            }
          } else {
            // New user Signup logic
            const username = (firebaseUser.email || 'user').split('@')[0] + Math.floor(Math.random() * 1000);
            const newUser: UserType = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              username: username,
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email) ? 'admin' : 'user',
              tier: 'General',
              isVerified: false,
              verificationRequested: false,
              friends: [],
              friendRequests: [],
              sentRequests: [],
              followers: [],
              following: [],
              swipedLeft: [],
              swipedRight: [],
              matches: [],
              walletBalance: 0,
              points: 0,
              profileViews: 0,
              createdAt: serverTimestamp(),
              isOnline: true,
              lastSeen: serverTimestamp()
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Auth listener Firestore error:", error);
          
          // CRITICAL FIX: If we have a firebaseUser but Firestore failed, 
          // don't leave them at the login screen. Create a fallback user object.
          if (!user) {
            const fallbackUser: UserType = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              username: (firebaseUser.email || 'user').split('@')[0],
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email) ? 'admin' : 'user',
              gender: 'Male',
              interestedIn: 'Female',
              tier: 'General',
              isVerified: false,
              verificationRequested: false,
              friends: [],
              friendRequests: [],
              sentRequests: [],
              followers: [],
              following: [],
              swipedLeft: [],
              swipedRight: [],
              matches: [],
              walletBalance: 0,
              points: 0,
              profileViews: 0,
              createdAt: serverTimestamp(),
              isOnline: true
            };
            setUser(fallbackUser);
          }
        }
      } else {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {});
        }
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [activeMenu, profileUser?.uid]);

  // Handle Online/Offline on window focus/blur
  React.useEffect(() => {
    if (!user) return;

    const handleFocus = () => updateDoc(doc(db, 'users', user.uid), { isOnline: true, lastSeen: serverTimestamp() });
    const handleBlur = () => updateDoc(doc(db, 'users', user.uid), { isOnline: false, lastSeen: serverTimestamp() });

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user]);

  // Fetch all users for chat/dating
  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserType)));
    });
    return () => unsubscribe();
  }, [user]);

  // Ads Listener
  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sponsoredContent'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleSwipe = async (targetUid: string, direction: 'left' | 'right') => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', targetUid);

    if (direction === 'left') {
      await updateDoc(userRef, { swipedLeft: arrayUnion(targetUid) });
    } else {
      await updateDoc(userRef, { swipedRight: arrayUnion(targetUid) });

      // Check for mutual match
      const targetSnap = await getDoc(targetRef);
      const targetData = targetSnap.data() as UserType;

      if (targetData.swipedRight?.includes(user.uid)) {
        // It's a match!
        const matchId = [user.uid, targetUid].sort().join('_');
        await setDoc(doc(db, 'matches', matchId), {
          id: matchId,
          users: [user.uid, targetUid],
          createdAt: serverTimestamp()
        });

        // Add to user match lists
        await updateDoc(userRef, { matches: arrayUnion(targetUid) });
        await updateDoc(targetRef, { matches: arrayUnion(user.uid) });

        // Create notification
        await addDoc(collection(db, 'notifications'), {
          type: 'match',
          fromId: user.uid,
          fromName: user.displayName,
          toId: targetUid,
          read: false,
          createdAt: serverTimestamp()
        });

        return true; // Match found
      }
    }
    return false;
  };

  // Posts Listener (Verified & Liked first)
  React.useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      const reelsData = postsData.filter(p => p.isReel);
      
      // Enable Global Feed to avoid "broken content" gaps as requested
      const allFetchedPosts = postsData;

      const sortedPosts = [...allFetchedPosts].sort((a, b) => {
        // Boosted/Sponsored always at top
        const isABoosted = a.isBoosted || a.isSponsored;
        const isBBoosted = b.isBoosted || b.isSponsored;
        if (isABoosted && !isBBoosted) return -1;
        if (!isABoosted && isBBoosted) return 1;

        if (a.authorVerified && !b.authorVerified) return -1;
        if (!a.authorVerified && b.authorVerified) return 1;
        
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      });
      
      setPosts(sortedPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Combine Reels and Movie Trailers
  React.useEffect(() => {
    const reelsFromPosts = posts.filter(p => 
      p.isReel || 
      p.mediaType === 'video' || 
      (p.mediaUrl && (p.mediaUrl.toLowerCase().endsWith('.mp4') || p.mediaUrl.toLowerCase().endsWith('.mov')))
    );
    const trailersFromMovies = movies.filter(m => m.trailerUrl).map(m => ({
      id: `trailer-${m.id}`,
      content: `${m.title}: ${m.description}`,
      mediaUrl: m.trailerUrl,
      mediaType: 'video',
      isReel: true,
      isMovieTrailer: true,
      movieId: m.id,
      moviePrice: m.price,
      authorId: m.authorId || 'system',
      authorName: 'Blockbuster',
      authorPhoto: m.thumbnailUrl,
      authorVerified: true,
      likes: m.likes || [],
      comments: m.comments || [],
      shares: m.shares || 0,
      views: m.views || 0,
      viewedBy: m.viewedBy || [],
      createdAt: m.createdAt
    })) as Post[];

    const combined = [...reelsFromPosts, ...trailersFromMovies].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    setAllReels(combined);
  }, [posts, movies]);

  // Notifications Listener
  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('toId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    });
  }, [user]);

  // App Config Listener
  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'appConfig', 'main'), (snap) => {
      if (snap.exists()) setAppConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Movies Listener
  React.useEffect(() => {
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMovies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movies');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleSignup = async (email: string, pass: string, name: string, gender: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(firebaseUser, { displayName: name });
    
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    const newUser: UserType = {
      uid: firebaseUser.uid,
      displayName: name,
      username: username,
      email: email,
      gender: gender as any,
      role: email && ADMIN_EMAILS.includes(email) ? 'admin' : 'user',
      tier: 'General',
      isVerified: false,
      verificationRequested: false,
      friends: [],
      friendRequests: [],
      sentRequests: [],
      followers: [],
      following: [],
      walletBalance: 0,
      points: 0,
      profileViews: 0,
      swipedLeft: [],
      swipedRight: [],
      matches: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUser(newUser);
  };

  const handleResetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Please enable popups for this site to sign in with Google.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Normal dismissal, do nothing
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Google Login failed: This domain (styni.com) is not authorized in the Firebase Console. Please add it to your Firebase Authentication settings under 'Authorized Domains'.");
      } else {
        alert("Google Login failed: " + (error.message || "Unknown error occurred."));
        // Suggest trying again or checking connection
        console.log("Tip: If you are on a custom domain, ensure it is added to the Firebase Authorized Domains list.");
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const handleUpdateProfile = async (updates: Partial<UserType>, targetUid?: string) => {
    if (!user) return;
    const uid = targetUid || user.uid;
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, updates);
      
      // Update local current user state if it's the current user
      if (uid === user.uid) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
        // Update firebase profile if displayName or photoURL changed
        if (updates.displayName || updates.photoURL) {
          await updateProfile(auth.currentUser!, {
            displayName: updates.displayName,
            photoURL: updates.photoURL
          });
        }
      }

      // Update profileUser if it's the one being viewed
      if (profileUser?.uid === uid) {
        setProfileUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handlePost = async (content: string, mediaFile?: File) => {
    if (!user) return;
    try {
      let mediaUrl = null;
      let mediaType: 'image' | 'video' | undefined = undefined;
      let isReel = false;

      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Upload failed with status ${res.status}`);
          } catch {
            throw new Error(`Upload failed with status ${res.status}. Server returned non-JSON response.`);
          }
        }
        
        const data = await res.json();
        mediaUrl = data.url;
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
        if (mediaType === 'video') {
          isReel = true; 
        }
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || null,
        authorVerified: user.isVerified || false,
        content,
        mediaUrl,
        mediaType,
        isReel,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        shares: 0,
        isSponsored: false
      });

      // Award points for posting
      const pointsAward = appConfig?.pointsPerPost || 10;
      await updateDoc(doc(db, 'users', user.uid), {
        points: (user.points || 0) + pointsAward
      });
      
      console.log('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleBoost = async (postId: string, price: number, duration: number) => {
    if (!user) return;
    const cleanId = String(postId).trim();
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    const collectionName = isTrailer ? 'movies' : 'posts';

    if ((user.walletBalance || 0) < price) {
      alert(`Insufficient funds. Boosting costs $${price.toFixed(2)}.`);
      setActiveMenu('wallet');
      return;
    }

    try {
      await updateDoc(doc(db, collectionName, actualId), {
        isBoosted: true,
        boostBudget: price,
        boostDuration: duration,
        boostedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', user.uid), {
        walletBalance: (user.walletBalance || 0) - price
      });
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: price,
        type: 'boost_post',
        status: 'completed',
        method: 'wallet',
        createdAt: serverTimestamp()
      });
      alert('Post boosted successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReelUpload = async (file: File, caption: string) => {
    if (!user) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("Starting upload...");
    
    try {
      const videoUrl = await uploadWithProgress(file, "Reel");

      await addDoc(collection(db, 'posts'), {
        content: caption,
        mediaUrl: videoUrl,
        mediaType: 'video',
        isReel: true,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || null,
        authorVerified: user.isVerified || false,
        likes: [],
        comments: [],
        shares: 0,
        createdAt: serverTimestamp()
      });
      alert('Reel uploaded successfully!');
    } catch (error) {
      console.error('Error uploading reel:', error);
      alert('Failed to upload reel.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReelUpdate = async (reelId: string, updates: { content?: string }) => {
    if (!user) return;
    try {
      const reelRef = doc(db, 'posts', reelId);
      await updateDoc(reelRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      alert('Reel updated successfully!');
    } catch (error) {
      console.error('Error updating reel:', error);
      alert('Failed to update reel.');
    }
  };

  const handlePinReel = async (postId: string, isPinned: boolean) => {
    if (user?.role !== 'admin') return;
    
    try {
      if (isPinned) {
        // Enforce 3 pins limit
        const pinnedCount = allReels.filter(r => r.isPinned).length;
        if (pinnedCount >= 3) {
          alert('Maximum 3 reels can be pinned. Unpin another reel first.');
          return;
        }
      }

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isPinned,
        updatedAt: serverTimestamp()
      });
      alert(isPinned ? 'Reel pinned to top!' : 'Reel unpinned!');
    } catch (error) {
      console.error('Error pinning post:', error);
      alert('Failed to pin reel.');
    }
  };

  const handleMovieUpload = async (movieData: { title: string; description: string; movieFile: File; trailerFile?: File; thumbnailFile: File; price: number }) => {
    if (!user || user.role !== 'admin') return;
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      setUploadMessage("Uploading Thumbnail...");
      const thumbUrl = await uploadWithProgress(movieData.thumbnailFile, "Thumbnail");
      
      setUploadMessage("Uploading Movie (this may take a while)...");
      const movieUrl = await uploadWithProgress(movieData.movieFile, "Movie");
      
      let trailerUrl = null;
      if (movieData.trailerFile) {
        setUploadMessage("Uploading Trailer...");
        trailerUrl = await uploadWithProgress(movieData.trailerFile, "Trailer");
      }

      setUploadMessage("Saving details...");
      await addDoc(collection(db, 'movies'), {
        title: movieData.title,
        description: movieData.description,
        thumbnailUrl: thumbUrl,
        videoUrl: movieUrl,
        trailerUrl: trailerUrl,
        price: movieData.price,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        rating: 0,
        views: 0,
        genre: 'African Cinema'
      });
      
      alert('Movie published successfully!');
    } catch (error) {
      console.error('Error uploading movie:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload movie');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMovieUpdate = async (movieId: string, updates: { title?: string; description?: string; price?: number }) => {
    if (!user || user.role !== 'admin') return;
    try {
      const movieRef = doc(db, 'movies', movieId);
      await updateDoc(movieRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      alert('Movie updated successfully!');
    } catch (error) {
      console.error('Error updating movie:', error);
      alert('Failed to update movie.');
    }
  };

  const handleMovieDelete = async (movieId: string) => {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Are you sure you want to delete this movie? This will also delete any trailers or reels connected to it.')) return;
    
    try {
      // 1. Delete the movie document
      const movieRef = doc(db, 'movies', movieId);
      await deleteDoc(movieRef);
      
      // 2. Find and delete connected reels (posts)
      const q = query(collection(db, 'posts'), where('movieId', '==', movieId));
      const reelsSnap = await getDocs(q);
      
      const deletePromises = reelsSnap.docs.map(reelDoc => deleteDoc(doc(db, 'posts', reelDoc.id)));
      await Promise.all(deletePromises);
      
      alert('Movie and connected reels deleted successfully.');
    } catch (error) {
      console.error('Error deleting movie:', error);
      alert('Failed to delete movie.');
    }
  };

  const handlePurchaseMovie = async (movieId: string, price: number) => {
    if (!user) return;
    
    if ((user.points || 0) < price) {
      alert(`Insufficient points. You need ${price} points to unlock this movie.`);
      return;
    }

    if (user.purchasedMovies?.includes(movieId)) {
      alert('You already own this movie.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        points: increment(-price),
        purchasedMovies: arrayUnion(movieId)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: price,
        type: 'movie_purchase',
        status: 'completed',
        method: 'points',
        movieId: movieId,
        createdAt: serverTimestamp()
      });

      alert('Movie unlocked successfully! Enjoy watching.');
    } catch (err) {
      console.error('Purchase Error:', err);
      alert('Failed to process purchase.');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const cleanId = String(postId).trim();
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    const collectionName = isTrailer ? 'movies' : 'posts';
    const ref = doc(db, collectionName, actualId);
    
    const post = isTrailer 
      ? allReels.find(r => r.id === cleanId)
      : posts.find(p => p.id === cleanId);

    if (!post) return;
    const isLiked = post.likes.includes(user.uid);

    try {
      await updateDoc(ref, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      if (!isLiked) {
        // Award points for liking
        const pointsAward = appConfig?.pointsPerLike || 1;
        await updateDoc(doc(db, 'users', user.uid), {
          points: (user.points || 0) + pointsAward
        });

        if (post.authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            type: 'like',
            fromId: user.uid,
            fromName: user.displayName,
            toId: post.authorId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error(`Error liking ${collectionName}:`, error);
    }
  };

  const handleSendFriendRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      // Update receiver's incoming requests
      await updateDoc(doc(db, 'users', targetUid), {
        friendRequests: arrayUnion(user.uid)
      });
      // Update sender's outgoing requests
      await updateDoc(doc(db, 'users', user.uid), {
        sentRequests: arrayUnion(targetUid)
      });
      // Notify
      await addDoc(collection(db, 'notifications'), {
        type: 'friend_request',
        fromId: user.uid,
        fromName: user.displayName,
        toId: targetUid,
        read: false,
        createdAt: serverTimestamp()
      });
      alert('Friend request sent!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelFriendRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      // Remove from receiver's incoming requests
      await updateDoc(doc(db, 'users', targetUid), {
        friendRequests: arrayRemove(user.uid)
      });
      // Remove from sender's outgoing requests
      await updateDoc(doc(db, 'users', user.uid), {
        sentRequests: arrayRemove(targetUid)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user) return;
    try {
      // Remove from both users' friends lists
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayRemove(friendId)
      });
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptFriend = async (fromId: string, fromName: string) => {
    if (!user) return;
    try {
      // Add to both users' friends lists
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(fromId),
        friendRequests: arrayRemove(fromId)
      });
      await updateDoc(doc(db, 'users', fromId), {
        friends: arrayUnion(user.uid),
        sentRequests: arrayRemove(user.uid)
      });

      // Notify
      await addDoc(collection(db, 'notifications'), {
        type: 'friend_accepted',
        fromId: user.uid,
        fromName: user.displayName,
        toId: fromId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineFriend = async (fromId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequests: arrayRemove(fromId)
      });
      await updateDoc(doc(db, 'users', fromId), {
        sentRequests: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserAdmin = async (uid: string, updates: Partial<UserType>) => {
    if (user?.role !== 'admin') return;
    await updateDoc(doc(db, 'users', uid), updates);
  };

  const handleDelete = async (postId: string) => {
    const cleanId = String(postId).trim();
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    
    if (isTrailer) {
      handleMovieDelete(actualId);
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', actualId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${actualId}`);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) return;
    const cleanId = String(postId).trim();
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    const collectionName = isTrailer ? 'movies' : 'posts';
    const ref = doc(db, collectionName, actualId);
    
    const post = posts.find(p => p.id === cleanId) || allReels.find(r => r.id === cleanId);
    
    try {
      await updateDoc(ref, {
        comments: arrayUnion({
          id: Math.random().toString(),
          authorId: user.uid,
          authorName: user.displayName,
          content,
          createdAt: new Date()
        })
      });

      if (post && post.authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          type: 'comment',
          fromId: user.uid,
          fromName: user.displayName,
          toId: post.authorId,
          postId: cleanId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${actualId}`);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) return;
    const cleanId = String(postId).trim();
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    const collectionName = isTrailer ? 'movies' : 'posts';
    const ref = doc(db, collectionName, actualId);
    
    const post = posts.find(p => p.id === cleanId) || allReels.find(r => r.id === cleanId);

    try {
      await updateDoc(ref, {
        shares: increment(1)
      });

      if (post && post.authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          type: 'share',
          fromId: user.uid,
          fromName: user.displayName,
          toId: post.authorId,
          postId: postId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Copy link to clipboard
      const url = window.location.href;
      await navigator.clipboard.writeText(`${url}?post=${postId}`);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleView = async (postId: string) => {
    if (!user) return;
    const cleanId = String(postId).trim();
    
    // Determine target collection and path
    const isTrailer = cleanId.startsWith('trailer-');
    const actualId = isTrailer ? cleanId.replace('trailer-', '') : cleanId;
    const collectionName = isTrailer ? 'movies' : 'posts';
    const docRef = doc(db, collectionName, actualId);

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const viewsCount = (data.viewedBy || []).length;
        
        // Exclude author's own views from incrementing public metrics
        // and prevent duplicate views from the same user
        if (data.authorId === user.uid || (data.viewedBy || []).includes(user.uid)) {
          // If the counter is out of sync with unique views, we can fix it here
          if (data.views !== viewsCount) {
             await updateDoc(docRef, { views: viewsCount });
          }
          return;
        }

        await updateDoc(docRef, {
          views: increment(1),
          viewedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`View increment failed for ID: ${cleanId}`, msg);
    }
  };

  const handleFollow = async (targetUid: string) => {
    if (!user || user.uid === targetUid) return;
    const userRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', targetUid);
    
    const isFollowing = user.following?.includes(targetUid);
    
    try {
      await updateDoc(userRef, {
        following: isFollowing ? arrayRemove(targetUid) : arrayUnion(targetUid)
      });
      await updateDoc(targetRef, {
        followers: isFollowing ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      if (!isFollowing) {
        await addDoc(collection(db, 'notifications'), {
          type: 'follow',
          fromId: user.uid,
          fromName: user.displayName,
          toId: targetUid,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] overflow-hidden relative">
        {/* Animated Water Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "100%", opacity: 0.1 }}
              animate={{ 
                y: ["100%", "90%", "100%"],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ 
                duration: 5 + i, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-blue-500/5"
              style={{ bottom: i * 20 }}
            />
          ))}
        </div>

        {/* Water Splash Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 4, 10], 
                opacity: [0.8, 0.3, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                delay: i * 0.4,
                ease: "easeOut" 
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-500/30"
              style={{ width: '100px', height: '100px' }}
            />
          ))}
          
          {/* Splashing Droplets */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`drop-${i}`}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 800,
                y: (Math.random() - 0.5) * 800,
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 3,
                ease: "circOut" 
              }}
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400/60 to-blue-400/40"
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -10, 0],
            rotate: [-1, 1, -1]
          }}
          transition={{ 
            scale: { duration: 0.5 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="text-center relative z-10"
        >
          <div className="relative mx-auto mb-12 flex h-48 w-48 items-center justify-center">
            {/* Pulsing Water Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl"
            />

            {/* Spinning Outer Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0 rounded-[3.5rem] border-4 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-4 rounded-[3rem] border-2 border-dashed border-orange-600/40"
            />
            
            {/* Logo and floating icons */}
            {appConfig?.logoUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 flex justify-center"
              >
                <img 
                  src={appConfig.logoUrl} 
                  alt="Logo" 
                  className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(234,88,12,0.4)]" 
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-600/10"
              >
                <Video size={40} className="text-orange-500" />
              </motion.div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              {APP_NAME}
            </h1>
            
            {/* Menu words removed */}

            <div className="relative w-64 mx-auto h-2 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            <motion.p 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 text-[11px] font-bold text-neutral-400 uppercase tracking-[0.3em]"
            >
              Launching Experience
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} onSignup={handleSignup} onGoogleLogin={handleGoogleLogin} onResetPassword={handleResetPassword} />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] font-sans text-white">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onMenuClick={(menu) => {
          if (menu === 'upload') {
            setIsGlobalUploadOpen(true);
            return;
          }
          navigate(menu);
          if (menu === 'profile') setProfileUser(user);
        }} 
        activeMenu={activeMenu}
        notificationCount={notifications.filter(n => !n.read).length}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        appConfig={appConfig}
      />

      <main className={`mx-auto ${
        activeMenu === 'chat' || activeMenu === 'reels' || activeMenu === 'live'
          ? 'max-w-none px-0 h-[calc(100vh-72px)] md:h-[calc(100vh-84px)] mt-[72px] md:mt-[84px] overflow-hidden' 
          : 'max-w-7xl px-4 pt-[110px] pb-12 md:px-6 md:pt-24 min-h-screen'
      }`}>
        {activeMenu === 'profile' && profileUser ? (
          <Profile 
            user={profileUser}
            currentUser={user}
            users={users}
            posts={posts}
            onUpdateProfile={(updates) => handleUpdateProfile(updates, profileUser.uid)}
            onLike={handleLike}
            onDelete={handleDelete}
            onComment={handleComment}
            onBoost={handleBoost}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriend={handleAcceptFriend}
            onDeclineFriend={handleDeclineFriend}
            onCancelFriendRequest={handleCancelFriendRequest}
            onUnfriend={handleUnfriend}
            onFollow={handleFollow}
            onBack={handleBack}
          />
        ) : activeMenu === 'friends' ? (
          <FriendsPage 
            currentUser={user}
            users={users}
            onAcceptFriend={handleAcceptFriend}
            onDeclineFriend={handleDeclineFriend}
            onCancelFriendRequest={handleCancelFriendRequest}
            onSendFriendRequest={handleSendFriendRequest}
            onUnfriend={handleUnfriend}
            onViewProfile={(uid) => {
              const target = users.find(u => u.uid === uid);
              if (target) {
                setProfileUser(target);
                navigate('profile');
              }
            }}
          />
        ) : activeMenu === 'admin' && user?.role === 'admin' ? (
          <AdminDashboard currentUser={user} onUpdateUser={handleUpdateUserAdmin} />
        ) : activeMenu === 'wallet' ? (
          <Wallet user={user} onUpdateUser={handleUpdateProfile} />
        ) : activeMenu === 'reels' ? (
          <Reels 
            posts={allReels} 
            currentUser={user} 
            onLike={handleLike} 
            onComment={handleComment} 
            onUpload={handleReelUpload}
            onUpdateReel={handleReelUpdate}
            onPinReel={handlePinReel}
            onDelete={handleDelete}
            onFollow={handleFollow}
            onShare={handleShare}
            onView={handleView}
            onChat={(targetUser) => {
              setSelectedChatUser(targetUser);
              navigate('chat');
            }}
            users={users}
            onPurchaseMovie={handlePurchaseMovie}
          />
        ) : activeMenu === 'live' ? (
          <Live />
        ) : activeMenu === 'upgrade' ? (
          <Upgrade user={user} onUpgrade={(tier) => handleUpdateProfile({ tier: tier as any })} />
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar - Profile & Requests */}
            {activeMenu !== 'blockbuster' && activeMenu !== 'chat' && (
              <Sidebar 
                user={user} 
                users={users}
                friendRequests={user?.friendRequests || []} 
                onAcceptFriend={handleAcceptFriend} 
                onDeclineFriend={handleDeclineFriend} 
                onSendFriendRequest={handleSendFriendRequest}
                onProfileClick={() => {
                  navigate('profile');
                  setProfileUser(user);
                }}
                onMenuClick={navigate}
                activeMenu={activeMenu}
              />
            )}

            {/* Main Content Area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMenu}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeMenu === 'chat' && user && (
                    <Chat currentUser={user} users={users} initialSelectedUser={selectedChatUser} />
                  )}
                  {activeMenu === 'dating' && user && (
                    <Dating currentUser={user} onSwipe={handleSwipe} />
                  )}
                  {activeMenu === 'blockbuster' && (
                    <Blockbuster 
                      movies={movies} 
                      currentUser={user} 
                      onUpload={handleMovieUpload} 
                      onUpdateMovie={handleMovieUpdate}
                      onDeleteMovie={handleMovieDelete}
                      onPurchase={handlePurchaseMovie}
                      onDeposit={() => navigate('wallet')}
                    />
                  )}
                  {(activeMenu === 'feed' || activeMenu === 'reels') && (
                    <Feed 
                      posts={posts} 
                      currentUser={user} 
                      users={users}
                      onPost={handlePost} 
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onComment={handleComment}
                      onBoost={handleBoost}
                      onFollow={handleFollow}
                      onShare={handleShare}
                      onReelUploadClick={() => setIsGlobalUploadOpen(true)}
                      ads={ads}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar - Suggestions & Ads */}
            {activeMenu !== 'blockbuster' && activeMenu !== 'chat' && (
              <div className="hidden w-80 flex-col gap-6 xl:flex">
                {/* Sponsored Card */}
                {ads.filter(a => a.active).length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
                    <div className="relative aspect-video">
                      <img src={ads.filter(a => a.active)[0].imageUrl} alt="Ad" className="h-full w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                        Sponsored
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="mb-2 text-sm font-black text-white">{ads.filter(a => a.active)[0].title}</h4>
                      <p className="mb-4 text-xs leading-relaxed text-neutral-400">{ads.filter(a => a.active)[0].description}</p>
                      <a 
                        href={ads.filter(a => a.active)[0].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl bg-orange-600 py-2.5 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                      >
                        Learn More
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
                    <div className="relative aspect-video">
                      <img src="https://picsum.photos/seed/safari/400/225" alt="Ad" className="h-full w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                        Sponsored
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="mb-2 text-sm font-black text-white">Explore the Serengeti</h4>
                      <p className="mb-4 text-xs leading-relaxed text-neutral-400">Book your next adventure with STYN Travel. Exclusive discounts for Platinum members.</p>
                      <button className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95">
                        Book Now
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-white/5 bg-neutral-900 p-6 shadow-xl ring-1 ring-white/5">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Suggested Friends</h4>
                  <div className="space-y-4">
                    {users.filter(u => u.uid !== user.uid).slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-500">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-white">{u.displayName}</span>
                        </div>
                        <button 
                          onClick={() => handleFollow(u.uid)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            user.following?.includes(u.uid) 
                              ? 'bg-neutral-800 text-neutral-400' 
                              : 'bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white'
                          }`}
                        >
                          {user.following?.includes(u.uid) ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {(activeMenu === 'feed' || activeMenu === 'profile' || activeMenu === 'dating' || activeMenu === 'blockbuster') && (
        <Footer 
          appConfig={appConfig} 
          onOpenPrivacy={() => setActiveInfoPage('privacy')}
          onOpenTerms={() => setActiveInfoPage('terms')}
          onOpenAbout={() => setActiveInfoPage('about')}
          onOpenSafety={() => setActiveInfoPage('safety')}
          onOpenContact={() => setActiveInfoPage('contact')}
        />
      )}

      <AnimatePresence>
        {activeInfoPage && (
          <InfoPages 
            type={activeInfoPage} 
            onClose={() => setActiveInfoPage(null)} 
          />
        )}
      </AnimatePresence>

      <UploadReel 
        isOpen={isGlobalUploadOpen} 
        onClose={() => setIsGlobalUploadOpen(false)} 
        onUpload={handleReelUpload}
      />

      {/* Upload Progress Indicator */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-3xl bg-neutral-900 p-8 shadow-2xl ring-1 ring-white/10"
            >
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-6 h-24 w-24">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="white"
                      strokeOpacity="0.1"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * uploadProgress) / 100 }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{uploadProgress}%</span>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Uploading Content</h3>
                <p className="text-center text-sm text-neutral-400">{uploadMessage}</p>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                <motion.div
                  className="h-full bg-orange-600"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Please do not close the window
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

