'use client';

/**
 * Help Page - In-App User Guide
 *
 * Provides comprehensive onboarding documentation for agents.
 * Features:
 * - Multi-language support (6 languages)
 * - Downloadable PDF guide
 * - Interactive tour restart
 * - Step-by-step instructions with screenshots
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  Play,
  ChevronRight,
  Home,
  UserPlus,
  Settings,
  FileText,
  Users,
  ListChecks,
  Eye,
  ExternalLink,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Guide section definitions
interface GuideSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  steps: string[];
  link?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'registration',
    icon: UserPlus,
    titleKey: 'help.registration.title',
    descriptionKey: 'help.registration.description',
    steps: [
      'help.registration.step1',
      'help.registration.step2',
      'help.registration.step3',
      'help.registration.step4',
    ],
    link: '/register',
  },
  {
    id: 'first-login',
    icon: Home,
    titleKey: 'help.firstLogin.title',
    descriptionKey: 'help.firstLogin.description',
    steps: [
      'help.firstLogin.step1',
      'help.firstLogin.step2',
      'help.firstLogin.step3',
    ],
  },
  {
    id: 'account-setup',
    icon: Settings,
    titleKey: 'help.accountSetup.title',
    descriptionKey: 'help.accountSetup.description',
    steps: [
      'help.accountSetup.step1',
      'help.accountSetup.step2',
      'help.accountSetup.step3',
      'help.accountSetup.step4',
    ],
    link: '/settings',
  },
  {
    id: 'create-transaction',
    icon: FileText,
    titleKey: 'help.createTransaction.title',
    descriptionKey: 'help.createTransaction.description',
    steps: [
      'help.createTransaction.step1',
      'help.createTransaction.step2',
      'help.createTransaction.step3',
      'help.createTransaction.step4',
    ],
    link: '/transactions/create',
  },
  {
    id: 'manage-buyers',
    icon: Users,
    titleKey: 'help.manageBuyers.title',
    descriptionKey: 'help.manageBuyers.description',
    steps: [
      'help.manageBuyers.step1',
      'help.manageBuyers.step2',
      'help.manageBuyers.step3',
    ],
    link: '/buyers',
  },
  {
    id: 'milestone-templates',
    icon: ListChecks,
    titleKey: 'help.milestoneTemplates.title',
    descriptionKey: 'help.milestoneTemplates.description',
    steps: [
      'help.milestoneTemplates.step1',
      'help.milestoneTemplates.step2',
      'help.milestoneTemplates.step3',
    ],
    link: '/milestone-templates',
  },
  {
    id: 'transaction-detail',
    icon: Eye,
    titleKey: 'help.transactionDetail.title',
    descriptionKey: 'help.transactionDetail.description',
    steps: [
      'help.transactionDetail.step1',
      'help.transactionDetail.step2',
      'help.transactionDetail.step3',
      'help.transactionDetail.step4',
    ],
  },
];

// Help page translations
const HELP_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'help.title': 'Getting Started Guide',
    'help.subtitle': 'Learn how to use Estate Portal to manage your property transactions',
    'help.downloadPdf': 'Download PDF Guide',
    'help.startTour': 'Start Interactive Tour',
    'help.quickStart': 'Quick Start',
    'help.quickStartDesc': 'Get up and running in just a few steps',

    // Registration
    'help.registration.title': '1. Registration',
    'help.registration.description': 'Create your agent account to get started',
    'help.registration.step1': 'Go to the registration page and select "Agent" as your role',
    'help.registration.step2': 'Enter your full name, email address, and create a secure password',
    'help.registration.step3': 'Check your email for a confirmation link',
    'help.registration.step4': 'Click the link to verify your account and complete registration',

    // First Login
    'help.firstLogin.title': '2. First Login',
    'help.firstLogin.description': 'Access your dashboard for the first time',
    'help.firstLogin.step1': 'Log in with your email and password',
    'help.firstLogin.step2': 'If prompted, update your password for security',
    'help.firstLogin.step3': 'You\'ll be taken to your dashboard where you can see your transactions',

    // Account Setup
    'help.accountSetup.title': '3. Account Setup',
    'help.accountSetup.description': 'Customize your profile and branding',
    'help.accountSetup.step1': 'Navigate to Settings from the menu',
    'help.accountSetup.step2': 'Upload your profile photo and agency logo',
    'help.accountSetup.step3': 'Enter your website URL to automatically extract brand colors',
    'help.accountSetup.step4': 'Customize your primary and secondary brand colors',

    // Create Transaction
    'help.createTransaction.title': '4. Create a Transaction',
    'help.createTransaction.description': 'Start tracking a property purchase',
    'help.createTransaction.step1': 'Click "Create Transaction" from the dashboard or menu',
    'help.createTransaction.step2': 'Enter the property address and your reference number',
    'help.createTransaction.step3': 'Select a milestone template or use the default',
    'help.createTransaction.step4': 'Invite buyers to the transaction via email',

    // Manage Buyers
    'help.manageBuyers.title': '5. Manage Buyers',
    'help.manageBuyers.description': 'Keep track of your international buyers',
    'help.manageBuyers.step1': 'Access the Buyers section from the navigation menu',
    'help.manageBuyers.step2': 'Add new buyers with their contact information',
    'help.manageBuyers.step3': 'Invite buyers to specific transactions',

    // Milestone Templates
    'help.milestoneTemplates.title': '6. Milestone Templates',
    'help.milestoneTemplates.description': 'Create reusable progress tracking templates',
    'help.milestoneTemplates.step1': 'Go to Milestone Templates from the menu',
    'help.milestoneTemplates.step2': 'Create a new template or edit existing ones',
    'help.milestoneTemplates.step3': 'Drag and drop to reorder milestones',

    // Transaction Detail
    'help.transactionDetail.title': '7. Transaction Details',
    'help.transactionDetail.description': 'Track progress and communicate with buyers',
    'help.transactionDetail.step1': 'Click on any transaction to view its details',
    'help.transactionDetail.step2': 'Use the Tracker tab to mark milestones as complete',
    'help.transactionDetail.step3': 'Send messages to buyers through the Messages tab',
    'help.transactionDetail.step4': 'Upload and share documents in the Files tab',

    'help.needMoreHelp': 'Need More Help?',
    'help.contactSupport': 'Contact our support team for assistance',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
  it: {
    'help.title': 'Guida Introduttiva',
    'help.subtitle': 'Scopri come usare Estate Portal per gestire le tue transazioni immobiliari',
    'help.downloadPdf': 'Scarica Guida PDF',
    'help.startTour': 'Avvia Tour Interattivo',
    'help.quickStart': 'Avvio Rapido',
    'help.quickStartDesc': 'Inizia in pochi semplici passaggi',

    'help.registration.title': '1. Registrazione',
    'help.registration.description': 'Crea il tuo account agente per iniziare',
    'help.registration.step1': 'Vai alla pagina di registrazione e seleziona "Agente" come ruolo',
    'help.registration.step2': 'Inserisci nome completo, email e crea una password sicura',
    'help.registration.step3': 'Controlla la tua email per il link di conferma',
    'help.registration.step4': 'Clicca sul link per verificare il tuo account',

    'help.firstLogin.title': '2. Primo Accesso',
    'help.firstLogin.description': 'Accedi alla tua dashboard per la prima volta',
    'help.firstLogin.step1': 'Accedi con email e password',
    'help.firstLogin.step2': 'Se richiesto, aggiorna la password per sicurezza',
    'help.firstLogin.step3': 'Verrai portato alla dashboard dove vedrai le transazioni',

    'help.accountSetup.title': '3. Configurazione Account',
    'help.accountSetup.description': 'Personalizza profilo e branding',
    'help.accountSetup.step1': 'Vai alle Impostazioni dal menu',
    'help.accountSetup.step2': 'Carica foto profilo e logo agenzia',
    'help.accountSetup.step3': 'Inserisci URL del sito per estrarre colori brand',
    'help.accountSetup.step4': 'Personalizza i colori primari e secondari',

    'help.createTransaction.title': '4. Crea una Transazione',
    'help.createTransaction.description': 'Inizia a tracciare un acquisto immobiliare',
    'help.createTransaction.step1': 'Clicca "Crea Transazione" dalla dashboard o menu',
    'help.createTransaction.step2': 'Inserisci indirizzo proprietà e numero riferimento',
    'help.createTransaction.step3': 'Seleziona un template milestone o usa quello predefinito',
    'help.createTransaction.step4': 'Invita acquirenti alla transazione via email',

    'help.manageBuyers.title': '5. Gestisci Acquirenti',
    'help.manageBuyers.description': 'Tieni traccia dei tuoi acquirenti internazionali',
    'help.manageBuyers.step1': 'Accedi alla sezione Acquirenti dal menu',
    'help.manageBuyers.step2': 'Aggiungi nuovi acquirenti con le loro informazioni',
    'help.manageBuyers.step3': 'Invita acquirenti a transazioni specifiche',

    'help.milestoneTemplates.title': '6. Template Milestone',
    'help.milestoneTemplates.description': 'Crea template riutilizzabili per il tracciamento',
    'help.milestoneTemplates.step1': 'Vai ai Template Milestone dal menu',
    'help.milestoneTemplates.step2': 'Crea un nuovo template o modifica quelli esistenti',
    'help.milestoneTemplates.step3': 'Trascina per riordinare i milestone',

    'help.transactionDetail.title': '7. Dettagli Transazione',
    'help.transactionDetail.description': 'Traccia progressi e comunica con acquirenti',
    'help.transactionDetail.step1': 'Clicca su una transazione per vedere i dettagli',
    'help.transactionDetail.step2': 'Usa la tab Tracker per segnare milestone completati',
    'help.transactionDetail.step3': 'Invia messaggi agli acquirenti dalla tab Messaggi',
    'help.transactionDetail.step4': 'Carica e condividi documenti nella tab File',

    'help.needMoreHelp': 'Serve Altro Aiuto?',
    'help.contactSupport': 'Contatta il nostro team di supporto',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
  es: {
    'help.title': 'Guía de Inicio',
    'help.subtitle': 'Aprende a usar Estate Portal para gestionar tus transacciones inmobiliarias',
    'help.downloadPdf': 'Descargar Guía PDF',
    'help.startTour': 'Iniciar Tour Interactivo',
    'help.quickStart': 'Inicio Rápido',
    'help.quickStartDesc': 'Empieza en unos pocos pasos',

    'help.registration.title': '1. Registro',
    'help.registration.description': 'Crea tu cuenta de agente para comenzar',
    'help.registration.step1': 'Ve a la página de registro y selecciona "Agente" como rol',
    'help.registration.step2': 'Ingresa tu nombre completo, email y crea una contraseña segura',
    'help.registration.step3': 'Revisa tu email para el enlace de confirmación',
    'help.registration.step4': 'Haz clic en el enlace para verificar tu cuenta',

    'help.firstLogin.title': '2. Primer Inicio de Sesión',
    'help.firstLogin.description': 'Accede a tu dashboard por primera vez',
    'help.firstLogin.step1': 'Inicia sesión con tu email y contraseña',
    'help.firstLogin.step2': 'Si se solicita, actualiza tu contraseña por seguridad',
    'help.firstLogin.step3': 'Serás llevado al dashboard donde verás tus transacciones',

    'help.accountSetup.title': '3. Configuración de Cuenta',
    'help.accountSetup.description': 'Personaliza tu perfil y marca',
    'help.accountSetup.step1': 'Navega a Configuración desde el menú',
    'help.accountSetup.step2': 'Sube tu foto de perfil y logo de agencia',
    'help.accountSetup.step3': 'Ingresa la URL de tu sitio web para extraer colores de marca',
    'help.accountSetup.step4': 'Personaliza tus colores primarios y secundarios',

    'help.createTransaction.title': '4. Crear una Transacción',
    'help.createTransaction.description': 'Comienza a rastrear una compra de propiedad',
    'help.createTransaction.step1': 'Haz clic en "Crear Transacción" desde el dashboard o menú',
    'help.createTransaction.step2': 'Ingresa la dirección de la propiedad y tu número de referencia',
    'help.createTransaction.step3': 'Selecciona una plantilla de hitos o usa la predeterminada',
    'help.createTransaction.step4': 'Invita compradores a la transacción por email',

    'help.manageBuyers.title': '5. Gestionar Compradores',
    'help.manageBuyers.description': 'Mantén un seguimiento de tus compradores internacionales',
    'help.manageBuyers.step1': 'Accede a la sección Compradores desde el menú',
    'help.manageBuyers.step2': 'Añade nuevos compradores con su información de contacto',
    'help.manageBuyers.step3': 'Invita compradores a transacciones específicas',

    'help.milestoneTemplates.title': '6. Plantillas de Hitos',
    'help.milestoneTemplates.description': 'Crea plantillas reutilizables para seguimiento',
    'help.milestoneTemplates.step1': 'Ve a Plantillas de Hitos desde el menú',
    'help.milestoneTemplates.step2': 'Crea una nueva plantilla o edita las existentes',
    'help.milestoneTemplates.step3': 'Arrastra y suelta para reordenar hitos',

    'help.transactionDetail.title': '7. Detalles de Transacción',
    'help.transactionDetail.description': 'Rastrea el progreso y comunícate con compradores',
    'help.transactionDetail.step1': 'Haz clic en cualquier transacción para ver sus detalles',
    'help.transactionDetail.step2': 'Usa la pestaña Tracker para marcar hitos como completados',
    'help.transactionDetail.step3': 'Envía mensajes a compradores en la pestaña Mensajes',
    'help.transactionDetail.step4': 'Sube y comparte documentos en la pestaña Archivos',

    'help.needMoreHelp': '¿Necesitas Más Ayuda?',
    'help.contactSupport': 'Contacta a nuestro equipo de soporte',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
  fr: {
    'help.title': 'Guide de Démarrage',
    'help.subtitle': 'Apprenez à utiliser Estate Portal pour gérer vos transactions immobilières',
    'help.downloadPdf': 'Télécharger le Guide PDF',
    'help.startTour': 'Démarrer la Visite Interactive',
    'help.quickStart': 'Démarrage Rapide',
    'help.quickStartDesc': 'Commencez en quelques étapes',

    'help.registration.title': '1. Inscription',
    'help.registration.description': 'Créez votre compte agent pour commencer',
    'help.registration.step1': 'Allez sur la page d\'inscription et sélectionnez "Agent" comme rôle',
    'help.registration.step2': 'Entrez votre nom complet, email et créez un mot de passe sécurisé',
    'help.registration.step3': 'Vérifiez votre email pour le lien de confirmation',
    'help.registration.step4': 'Cliquez sur le lien pour vérifier votre compte',

    'help.firstLogin.title': '2. Première Connexion',
    'help.firstLogin.description': 'Accédez à votre tableau de bord pour la première fois',
    'help.firstLogin.step1': 'Connectez-vous avec votre email et mot de passe',
    'help.firstLogin.step2': 'Si demandé, mettez à jour votre mot de passe pour la sécurité',
    'help.firstLogin.step3': 'Vous serez dirigé vers votre tableau de bord',

    'help.accountSetup.title': '3. Configuration du Compte',
    'help.accountSetup.description': 'Personnalisez votre profil et votre marque',
    'help.accountSetup.step1': 'Naviguez vers Paramètres depuis le menu',
    'help.accountSetup.step2': 'Téléchargez votre photo de profil et logo d\'agence',
    'help.accountSetup.step3': 'Entrez l\'URL de votre site web pour extraire les couleurs de marque',
    'help.accountSetup.step4': 'Personnalisez vos couleurs primaires et secondaires',

    'help.createTransaction.title': '4. Créer une Transaction',
    'help.createTransaction.description': 'Commencez à suivre un achat immobilier',
    'help.createTransaction.step1': 'Cliquez sur "Créer Transaction" depuis le tableau de bord ou menu',
    'help.createTransaction.step2': 'Entrez l\'adresse de la propriété et votre numéro de référence',
    'help.createTransaction.step3': 'Sélectionnez un modèle d\'étapes ou utilisez celui par défaut',
    'help.createTransaction.step4': 'Invitez des acheteurs à la transaction par email',

    'help.manageBuyers.title': '5. Gérer les Acheteurs',
    'help.manageBuyers.description': 'Suivez vos acheteurs internationaux',
    'help.manageBuyers.step1': 'Accédez à la section Acheteurs depuis le menu',
    'help.manageBuyers.step2': 'Ajoutez de nouveaux acheteurs avec leurs informations',
    'help.manageBuyers.step3': 'Invitez des acheteurs à des transactions spécifiques',

    'help.milestoneTemplates.title': '6. Modèles d\'Étapes',
    'help.milestoneTemplates.description': 'Créez des modèles réutilisables pour le suivi',
    'help.milestoneTemplates.step1': 'Allez aux Modèles d\'Étapes depuis le menu',
    'help.milestoneTemplates.step2': 'Créez un nouveau modèle ou modifiez les existants',
    'help.milestoneTemplates.step3': 'Glissez-déposez pour réordonner les étapes',

    'help.transactionDetail.title': '7. Détails de Transaction',
    'help.transactionDetail.description': 'Suivez les progrès et communiquez avec les acheteurs',
    'help.transactionDetail.step1': 'Cliquez sur une transaction pour voir ses détails',
    'help.transactionDetail.step2': 'Utilisez l\'onglet Tracker pour marquer les étapes terminées',
    'help.transactionDetail.step3': 'Envoyez des messages aux acheteurs via l\'onglet Messages',
    'help.transactionDetail.step4': 'Téléchargez et partagez des documents dans l\'onglet Fichiers',

    'help.needMoreHelp': 'Besoin de Plus d\'Aide?',
    'help.contactSupport': 'Contactez notre équipe de support',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
  de: {
    'help.title': 'Erste Schritte',
    'help.subtitle': 'Lernen Sie, wie Sie Estate Portal zur Verwaltung Ihrer Immobilientransaktionen nutzen',
    'help.downloadPdf': 'PDF-Anleitung Herunterladen',
    'help.startTour': 'Interaktive Tour Starten',
    'help.quickStart': 'Schnellstart',
    'help.quickStartDesc': 'Starten Sie in wenigen Schritten',

    'help.registration.title': '1. Registrierung',
    'help.registration.description': 'Erstellen Sie Ihr Maklerkonto, um zu beginnen',
    'help.registration.step1': 'Gehen Sie zur Registrierungsseite und wählen Sie "Makler" als Rolle',
    'help.registration.step2': 'Geben Sie Ihren vollständigen Namen, E-Mail und ein sicheres Passwort ein',
    'help.registration.step3': 'Prüfen Sie Ihre E-Mail für den Bestätigungslink',
    'help.registration.step4': 'Klicken Sie auf den Link, um Ihr Konto zu verifizieren',

    'help.firstLogin.title': '2. Erste Anmeldung',
    'help.firstLogin.description': 'Greifen Sie zum ersten Mal auf Ihr Dashboard zu',
    'help.firstLogin.step1': 'Melden Sie sich mit E-Mail und Passwort an',
    'help.firstLogin.step2': 'Wenn aufgefordert, aktualisieren Sie Ihr Passwort zur Sicherheit',
    'help.firstLogin.step3': 'Sie werden zu Ihrem Dashboard weitergeleitet',

    'help.accountSetup.title': '3. Kontoeinrichtung',
    'help.accountSetup.description': 'Passen Sie Ihr Profil und Branding an',
    'help.accountSetup.step1': 'Navigieren Sie zu Einstellungen im Menü',
    'help.accountSetup.step2': 'Laden Sie Ihr Profilfoto und Agenturlogo hoch',
    'help.accountSetup.step3': 'Geben Sie Ihre Website-URL ein, um Markenfarben zu extrahieren',
    'help.accountSetup.step4': 'Passen Sie Ihre primären und sekundären Markenfarben an',

    'help.createTransaction.title': '4. Transaktion Erstellen',
    'help.createTransaction.description': 'Beginnen Sie mit der Verfolgung eines Immobilienkaufs',
    'help.createTransaction.step1': 'Klicken Sie auf "Transaktion Erstellen" vom Dashboard oder Menü',
    'help.createTransaction.step2': 'Geben Sie die Immobilienadresse und Ihre Referenznummer ein',
    'help.createTransaction.step3': 'Wählen Sie eine Meilensteinvorlage oder verwenden Sie die Standardvorlage',
    'help.createTransaction.step4': 'Laden Sie Käufer per E-Mail zur Transaktion ein',

    'help.manageBuyers.title': '5. Käufer Verwalten',
    'help.manageBuyers.description': 'Behalten Sie Ihre internationalen Käufer im Blick',
    'help.manageBuyers.step1': 'Greifen Sie über das Menü auf den Käuferbereich zu',
    'help.manageBuyers.step2': 'Fügen Sie neue Käufer mit ihren Kontaktinformationen hinzu',
    'help.manageBuyers.step3': 'Laden Sie Käufer zu bestimmten Transaktionen ein',

    'help.milestoneTemplates.title': '6. Meilenstein-Vorlagen',
    'help.milestoneTemplates.description': 'Erstellen Sie wiederverwendbare Tracking-Vorlagen',
    'help.milestoneTemplates.step1': 'Gehen Sie zu Meilenstein-Vorlagen im Menü',
    'help.milestoneTemplates.step2': 'Erstellen Sie eine neue Vorlage oder bearbeiten Sie vorhandene',
    'help.milestoneTemplates.step3': 'Ziehen und ablegen, um Meilensteine neu zu ordnen',

    'help.transactionDetail.title': '7. Transaktionsdetails',
    'help.transactionDetail.description': 'Verfolgen Sie den Fortschritt und kommunizieren Sie mit Käufern',
    'help.transactionDetail.step1': 'Klicken Sie auf eine Transaktion, um Details anzuzeigen',
    'help.transactionDetail.step2': 'Verwenden Sie den Tracker-Tab, um Meilensteine als abgeschlossen zu markieren',
    'help.transactionDetail.step3': 'Senden Sie Nachrichten an Käufer über den Nachrichten-Tab',
    'help.transactionDetail.step4': 'Laden Sie Dokumente im Dateien-Tab hoch und teilen Sie sie',

    'help.needMoreHelp': 'Brauchen Sie Mehr Hilfe?',
    'help.contactSupport': 'Kontaktieren Sie unser Support-Team',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
  pl: {
    'help.title': 'Przewodnik Wprowadzający',
    'help.subtitle': 'Dowiedz się, jak używać Estate Portal do zarządzania transakcjami nieruchomości',
    'help.downloadPdf': 'Pobierz Przewodnik PDF',
    'help.startTour': 'Rozpocznij Interaktywną Wycieczkę',
    'help.quickStart': 'Szybki Start',
    'help.quickStartDesc': 'Zacznij w kilku prostych krokach',

    'help.registration.title': '1. Rejestracja',
    'help.registration.description': 'Utwórz konto agenta, aby rozpocząć',
    'help.registration.step1': 'Przejdź do strony rejestracji i wybierz "Agent" jako rolę',
    'help.registration.step2': 'Wprowadź pełne imię, email i utwórz bezpieczne hasło',
    'help.registration.step3': 'Sprawdź email w poszukiwaniu linku potwierdzającego',
    'help.registration.step4': 'Kliknij link, aby zweryfikować swoje konto',

    'help.firstLogin.title': '2. Pierwsze Logowanie',
    'help.firstLogin.description': 'Uzyskaj dostęp do panelu po raz pierwszy',
    'help.firstLogin.step1': 'Zaloguj się za pomocą email i hasła',
    'help.firstLogin.step2': 'Jeśli zostaniesz poproszony, zaktualizuj hasło dla bezpieczeństwa',
    'help.firstLogin.step3': 'Zostaniesz przeniesiony do panelu, gdzie zobaczysz swoje transakcje',

    'help.accountSetup.title': '3. Konfiguracja Konta',
    'help.accountSetup.description': 'Dostosuj swój profil i branding',
    'help.accountSetup.step1': 'Przejdź do Ustawień z menu',
    'help.accountSetup.step2': 'Prześlij zdjęcie profilowe i logo agencji',
    'help.accountSetup.step3': 'Wprowadź URL swojej strony, aby wyodrębnić kolory marki',
    'help.accountSetup.step4': 'Dostosuj swoje podstawowe i drugorzędne kolory marki',

    'help.createTransaction.title': '4. Utwórz Transakcję',
    'help.createTransaction.description': 'Rozpocznij śledzenie zakupu nieruchomości',
    'help.createTransaction.step1': 'Kliknij "Utwórz Transakcję" z panelu lub menu',
    'help.createTransaction.step2': 'Wprowadź adres nieruchomości i numer referencyjny',
    'help.createTransaction.step3': 'Wybierz szablon kamieni milowych lub użyj domyślnego',
    'help.createTransaction.step4': 'Zaproś kupujących do transakcji przez email',

    'help.manageBuyers.title': '5. Zarządzaj Kupującymi',
    'help.manageBuyers.description': 'Śledź swoich międzynarodowych kupujących',
    'help.manageBuyers.step1': 'Uzyskaj dostęp do sekcji Kupujący z menu',
    'help.manageBuyers.step2': 'Dodaj nowych kupujących z ich informacjami kontaktowymi',
    'help.manageBuyers.step3': 'Zaproś kupujących do konkretnych transakcji',

    'help.milestoneTemplates.title': '6. Szablony Kamieni Milowych',
    'help.milestoneTemplates.description': 'Twórz szablony wielokrotnego użytku do śledzenia',
    'help.milestoneTemplates.step1': 'Przejdź do Szablonów Kamieni Milowych z menu',
    'help.milestoneTemplates.step2': 'Utwórz nowy szablon lub edytuj istniejące',
    'help.milestoneTemplates.step3': 'Przeciągnij i upuść, aby zmienić kolejność kamieni milowych',

    'help.transactionDetail.title': '7. Szczegóły Transakcji',
    'help.transactionDetail.description': 'Śledź postępy i komunikuj się z kupującymi',
    'help.transactionDetail.step1': 'Kliknij na dowolną transakcję, aby zobaczyć szczegóły',
    'help.transactionDetail.step2': 'Użyj zakładki Tracker, aby oznaczyć kamienie milowe jako ukończone',
    'help.transactionDetail.step3': 'Wysyłaj wiadomości do kupujących w zakładce Wiadomości',
    'help.transactionDetail.step4': 'Przesyłaj i udostępniaj dokumenty w zakładce Pliki',

    'help.needMoreHelp': 'Potrzebujesz Więcej Pomocy?',
    'help.contactSupport': 'Skontaktuj się z naszym zespołem wsparcia',
    'help.supportEmail': 'support@thepropertygateway.com',
  },
};

export default function HelpPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Get translation for current language
  const t = useCallback((key: string): string => {
    const langTranslations = HELP_TRANSLATIONS[language] || HELP_TRANSLATIONS.en;
    return langTranslations[key] || HELP_TRANSLATIONS.en[key] || key;
  }, [language]);

  // Handle PDF download
  const handleDownloadPdf = () => {
    const pdfPath = `/downloads/user-guide-${language}.pdf`;
    window.open(pdfPath, '_blank');
  };

  // Handle tour start - navigate to dashboard with tour trigger
  const handleStartTour = () => {
    router.push('/dashboard?tour=true');
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('help.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('help.subtitle')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('help.downloadPdf')}
            </Button>
            <Button
              onClick={handleStartTour}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4" />
              {t('help.startTour')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Start Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <ArrowRight className="h-5 w-5" />
              {t('help.quickStart')}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {t('help.quickStartDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button variant="outline" size="sm" className="border-blue-300">
                  1. {t('help.registration.title')}
                </Button>
              </Link>
              <ChevronRight className="h-5 w-5 text-blue-400 self-center hidden sm:block" />
              <Link href="/settings">
                <Button variant="outline" size="sm" className="border-blue-300">
                  2. {t('help.accountSetup.title')}
                </Button>
              </Link>
              <ChevronRight className="h-5 w-5 text-blue-400 self-center hidden sm:block" />
              <Link href="/transactions/create">
                <Button variant="outline" size="sm" className="border-blue-300">
                  3. {t('help.createTransaction.title')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Guide Sections */}
        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <Card
                key={section.id}
                className={`cursor-pointer transition-all ${
                  isExpanded ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
              >
                <CardHeader
                  className="flex flex-row items-center justify-between"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      isExpanded ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isExpanded ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {t(section.titleKey)}
                      </CardTitle>
                      <CardDescription>
                        {t(section.descriptionKey)}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <ol className="space-y-3">
                        {section.steps.map((stepKey, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">
                              {t(stepKey)}
                            </span>
                          </li>
                        ))}
                      </ol>

                      {section.link && (
                        <div className="mt-4 pt-4 border-t">
                          <Link href={section.link}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Go to {t(section.titleKey).replace(/^\d+\.\s*/, '')}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Need More Help */}
        <Card className="mt-8 bg-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('help.needMoreHelp')}
            </CardTitle>
            <CardDescription>
              {t('help.contactSupport')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${t('help.supportEmail')}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('help.supportEmail')}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
