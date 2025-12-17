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
    'action.sending': 'Sending...',
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
    'transactions.propertyAddressOptional': 'Property Address (Optional)',
    'transactions.propertyAddressPlaceholder': 'e.g., Via Roma 123, 50100 Florence, Italy',
    'transactions.propertyAddressHelp': 'The address of the property being purchased',
    'transactions.propertyUrl': 'Property URL (Optional)',
    'transactions.propertyUrlPlaceholder': 'e.g., https://your-agency.com/properties/villa-tuscany',
    'transactions.propertyUrlHelp': 'Link to the property listing on your website',
    'transactions.viewProperty': 'View Property Listing',
    'transactions.status': 'Status',
    'transactions.progress': 'Progress',
    'transactions.participants': 'Participants',
    'transactions.noTransactions': 'No transactions found',
    'transactions.found': '{{count}} transactions found',
    'transactions.viewDetails': 'View Details',
    'transactions.created': 'Created {{date}}',
    'transactions.createdOn': 'Created',
    'transactions.startTracking': 'Start tracking a new property transaction',
    'transactions.transactionTitle': 'Transaction Title',
    'transactions.transactionTitlePlaceholder': 'e.g., Villa in Tuscany Purchase',
    'transactions.transactionTitleHelp': 'A descriptive name for this transaction',
    'transactions.createDescription': 'Enter the basic information for this property transaction. You can invite buyers and manage milestones after creating the transaction.',
    'transactions.inviteBuyersOptional': 'Invite Buyers (Optional)',
    'transactions.noBuyersFound': 'No registered buyers found.',
    'transactions.searchBuyersHelp': 'Search for buyers by name and select them to invite to this transaction.',
    'transactions.creating': 'Creating...',
    'transactions.onlyAgentsCreate': 'Only agents can create transactions',
    'transactions.whatHappensNext': 'What happens next:',
    'transactions.nextStep1': 'Transaction will be created with default milestones',
    'transactions.nextStep2': 'You will be automatically added as a participant',
    'transactions.nextStep3': 'Selected buyers will be invited to the transaction',
    'transactions.nextStep4': 'Milestones can be checked off as the purchase progresses',
    
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
    'transaction.deleteFailed': 'Failed to delete transaction',
    'transaction.backToDashboard': 'Back to Dashboard',
    'transaction.error': 'Error',
    'transaction.notFound': 'Transaction not found',
    'transaction.noAccess': 'You do not have access to this transaction',
    'transaction.editTitle': 'Edit Transaction Title',
    'transaction.editTitleDescription': 'Update the transaction title in multiple languages. Translations are displayed based on user language preference.',
    
    // Messages
    'messages.title': 'Messages',
    'messages.send': 'Send Message',
    'messages.typeMessage': 'Type your message...',
    'messages.typeMessageIn': 'Type your message in {{lang}}...',
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
    'milestones.completedOnLabel': 'Completed on',
    'milestones.transactionProgress': 'Transaction Progress',
    'milestones.ofCompleted': 'of',
    'milestones.percentComplete': '{{percent}}% Complete',
    'milestones.active': 'Active',
    'milestones.done': 'Done',
    
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
    'settings.avatar': 'Avatar',
    'settings.uploadAvatar': 'Upload avatar',
    
    // Languages
    'lang.english': 'English',
    'lang.italian': 'Italian',
    'lang.spanish': 'Spanish',
    'lang.french': 'French',
    'lang.german': 'German',
    
    // Files
    'files.upload': 'Upload File',
    'files.uploading': 'Uploading...',
    'files.download': 'Download',
    'files.delete': 'Delete',
    'files.noFiles': 'No files uploaded yet',
    'files.title': 'Files & Documents',
    'files.description': 'Documents and files related to this transaction',
    'files.comingSoon': 'File upload feature coming soon',
    'files.uploadContracts': 'Upload contracts, surveys, and other documents',
    'files.selectMilestone': 'Associate to milestone (optional)',
    'files.unassigned': 'Unassigned',
    'files.limitNote': 'Max size 20MB. Participants can access files attached here.',
    'files.selectFileFirst': 'Please select a file to upload.',
    'files.tooLarge': 'File is too large. Please keep under 20MB.',
    'files.loading': 'Loading files...',
    'files.uploadedBy': 'Uploaded by',
    'files.forMilestone': 'Milestone',
    'files.downloadFailed': 'Failed to generate download link. Please try again.',
    
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
    'buyers.inviteButton': 'Invite Buyer',
    'buyers.inviteTitle': 'Invite Buyer',
    'buyers.inviteDescription': 'Select a buyer from your list to add them to this transaction.',
    'buyers.selectBuyer': 'Select Buyer',
    'buyers.noAvailable': 'No buyers available. Please create buyers first.',
    'buyers.searchPlaceholder': 'Search and select buyer...',
    'buyers.noneFound': 'No buyers found',
    'buyers.addButton': 'Add Buyer',
    
    // Errors
    'error.generic': 'An error occurred',
    'error.loadingFailed': 'Failed to load data',
    'error.saveFailed': 'Failed to save',
    'error.deleteFailed': 'Failed to delete',
    'error.unauthorized': 'Unauthorized',
    'error.mustBeLoggedIn': 'You must be logged in to create a transaction',
    'error.enterTitle': 'Please enter a transaction title',
    'error.loadBuyersFailed': 'Failed to load buyers. Please try again.',
    'error.createTransactionFailed': 'Failed to create transaction',
    
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
    
    // Landing Page
    'landing.heroTitle1': 'International Property',
    'landing.heroTitle2': 'Transaction Portal',
    'landing.heroDescription': 'Bridge the language gap in international real estate. Track your property purchase progress and communicate seamlessly with agents in your native language.',
    'landing.getStarted': 'Get Started',
    'landing.signIn': 'Sign In',
    'landing.featuresTitle': 'Everything you need for international property purchases',
    'landing.featuresDescription': 'Designed for buyers and agents who need clarity and communication',
    'landing.featureProgressTitle': 'Progress Tracking',
    'landing.featureProgressDesc': 'Visual timeline showing exactly where you are in the purchasing process',
    'landing.featureTranslationTitle': 'Auto Translation',
    'landing.featureTranslationDesc': 'Communicate with agents in your native language with automatic translation',
    'landing.featureCommunicationTitle': 'Centralized Communication',
    'landing.featureCommunicationDesc': 'All messages, documents, and updates in one secure location',
    'landing.featureSecurityTitle': 'Secure & Transparent',
    'landing.featureSecurityDesc': 'Bank-level security with complete transparency throughout the process',
    'landing.ctaTitle': 'Ready to streamline your property purchase?',
    'landing.ctaDescription': 'Join thousands of buyers and agents using The Property Gateway',
    'landing.startJourney': 'Start Your Journey',
    'landing.selectLanguage': 'Select Language',
    'landing.featureCustomMilestonesTitle': 'Customizable Milestones',
    'landing.featureCustomMilestonesDesc': 'Create and customize milestone sets to match your specific transaction workflow and requirements',
    'landing.featureBuyerManagementTitle': 'Buyer Management',
    'landing.featureBuyerManagementDesc': 'Efficiently manage your buyer contacts, send invitations, and track all your property transactions',
    'landing.featurePropertyLinksTitle': 'Property Listing Links',
    'landing.featurePropertyLinksDesc': 'Link transactions directly to your property listings for easy reference and client access',
    'landing.featureMultilingualTitle': 'Multilingual Transactions',
    'landing.featureMultilingualDesc': 'Transaction titles and content automatically translate to support international buyers and agents',
  },
  
  it: {
    // Navigation
    'nav.dashboard': 'Cruscotto',
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
    'action.sending': 'Invio in corso...',
    'action.upload': 'Carica',
    'action.download': 'Scarica',
    
    // Dashboard
    'dashboard.title': 'Cruscotto',
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
    'transactions.propertyAddressOptional': 'Indirizzo Proprietà (Facoltativo)',
    'transactions.propertyAddressPlaceholder': 'es., Via Roma 123, 50100 Firenze, Italia',
    'transactions.propertyAddressHelp': 'L\'indirizzo della proprietà in fase di acquisto',
    'transactions.propertyUrl': 'URL Proprietà (Facoltativo)',
    'transactions.propertyUrlPlaceholder': 'es., https://your-agency.com/properties/villa-tuscany',
    'transactions.propertyUrlHelp': 'Link all\'annuncio immobiliare sul tuo sito web',
    'transactions.viewProperty': 'Visualizza Annuncio Immobiliare',
    'transactions.status': 'Stato',
    'transactions.progress': 'Progresso',
    'transactions.participants': 'Partecipanti',
    'transactions.noTransactions': 'Nessuna transazione trovata',
    'transactions.found': '{{count}} transazioni trovate',
    'transactions.viewDetails': 'Vedi Dettagli',
    'transactions.created': 'Creato {{date}}',
    'transactions.createdOn': 'Creato',
    'transactions.startTracking': 'Inizia a monitorare una nuova transazione immobiliare',
    'transactions.transactionTitle': 'Titolo Transazione',
    'transactions.transactionTitlePlaceholder': 'es., Acquisto Villa in Toscana',
    'transactions.transactionTitleHelp': 'Un nome descrittivo per questa transazione',
    'transactions.createDescription': 'Inserisci le informazioni di base per questa transazione immobiliare. Potrai invitare acquirenti e gestire traguardi dopo aver creato la transazione.',
    'transactions.inviteBuyersOptional': 'Invita Acquirenti (Facoltativo)',
    'transactions.noBuyersFound': 'Nessun acquirente registrato trovato.',
    'transactions.searchBuyersHelp': 'Cerca acquirenti per nome e selezionali per invitarli a questa transazione.',
    'transactions.creating': 'Creazione in corso...',
    'transactions.onlyAgentsCreate': 'Solo gli agenti possono creare transazioni',
    'transactions.whatHappensNext': 'Cosa succederà dopo:',
    'transactions.nextStep1': 'La transazione verrà creata con traguardi predefiniti',
    'transactions.nextStep2': 'Sarai aggiunto automaticamente come partecipante',
    'transactions.nextStep3': 'Gli acquirenti selezionati verranno invitati alla transazione',
    'transactions.nextStep4': 'I traguardi possono essere contrassegnati man mano che l\'acquisto procede',
    
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
    'transaction.deleteFailed': 'Impossibile eliminare la transazione',
    'transaction.backToDashboard': 'Torna al Cruscotto',
    'transaction.error': 'Errore',
    'transaction.notFound': 'Transazione non trovata',
    'transaction.noAccess': 'Non hai accesso a questa transazione',
    'transaction.editTitle': 'Modifica Titolo Transazione',
    'transaction.editTitleDescription': 'Aggiorna il titolo della transazione in più lingue. Le traduzioni vengono visualizzate in base alla preferenza linguistica dell\'utente.',
    
    // Messages
    'messages.title': 'Messaggi',
    'messages.send': 'Invia Messaggio',
    'messages.typeMessage': 'Scrivi il tuo messaggio...',
    'messages.typeMessageIn': 'Scrivi il tuo messaggio in {{lang}}...',
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
    'milestones.completedOnLabel': 'Completato il',
    'milestones.transactionProgress': 'Progresso Transazione',
    'milestones.ofCompleted': 'di',
    'milestones.percentComplete': '{{percent}}% Completato',
    'milestones.active': 'Attivo',
    'milestones.done': 'Fatto',
    
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
    'settings.avatar': 'Avatar',
    'settings.uploadAvatar': 'Carica avatar',
    
    // Languages
    'lang.english': 'Inglese',
    'lang.italian': 'Italiano',
    'lang.spanish': 'Spagnolo',
    'lang.french': 'Francese',
    'lang.german': 'Tedesco',
    
    // Files
    'files.upload': 'Carica File',
    'files.uploading': 'Caricamento...',
    'files.download': 'Scarica',
    'files.delete': 'Elimina',
    'files.noFiles': 'Nessun file caricato ancora',
    'files.title': 'File e Documenti',
    'files.description': 'Documenti e file relativi a questa transazione',
    'files.comingSoon': 'Funzione di caricamento file in arrivo presto',
    'files.uploadContracts': 'Carica contratti, perizie e altri documenti',
    'files.selectMilestone': 'Associa a un traguardo (opzionale)',
    'files.unassigned': 'Non assegnato',
    'files.limitNote': 'Dimensione massima 20MB. I partecipanti possono accedere ai file qui allegati.',
    'files.selectFileFirst': 'Seleziona un file da caricare.',
    'files.tooLarge': 'Il file è troppo grande. Mantieni sotto i 20MB.',
    'files.loading': 'Caricamento file...',
    'files.uploadedBy': 'Caricato da',
    'files.forMilestone': 'Traguardo',
    'files.downloadFailed': 'Impossibile generare il link di download. Riprova.',
    
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
    'buyers.inviteButton': 'Invita Acquirente',
    'buyers.inviteTitle': 'Invita Acquirente',
    'buyers.inviteDescription': 'Seleziona un acquirente dalla tua lista per aggiungerlo a questa transazione.',
    'buyers.selectBuyer': 'Seleziona Acquirente',
    'buyers.noAvailable': 'Nessun acquirente disponibile. Si prega di creare prima gli acquirenti.',
    'buyers.searchPlaceholder': 'Cerca e seleziona acquirente...',
    'buyers.noneFound': 'Nessun acquirente trovato',
    'buyers.addButton': 'Aggiungi Acquirente',
    
    // Errors
    'error.generic': 'Si è verificato un errore',
    'error.loadingFailed': 'Caricamento fallito',
    'error.saveFailed': 'Salvataggio fallito',
    'error.deleteFailed': 'Eliminazione fallita',
    'error.unauthorized': 'Non autorizzato',
    'error.mustBeLoggedIn': 'Devi essere connesso per creare una transazione',
    'error.enterTitle': 'Inserisci un titolo per la transazione',
    'error.loadBuyersFailed': 'Impossibile caricare gli acquirenti. Riprova.',
    'error.createTransactionFailed': 'Impossibile creare la transazione',
    
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
    
    // Landing Page
    'landing.heroTitle1': 'Portale Transazioni',
    'landing.heroTitle2': 'Immobiliari Internazionali',
    'landing.heroDescription': 'Colma il divario linguistico nel settore immobiliare internazionale. Monitora i progressi dell\'acquisto della tua proprietà e comunica senza problemi con gli agenti nella tua lingua madre.',
    'landing.getStarted': 'Inizia',
    'landing.signIn': 'Accedi',
    'landing.featuresTitle': 'Tutto ciò che serve per acquisti immobiliari internazionali',
    'landing.featuresDescription': 'Progettato per acquirenti e agenti che necessitano di chiarezza e comunicazione',
    'landing.featureProgressTitle': 'Monitoraggio Progressi',
    'landing.featureProgressDesc': 'Cronologia visiva che mostra esattamente dove ti trovi nel processo di acquisto',
    'landing.featureTranslationTitle': 'Traduzione Automatica',
    'landing.featureTranslationDesc': 'Comunica con gli agenti nella tua lingua madre con traduzione automatica',
    'landing.featureCommunicationTitle': 'Comunicazione Centralizzata',
    'landing.featureCommunicationDesc': 'Tutti i messaggi, documenti e aggiornamenti in un\'unica posizione sicura',
    'landing.featureSecurityTitle': 'Sicuro e Trasparente',
    'landing.featureSecurityDesc': 'Sicurezza di livello bancario con completa trasparenza durante tutto il processo',
    'landing.ctaTitle': 'Pronto a semplificare il tuo acquisto immobiliare?',
    'landing.ctaDescription': 'Unisciti a migliaia di acquirenti e agenti che utilizzano The Property Gateway',
    'landing.startJourney': 'Inizia il Tuo Viaggio',
    'landing.selectLanguage': 'Seleziona Lingua',
    'landing.featureCustomMilestonesTitle': 'Traguardi Personalizzabili',
    'landing.featureCustomMilestonesDesc': 'Crea e personalizza set di traguardi per adattarli al tuo flusso di lavoro e requisiti specifici',
    'landing.featureBuyerManagementTitle': 'Gestione Acquirenti',
    'landing.featureBuyerManagementDesc': 'Gestisci in modo efficiente i tuoi contatti acquirenti, invia inviti e monitora tutte le tue transazioni immobiliari',
    'landing.featurePropertyLinksTitle': 'Link Annunci Immobiliari',
    'landing.featurePropertyLinksDesc': 'Collega le transazioni direttamente ai tuoi annunci immobiliari per un facile riferimento e accesso clienti',
    'landing.featureMultilingualTitle': 'Transazioni Multilingue',
    'landing.featureMultilingualDesc': 'I titoli e i contenuti delle transazioni si traducono automaticamente per supportare acquirenti e agenti internazionali',
  },
} as const;

/**
 * Get translation for a key in the specified language
 */
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  // For languages not yet fully implemented, fall back to English
  const supportedTranslations: SupportedLanguage[] = ['en', 'it'];
  const languageToUse = (supportedTranslations.includes(lang) ? lang : 'en') as 'en' | 'it';
  
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

