// Core type definitions for The Property Gateway

export interface User {
  id: string;
  email: string;
  role: 'agent' | 'buyer';
  preferredLanguage: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  agentId: string;
  buyerId: string;
  propertyAddress: string;
  status: TransactionStatus;
  currentMilestone: number;
  milestones: Milestone[];
  messages: Message[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

export interface Message {
  id: string;
  transactionId: string;
  senderId: string;
  content: string;
  originalContent?: string; // For translated messages
  translatedContent?: string;
  senderLanguage: string;
  recipientLanguage?: string;
  createdAt: string;
  isTranslated: boolean;
  translated_text?: Record<string, string>; // Cached translations by language code
}

export interface Document {
  id: string;
  transactionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export type TransactionStatus = 
  | 'created' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type Language = 
  | 'en' 
  | 'it' 
  | 'es' 
  | 'fr' 
  | 'de';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'buyer';
  preferredLanguage: Language;
}

export interface CreateTransactionForm {
  buyerEmail: string;
  propertyAddress: string;
}

export interface MessageForm {
  content: string;
}