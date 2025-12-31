import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { SupportedLanguage } from "@/lib/translation";

interface SystemAnnouncementEmailProps {
  subject: string;
  message: string;
  recipientType: 'agent' | 'buyer';
  siteUrl?: string;
  language?: SupportedLanguage;
}

// Translation map for email template strings
const emailTranslations: Record<SupportedLanguage, {
  systemAnnouncement: string;
  dear: string;
  agent: string;
  buyer: string;
  supportText: string;
  goToDashboard: string;
  footerText: (role: string) => string;
}> = {
  en: {
    systemAnnouncement: 'System Announcement',
    dear: 'Dear',
    agent: 'Agent',
    buyer: 'Buyer',
    supportText: 'If you have any questions or concerns, please contact our support team.',
    goToDashboard: 'Go to Dashboard',
    footerText: (role) => `You received this system announcement because you are a registered ${role} on The Property Gateway platform.`,
  },
  it: {
    systemAnnouncement: 'Annuncio di Sistema',
    dear: 'Gentile',
    agent: 'Agente',
    buyer: 'Acquirente',
    supportText: 'Se hai domande o dubbi, contatta il nostro team di supporto.',
    goToDashboard: 'Vai alla Dashboard',
    footerText: (role) => `Hai ricevuto questo annuncio di sistema perché sei un ${role} registrato sulla piattaforma The Property Gateway.`,
  },
  es: {
    systemAnnouncement: 'Anuncio del Sistema',
    dear: 'Estimado',
    agent: 'Agente',
    buyer: 'Comprador',
    supportText: 'Si tiene alguna pregunta o inquietud, por favor contacte a nuestro equipo de soporte.',
    goToDashboard: 'Ir al Panel',
    footerText: (role) => `Recibió este anuncio del sistema porque es un ${role} registrado en la plataforma The Property Gateway.`,
  },
  fr: {
    systemAnnouncement: 'Annonce Système',
    dear: 'Cher',
    agent: 'Agent',
    buyer: 'Acheteur',
    supportText: 'Si vous avez des questions ou des préoccupations, veuillez contacter notre équipe de support.',
    goToDashboard: 'Aller au Tableau de Bord',
    footerText: (role) => `Vous avez reçu cette annonce système car vous êtes un ${role} enregistré sur la plateforme The Property Gateway.`,
  },
  de: {
    systemAnnouncement: 'Systemankündigung',
    dear: 'Sehr geehrter',
    agent: 'Makler',
    buyer: 'Käufer',
    supportText: 'Wenn Sie Fragen oder Bedenken haben, wenden Sie sich bitte an unser Support-Team.',
    goToDashboard: 'Zum Dashboard gehen',
    footerText: (role) => `Sie haben diese Systemankündigung erhalten, weil Sie ein registrierter ${role} auf der Plattform The Property Gateway sind.`,
  },
  pl: {
    systemAnnouncement: 'Ogłoszenie Systemowe',
    dear: 'Szanowny',
    agent: 'Agent',
    buyer: 'Kupujący',
    supportText: 'Jeśli masz pytania lub wątpliwości, skontaktuj się z naszym zespołem wsparcia.',
    goToDashboard: 'Przejdź do Panelu',
    footerText: (role) => `Otrzymałeś to ogłoszenie systemowe, ponieważ jesteś zarejestrowanym ${role} na platformie The Property Gateway.`,
  },
  nl: {
    systemAnnouncement: 'Systeemaankondiging',
    dear: 'Beste',
    agent: 'Makelaar',
    buyer: 'Koper',
    supportText: 'Als u vragen of zorgen heeft, neem dan contact op met ons ondersteuningsteam.',
    goToDashboard: 'Ga naar Dashboard',
    footerText: (role) => `U heeft deze systeemaankondiging ontvangen omdat u een geregistreerde ${role} bent op het The Property Gateway platform.`,
  },
};

export const SystemAnnouncementEmail = ({
  subject,
  message,
  recipientType,
  siteUrl = 'https://thepropertygateway.com',
  language = 'en',
}: SystemAnnouncementEmailProps) => {
  const t = emailTranslations[language] || emailTranslations.en;
  const previewText = `${t.systemAnnouncement}: ${subject}`;
  const roleText = recipientType === 'agent' ? t.agent : t.buyer;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>The Property Gateway</Heading>

          <Section style={headerSection}>
            <div style={alertBadge}>
              {t.systemAnnouncement}
            </div>
            <Heading as="h2" style={h2}>{subject}</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Text style={greeting}>{t.dear} {roleText},</Text>
            
            <Text style={text}>
              {message.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              {t.supportText}
            </Text>

            <Link href={`${siteUrl}/dashboard`} style={button}>
              {t.goToDashboard}
            </Link>
          </Section>

          <Text style={footer}>
            {t.footerText(roleText.toLowerCase())}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const h2 = {
  color: "#333",
  fontSize: "22px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "16px 0 0",
};

const headerSection = {
  padding: "20px",
  backgroundColor: "#fef3c7",
  borderBottom: "2px solid #f59e0b",
  textAlign: "center" as const,
};

const alertBadge = {
  display: "inline-block",
  padding: "6px 16px",
  backgroundColor: "#f59e0b",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  borderRadius: "4px",
  marginBottom: "12px",
};

const contentSection = {
  padding: "30px 40px",
};

const greeting = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "28px",
  marginBottom: "20px",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footerText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
  marginBottom: "16px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "20px",
  paddingTop: "20px",
  borderTop: "1px solid #e6ebf1",
};

