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

interface SystemAnnouncementEmailProps {
  subject: string;
  message: string;
  recipientType: 'agent' | 'buyer';
  siteUrl?: string;
}

export const SystemAnnouncementEmail = ({
  subject,
  message,
  recipientType,
  siteUrl = 'https://thepropertygateway.com',
}: SystemAnnouncementEmailProps) => {
  const previewText = `System Announcement: ${subject}`;
  const roleText = recipientType === 'agent' ? 'Agent' : 'Buyer';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>The Property Gateway</Heading>

          <Section style={headerSection}>
            <div style={alertBadge}>
              System Announcement
            </div>
            <Heading as="h2" style={h2}>{subject}</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Text style={greeting}>Dear {roleText},</Text>
            
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
              If you have any questions or concerns, please contact our support team.
            </Text>

            <Link href={`${siteUrl}/dashboard`} style={button}>
              Go to Dashboard
            </Link>
          </Section>

          <Text style={footer}>
            You received this system announcement because you are a registered {roleText.toLowerCase()} on The Property Gateway platform.
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

