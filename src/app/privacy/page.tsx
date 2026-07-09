import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Who we are</h2>
        <p>
          The Property Gateway (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the Estate Agent Portal. This
          policy explains how we collect, use, and protect personal data for estate agents
          and buyers using the platform.
        </p>
        <p>
          Contact: <a className="underline" href="mailto:support@thepropertygateway.com">support@thepropertygateway.com</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Data we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details (name, email, preferred language).</li>
          <li>Transaction data (property address, title, status, milestones).</li>
          <li>Messages and files shared within transactions.</li>
          <li>Security and audit data (logins, IP address, device and browser info).</li>
        </ul>
        <p>
          During the pilot we do not collect sensitive identifiers (passport numbers,
          national insurance numbers, bank details, or government IDs).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. How we use data</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide authentication, access control, and transaction tracking.</li>
          <li>Enable collaboration between agents and buyers.</li>
          <li>Send operational emails or SMS notifications when opted in.</li>
          <li>Maintain platform security, audits, and incident response.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Legal bases</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Contract performance to deliver the service.</li>
          <li>Legitimate interests for security and product improvement.</li>
          <li>Legal obligations such as retention of property transaction records.</li>
          <li>Consent for optional alerts or communications.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Sharing and processors</h2>
        <p>
          We share data only with trusted processors that power the service, such as
          Supabase (database/auth/storage), Resend (email), Twilio (SMS), and DeepL
          (translations). Data Processing Agreements are reviewed for each provider.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Retention</h2>
        <p>
          We retain transaction records for legal compliance and operational continuity.
          Account data is retained until deletion is requested, subject to legal obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Your rights</h2>
        <p>
          You can request access, correction, portability, or deletion of your data. Requests
          are handled within 30 days. Contact us at{' '}
          <a className="underline" href="mailto:support@thepropertygateway.com">support@thepropertygateway.com</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Cookies</h2>
        <p>
          We only use essential cookies or storage required for authentication. See the{' '}
          <a className="underline" href="/cookies">Cookie Policy</a> for details.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Changes</h2>
        <p>
          We may update this policy to reflect changes in the platform or legal requirements.
          Material changes will be posted on this page.
        </p>
      </section>
    </div>
  );
}
