export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  tier: 'General' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  isVerified: boolean;
  verificationRequested: boolean;
  bio?: string;
  location?: {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  age?: number;
  gender?: string;
  interestedIn?: string;
  friends: string[]; // Array of UIDs
  friendRequests: string[]; // Array of UIDs
  walletBalance: number;
  points: number;
  profileViews: number;
  createdAt: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorVerified?: boolean;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isReel?: boolean;
  duration?: number;
  createdAt: any; // Firestore Timestamp
  likes: string[]; // Array of UIDs
  comments: Comment[];
  shares: number;
  isSponsored?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'profile_view' | 'like' | 'comment';
  fromId: string;
  fromName: string;
  toId: string;
  read: boolean;
  createdAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'points_conversion' | 'ad_payment' | 'verification_payment';
  status: 'pending' | 'completed' | 'failed';
  method: 'manual' | 'wallet';
  createdAt: any;
}
