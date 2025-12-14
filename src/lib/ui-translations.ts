/**
 * UI Translation System
 * Provides translations for all static UI elements across the site
 * 
 * ⚠️ IMPORTANT - Translation Workflow for Developers:
 * 
 * 1. ALWAYS add translations when creating new UI elements
 * 2. Add keys to BOTH 'en' and 'it' objects
 * 3. Use dot notation: 'category.subcategory.key'
 * 4. Use {{variables}} for dynamic content
 * 5. Test in both languages before committing
 * 
 * Quick Reference: See TRANSLATION_GUIDE.md
 * Full Documentation: See TRANSLATION_IMPLEMENTATION.md
 * 
 * Usage in components:
 *   import { useLanguage } from '@/contexts/LanguageContext';
 *   const { t, tVar } = useLanguage();
 *   <Button>{t('action.save')}</Button>
 *   <p>{tVar('message.count', { count: 5 })}</p>
 */

import { SupportedLanguage } from './translation';

export type TranslationKey = keyof typeof translations.en;

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.siteAdmin': 'Site Admin',
    
    // Common actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.create': 'Create',
    'action.submit': 'Submit',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.send': 'Send',
    'action.upload': 'Upload',
    'action.download': 'Download',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.activeTransactions': 'Active Transactions',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noActivity': 'No recent activity',
    'dashboard.noTransactions': 'No transactions yet',
    'dashboard.createFirst': 'Create your first transaction to get started',
    'dashboard.newMessages': 'New Messages',
    'dashboard.viewAll': 'View All',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.complete': 'complete',
    'dashboard.milestoneCompleted': 'Milestone completed: {{milestone}}',
    'dashboard.newMessageFrom': 'New message from {{author}}',
    'dashboard.fileUploaded': 'File uploaded: {{filename}}',
    
    // Transactions
    'transactions.title': 'Transactions',
    'transactions.my': 'My Transactions',
    'transactions.create': 'Create Transaction',
    'transactions.createNew': 'Create New Transaction',
    'transactions.new': 'New Transaction',
    'transactions.propertyAddress': 'Property Address',
    'transactions.status': 'Status',
    'transactions.progress': 'Progress',
    'transactions.participants': 'Participants',
    'transactions.noTransactions': 'No transactions found',
    'transactions.found': '{{count}} transactions found',
    'transactions.viewDetails': 'View Details',
    'transactions.created': 'Created {{date}}',
    
    // Transaction Detail
    'transaction.details': 'Transaction Details',
    'transaction.overview': 'Overview',
    'transaction.milestones': 'Milestones',
    'transaction.messages': 'Messages',
    'transaction.files': 'Files',
    'transaction.participants': 'Participants',
    'transaction.tracker': 'Tracker',
    'transaction.title': 'Title',
    'transaction.address': 'Property Address',
    'transaction.createdBy': 'Created By',
    'transaction.createdAt': 'Created At',
    'transaction.createdByOn': 'Created by {{creator}} on {{date}}',
    'transaction.delete': 'Delete Transaction',
    'transaction.deleteConfirm': 'Are you sure you want to delete this transaction? This action cannot be undone.',
    'transaction.deleteWarning': 'This will permanently delete:',
    'transaction.deleteItem1': 'All transaction details and history',
    'transaction.deleteItem2': 'All milestones and progress tracking',
    'transaction.deleteItem3': 'All messages and communications',
    'transaction.deleteItem4': 'All uploaded documents and files',
    'transaction.deleteItem5': 'All participant associations',
    'transaction.deleteButton': 'Delete Permanently',
    'transaction.deleting': 'Deleting...',
    'transaction.backToDashboard': 'Back to Dashboard',
    'transaction.error': 'Error',
    'transaction.notFound': 'Transaction not found',
    'transaction.noAccess': 'You do not have access to this transaction',
    
    // Messages
    'messages.title': 'Messages',
    'messages.send': 'Send Message',
    'messages.typeMessage': 'Type your message...',
    'messages.noMessages': 'No messages yet',
    'messages.startConversation': 'Start the conversation',
    'messages.original': 'Show Original',
    'messages.translated': 'Show Translation',
    'messages.sendingAs': 'Sending as',
    'messages.newMessage': 'New Message',
    'messages.autoTranslate': 'Messages will be automatically translated for participants with different language preferences',
    'messages.description': 'Communication between transaction participants with automatic translation.',
    
    // Milestones
    'milestones.title': 'Milestones',
    'milestones.completed': 'Completed',
    'milestones.pending': 'Pending',
    'milestones.markComplete': 'Mark Complete',
    'milestones.markIncomplete': 'Mark Incomplete',
    'milestones.manage': 'Manage Milestones',
    'milestones.tracker': 'Progress Tracker',
    'milestones.trackerDesc': 'Track the key milestones of this property purchase.',
    'milestones.trackerDescAgent': 'Click on a milestone to mark it as complete.',
    'milestones.completedOn': 'Completed {{date}}',
    
    // User roles
    'role.agent': 'Agent',
    'role.buyer': 'Buyer',
    
    // Status
    'status.active': 'Active',
    'status.completed': 'Completed',
    'status.archived': 'Archived',
    'status.pending': 'Pending',
    'status.done': 'Done',
    
    // Forms
    'form.required': 'Required',
    'form.optional': 'Optional',
    'form.email': 'Email',
    'form.password': 'Password',
    'form.newPassword': 'New password',
    'form.firstName': 'First Name',
    'form.lastName': 'Last Name',
    'form.fullName': 'Full Name',
    'form.language': 'Preferred Language',
    'form.propertyAddress': 'Property Address',
    'form.transactionTitle': 'Transaction Title',
    'form.selectBuyers': 'Select Buyers',
    'form.notes': 'Notes',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.security': 'Security',
    'settings.signedInAs': 'Signed in as {{email}}',
    'settings.languageDescription': 'Your messages will be in this language and automatically translated for others.',
    'settings.changePassword': 'Change password',
    'settings.saveProfile': 'Save profile',
    'settings.saving': 'Saving...',
    'settings.makeChanges': 'Make changes above to enable save',
    'settings.avatar': 'Avatar (coming soon)',
    'settings.uploadAvatar': 'Upload avatar',
    'settings.avatarNote': 'Requires Supabase Storage bucket \'avatars\' with public read policy.',
    
    // Languages
    'lang.english': 'English',
    'lang.italian': 'Italian',
    'lang.spanish': 'Spanish',
    'lang.french': 'French',
    'lang.german': 'German',
    
    // Files
    'files.upload': 'Upload File',
    'files.download': 'Download',
    'files.delete': 'Delete',
    'files.noFiles': 'No files uploaded yet',
    'files.title': 'Files & Documents',
    'files.description': 'Documents and files related to this transaction',
    'files.comingSoon': 'File upload feature coming soon',
    'files.uploadContracts': 'Upload contracts, surveys, and other documents',
    
    // Participants
    'participants.add': 'Add Participant',
    'participants.remove': 'Remove',
    'participants.invite': 'Invite',
    'participants.invited': 'Invited',
    'participants.title': 'Participants',
    'participants.description': 'Users involved in this transaction',
    'participants.invitedOn': 'Invited {{date}}',
    
    // Buyers
    'buyers.title': 'Buyer Management',
    'buyers.manage': 'Manage Buyers',
    'buyers.description': 'Manage your buyers and send invitations',
    'buyers.your': 'Your Buyers',
    'buyers.count': 'Your Buyers ({{count}})',
    'buyers.listDescription': 'Buyers you\'ve created can be invited to transactions',
    'buyers.loading': 'Loading buyers...',
    'buyers.noBuyers': 'You haven\'t created any buyers yet.',
    'buyers.create': 'Create Buyer',
    'buyers.createFirst': 'Create Your First Buyer',
    'buyers.createNew': 'Create New Buyer',
    'buyers.createDescription': 'Create a buyer account and send them an invitation email.',
    'buyers.createAndInvite': 'Create & Send Invite',
    'buyers.creating': 'Creating...',
    'buyers.edit': 'Edit Buyer',
    'buyers.editDescription': 'Update buyer information.',
    'buyers.update': 'Update Buyer',
    'buyers.updating': 'Updating...',
    'buyers.delete': 'Delete Buyer',
    'buyers.deleteConfirm': 'Are you sure you want to remove this buyer? This will remove them from your list but will not delete their account.',
    'buyers.deleting': 'Deleting...',
    'buyers.unnamedBuyer': 'Unnamed Buyer',
    'buyers.language': 'Language',
    'buyers.created': 'Created',
    'buyers.resendInvite': 'Resend invitation email',
    'buyers.inviteNote': 'The buyer will receive an email to set their password.',
    'buyers.accessDenied': 'Access Denied',
    'buyers.accessDeniedDesc': 'Only agents can access buyer management.',
    
    // Errors
    'error.generic': 'An error occurred',
    'error.loadingFailed': 'Failed to load data',
    'error.saveFailed': 'Failed to save',
    'error.deleteFailed': 'Failed to delete',
    'error.unauthorized': 'Unauthorized',
    
    // Success messages
    'success.saved': 'Saved successfully',
    'success.created': 'Created successfully',
    'success.updated': 'Updated successfully',
    'success.deleted': 'Deleted successfully',
    'success.sent': 'Sent successfully',
    
    // Confirmation
    'confirm.delete': 'Are you sure you want to delete this?',
    'confirm.cancel': 'Are you sure you want to cancel?',
    
    // Time
    'time.justNow': 'Just now',
    'time.minutesAgo': '{{count}} minutes ago',
    'time.hoursAgo': '{{count}} hours ago',
    'time.daysAgo': '{{count}} days ago',
    'time.weeksAgo': '{{count}} weeks ago',
  },
  
  it: {
    // Navigation
    'nav.dashboard': 'Pannello di Controllo',
    'nav.transactions': 'Transazioni',
    'nav.settings': 'Impostazioni',
    'nav.logout': 'Esci',
    'nav.login': 'Accedi',
    'nav.register': 'Registrati',
    'nav.siteAdmin': 'Amministrazione Sito',
    
    // Common actions
    'action.save': 'Salva',
    'action.cancel': 'Annulla',
    'action.delete': 'Elimina',
    'action.edit': 'Modifica',
    'action.create': 'Crea',
    'action.submit': 'Invia',
    'action.close': 'Chiudi',
    'action.back': 'Indietro',
    'action.next': 'Avanti',
    'action.send': 'Invia',
    'action.upload': 'Carica',
    'action.download': 'Scarica',
    
    // Dashboard
    'dashboard.title': 'Pannello di Controllo',
    'dashboard.welcome': 'Bentornato',
    'dashboard.activeTransactions': 'Transazioni Attive',
    'dashboard.recentActivity': 'Attività Recenti',
    'dashboard.noActivity': 'Nessuna attività recente',
    'dashboard.noTransactions': 'Nessuna transazione ancora',
    'dashboard.createFirst': 'Crea la tua prima transazione per iniziare',
    'dashboard.newMessages': 'Nuovi Messaggi',
    'dashboard.viewAll': 'Vedi Tutto',
    'dashboard.quickActions': 'Azioni Rapide',
    'dashboard.complete': 'completato',
    'dashboard.milestoneCompleted': 'Traguardo completato: {{milestone}}',
    'dashboard.newMessageFrom': 'Nuovo messaggio da {{author}}',
    'dashboard.fileUploaded': 'File caricato: {{filename}}',
    
    // Transactions
    'transactions.title': 'Transazioni',
    'transactions.my': 'Le Mie Transazioni',
    'transactions.create': 'Crea Transazione',
    'transactions.createNew': 'Crea Nuova Transazione',
    'transactions.new': 'Nuova Transazione',
    'transactions.propertyAddress': 'Indirizzo Proprietà',
    'transactions.status': 'Stato',
    'transactions.progress': 'Progresso',
    'transactions.participants': 'Partecipanti',
    'transactions.noTransactions': 'Nessuna transazione trovata',
    'transactions.found': '{{count}} transazioni trovate',
    'transactions.viewDetails': 'Vedi Dettagli',
    'transactions.created': 'Creato {{date}}',
    
    // Transaction Detail
    'transaction.details': 'Dettagli Transazione',
    'transaction.overview': 'Panoramica',
    'transaction.milestones': 'Traguardi',
    'transaction.messages': 'Messaggi',
    'transaction.files': 'File',
    'transaction.participants': 'Partecipanti',
    'transaction.tracker': 'Tracciamento',
    'transaction.title': 'Titolo',
    'transaction.address': 'Indirizzo Proprietà',
    'transaction.createdBy': 'Creato Da',
    'transaction.createdAt': 'Creato Il',
    'transaction.createdByOn': 'Creato da {{creator}} il {{date}}',
    'transaction.delete': 'Elimina Transazione',
    'transaction.deleteConfirm': 'Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.',
    'transaction.deleteWarning': 'Questo eliminerà permanentemente:',
    'transaction.deleteItem1': 'Tutti i dettagli e la cronologia della transazione',
    'transaction.deleteItem2': 'Tutti i traguardi e il tracciamento dei progressi',
    'transaction.deleteItem3': 'Tutti i messaggi e le comunicazioni',
    'transaction.deleteItem4': 'Tutti i documenti e i file caricati',
    'transaction.deleteItem5': 'Tutte le associazioni dei partecipanti',
    'transaction.deleteButton': 'Elimina Permanentemente',
    'transaction.deleting': 'Eliminazione...',
    'transaction.backToDashboard': 'Torna al Pannello di Controllo',
    'transaction.error': 'Errore',
    'transaction.notFound': 'Transazione non trovata',
    'transaction.noAccess': 'Non hai accesso a questa transazione',
    
    // Messages
    'messages.title': 'Messaggi',
    'messages.send': 'Invia Messaggio',
    'messages.typeMessage': 'Scrivi il tuo messaggio...',
    'messages.noMessages': 'Nessun messaggio ancora',
    'messages.startConversation': 'Inizia la conversazione',
    'messages.original': 'Mostra Originale',
    'messages.translated': 'Mostra Traduzione',
    'messages.sendingAs': 'Inviando come',
    'messages.newMessage': 'Nuovo Messaggio',
    'messages.autoTranslate': 'I messaggi verranno tradotti automaticamente per i partecipanti con preferenze linguistiche diverse',
    'messages.description': 'Comunicazione tra i partecipanti alla transazione con traduzione automatica.',
    
    // Milestones
    'milestones.title': 'Traguardi',
    'milestones.completed': 'Completato',
    'milestones.pending': 'In Attesa',
    'milestones.markComplete': 'Segna come Completato',
    'milestones.markIncomplete': 'Segna come Incompleto',
    'milestones.manage': 'Gestisci Traguardi',
    'milestones.tracker': 'Tracciamento Progressi',
    'milestones.trackerDesc': 'Traccia i traguardi chiave di questo acquisto immobiliare.',
    'milestones.trackerDescAgent': 'Fai clic su un traguardo per contrassegnarlo come completato.',
    'milestones.completedOn': 'Completato {{date}}',
    
    // User roles
    'role.agent': 'Agente',
    'role.buyer': 'Acquirente',
    
    // Status
    'status.active': 'Attivo',
    'status.completed': 'Completato',
    'status.archived': 'Archiviato',
    'status.pending': 'In Attesa',
    'status.done': 'Fatto',
    
    // Forms
    'form.required': 'Obbligatorio',
    'form.optional': 'Opzionale',
    'form.email': 'Email',
    'form.password': 'Password',
    'form.newPassword': 'Nuova password',
    'form.firstName': 'Nome',
    'form.lastName': 'Cognome',
    'form.fullName': 'Nome Completo',
    'form.language': 'Lingua Preferita',
    'form.propertyAddress': 'Indirizzo Proprietà',
    'form.transactionTitle': 'Titolo Transazione',
    'form.selectBuyers': 'Seleziona Acquirenti',
    'form.notes': 'Note',
    
    // Settings
    'settings.title': 'Impostazioni',
    'settings.profile': 'Profilo',
    'settings.security': 'Sicurezza',
    'settings.signedInAs': 'Connesso come {{email}}',
    'settings.languageDescription': 'I tuoi messaggi saranno in questa lingua e tradotti automaticamente per gli altri.',
    'settings.changePassword': 'Cambia password',
    'settings.saveProfile': 'Salva profilo',
    'settings.saving': 'Salvataggio...',
    'settings.makeChanges': 'Apporta modifiche sopra per abilitare il salvataggio',
    'settings.avatar': 'Avatar (prossimamente)',
    'settings.uploadAvatar': 'Carica avatar',
    'settings.avatarNote': 'Richiede bucket Supabase Storage \'avatars\' con policy di lettura pubblica.',
    
    // Languages
    'lang.english': 'Inglese',
    'lang.italian': 'Italiano',
    'lang.spanish': 'Spagnolo',
    'lang.french': 'Francese',
    'lang.german': 'Tedesco',
    
    // Files
    'files.upload': 'Carica File',
    'files.download': 'Scarica',
    'files.delete': 'Elimina',
    'files.noFiles': 'Nessun file caricato ancora',
    'files.title': 'File e Documenti',
    'files.description': 'Documenti e file relativi a questa transazione',
    'files.comingSoon': 'Funzione di caricamento file in arrivo presto',
    'files.uploadContracts': 'Carica contratti, perizie e altri documenti',
    
    // Participants
    'participants.add': 'Aggiungi Partecipante',
    'participants.remove': 'Rimuovi',
    'participants.invite': 'Invita',
    'participants.invited': 'Invitato',
    'participants.title': 'Partecipanti',
    'participants.description': 'Utenti coinvolti in questa transazione',
    'participants.invitedOn': 'Invitato {{date}}',
    
    // Buyers
    'buyers.title': 'Gestione Acquirenti',
    'buyers.manage': 'Gestisci Acquirenti',
    'buyers.description': 'Gestisci i tuoi acquirenti e invia inviti',
    'buyers.your': 'I Tuoi Acquirenti',
    'buyers.count': 'I Tuoi Acquirenti ({{count}})',
    'buyers.listDescription': 'Gli acquirenti che hai creato possono essere invitati alle transazioni',
    'buyers.loading': 'Caricamento acquirenti...',
    'buyers.noBuyers': 'Non hai ancora creato acquirenti.',
    'buyers.create': 'Crea Acquirente',
    'buyers.createFirst': 'Crea il Tuo Primo Acquirente',
    'buyers.createNew': 'Crea Nuovo Acquirente',
    'buyers.createDescription': 'Crea un account acquirente e invia un\'email di invito.',
    'buyers.createAndInvite': 'Crea e Invia Invito',
    'buyers.creating': 'Creazione...',
    'buyers.edit': 'Modifica Acquirente',
    'buyers.editDescription': 'Aggiorna le informazioni dell\'acquirente.',
    'buyers.update': 'Aggiorna Acquirente',
    'buyers.updating': 'Aggiornamento...',
    'buyers.delete': 'Elimina Acquirente',
    'buyers.deleteConfirm': 'Sei sicuro di voler rimuovere questo acquirente? Questo lo rimuoverà dalla tua lista ma non eliminerà il suo account.',
    'buyers.deleting': 'Eliminazione...',
    'buyers.unnamedBuyer': 'Acquirente Senza Nome',
    'buyers.language': 'Lingua',
    'buyers.created': 'Creato',
    'buyers.resendInvite': 'Invia nuovamente email di invito',
    'buyers.inviteNote': 'L\'acquirente riceverà un\'email per impostare la password.',
    'buyers.accessDenied': 'Accesso Negato',
    'buyers.accessDeniedDesc': 'Solo gli agenti possono accedere alla gestione acquirenti.',
    
    // Errors
    'error.generic': 'Si è verificato un errore',
    'error.loadingFailed': 'Caricamento fallito',
    'error.saveFailed': 'Salvataggio fallito',
    'error.deleteFailed': 'Eliminazione fallita',
    'error.unauthorized': 'Non autorizzato',
    
    // Success messages
    'success.saved': 'Salvato con successo',
    'success.created': 'Creato con successo',
    'success.updated': 'Aggiornato con successo',
    'success.deleted': 'Eliminato con successo',
    'success.sent': 'Inviato con successo',
    
    // Confirmation
    'confirm.delete': 'Sei sicuro di voler eliminare questo?',
    'confirm.cancel': 'Sei sicuro di voler annullare?',
    
    // Time
    'time.justNow': 'Proprio ora',
    'time.minutesAgo': '{{count}} minuti fa',
    'time.hoursAgo': '{{count}} ore fa',
    'time.daysAgo': '{{count}} giorni fa',
    'time.weeksAgo': '{{count}} settimane fa',
  },
} as const;

/**
 * Get translation for a key in the specified language
 */
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  // For languages not yet fully implemented, fall back to English
  const supportedTranslations: SupportedLanguage[] = ['en', 'it'];
  const languageToUse = supportedTranslations.includes(lang) ? lang : 'en';
  
  return translations[languageToUse][key] || translations.en[key] || key;
}

/**
 * Get translation with variable substitution
 * Example: t('time.minutesAgo', 'en', { count: 5 }) => "5 minutes ago"
 */
export function tVar(
  key: TranslationKey,
  lang: SupportedLanguage = 'en',
  variables: Record<string, string | number> = {}
): string {
  let translation = t(key, lang);
  
  // Replace {{variableName}} with actual values
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.replace(`{{${varKey}}}`, String(value));
  });
  
  return translation;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Array<{
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}> {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
  ];
}

