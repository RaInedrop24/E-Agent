'use client';

/**
 * Onboarding Tour Component
 *
 * Provides an interactive guided tour for new users using react-joyride.
 * Automatically shows on first login and can be manually triggered from the help page.
 *
 * Usage:
 *   <OnboardingTour />
 *
 * Add data-tour attributes to target elements:
 *   <button data-tour="create-transaction">Create</button>
 */

import { useState, useEffect, useCallback } from 'react';
import Joyride, {
  Step,
  CallBackProps,
  STATUS,
  EVENTS,
  ACTIONS,
  Styles
} from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase';

// Tour step definitions with multi-language support
interface TourStep extends Omit<Step, 'content' | 'title'> {
  titleKey: string;
  contentKey: string;
}

// Agent tour steps
const AGENT_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    titleKey: 'tour.welcome.title',
    contentKey: 'tour.welcome.content',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="transactions-list"]',
    titleKey: 'tour.transactions.title',
    contentKey: 'tour.transactions.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-activity"]',
    titleKey: 'tour.activity.title',
    contentKey: 'tour.activity.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    titleKey: 'tour.userMenu.title',
    contentKey: 'tour.userMenu.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="hamburger-menu"]',
    titleKey: 'tour.hamburgerMenu.title',
    contentKey: 'tour.hamburgerMenu.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    titleKey: 'tour.nextSteps.title',
    contentKey: 'tour.nextSteps.content',
    placement: 'center',
  },
];

// Buyer tour steps
const BUYER_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    titleKey: 'tour.buyer.welcome.title',
    contentKey: 'tour.buyer.welcome.content',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="transactions-list"]',
    titleKey: 'tour.buyer.transactions.title',
    contentKey: 'tour.buyer.transactions.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-activity"]',
    titleKey: 'tour.buyer.activity.title',
    contentKey: 'tour.buyer.activity.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    titleKey: 'tour.buyer.userMenu.title',
    contentKey: 'tour.buyer.userMenu.content',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    titleKey: 'tour.buyer.nextSteps.title',
    contentKey: 'tour.buyer.nextSteps.content',
    placement: 'center',
  },
];

// Tour translations (add these to ui-translations.ts)
const TOUR_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'tour.welcome.title': 'Welcome to The Property Gateway!',
    'tour.welcome.content': 'Let\'s take a quick tour to help you get started with managing your property transactions.',
    'tour.transactions.title': 'Your Transactions',
    'tour.transactions.content': 'Here you\'ll see all your active property transactions. Click on any transaction to view details, track progress, and communicate with buyers.',
    'tour.activity.title': 'Recent Activity',
    'tour.activity.content': 'Stay up to date with the latest activity across all your transactions - new messages, completed milestones, and uploaded files.',
    'tour.userMenu.title': 'Your Profile & Settings',
    'tour.userMenu.content': 'Click here to access Settings where you can set up your Avatar, configure your Agency Branding, and manage Alert preferences.',
    'tour.hamburgerMenu.title': 'Main Menu',
    'tour.hamburgerMenu.content': 'This menu gives you access to all features: Dashboard, Transactions, Manage Buyers, Milestone Templates, and the Help guide.',
    'tour.nextSteps.title': 'You\'re All Set!',
    'tour.nextSteps.content': 'That\'s the basics covered! You can access this tour again anytime via the Help option in the menu. The Help page also has detailed guides for each feature.',
    'tour.next': 'Next',
    'tour.back': 'Back',
    'tour.skip': 'Skip Tour',
    'tour.finish': 'Get Started!',
    // Buyer tour translations
    'tour.buyer.welcome.title': 'Welcome to The Property Gateway!',
    'tour.buyer.welcome.content': 'Let\'s take a quick tour to help you get started with tracking your property transactions.',
    'tour.buyer.transactions.title': 'Your Transactions',
    'tour.buyer.transactions.content': 'Here you\'ll see all your property transactions. Click on any transaction to view details, track progress, message your agent, and download files.',
    'tour.buyer.activity.title': 'Recent Activity',
    'tour.buyer.activity.content': 'Stay up to date with the latest updates across all your transactions - new messages from your agent, completed milestones, and uploaded documents.',
    'tour.buyer.userMenu.title': 'Your Profile & Settings',
    'tour.buyer.userMenu.content': 'Click here to access Settings where you can upload your avatar and reset your password.',
    'tour.buyer.nextSteps.title': 'You\'re All Set!',
    'tour.buyer.nextSteps.content': 'That\'s the basics covered! You can access this tour again anytime via the Help option in the menu. The Help page also has detailed guides for each feature.',
  },
  it: {
    'tour.welcome.title': 'Benvenuto su The Property Gateway!',
    'tour.welcome.content': 'Facciamo un breve tour per aiutarti a iniziare a gestire le tue transazioni immobiliari.',
    'tour.transactions.title': 'Le Tue Transazioni',
    'tour.transactions.content': 'Qui vedrai tutte le tue transazioni immobiliari attive. Clicca su qualsiasi transazione per visualizzare i dettagli, monitorare i progressi e comunicare con gli acquirenti.',
    'tour.activity.title': 'Attività Recente',
    'tour.activity.content': 'Rimani aggiornato con le ultime attività di tutte le tue transazioni - nuovi messaggi, tappe completate e file caricati.',
    'tour.userMenu.title': 'Profilo e Impostazioni',
    'tour.userMenu.content': 'Clicca qui per accedere alle Impostazioni dove puoi configurare il tuo Avatar, il Branding dell\'Agenzia e le preferenze degli Avvisi.',
    'tour.hamburgerMenu.title': 'Menu Principale',
    'tour.hamburgerMenu.content': 'Questo menu ti dà accesso a tutte le funzionalità: Dashboard, Transazioni, Gestione Acquirenti, Template Milestone e la guida Aiuto.',
    'tour.nextSteps.title': 'Tutto Pronto!',
    'tour.nextSteps.content': 'Ecco le basi! Puoi accedere a questo tour in qualsiasi momento tramite l\'opzione Aiuto nel menu. La pagina Aiuto contiene anche guide dettagliate per ogni funzionalità.',
    'tour.next': 'Avanti',
    'tour.back': 'Indietro',
    'tour.skip': 'Salta Tour',
    'tour.finish': 'Inizia!',
    // Buyer tour translations
    'tour.buyer.welcome.title': 'Benvenuto su The Property Gateway!',
    'tour.buyer.welcome.content': 'Facciamo un breve tour per aiutarti a iniziare a tracciare le tue transazioni immobiliari.',
    'tour.buyer.transactions.title': 'Le Tue Transazioni',
    'tour.buyer.transactions.content': 'Qui vedrai tutte le tue transazioni immobiliari. Clicca su qualsiasi transazione per visualizzare i dettagli, monitorare i progressi, messaggiare il tuo agente e scaricare file.',
    'tour.buyer.activity.title': 'Attività Recente',
    'tour.buyer.activity.content': 'Rimani aggiornato con gli ultimi aggiornamenti di tutte le tue transazioni - nuovi messaggi dal tuo agente, tappe completate e documenti caricati.',
    'tour.buyer.userMenu.title': 'Profilo e Impostazioni',
    'tour.buyer.userMenu.content': 'Clicca qui per accedere alle Impostazioni dove puoi caricare il tuo avatar e reimpostare la password.',
    'tour.buyer.nextSteps.title': 'Tutto Pronto!',
    'tour.buyer.nextSteps.content': 'Ecco le basi! Puoi accedere a questo tour in qualsiasi momento tramite l\'opzione Aiuto nel menu. La pagina Aiuto contiene anche guide dettagliate per ogni funzionalità.',
  },
  es: {
    'tour.welcome.title': '¡Bienvenido a The Property Gateway!',
    'tour.welcome.content': 'Hagamos un recorrido rápido para ayudarte a comenzar a gestionar tus transacciones inmobiliarias.',
    'tour.transactions.title': 'Tus Transacciones',
    'tour.transactions.content': 'Aquí verás todas tus transacciones inmobiliarias activas. Haz clic en cualquier transacción para ver detalles, seguir el progreso y comunicarte con los compradores.',
    'tour.activity.title': 'Actividad Reciente',
    'tour.activity.content': 'Mantente al día con la última actividad de todas tus transacciones - nuevos mensajes, hitos completados y archivos subidos.',
    'tour.userMenu.title': 'Tu Perfil y Configuración',
    'tour.userMenu.content': 'Haz clic aquí para acceder a Configuración donde puedes configurar tu Avatar, el Branding de tu Agencia y las preferencias de Alertas.',
    'tour.hamburgerMenu.title': 'Menú Principal',
    'tour.hamburgerMenu.content': 'Este menú te da acceso a todas las funciones: Dashboard, Transacciones, Gestionar Compradores, Plantillas de Hitos y la guía de Ayuda.',
    'tour.nextSteps.title': '¡Todo Listo!',
    'tour.nextSteps.content': '¡Eso cubre lo básico! Puedes acceder a este tour en cualquier momento a través de la opción Ayuda en el menú. La página de Ayuda también tiene guías detalladas para cada función.',
    'tour.next': 'Siguiente',
    'tour.back': 'Atrás',
    'tour.skip': 'Saltar Tour',
    'tour.finish': '¡Empezar!',
    // Buyer tour translations
    'tour.buyer.welcome.title': '¡Bienvenido a The Property Gateway!',
    'tour.buyer.welcome.content': 'Hagamos un recorrido rápido para ayudarte a comenzar a rastrear tus transacciones inmobiliarias.',
    'tour.buyer.transactions.title': 'Tus Transacciones',
    'tour.buyer.transactions.content': 'Aquí verás todas tus transacciones inmobiliarias. Haz clic en cualquier transacción para ver detalles, seguir el progreso, enviar mensajes a tu agente y descargar archivos.',
    'tour.buyer.activity.title': 'Actividad Reciente',
    'tour.buyer.activity.content': 'Mantente al día con las últimas actualizaciones de todas tus transacciones - nuevos mensajes de tu agente, hitos completados y documentos subidos.',
    'tour.buyer.userMenu.title': 'Tu Perfil y Configuración',
    'tour.buyer.userMenu.content': 'Haz clic aquí para acceder a Configuración donde puedes subir tu avatar y restablecer tu contraseña.',
    'tour.buyer.nextSteps.title': '¡Todo Listo!',
    'tour.buyer.nextSteps.content': '¡Eso cubre lo básico! Puedes acceder a este tour en cualquier momento a través de la opción Ayuda en el menú. La página de Ayuda también tiene guías detalladas para cada función.',
  },
  fr: {
    'tour.welcome.title': 'Bienvenue sur The Property Gateway!',
    'tour.welcome.content': 'Faisons une visite rapide pour vous aider à commencer à gérer vos transactions immobilières.',
    'tour.transactions.title': 'Vos Transactions',
    'tour.transactions.content': 'Ici, vous verrez toutes vos transactions immobilières actives. Cliquez sur une transaction pour voir les détails, suivre les progrès et communiquer avec les acheteurs.',
    'tour.activity.title': 'Activité Récente',
    'tour.activity.content': 'Restez à jour avec les dernières activités de toutes vos transactions - nouveaux messages, étapes complétées et fichiers téléchargés.',
    'tour.userMenu.title': 'Votre Profil et Paramètres',
    'tour.userMenu.content': 'Cliquez ici pour accéder aux Paramètres où vous pouvez configurer votre Avatar, le Branding de votre Agence et les préférences d\'Alertes.',
    'tour.hamburgerMenu.title': 'Menu Principal',
    'tour.hamburgerMenu.content': 'Ce menu vous donne accès à toutes les fonctionnalités: Tableau de bord, Transactions, Gérer les Acheteurs, Modèles d\'Étapes et le guide d\'Aide.',
    'tour.nextSteps.title': 'Vous êtes Prêt!',
    'tour.nextSteps.content': 'Voilà les bases! Vous pouvez accéder à cette visite à tout moment via l\'option Aide dans le menu. La page Aide contient également des guides détaillés pour chaque fonctionnalité.',
    'tour.next': 'Suivant',
    'tour.back': 'Retour',
    'tour.skip': 'Passer la Visite',
    'tour.finish': 'Commencer!',
    // Buyer tour translations
    'tour.buyer.welcome.title': 'Bienvenue sur The Property Gateway!',
    'tour.buyer.welcome.content': 'Faisons une visite rapide pour vous aider à commencer à suivre vos transactions immobilières.',
    'tour.buyer.transactions.title': 'Vos Transactions',
    'tour.buyer.transactions.content': 'Ici, vous verrez toutes vos transactions immobilières. Cliquez sur une transaction pour voir les détails, suivre les progrès, envoyer des messages à votre agent et télécharger des fichiers.',
    'tour.buyer.activity.title': 'Activité Récente',
    'tour.buyer.activity.content': 'Restez à jour avec les dernières mises à jour de toutes vos transactions - nouveaux messages de votre agent, étapes complétées et documents téléchargés.',
    'tour.buyer.userMenu.title': 'Votre Profil et Paramètres',
    'tour.buyer.userMenu.content': 'Cliquez ici pour accéder aux Paramètres où vous pouvez télécharger votre avatar et réinitialiser votre mot de passe.',
    'tour.buyer.nextSteps.title': 'Vous êtes Prêt!',
    'tour.buyer.nextSteps.content': 'Voilà les bases! Vous pouvez accéder à cette visite à tout moment via l\'option Aide dans le menu. La page Aide contient également des guides détaillés pour chaque fonctionnalité.',
  },
  de: {
    'tour.welcome.title': 'Willkommen bei The Property Gateway!',
    'tour.welcome.content': 'Lassen Sie uns eine kurze Tour machen, um Ihnen den Einstieg in die Verwaltung Ihrer Immobilientransaktionen zu erleichtern.',
    'tour.transactions.title': 'Ihre Transaktionen',
    'tour.transactions.content': 'Hier sehen Sie alle Ihre aktiven Immobilientransaktionen. Klicken Sie auf eine Transaktion, um Details anzuzeigen, den Fortschritt zu verfolgen und mit Käufern zu kommunizieren.',
    'tour.activity.title': 'Letzte Aktivität',
    'tour.activity.content': 'Bleiben Sie über die neuesten Aktivitäten aller Ihrer Transaktionen auf dem Laufenden - neue Nachrichten, abgeschlossene Meilensteine und hochgeladene Dateien.',
    'tour.userMenu.title': 'Ihr Profil & Einstellungen',
    'tour.userMenu.content': 'Klicken Sie hier, um auf die Einstellungen zuzugreifen, wo Sie Ihr Avatar einrichten, Ihr Agentur-Branding konfigurieren und Benachrichtigungseinstellungen verwalten können.',
    'tour.hamburgerMenu.title': 'Hauptmenü',
    'tour.hamburgerMenu.content': 'Dieses Menü gibt Ihnen Zugang zu allen Funktionen: Dashboard, Transaktionen, Käufer verwalten, Meilenstein-Vorlagen und den Hilfe-Leitfaden.',
    'tour.nextSteps.title': 'Alles Bereit!',
    'tour.nextSteps.content': 'Das sind die Grundlagen! Sie können diese Tour jederzeit über die Hilfe-Option im Menü erneut starten. Die Hilfe-Seite enthält auch detaillierte Anleitungen für jede Funktion.',
    'tour.next': 'Weiter',
    'tour.back': 'Zurück',
    'tour.skip': 'Tour Überspringen',
    'tour.finish': 'Loslegen!',
    // Buyer tour translations
    'tour.buyer.welcome.title': 'Willkommen bei The Property Gateway!',
    'tour.buyer.welcome.content': 'Lassen Sie uns eine kurze Tour machen, um Ihnen den Einstieg in die Verfolgung Ihrer Immobilientransaktionen zu erleichtern.',
    'tour.buyer.transactions.title': 'Ihre Transaktionen',
    'tour.buyer.transactions.content': 'Hier sehen Sie alle Ihre Immobilientransaktionen. Klicken Sie auf eine Transaktion, um Details anzuzeigen, den Fortschritt zu verfolgen, Ihrem Makler Nachrichten zu senden und Dateien herunterzuladen.',
    'tour.buyer.activity.title': 'Letzte Aktivität',
    'tour.buyer.activity.content': 'Bleiben Sie über die neuesten Updates aller Ihrer Transaktionen auf dem Laufenden - neue Nachrichten von Ihrem Makler, abgeschlossene Meilensteine und hochgeladene Dokumente.',
    'tour.buyer.userMenu.title': 'Ihr Profil & Einstellungen',
    'tour.buyer.userMenu.content': 'Klicken Sie hier, um auf die Einstellungen zuzugreifen, wo Sie Ihr Avatar hochladen und Ihr Passwort zurücksetzen können.',
    'tour.buyer.nextSteps.title': 'Alles Bereit!',
    'tour.buyer.nextSteps.content': 'Das sind die Grundlagen! Sie können diese Tour jederzeit über die Hilfe-Option im Menü erneut starten. Die Hilfe-Seite enthält auch detaillierte Anleitungen für jede Funktion.',
  },
  pl: {
    'tour.welcome.title': 'Witamy w The Property Gateway!',
    'tour.welcome.content': 'Zróbmy krótką wycieczkę, aby pomóc Ci rozpocząć zarządzanie transakcjami nieruchomości.',
    'tour.transactions.title': 'Twoje Transakcje',
    'tour.transactions.content': 'Tutaj zobaczysz wszystkie swoje aktywne transakcje nieruchomości. Kliknij na dowolną transakcję, aby zobaczyć szczegóły, śledzić postępy i komunikować się z kupującymi.',
    'tour.activity.title': 'Ostatnia Aktywność',
    'tour.activity.content': 'Bądź na bieżąco z najnowszymi aktywnościami wszystkich transakcji - nowymi wiadomościami, ukończonymi kamieniami milowymi i przesłanymi plikami.',
    'tour.userMenu.title': 'Twój Profil i Ustawienia',
    'tour.userMenu.content': 'Kliknij tutaj, aby uzyskać dostęp do Ustawień, gdzie możesz skonfigurować swój Awatar, Branding Agencji i preferencje Powiadomień.',
    'tour.hamburgerMenu.title': 'Menu Główne',
    'tour.hamburgerMenu.content': 'To menu daje ci dostęp do wszystkich funkcji: Dashboard, Transakcje, Zarządzanie Kupującymi, Szablony Kamieni Milowych i przewodnik Pomocy.',
    'tour.nextSteps.title': 'Wszystko Gotowe!',
    'tour.nextSteps.content': 'To podstawy! Możesz uzyskać dostęp do tej wycieczki w dowolnym momencie poprzez opcję Pomoc w menu. Strona Pomocy zawiera również szczegółowe przewodniki dla każdej funkcji.',
    'tour.next': 'Dalej',
    'tour.back': 'Wstecz',
    'tour.skip': 'Pomiń Wycieczkę',
    'tour.finish': 'Rozpocznij!',
    // Buyer tour translations
    'tour.buyer.welcome.title': 'Witamy w The Property Gateway!',
    'tour.buyer.welcome.content': 'Zróbmy krótką wycieczkę, aby pomóc Ci rozpocząć śledzenie transakcji nieruchomości.',
    'tour.buyer.transactions.title': 'Twoje Transakcje',
    'tour.buyer.transactions.content': 'Tutaj zobaczysz wszystkie swoje transakcje nieruchomości. Kliknij na dowolną transakcję, aby zobaczyć szczegóły, śledzić postępy, wysyłać wiadomości do swojego agenta i pobierać pliki.',
    'tour.buyer.activity.title': 'Ostatnia Aktywność',
    'tour.buyer.activity.content': 'Bądź na bieżąco z najnowszymi aktualizacjami wszystkich transakcji - nowymi wiadomościami od twojego agenta, ukończonymi kamieniami milowymi i przesłanymi dokumentami.',
    'tour.buyer.userMenu.title': 'Twój Profil i Ustawienia',
    'tour.buyer.userMenu.content': 'Kliknij tutaj, aby uzyskać dostęp do Ustawień, gdzie możesz przesłać swój awatar i zresetować hasło.',
    'tour.buyer.nextSteps.title': 'Wszystko Gotowe!',
    'tour.buyer.nextSteps.content': 'To podstawy! Możesz uzyskać dostęp do tej wycieczki w dowolnym momencie poprzez opcję Pomoc w menu. Strona Pomocy zawiera również szczegółowe przewodniki dla każdej funkcji.',
  },
};

// Custom styles for the tour
const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: '#1e40af',
    textColor: '#1e293b',
    backgroundColor: '#ffffff',
    arrowColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
  },
  tooltipContent: {
    padding: '10px 0',
  },
  buttonNext: {
    backgroundColor: '#1e40af',
    borderRadius: '8px',
    padding: '10px 20px',
  },
  buttonBack: {
    color: '#64748b',
    marginRight: '10px',
  },
  buttonSkip: {
    color: '#94a3b8',
  },
};

interface OnboardingTourProps {
  /** Force the tour to run regardless of completion status */
  forceRun?: boolean;
  /** Callback when tour completes or is skipped */
  onComplete?: () => void;
}

export function OnboardingTour({ forceRun = false, onComplete }: OnboardingTourProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Get translations for current language
  const t = useCallback((key: string): string => {
    const langTranslations = TOUR_TRANSLATIONS[language] || TOUR_TRANSLATIONS.en;
    return langTranslations[key] || TOUR_TRANSLATIONS.en[key] || key;
  }, [language]);

  // Get tour steps based on role
  const tourSteps = profile?.role === 'buyer' ? BUYER_TOUR_STEPS : AGENT_TOUR_STEPS;

  // Transform steps with translations
  const steps: Step[] = tourSteps.map(step => ({
    ...step,
    title: t(step.titleKey),
    content: t(step.contentKey),
  }));

  // Check if user needs onboarding
  useEffect(() => {
    if (forceRun) {
      setRunTour(true);
      return;
    }

    // Show tour to logged-in users (agents or buyers) who haven't completed it
    if (user && profile && (profile.role === 'agent' || profile.role === 'buyer')) {
      // Check if onboarding is completed (stored in profile or user metadata)
      const onboardingCompleted =
        user.user_metadata?.onboarding_completed === true ||
        profile.onboarding_completed === true;

      if (!onboardingCompleted) {
        // Small delay to let the page render
        const timer = setTimeout(() => setRunTour(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, profile, forceRun]);

  // Mark onboarding as completed
  const markOnboardingComplete = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient();

      if (!supabase) {
        return;
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      await refreshProfile();
    } catch {
      // no-op to avoid noisy console errors during onboarding
    }
  }, [user, refreshProfile]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Update step index for controlled tour
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      markOnboardingComplete();
      onComplete?.();
    }
  }, [markOnboardingComplete, onComplete]);

  // Don't render if not running
  if (!runTour) return null;

  return (
    <Joyride
      steps={steps}
      stepIndex={stepIndex}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      styles={tourStyles}
      callback={handleJoyrideCallback}
      locale={{
        back: t('tour.back'),
        close: t('tour.finish'),
        last: t('tour.finish'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
    />
  );
}

/**
 * Hook to manually trigger the onboarding tour
 */
export function useTriggerTour() {
  const [shouldRun, setShouldRun] = useState(false);

  const triggerTour = useCallback(() => {
    setShouldRun(true);
  }, []);

  const resetTour = useCallback(() => {
    setShouldRun(false);
  }, []);

  return { shouldRun, triggerTour, resetTour };
}

export default OnboardingTour;
