import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website.
          They help the site remember your preferences and keep you signed in.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Cookies we use</h2>
        <p>We only use essential cookies or storage required for the Service to function.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Authentication session token stored in browser storage to keep you logged in.
          </li>
          <li>
            A cookie to remember that you have seen this cookie notice.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Cookies we do not use</h2>
        <p>
          We do not use analytics, advertising, or marketing cookies. We do not use
          third-party tracking pixels.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Managing cookies</h2>
        <p>
          You can clear cookies or browser storage at any time in your browser settings.
          Note that clearing storage will log you out of the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Contact</h2>
        <p>
          Questions about cookies can be sent to{' '}
          <a className="underline" href="mailto:support@thepropertygateway.com">support@thepropertygateway.com</a>.
        </p>
      </section>
    </div>
  );
}
