// Email template helper for multilingual buyer welcome emails

import type { LanguageCode as Language } from '@/lib/constants';

interface WelcomeEmailData {
  fullName: string;
  email: string;
  password: string;
  loginUrl: string;
  language: Language;
  agentName: string;
  agentLogoUrl?: string | null;
  agentPrimaryColor?: string;
}

const translations = {
  en: {
    subject: 'Welcome to The Property Gateway',
    title: 'Welcome to The Property Gateway!',
    greeting: 'Hello',
    intro: 'Your estate agent has created an account for you on The Property Gateway to manage your property transaction.',
    credentialsTitle: 'Your Login Credentials',
    email: 'Email',
    password: 'Password',
    instructions: 'To get started, click the button below to access the login page, then use the credentials above to sign in. You will be required to change your password on first login for security.',
    buttonText: 'Go to Login Page',
    altLink: 'Or copy and paste this link into your browser:',
    securityNote: 'For your security, you must change your password when you first log in.',
    expiration: 'If you didn\'t expect this email, you can safely ignore it.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'International Property Transaction Portal',
    footerDisclaimer: 'This is an automated email from The Property Gateway. Please do not reply to this email.',
  },
  it: {
    subject: 'Benvenuto su The Property Gateway',
    title: 'Benvenuto su The Property Gateway!',
    greeting: 'Ciao',
    intro: 'Il tuo agente immobiliare ha creato un account per te su The Property Gateway per gestire la tua transazione immobiliare.',
    credentialsTitle: 'Le Tue Credenziali di Accesso',
    email: 'Email',
    password: 'Password',
    instructions: 'Per iniziare, clicca sul pulsante qui sotto per accedere alla pagina di login, quindi utilizza le credenziali sopra indicate per accedere. Ti verrà richiesto di cambiare la password al primo accesso per sicurezza.',
    buttonText: 'Vai alla Pagina di Login',
    altLink: 'Oppure copia e incolla questo link nel tuo browser:',
    securityNote: 'Per la tua sicurezza, devi cambiare la password al primo accesso.',
    expiration: 'Se non ti aspettavi questa email, puoi ignorarla tranquillamente.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portale Internazionale per Transazioni Immobiliari',
    footerDisclaimer: 'Questa è un\'email automatica da The Property Gateway. Si prega di non rispondere a questa email.',
  },
  pl: {
    subject: 'Witamy w The Property Gateway',
    title: 'Witamy w The Property Gateway!',
    greeting: 'Cześć',
    intro: 'Twój agent nieruchomości utworzył dla Ciebie konto w The Property Gateway, aby zarządzać Twoją transakcją nieruchomości.',
    credentialsTitle: 'Twoje Dane Logowania',
    email: 'Email',
    password: 'Hasło',
    instructions: 'Aby rozpocząć, kliknij przycisk poniżej, aby przejść do strony logowania, a następnie użyj powyższych danych logowania, aby się zalogować. Przy pierwszym logowaniu będziesz musiał zmienić hasło ze względów bezpieczeństwa.',
    buttonText: 'Przejdź do Strony Logowania',
    altLink: 'Lub skopiuj i wklej ten link do przeglądarki:',
    securityNote: 'Ze względów bezpieczeństwa musisz zmienić hasło przy pierwszym logowaniu.',
    expiration: 'Jeśli nie spodziewałeś się tej wiadomości e-mail, możesz ją bezpiecznie zignorować.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Międzynarodowy Portal Transakcji Nieruchomości',
    footerDisclaimer: 'To jest automatyczna wiadomość e-mail z The Property Gateway. Prosimy nie odpowiadać na tę wiadomość.',
  },
  es: {
    subject: 'Bienvenido a The Property Gateway',
    title: '¡Bienvenido a The Property Gateway!',
    greeting: 'Hola',
    intro: 'Tu agente inmobiliario ha creado una cuenta para ti en The Property Gateway para gestionar tu transacción inmobiliaria.',
    credentialsTitle: 'Tus Credenciales de Inicio de Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    instructions: 'Para comenzar, haz clic en el botón a continuación para acceder a la página de inicio de sesión, luego usa las credenciales anteriores para iniciar sesión. Se te pedirá que cambies tu contraseña en el primer inicio de sesión por seguridad.',
    buttonText: 'Ir a la Página de Inicio de Sesión',
    altLink: 'O copie y pegue este enlace en su navegador:',
    securityNote: 'Por tu seguridad, debes cambiar tu contraseña en el primer inicio de sesión.',
    expiration: 'Si no esperaba este correo electrónico, puede ignorarlo de forma segura.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portal Internacional de Transacciones Inmobiliarias',
    footerDisclaimer: 'Este es un correo electrónico automatizado de The Property Gateway. Por favor, no responda a este correo electrónico.',
  },
  fr: {
    subject: 'Bienvenue sur The Property Gateway',
    title: 'Bienvenue sur The Property Gateway !',
    greeting: 'Bonjour',
    intro: 'Votre agent immobilier a créé un compte pour vous sur The Property Gateway pour gérer votre transaction immobilière.',
    credentialsTitle: 'Vos Identifiants de Connexion',
    email: 'E-mail',
    password: 'Mot de passe',
    instructions: 'Pour commencer, cliquez sur le bouton ci-dessous pour accéder à la page de connexion, puis utilisez les identifiants ci-dessus pour vous connecter. Vous devrez changer votre mot de passe lors de votre première connexion pour des raisons de sécurité.',
    buttonText: 'Aller à la Page de Connexion',
    altLink: 'Ou copiez et collez ce lien dans votre navigateur :',
    securityNote: 'Pour votre sécurité, vous devez changer votre mot de passe lors de votre première connexion.',
    expiration: 'Si vous ne vous attendiez pas à cet e-mail, vous pouvez l\'ignorer en toute sécurité.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portail International de Transactions Immobilières',
    footerDisclaimer: 'Il s\'agit d\'un e-mail automatique de The Property Gateway. Veuillez ne pas répondre à cet e-mail.',
  },
  nl: {
    subject: 'Welkom bij The Property Gateway',
    title: 'Welkom bij The Property Gateway!',
    greeting: 'Hallo',
    intro: 'Uw makelaar heeft een account voor u aangemaakt op The Property Gateway om uw vastgoedtransactie te beheren.',
    credentialsTitle: 'Uw Inloggegevens',
    email: 'E-mail',
    password: 'Wachtwoord',
    instructions: 'Om te beginnen, klik op de onderstaande knop om naar de inlogpagina te gaan, gebruik vervolgens de bovenstaande inloggegevens om in te loggen. U wordt gevraagd uw wachtwoord te wijzigen bij de eerste login voor beveiliging.',
    buttonText: 'Ga naar Inlogpagina',
    altLink: 'Of kopieer en plak deze link in uw browser:',
    securityNote: 'Voor uw veiligheid moet u uw wachtwoord wijzigen bij de eerste login.',
    expiration: 'Als u deze e-mail niet verwachtte, kunt u deze veilig negeren.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Internationaal Portaal voor Vastgoedtransacties',
    footerDisclaimer: 'Dit is een geautomatiseerde e-mail van The Property Gateway. Gelieve niet te antwoorden op deze e-mail.',
  },
  de: {
    subject: 'Willkommen bei The Property Gateway',
    title: 'Willkommen bei The Property Gateway!',
    greeting: 'Hallo',
    intro: 'Ihr Immobilienmakler hat ein Konto für Sie auf The Property Gateway erstellt, um Ihre Immobilientransaktion zu verwalten.',
    credentialsTitle: 'Ihre Anmeldedaten',
    email: 'E-Mail',
    password: 'Passwort',
    instructions: 'Um zu beginnen, klicken Sie auf die Schaltfläche unten, um zur Anmeldeseite zu gelangen, und verwenden Sie dann die oben genannten Anmeldedaten, um sich anzumelden. Sie werden aus Sicherheitsgründen aufgefordert, Ihr Passwort bei der ersten Anmeldung zu ändern.',
    buttonText: 'Zur Anmeldeseite',
    altLink: 'Oder kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:',
    securityNote: 'Zu Ihrer Sicherheit müssen Sie Ihr Passwort bei der ersten Anmeldung ändern.',
    expiration: 'Wenn Sie diese E-Mail nicht erwartet haben, können Sie sie sicher ignorieren.',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Internationales Immobilientransaktionsportal',
    footerDisclaimer: 'Dies ist eine automatische E-Mail von The Property Gateway. Bitte antworten Sie nicht auf diese E-Mail.',
  },
};

export function generateBuyerWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const t = translations[data.language] || translations.en;

  const html = `<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Agent Branding -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: ${data.agentPrimaryColor ? `linear-gradient(135deg, ${data.agentPrimaryColor} 0%, ${data.agentPrimaryColor} 100%)` : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'}; border-radius: 8px 8px 0 0;">
              ${data.agentLogoUrl ? `
                <img src="${data.agentLogoUrl}" alt="Agent Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
              ` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                ${data.agentName}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                via The Property Gateway
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Title -->
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                ${t.title}
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${t.greeting} ${data.fullName},
              </p>
              
              <!-- Main message -->
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${t.intro}
              </p>
              
              <!-- Credentials Box -->
              <div style="margin: 0 0 24px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                <h3 style="margin: 0 0 16px; color: #1e40af; font-size: 18px; font-weight: 600;">
                  ${t.credentialsTitle}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                      ${t.email}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace;">
                      ${data.email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                      ${t.password}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace; font-weight: 600;">
                      ${data.password}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Note -->
              <div style="margin: 0 0 24px; padding: 12px 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  ⚠️ ${t.securityNote}
                </p>
              </div>
              
              <!-- Call to action text -->
              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${t.instructions}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${data.loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${t.altLink}
              </p>
              <p style="margin: 0 0 32px; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; color: #374151; font-size: 13px; font-family: monospace; line-height: 1.5;">
                ${data.loginUrl}
              </p>
              
              <!-- Footer Note -->
              <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 1.6;">
                ${t.expiration}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; text-align: center;">
                <strong>${t.footerTitle}</strong><br>
                ${t.footerSubtitle}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                ${t.footerDisclaimer}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: t.subject,
    html,
  };
}

// ============================================
// Buyer Connection Notification Email
// (When existing buyer is connected with new agent)
// ============================================

interface ConnectionEmailData {
  buyerName: string;
  agentName: string;
  agentEmail: string;
  loginUrl: string;
  language: Language;
  agentLogoUrl?: string | null;
  agentPrimaryColor?: string;
}

const connectionTranslations = {
  en: {
    subject: 'New Agent Connection - The Property Gateway',
    title: 'You\'ve been connected with a new agent',
    greeting: 'Hello',
    intro: 'has connected with you on The Property Gateway for a new property transaction.',
    accessTitle: 'Access Your Account',
    instructions: 'You can log in to The Property Gateway using your existing credentials to view all your property transactions.',
    buttonText: 'Go to Dashboard',
    altLink: 'Or copy and paste this link into your browser:',
    multipleAgents: 'You can work with multiple agents simultaneously. Each transaction will show the relevant agent\'s information.',
    contactInfo: 'Agent Contact Information',
    email: 'Email',
    questions: 'If you have any questions about this connection, please contact',
    directly: 'directly',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'International Property Transaction Portal',
    footerDisclaimer: 'This is an automated notification from The Property Gateway. Please do not reply to this email.',
  },
  it: {
    subject: 'Nuova Connessione Agente - The Property Gateway',
    title: 'Sei stato connesso con un nuovo agente',
    greeting: 'Ciao',
    intro: 'si è connesso con te su The Property Gateway per una nuova transazione immobiliare.',
    accessTitle: 'Accedi al Tuo Account',
    instructions: 'Puoi accedere a The Property Gateway utilizzando le tue credenziali esistenti per visualizzare tutte le tue transazioni immobiliari.',
    buttonText: 'Vai alla Dashboard',
    altLink: 'Oppure copia e incolla questo link nel tuo browser:',
    multipleAgents: 'Puoi lavorare con più agenti simultaneamente. Ogni transazione mostrerà le informazioni dell\'agente pertinente.',
    contactInfo: 'Informazioni di Contatto dell\'Agente',
    email: 'Email',
    questions: 'Se hai domande su questa connessione, contatta',
    directly: 'direttamente',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portale Internazionale per Transazioni Immobiliari',
    footerDisclaimer: 'Questa è una notifica automatica da The Property Gateway. Si prega di non rispondere a questa email.',
  },
  pl: {
    subject: 'Nowe Połączenie z Agentem - The Property Gateway',
    title: 'Zostałeś połączony z nowym agentem',
    greeting: 'Cześć',
    intro: 'połączył się z Tobą w The Property Gateway w sprawie nowej transakcji nieruchomości.',
    accessTitle: 'Uzyskaj Dostęp do Swojego Konta',
    instructions: 'Możesz zalogować się do The Property Gateway, używając swoich istniejących danych logowania, aby wyświetlić wszystkie swoje transakcje nieruchomości.',
    buttonText: 'Przejdź do Panelu',
    altLink: 'Lub skopiuj i wklej ten link do przeglądarki:',
    multipleAgents: 'Możesz pracować z wieloma agentami jednocześnie. Każda transakcja pokaże informacje o odpowiednim agencie.',
    contactInfo: 'Informacje Kontaktowe Agenta',
    email: 'Email',
    questions: 'Jeśli masz pytania dotyczące tego połączenia, skontaktuj się z',
    directly: 'bezpośrednio',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Międzynarodowy Portal Transakcji Nieruchomości',
    footerDisclaimer: 'To jest automatyczne powiadomienie z The Property Gateway. Prosimy nie odpowiadać na tę wiadomość.',
  },
  es: {
    subject: 'Nueva Conexión de Agente - The Property Gateway',
    title: 'Te has conectado con un nuevo agente',
    greeting: 'Hola',
    intro: 'se ha conectado contigo en The Property Gateway para una nueva transacción inmobiliaria.',
    accessTitle: 'Accede a Tu Cuenta',
    instructions: 'Puedes iniciar sesión en The Property Gateway usando tus credenciales existentes para ver todas tus transacciones inmobiliarias.',
    buttonText: 'Ir al Panel',
    altLink: 'O copie y pegue este enlace en su navegador:',
    multipleAgents: 'Puedes trabajar con múltiples agentes simultáneamente. Cada transacción mostrará la información del agente relevante.',
    contactInfo: 'Información de Contacto del Agente',
    email: 'Correo Electrónico',
    questions: 'Si tienes preguntas sobre esta conexión, contacta a',
    directly: 'directamente',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portal Internacional de Transacciones Inmobiliarias',
    footerDisclaimer: 'Esta es una notificación automatizada de The Property Gateway. Por favor, no responda a este correo electrónico.',
  },
  fr: {
    subject: 'Nouvelle Connexion d\'Agent - The Property Gateway',
    title: 'Vous avez été connecté avec un nouvel agent',
    greeting: 'Bonjour',
    intro: 's\'est connecté avec vous sur The Property Gateway pour une nouvelle transaction immobilière.',
    accessTitle: 'Accédez à Votre Compte',
    instructions: 'Vous pouvez vous connecter à The Property Gateway en utilisant vos identifiants existants pour voir toutes vos transactions immobilières.',
    buttonText: 'Aller au Tableau de Bord',
    altLink: 'Ou copiez et collez ce lien dans votre navigateur :',
    multipleAgents: 'Vous pouvez travailler avec plusieurs agents simultanément. Chaque transaction affichera les informations de l\'agent concerné.',
    contactInfo: 'Informations de Contact de l\'Agent',
    email: 'E-mail',
    questions: 'Si vous avez des questions sur cette connexion, contactez',
    directly: 'directement',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Portail International de Transactions Immobilières',
    footerDisclaimer: 'Il s\'agit d\'une notification automatique de The Property Gateway. Veuillez ne pas répondre à cet e-mail.',
  },
  nl: {
    subject: 'Nieuwe Agentverbinding - The Property Gateway',
    title: 'Je bent verbonden met een nieuwe makelaar',
    greeting: 'Hallo',
    intro: 'heeft contact met je opgenomen via The Property Gateway voor een nieuwe vastgoedtransactie.',
    accessTitle: 'Toegang tot Je Account',
    instructions: 'Je kunt inloggen op The Property Gateway met je bestaande inloggegevens om al je vastgoedtransacties te bekijken.',
    buttonText: 'Ga naar Dashboard',
    altLink: 'Of kopieer en plak deze link in je browser:',
    multipleAgents: 'Je kunt tegelijkertijd met meerdere makelaars werken. Elke transactie toont de informatie van de relevante makelaar.',
    contactInfo: 'Contactinformatie Makelaar',
    email: 'E-mail',
    questions: 'Als je vragen hebt over deze verbinding, neem dan contact op met',
    directly: 'rechtstreeks',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Internationaal Vastgoedtransactieportaal',
    footerDisclaimer: 'Dit is een geautomatiseerde melding van The Property Gateway. Reageer niet op deze e-mail.',
  },
  de: {
    subject: 'Neue Agentenverbindung - The Property Gateway',
    title: 'Sie wurden mit einem neuen Makler verbunden',
    greeting: 'Hallo',
    intro: 'hat sich über The Property Gateway mit Ihnen für eine neue Immobilientransaktion verbunden.',
    accessTitle: 'Zugriff auf Ihr Konto',
    instructions: 'Sie können sich bei The Property Gateway mit Ihren bestehenden Anmeldedaten anmelden, um alle Ihre Immobilientransaktionen zu sehen.',
    buttonText: 'Zum Dashboard',
    altLink: 'Oder kopieren und fügen Sie diesen Link in Ihren Browser ein:',
    multipleAgents: 'Sie können gleichzeitig mit mehreren Maklern arbeiten. Jede Transaktion zeigt die Informationen des relevanten Maklers.',
    contactInfo: 'Kontaktinformationen des Maklers',
    email: 'E-Mail',
    questions: 'Wenn Sie Fragen zu dieser Verbindung haben, kontaktieren Sie',
    directly: 'direkt',
    footerTitle: 'The Property Gateway',
    footerSubtitle: 'Internationales Immobilientransaktionsportal',
    footerDisclaimer: 'Dies ist eine automatisierte Benachrichtigung von The Property Gateway. Bitte antworten Sie nicht auf diese E-Mail.',
  },
};

export function generateBuyerConnectionEmail(data: ConnectionEmailData): { subject: string; html: string } {
  const t = connectionTranslations[data.language] || connectionTranslations.en;

  const html = `<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Agent Branding -->
          <tr>
            <td style="background: ${data.agentPrimaryColor ? `linear-gradient(135deg, ${data.agentPrimaryColor} 0%, ${data.agentPrimaryColor} 100%)` : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'}; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              ${data.agentLogoUrl ? `
                <img src="${data.agentLogoUrl}" alt="Agent Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
              ` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${data.agentName}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                via The Property Gateway
              </p>
              <h2 style="margin: 20px 0 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                ${t.title}
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 24px;">
                <strong>${t.greeting} ${data.buyerName},</strong>
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 24px;">
                <strong>${data.agentName}</strong> ${t.intro}
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  ${t.contactInfo}
                </h2>
                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                  <strong>${data.agentName}</strong>
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  ${t.email}: <a href="mailto:${data.agentEmail}" style="color: #2563eb; text-decoration: none;">${data.agentEmail}</a>
                </p>
              </div>

              <!-- Access Account Section -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  ${t.accessTitle}
                </h2>
                <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 22px;">
                  ${t.instructions}
                </p>

                <!-- Login Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                        ${t.buttonText}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                  ${t.altLink}
                </p>
                <p style="margin: 5px 0 0; color: #2563eb; font-size: 13px; text-align: center; word-break: break-all;">
                  <a href="${data.loginUrl}" style="color: #2563eb; text-decoration: underline;">${data.loginUrl}</a>
                </p>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                  <strong>ℹ️ ${t.multipleAgents}</strong>
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #6b7280; font-size: 14px; line-height: 21px;">
                ${t.questions} <strong>${data.agentName}</strong> ${t.directly}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">
                ${t.footerTitle}
              </p>
              <p style="margin: 0 0 15px; color: #6b7280; font-size: 13px;">
                ${t.footerSubtitle}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                ${t.footerDisclaimer}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: t.subject,
    html,
  };
}

