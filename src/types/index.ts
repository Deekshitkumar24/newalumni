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
  graduationYear: number;
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
  requirements: string[];
  type: 'full-time' | 'part-time' | 'internship';
  applicationLink?: string;
  postedBy: string;
  postedByName: string;
  postedAt: string;
  isActive: boolean;
  status: 'active' | 'closed' | 'pending' | 'rejected';
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
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
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
  order: number;
  isActive: boolean;
}

// Notice Types
export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'general' | 'event' | 'news' | 'important';
  isActive: boolean;
}

// Gallery Types
export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  category: 'campus' | 'events' | 'reunion' | 'other';
  date: string;
}
