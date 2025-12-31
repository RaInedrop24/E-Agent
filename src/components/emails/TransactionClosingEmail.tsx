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
  Img,
} from "@react-email/components";
import * as React from "react";

interface Translations {
  title: string;
  preview: string;
  congratulations: string;
  thankYouMessage: string;
  portalAccess: string;
  viewDashboard: string;
  footer: string;
}

interface TransactionClosingEmailProps {
  transactionTitle: string;
  agentName: string;
  transactionUrl: string;
  brandLogoUrl?: string | null;
  brandColor?: string | null;
  translations?: Translations;
}

export const TransactionClosingEmail = ({
  transactionTitle,
  agentName,
  transactionUrl,
  brandLogoUrl,
  brandColor,
  translations,
}: TransactionClosingEmailProps) => {
  const primaryColor = brandColor || "#10b981";
  const previewText = translations?.preview || `${transactionTitle} has been completed!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {brandLogoUrl ? (
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <Img
                src={brandLogoUrl}
                alt="Agency Logo"
                width="200"
                style={{ margin: "0 auto", objectFit: "contain", maxHeight: "80px" }}
              />
            </Section>
          ) : (
             <Heading style={h1}>The Property Gateway</Heading>
          )}

          <Section style={headerSection}>
             <Heading as="h2" style={h2}>{translations?.title || 'Transaction Complete!'}</Heading>
             <Text style={subheading}>{transactionTitle}</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={congratsText}>
              {translations?.congratulations || '🎉 Congratulations!'}
            </Text>

            <Text style={text}>
              {translations?.thankYouMessage ||
                `${agentName} has finalized your property transaction. Thank you for trusting us with your property journey!`}
            </Text>

            <div style={highlightBox}>
               <Text style={highlightText}>
                 {translations?.portalAccess ||
                   'You can continue to access the portal anytime to view all your documents, messages, and transaction history.'}
               </Text>
            </div>

            <Hr style={hr} />

            <Link href={transactionUrl} style={{ ...button, backgroundColor: primaryColor }}>
              {translations?.viewDashboard || 'View Dashboard'}
            </Link>
          </Section>

          <Text style={footer}>
            {translations?.footer || 'Best wishes with your new property!'}
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
  fontSize: "20px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0",
};

const subheading = {
  color: "#64748b",
  fontSize: "16px",
  textAlign: "center" as const,
  margin: "4px 0 0",
};

const headerSection = {
  padding: "20px",
  backgroundColor: "#f0fdf4",
  borderBottom: "1px solid #d1fae5",
};

const contentSection = {
  padding: "30px 40px",
};

const congratsText = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#10b981",
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "20px",
};

const highlightBox = {
  padding: "20px",
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  borderLeft: "4px solid #10b981",
  margin: "20px 0",
};

const highlightText = {
  fontSize: "16px",
  color: "#047857",
  margin: "0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "20px",
};
