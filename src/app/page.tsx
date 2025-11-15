import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Globe, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">International Property</span>
              <span className="block text-blue-600">Transaction Portal</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Bridge the language gap in international real estate. Track your property purchase 
              progress and communicate seamlessly with agents in your native language.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="/register">Get Started</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/login">Sign In</a>
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
              Everything you need for international property purchases
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Designed for buyers and agents who need clarity and communication
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visual timeline showing exactly where you are in the purchasing process
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Globe className="mx-auto h-10 w-10 text-blue-600" />
                <CardTitle>Auto Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Communicate with agents in your native language with automatic translation
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-purple-600" />
                <CardTitle>Centralized Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All messages, documents, and updates in one secure location
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="mx-auto h-10 w-10 text-orange-600" />
                <CardTitle>Secure & Transparent</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bank-level security with complete transparency throughout the process
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
              Ready to streamline your property purchase?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of buyers and agents using Estate Portal
            </p>
            <div className="mt-8">
              <Button size="lg" variant="secondary" asChild>
                <a href="/register">Start Your Journey</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
