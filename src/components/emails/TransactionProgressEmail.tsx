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

interface Milestone {
  label: string;
  completed: boolean;
  completedAt?: string | null;
}

interface Message {
  author: string;
  content: string;
  createdAt: string;
}

interface FileAttachment {
  name: string;
  size: string;
}

interface Translations {
  progressReport: string;
  transactionProgressFor: string;
  viewPropertyListing: string;
  milestones: string;
  completedOn: (date: string) => string;
  recentMessages: string;
  noMessages: string;
  files: string;
  noFiles: string;
  attachmentNote: string;
  viewTransaction: string;
  viewDetails: string;
  sentFrom: string;
}

interface TransactionProgressEmailProps {
  transactionTitle: string;
  propertyAddress?: string | null;
  propertyUrl?: string | null;
  milestones: Milestone[];
  messages: Message[];
  files: FileAttachment[];
  siteUrl: string;
  transactionUrl: string;
  brandLogoUrl?: string | null;
  brandColor?: string | null;
  language?: string;
  translations?: Translations;
}

export const TransactionProgressEmail = ({
  transactionTitle,
  propertyAddress,
  propertyUrl,
  milestones,
  messages,
  files,
  siteUrl,
  transactionUrl,
  brandLogoUrl,
  brandColor,
  translations,
}: TransactionProgressEmailProps) => {
  const previewText = translations?.transactionProgressFor || `Transaction Progress for ${transactionTitle}`;
  const primaryColor = brandColor || "#2563eb";

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
             <Heading style={h1}>{translations?.progressReport || 'Transaction Progress Report'}</Heading>
          )}
          
          <Section style={headerSection}>
            <Text style={transactionName}>{transactionTitle}</Text>
            {propertyAddress && (
              <Text style={address}>{propertyAddress}</Text>
            )}
            {propertyUrl && (
              <Link href={propertyUrl} style={{ ...link, color: primaryColor }}>
                {translations?.viewPropertyListing || 'View Property Listing'}
              </Link>
            )}
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>{translations?.milestones || 'Milestones'}</Heading>
            {milestones.map((m, i) => (
              <div key={i} style={milestoneRow}>
                <span style={m.completed ? completedIcon : pendingIcon}>
                  {m.completed ? "✓" : ""}
                </span>
                <span style={m.completed ? completedText : pendingText}>
                  {m.label}
                  {m.completed && m.completedAt && (
                    <span style={dateText}> - {translations?.completedOn(new Date(m.completedAt).toLocaleDateString()) || `Completed on ${new Date(m.completedAt).toLocaleDateString()}`}</span>
                  )}
                </span>
              </div>
            ))}
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>{translations?.recentMessages || 'Recent Messages'}</Heading>
            {messages.length === 0 ? (
              <Text style={secondary}>{translations?.noMessages || 'No messages yet.'}</Text>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={messageBox}>
                  <Text style={messageAuthor}>{msg.author} <span style={dateText}>({new Date(msg.createdAt).toLocaleString()})</span></Text>
                  <Text style={messageContent}>{msg.content}</Text>
                </div>
              ))
            )}
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>{translations?.files || 'Files'}</Heading>
            {files.length === 0 ? (
              <Text style={secondary}>{translations?.noFiles || 'No files uploaded yet.'}</Text>
            ) : (
              <div style={fileList}>
                {files.map((file, i) => (
                  <Text key={i} style={fileItem}>
                    📎 {file.name} ({file.size})
                  </Text>
                ))}
                <Text style={attachmentNote}>{translations?.attachmentNote || 'Note: All files are attached to this email.'}</Text>
              </div>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              {translations?.viewDetails || 'You can view the full details and continue the conversation on the portal:'}
            </Text>
            <Link href={transactionUrl} style={{ ...button, backgroundColor: primaryColor }}>
              {translations?.viewTransaction || 'View Transaction on Site'}
            </Link>
            <Text style={footerSecondary}>
              {translations?.sentFrom || 'Sent from'} <Link href={siteUrl} style={footerLink}>The Property Gateway</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
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
  margin: "20px 0 10px",
};

const headerSection = {
  padding: "20px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const transactionName = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#1e293b",
  margin: "0 0 8px",
};

const address = {
  fontSize: "16px",
  color: "#64748b",
  margin: "0 0 12px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline" as const,
  fontSize: "14px",
};

const milestoneRow = {
  marginBottom: "12px",
  fontSize: "15px",
  lineHeight: "1.5",
};

const completedIcon = {
  display: "inline-block",
  width: "20px",
  height: "20px",
  backgroundColor: "#10b981",
  color: "#ffffff",
  borderRadius: "50%",
  textAlign: "center" as const,
  lineHeight: "20px",
  marginRight: "12px",
  fontSize: "14px",
  fontWeight: "bold" as const,
  verticalAlign: "middle",
};

const pendingIcon = {
  display: "inline-block",
  width: "20px",
  height: "20px",
  border: "2px solid #cbd5e1",
  borderRadius: "50%",
  marginRight: "12px",
  backgroundColor: "#ffffff",
  verticalAlign: "middle",
};

const completedText = {
  color: "#1e293b",
  fontWeight: "500" as const,
};

const pendingText = {
  color: "#64748b",
};

const dateText = {
  fontSize: "12px",
  color: "#94a3b8",
};

const messageBox = {
  padding: "12px",
  backgroundColor: "#f1f5f9",
  borderRadius: "6px",
  marginBottom: "12px",
};

const messageAuthor = {
  fontSize: "14px",
  fontWeight: "bold" as const,
  color: "#334155",
  margin: "0 0 4px",
};

const messageContent = {
  fontSize: "14px",
  color: "#475569",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const fileList = {
  backgroundColor: "#f8fafc",
  padding: "15px",
  borderRadius: "6px",
};

const fileItem = {
  fontSize: "14px",
  color: "#475569",
  margin: "4px 0",
};

const attachmentNote = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "10px",
  fontStyle: "italic",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "30px 0",
};

const secondary = {
  color: "#64748b",
  fontSize: "14px",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "30px",
};

const footerText = {
  fontSize: "14px",
  color: "#64748b",
  marginBottom: "20px",
};

const footerSecondary = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "30px",
};

const footerLink = {
  color: "#94a3b8",
  textDecoration: "underline" as const,
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};