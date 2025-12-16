'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Globe, Shield, Settings, Users, Link as LinkIcon, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/language-selector';

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  // Log out user when they visit the landing page
  useEffect(() => {
    if (user) {
      signOut();
    }
  }, [user, signOut]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar with Language Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Fancy Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight pb-2">
              <span className="block text-white drop-shadow-2xl">
                The Property Gateway
              </span>
            </h1>
            <p className="mt-4 text-xl text-blue-100 sm:text-2xl">
              {t('landing.heroTitle1')} • {t('landing.heroTitle2')}
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              {t('landing.heroDescription')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="/register">{t('landing.getStarted')}</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/login">{t('landing.signIn')}</a>
              </Button>
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
              <Button size="lg" variant="secondary" asChild>
                <a href="/register">{t('landing.startJourney')}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
