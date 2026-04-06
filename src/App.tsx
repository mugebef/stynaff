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
import { Footer } from './components/Footer';
import { Post, User as UserType } from './types';
import { Globe, Loader2 } from 'lucide-react';
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
  updateProfile 
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
  getDocFromServer
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
  const [friendRequests, setFriendRequests] = React.useState<any[]>([]);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<UserType | null>(null);

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
            const newUser: UserType = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'user',
              friends: [],
              friendRequests: [],
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

  // Posts Listener
  React.useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const handleLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleSignup = async (email: string, pass: string, name: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(firebaseUser, { displayName: name });
    
    const newUser: UserType = {
      uid: firebaseUser.uid,
      displayName: name,
      email: email,
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      friends: [],
      friendRequests: [],
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUser(newUser);
  };

  const handleGoogleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleLogout = () => signOut(auth);

  const handleUpdateProfile = async (updates: Partial<UserType>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, updates);
      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      if (profileUser?.uid === user.uid) {
        setProfileUser(prev => prev ? { ...prev, ...updates } : null);
      }
      // Update firebase profile if displayName or photoURL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser!, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handlePost = async (content: string, mediaFile?: File) => {
    if (!user) return;
    try {
      let mediaUrl = null;
      let mediaType: 'image' | 'video' | undefined = undefined;

      if (mediaFile) {
        // Simulate upload by using base64 for small files
        const reader = new FileReader();
        mediaUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(mediaFile);
        });
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || null,
        content,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
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
    return <Auth onLogin={handleLogin} onSignup={handleSignup} onGoogleLogin={handleGoogleLogin} />;
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
      />

      <main className="mx-auto max-w-7xl px-4 pt-20 pb-12 md:px-6">
        {activeMenu === 'profile' && profileUser ? (
          <Profile 
            user={profileUser}
            currentUser={user}
            posts={posts}
            onUpdateProfile={handleUpdateProfile}
            onLike={handleLike}
            onDelete={handleDelete}
            onComment={handleComment}
          />
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar - Profile & Requests */}
            <Sidebar 
              user={user} 
              friendRequests={friendRequests} 
              onAcceptFriend={() => {}} 
              onDeclineFriend={() => {}} 
              onProfileClick={() => {
                setActiveMenu('profile');
                setProfileUser(user);
              }}
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
                  {activeMenu === 'feed' && (
                    <Feed 
                      posts={posts} 
                      currentUser={user} 
                      onPost={handlePost} 
                      onLike={handleLike} 
                      onDelete={handleDelete} 
                      onComment={handleComment} 
                    />
                  )}
                  {activeMenu === 'chat' && <Chat />}
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
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-neutral-100"></div>
                        <span className="text-sm font-bold text-neutral-900">User {i}</span>
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

