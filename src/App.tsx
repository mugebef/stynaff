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
import { Footer } from './components/Footer';
import { Upgrade } from './components/Upgrade';
import { FriendsPage } from './components/FriendsPage';
import { Post, User as UserType, Notification } from './types';
import { Globe, Loader2, LayoutDashboard, Wallet as WalletIcon, Video, Bell, Users, Flag, User, Heart, Play, MessageSquare } from 'lucide-react';
import { APP_NAME, ADMIN_EMAIL } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
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
  where
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
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
  const [profileUser, setProfileUser] = React.useState<UserType | null>(null);
  const [appConfig, setAppConfig] = React.useState<any>(null);
  const [users, setUsers] = React.useState<UserType[]>([]);
  const [ads, setAds] = React.useState<any[]>([]);

  const [selectedChatUser, setSelectedChatUser] = React.useState<UserType | null>(null);

  // Listen for menu changes from other components
  React.useEffect(() => {
    const handleMenuChange = (e: any) => {
      const detail = e.detail;
      if (typeof detail === 'string') {
        setActiveMenu(detail);
        if (detail === 'profile') setProfileUser(user);
      } else if (detail && detail.menu) {
        setActiveMenu(detail.menu);
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
        setActiveMenu('profile');
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            setUser(userData);
            // Update online status
            await updateDoc(userDocRef, { isOnline: true, lastSeen: serverTimestamp() });
            if (activeMenu === 'profile' && profileUser?.uid === firebaseUser.uid) {
              setProfileUser(userData);
            }
          } else {
            // Create user profile if it doesn't exist
            const username = (firebaseUser.email || 'user').split('@')[0] + Math.floor(Math.random() * 1000);
            const newUser: UserType = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              username: username,
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'user',
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
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        if (user) {
          // Set offline
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, { isOnline: false, lastSeen: serverTimestamp() });
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
      setAllReels(reelsData);
      
      // Algorithm: Filter to self/friends/sponsored, then sort
      const filteredPosts = postsData.filter(p => 
        p.authorId === user.uid || 
        user.friends?.includes(p.authorId) || 
        p.isSponsored || 
        p.isBoosted
      );

      const sortedPosts = [...filteredPosts].sort((a, b) => {
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
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
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
    await signInWithPopup(auth, googleProvider);
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
    if ((user.walletBalance || 0) < price) {
      alert(`Insufficient funds. Boosting costs $${price.toFixed(2)}.`);
      setActiveMenu('wallet');
      return;
    }

    try {
      await updateDoc(doc(db, 'posts', postId), {
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
    
    try {
      const formData = new FormData();
      formData.append('file', file);
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
      const videoUrl = data.url;

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
    } catch (error) {
      console.error('Error uploading reel:', error);
      throw error;
    }
  };

  const handleMovieUpload = async (movieData: { title: string; description: string; movieFile: File; trailerFile?: File; thumbnailFile: File; price: number }) => {
    if (!user || user.role !== 'admin') return;
    try {
      const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
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
        return data.url;
      };
      
      const thumbUrl = await uploadFile(movieData.thumbnailFile);
      const movieUrl = await uploadFile(movieData.movieFile);
      let trailerUrl = null;
      if (movieData.trailerFile) {
        trailerUrl = await uploadFile(movieData.trailerFile);
      }

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
      throw error;
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
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    await updateDoc(postRef, {
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
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: Math.random().toString(),
          authorId: user.uid,
          authorName: user.displayName,
          content,
          createdAt: new Date()
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        shares: increment(1)
      });
      // Copy link to clipboard
      const url = window.location.href;
      await navigator.clipboard.writeText(`${url}?post=${postId}`);
    } catch (error) {
      console.error('Error sharing post:', error);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-12 flex h-40 w-40 items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-0 rounded-[3rem] border-2 border-dashed border-orange-600/20"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-4 rounded-[2.5rem] border border-orange-600/10"
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-2xl shadow-orange-900/40 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              {appConfig?.logoUrl ? (
                <img src={appConfig.logoUrl} alt="Logo" className="relative h-full w-full object-contain p-4" />
              ) : (
                <span className="relative text-4xl font-black italic tracking-tighter">S</span>
              )}
            </div>
            
            {/* Floating Icons */}
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ repeat: Infinity, duration: 3, delay: 0 }}
              className="absolute -top-6 -right-6 rounded-2xl bg-neutral-900 p-4 text-pink-500 shadow-2xl border border-white/5 backdrop-blur-xl"
            >
              <Heart size={24} fill="currentColor" />
            </motion.div>
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.7 }}
              className="absolute -bottom-6 -left-6 rounded-2xl bg-neutral-900 p-4 text-orange-500 shadow-2xl border border-white/5 backdrop-blur-xl"
            >
              <Play size={24} fill="currentColor" />
            </motion.div>
            <motion.div 
              animate={{ 
                x: [0, -10, 0],
                y: [0, 10, 0]
              }}
              transition={{ repeat: Infinity, duration: 4, delay: 1.4 }}
              className="absolute top-1/2 -left-12 -translate-y-1/2 rounded-2xl bg-neutral-900 p-4 text-indigo-500 shadow-2xl border border-white/5 backdrop-blur-xl"
            >
              <MessageSquare size={24} fill="currentColor" />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="mb-2 text-6xl font-black italic tracking-tighter text-white">
              STYN
            </h1>
            <p className="mb-12 text-xs font-black uppercase tracking-[0.5em] text-orange-500">
              Unique Experience
            </p>
          </motion.div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-900">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="h-full w-full bg-gradient-to-r from-transparent via-orange-600 to-transparent"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Initializing Secure Connection</p>
          </div>
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
          setActiveMenu(menu);
          if (menu === 'profile') setProfileUser(user);
        }} 
        activeMenu={activeMenu}
        notificationCount={notifications.filter(n => !n.read).length}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        appConfig={appConfig}
      />

      <main className="mx-auto max-w-7xl px-4 pt-20 pb-12 md:px-6">
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
                setActiveMenu('profile');
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
            onFollow={handleFollow}
            onShare={handleShare}
            onChat={(targetUser) => {
              setSelectedChatUser(targetUser);
              setActiveMenu('chat');
            }}
            users={users}
          />
        ) : activeMenu === 'live' ? (
          <Live />
        ) : activeMenu === 'upgrade' ? (
          <Upgrade user={user} onUpgrade={(tier) => handleUpdateProfile({ tier: tier as any })} />
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar - Profile & Requests */}
            <Sidebar 
              user={user} 
              users={users}
              friendRequests={user?.friendRequests || []} 
              onAcceptFriend={handleAcceptFriend} 
              onDeclineFriend={handleDeclineFriend} 
              onSendFriendRequest={handleSendFriendRequest}
              onProfileClick={() => {
                setActiveMenu('profile');
                setProfileUser(user);
              }}
              onMenuClick={setActiveMenu}
            />

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
                      onPurchase={handlePurchaseMovie}
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
                      ads={ads}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar - Suggestions & Ads */}
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

