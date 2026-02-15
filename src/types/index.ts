// User Types
export type UserRole = 'student' | 'alumni' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  profileImage?: string;
  avatar?: string;
  department?: string;
}

export interface Student extends User {
  role: 'student';
  rollNumber: string;
  department: string;
  batch: number;
  skills: string[];
  interests: string[];
  linkedIn?: string;
}

export interface Alumni extends User {
  role: 'alumni';
  graduationYear: number;
  department: string;
  currentCompany?: string;
  currentRole?: string;
  linkedIn?: string;
  careerJourney?: string;
  imageUrl?: string;
}

export interface Admin extends User {
  role: 'admin';
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  posterImage?: string;
  link?: string;
  eventType: 'upcoming' | 'past';
  status: 'upcoming' | 'past' | 'cancelled' | 'pending'; // Combined status for lifecycle and moderation
  registrations: string[]; // User IDs
  createdBy: string;
  createdAt: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type: 'full_time' | 'part_time' | 'internship'; // Updated enum values to match DB
  status: 'open' | 'closed';
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  poster?: {
    id: string;
    fullName: string;
    role: string;
    profileImage?: string;
  };
  applicationLink?: string;
  // Legacy fields (optional compatibility)
  postedByName?: string;
  postedAt?: string;
  isActive?: boolean;
}

// Mentorship Types
export type MentorshipStatus = 'pending' | 'accepted' | 'rejected';

export interface MentorshipRequest {
  id: string;
  studentId: string;
  alumniId: string;
  message: string;
  status: MentorshipStatus;
  createdAt: string;
  respondedAt?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: (string | Partial<User>)[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedSource?: string;
}

// Batch Discussion Types
export interface BatchPost {
  id: string;
  batchYear: number;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  replies: BatchReply[];
}

export interface BatchReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
}

// Slider Image Types
export interface SliderImage {
  id: string;
  imageUrl: string;
  title: string;
  link?: string;
  linkUrl?: string; // Added field
  displayOrder: number; // Renamed from order
  isActive: boolean;
  createdAt?: string;
}

// Notice Types
export interface Notice {
  id: string;
  title: string;
  content: string;

  type: 'general' | 'event' | 'news' | 'important';
  isActive: boolean;
  createdAt: string;
}

// Gallery Types
export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  category: string; // Changed from strict union for flexibility
  date: string; // Mapped from createdAt
  isActive?: boolean;
  userId?: string;
}

// Report Types
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole: UserRole;
  conversationId: string;
  reason: string;
  description: string;
  messagesSnapshot: Message[]; // Deep copy of last 20 messages
  status: ReportStatus;
  adminNotes?: string;
  timestamp: string;
  updatedAt: string;
}
