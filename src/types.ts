export interface User {
  uid: string;
  displayName: string;
  username?: string;
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
  gender?: 'Male' | 'Female' | 'Other';
  interestedIn?: 'Male' | 'Female' | 'Everyone';
  interests?: string[];
  mood?: string;
  friends: string[]; // Array of UIDs
  friendRequests: string[]; // Array of UIDs
  followers: string[]; // Array of UIDs
  following: string[]; // Array of UIDs
  swipedLeft: string[]; // Array of UIDs
  swipedRight: string[]; // Array of UIDs
  matches: string[]; // Array of UIDs
  walletBalance: number;
  points: number;
  profileViews: number;
  createdAt: any;
  joinedGroups: string[]; // Array of Group IDs
  followedPages: string[]; // Array of Page IDs
  isOnline?: boolean;
  lastSeen?: any;
  typingTo?: string | null;
  anonymousMode?: boolean;
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
  reactions?: { [uid: string]: string }; // uid -> reaction type (heart, laugh, etc)
  comments: Comment[];
  shares: number;
  isSponsored?: boolean;
  isBoosted?: boolean;
  boostBudget?: number;
  targetAudience?: string;
  pageId?: string; // If posted by a page
  groupId?: string; // If posted in a group
  hashtags?: string[];
  mentions?: string[];
}

export interface Page {
  id: string;
  name: string;
  description: string;
  category: string;
  ownerId: string;
  photoURL?: string;
  coverURL?: string;
  isVerified: boolean;
  followers: string[]; // Array of UIDs
  createdAt: any;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  photoURL?: string;
  members: string[]; // Array of UIDs
  isPrivate: boolean;
  createdAt: any;
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
  type: 'friend_request' | 'friend_accepted' | 'profile_view' | 'like' | 'comment' | 'group_invite' | 'page_post' | 'match';
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
  type: 'deposit' | 'withdrawal' | 'points_conversion' | 'ad_payment' | 'verification_payment' | 'boost_payment' | 'gift';
  status: 'pending' | 'completed' | 'failed';
  method: 'manual' | 'wallet';
  createdAt: any;
}

export interface AppConfig {
  id: 'main';
  pointsToCashRate: number; // e.g., 0.01
  boostPricePerDay: number; // e.g., 5.00
  verificationPrice: number; // e.g., 10.00
  giftPrices?: { [giftId: string]: number };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  mediaUrl?: string;
  createdAt: any;
  read: boolean;
  status: 'sent' | 'delivered' | 'seen';
  replyTo?: string; // Message ID
  reactions?: { [uid: string]: string };
}

export interface Status {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
}

export interface DatingMatch {
  id: string;
  users: string[]; // [uid1, uid2]
  createdAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
}
