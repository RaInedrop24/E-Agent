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

interface NewMessageEmailProps {
  transactionTitle: string;
  authorName: string;
  messagePreview: string;
  transactionUrl: string;
  brandLogoUrl?: string | null;
  brandColor?: string | null;
}

export const NewMessageEmail = ({
  transactionTitle,
  authorName,
  messagePreview,
  transactionUrl,
  brandLogoUrl,
  brandColor,
}: NewMessageEmailProps) => {
  const primaryColor = brandColor || "#2563eb";
  const previewText = `New message from ${authorName} in ${transactionTitle}`;

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
             <Heading as="h2" style={h2}>New Message</Heading>
             <Text style={subheading}>{transactionTitle}</Text>
          </Section>
          
          <Section style={contentSection}>
            <Text style={text}>
              <strong>{authorName}</strong> sent a new message:
            </Text>

            <div style={messageBox}>
               <Text style={messageText}>"{messagePreview}"</Text>
            </div>

            <Hr style={hr} />

            <Link href={transactionUrl} style={{ ...button, backgroundColor: primaryColor }}>
              Reply in Dashboard
            </Link>
          </Section>

          <Text style={footer}>
            You received this email because you are a participant in this transaction and have enabled email alerts.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles (Reused from MilestoneUpdateEmail for consistency)
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
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const contentSection = {
  padding: "30px 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "20px",
};

const messageBox = {
  padding: "20px",
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  borderLeft: "4px solid #cbd5e1",
  margin: "20px 0",
};

const messageText = {
  fontSize: "16px",
  fontStyle: "italic",
  color: "#475569",
  margin: "0",
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
