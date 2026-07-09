import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Agreement</h2>
        <p>
          By accessing or using the Estate Agent Portal (&quot;Service&quot;), you agree to these
          Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Service description</h2>
        <p>
          The Service provides estate agents and buyers with transaction tracking,
          communication, and document sharing tools for property purchases.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Accounts</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You agree to provide accurate information and keep your account details up to date.</li>
          <li>Buyers are invited by estate agents; unauthorised access is prohibited.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Acceptable use</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Do not upload unlawful, harmful, or infringing content.</li>
          <li>Do not attempt to access data that is not assigned to you.</li>
          <li>Do not disrupt or attempt to compromise the Service.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Data and privacy</h2>
        <p>
          Our <a className="underline" href="/privacy">Privacy Policy</a> explains how we
          collect and process personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Availability</h2>
        <p>
          We aim to keep the Service available, but availability may be interrupted for
          maintenance, upgrades, or unforeseen issues.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, The Property Gateway is not liable for
          indirect or consequential losses resulting from the use of the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Termination</h2>
        <p>
          We may suspend or terminate access if these terms are violated. You may request
          account deletion at any time by contacting support.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Governing law</h2>
        <p>These terms are governed by the laws of the United Kingdom.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Contact</h2>
        <p>
          Questions about these terms can be sent to{' '}
          <a className="underline" href="mailto:support@thepropertygateway.com">support@thepropertygateway.com</a>.
        </p>
      </section>
    </div>
  );
}
