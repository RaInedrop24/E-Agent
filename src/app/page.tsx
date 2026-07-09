'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Globe, Shield, Settings, Users, Link as LinkIcon, Languages, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlagLanguageSelector } from '@/components/ui/flag-language-selector';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const { t } = useLanguage();

  // Redirect logged-in users to dashboard (only if valid session exists)
  // Wait for auth to finish loading to avoid race conditions with expired sessions
  useEffect(() => {
    if (!loading && user && session) {
      router.push('/dashboard');
    }
  }, [user, session, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar with Flag Language Selector */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <FlagLanguageSelector />
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight pb-2">
              <span className="block text-white drop-shadow-2xl">
                The Property Gateway
              </span>
            </h1>
            <p className="mt-4 text-xl text-blue-100 sm:text-2xl font-medium">
              {t('landing.heroSubheadline')}
            </p>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-50">
              {t('landing.heroDescription')}
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  asChild
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  <a href="/register">
                    {t('landing.getStarted')}
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" asChild className="border-white bg-white/10 text-white hover:bg-white hover:text-blue-700">
                  <a href="/login">{t('landing.signIn')}</a>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('landing.featuresDescription')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
                <CardTitle>{t('landing.featureProgressTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureProgressDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Globe className="mx-auto h-10 w-10 text-blue-600" />
                <CardTitle>{t('landing.featureTranslationTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureTranslationDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-purple-600" />
                <CardTitle>{t('landing.featureCommunicationTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureCommunicationDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="mx-auto h-10 w-10 text-orange-600" />
                <CardTitle>{t('landing.featureSecurityTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureSecurityDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Settings className="mx-auto h-10 w-10 text-indigo-600" />
                <CardTitle>{t('landing.featureCustomMilestonesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureCustomMilestonesDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="mx-auto h-10 w-10 text-teal-600" />
                <CardTitle>{t('landing.featureBuyerManagementTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureBuyerManagementDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <LinkIcon className="mx-auto h-10 w-10 text-pink-600" />
                <CardTitle>{t('landing.featurePropertyLinksTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featurePropertyLinksDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Languages className="mx-auto h-10 w-10 text-amber-600" />
                <CardTitle>{t('landing.featureMultilingualTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureMultilingualDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Palette className="mx-auto h-10 w-10 text-rose-500" />
                <CardTitle>{t('landing.featureCustomBrandingTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.featureCustomBrandingDesc')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              {t('landing.ctaDescription')}
            </p>
            <div className="mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" asChild>
                  <a href="/register">{t('landing.startJourney')}</a>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
