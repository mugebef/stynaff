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
import { Pages } from './components/Pages';
import { Groups } from './components/Groups';
import { Status } from './components/Status';
import { Footer } from './components/Footer';
import { Post, User as UserType, Notification, Page, Group } from './types';
import { Globe, Loader2, LayoutDashboard, Wallet as WalletIcon, Video, Bell, Users, Flag, User } from 'lucide-react';
import { APP_NAME, ADMIN_EMAIL } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  auth, 
  db, 
  googleProvider 
} from './firebase';
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
  const [activeMenu, setActiveMenu] = React.useState('feed');
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<UserType | null>(null);
  const [pages, setPages] = React.useState<Page[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [appConfig, setAppConfig] = React.useState<any>(null);
  const [users, setUsers] = React.useState<UserType[]>([]);

  // Listen for menu changes from other components
  React.useEffect(() => {
    const handleMenuChange = (e: any) => {
      setActiveMenu(e.detail);
      if (e.detail === 'profile') setProfileUser(user);
    };
    window.addEventListener('changeMenu', handleMenuChange);
    return () => window.removeEventListener('changeMenu', handleMenuChange);
  }, [user]);

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
              followers: [],
              following: [],
              joinedGroups: [],
              followedPages: [],
              walletBalance: 0,
              points: 0,
              profileViews: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [activeMenu, profileUser?.uid]);

  // Posts Listener (Verified & Liked first)
  React.useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Algorithm: Verified users first, then most liked
      const sortedPosts = [...postsData].sort((a, b) => {
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

  // Pages & Groups Listeners
  React.useEffect(() => {
    if (!user) return;
    const unsubPages = onSnapshot(collection(db, 'pages'), (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Page)));
    });
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data() } as UserType)));
    });
    return () => { unsubPages(); unsubGroups(); unsubUsers(); };
  }, [user]);

  // App Config Listener
  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'appConfig', 'main'), (snap) => {
      if (snap.exists()) setAppConfig(snap.data());
    });
    return () => unsub();
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
      gender: gender,
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      tier: 'General',
      isVerified: false,
      verificationRequested: false,
      friends: [],
      friendRequests: [],
      followers: [],
      following: [],
      joinedGroups: [],
      followedPages: [],
      walletBalance: 0,
      points: 0,
      profileViews: 0,
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
        if (mediaFile.size > 2000000) {
          throw new Error('File size too large. Please upload a file smaller than 2MB.');
        }
        
        const formData = new FormData();
        formData.append('file', mediaFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        mediaUrl = data.url;
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
        
        // Reels logic: video < 15s (simulated check)
        if (mediaType === 'video') {
          isReel = true; // In real app, check video duration
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
      await updateDoc(doc(db, 'users', user.uid), {
        points: (user.points || 0) + 10
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleBoost = async (postId: string) => {
    if (!user) return;
    const boostPrice = appConfig?.boostPricePerDay || 5.00;
    if ((user.walletBalance || 0) < boostPrice) {
      alert(`Insufficient funds. Boosting costs $${boostPrice.toFixed(2)}.`);
      setActiveMenu('wallet');
      return;
    }

    try {
      await updateDoc(doc(db, 'posts', postId), {
        isBoosted: true,
        boostBudget: boostPrice
      });
      await updateDoc(doc(db, 'users', user.uid), {
        walletBalance: (user.walletBalance || 0) - boostPrice
      });
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: boostPrice,
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

  const handleLike = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });

    if (!isLiked && post.authorId !== user.uid) {
      await addDoc(collection(db, 'notifications'), {
        type: 'like',
        fromId: user.uid,
        fromName: user.displayName,
        toId: post.authorId,
        read: false,
        createdAt: serverTimestamp()
      });
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
        friends: arrayUnion(user.uid)
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
    await updateDoc(doc(db, 'users', user.uid), {
      friendRequests: arrayRemove(fromId)
    });
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

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-600 text-white shadow-2xl shadow-orange-200">
            <Globe size={48} className="animate-pulse" />
            <div className="absolute -inset-2 animate-ping rounded-3xl border-2 border-orange-600/20"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">STYN AFRICA</h1>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-orange-600" size={18} />
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Connecting...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} onSignup={handleSignup} onGoogleLogin={handleGoogleLogin} onResetPassword={handleResetPassword} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onMenuClick={(menu) => {
          setActiveMenu(menu);
          if (menu === 'profile') setProfileUser(user);
        }} 
        activeMenu={activeMenu}
        notificationCount={notifications.filter(n => !n.read).length}
      />

      <main className="mx-auto max-w-7xl px-4 pt-20 pb-12 md:px-6">
        {activeMenu === 'profile' && profileUser ? (
          <Profile 
            user={profileUser}
            currentUser={user}
            posts={posts}
            onUpdateProfile={(updates) => handleUpdateProfile(updates, profileUser.uid)}
            onLike={handleLike}
            onDelete={handleDelete}
            onComment={handleComment}
          />
        ) : activeMenu === 'admin' && user?.role === 'admin' ? (
          <AdminDashboard currentUser={user} onUpdateUser={handleUpdateUserAdmin} />
        ) : activeMenu === 'wallet' ? (
          <Wallet user={user} onUpdateUser={handleUpdateProfile} />
        ) : activeMenu === 'reels' ? (
          <Reels posts={posts} currentUser={user} onLike={handleLike} onComment={handleComment} />
        ) : activeMenu === 'pages' ? (
          <Pages pages={pages} currentUser={user} />
        ) : activeMenu === 'groups' ? (
          <Groups groups={groups} currentUser={user} />
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar - Profile & Requests */}
            <Sidebar 
              user={user} 
              friendRequests={user?.friendRequests || []} 
              onAcceptFriend={handleAcceptFriend} 
              onDeclineFriend={handleDeclineFriend} 
              onProfileClick={() => {
                setActiveMenu('profile');
                setProfileUser(user);
              }}
              onMenuClick={setActiveMenu}
            />

            {/* Main Content Area */}
            <div className="flex-1">
              <Status user={user} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMenu}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeMenu === 'feed' && (
                    <Feed 
                      posts={posts} 
                      currentUser={user} 
                      onPost={handlePost} 
                      onLike={handleLike} 
                      onDelete={handleDelete} 
                      onComment={handleComment} 
                      onBoost={handleBoost}
                    />
                  )}
                  {activeMenu === 'chat' && <Chat currentUser={user} users={users} />}
                  {activeMenu === 'dating' && <Dating />}
                  {activeMenu === 'blockbuster' && <Blockbuster />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar - Suggestions (Placeholder) */}
            <div className="hidden w-80 flex-col gap-6 xl:flex">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-900">Suggested Friends</h4>
                <div className="space-y-4">
                  {users.filter(u => u.uid !== user.uid).slice(0, 5).map(u => (
                    <div key={u.uid} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-neutral-900">{u.displayName}</span>
                      </div>
                      <button className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-all">
                        Connect
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

