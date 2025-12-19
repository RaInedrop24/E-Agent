import { LanguageOption, Milestone } from '@/types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

export const DEFAULT_MILESTONES: Omit<Milestone, 'id' | 'isCompleted' | 'completedAt'>[] = [
  {
    title: 'Offer Accepted',
    description: 'Initial offer has been accepted by the seller',
    order: 1,
  },
  {
    title: 'Preliminary Contract',
    description: 'Preliminary contract (compromesso) signed',
    order: 2,
  },
  {
    title: 'Deposit Paid',
    description: 'Initial deposit payment completed',
    order: 3,
  },
  {
    title: 'Survey & Inspection',
    description: 'Property survey and technical inspection completed',
    order: 4,
  },
  {
    title: 'Mortgage Approved',
    description: 'Mortgage application approved by bank',
    order: 5,
  },
  {
    title: 'Final Deed (Rogito)',
    description: 'Final deed signed at notary office',
    order: 6,
  },
  {
    title: 'Keys Handed Over',
    description: 'Property keys transferred to new owner',
    order: 7,
  },
];

export const USER_ROLES = {
  AGENT: 'agent' as const,
  BUYER: 'buyer' as const,
};

export const TRANSACTION_STATUS = {
  CREATED: 'created' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
};

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  TRANSACTIONS: '/api/transactions',
  MESSAGES: '/api/messages',
  UPLOAD: '/api/upload',
  TRANSLATE: '/api/translate',
} as const;