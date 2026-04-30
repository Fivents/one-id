'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle,
  Globe,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  isActive: boolean;
  _count?: {
    planFeatures: number;
  };
}

interface Feature {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

const featuresList: Feature[] = [
  {
    icon: <Camera className="h-8 w-8 text-blue-500" />,
    titleKey: 'hotsite.features.faceRecognition.title',
    descriptionKey: 'hotsite.features.faceRecognition.description',
  },
  {
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    titleKey: 'hotsite.features.instantCheckin.title',
    descriptionKey: 'hotsite.features.instantCheckin.description',
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    titleKey: 'hotsite.features.participantManagement.title',
    descriptionKey: 'hotsite.features.participantManagement.description',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
    titleKey: 'hotsite.features.analytics.title',
    descriptionKey: 'hotsite.features.analytics.description',
  },
  {
    icon: <Shield className="h-8 w-8 text-red-500" />,
    titleKey: 'hotsite.features.security.title',
    descriptionKey: 'hotsite.features.security.description',
  },
  {
    icon: <Globe className="h-8 w-8 text-cyan-500" />,
    titleKey: 'hotsite.features.multiTenant.title',
    descriptionKey: 'hotsite.features.multiTenant.description',
  },
];

export default function Home() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/plans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch plans: ${response.status}`);
        }

        const data = await response.json();
        const activePlans = Array.isArray(data) ? data.filter((p: Plan) => p.isActive) : [];
        setPlans(activePlans.slice(0, 3)); // Show max 3 plans
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Unable to load pricing plans');
        // Use default placeholder plans
        setPlans(getDefaultPlans());
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/png/logo-blue.png" alt="Fivents Logo" width={32} height={32} className="block dark:hidden" />
              <Image
                src="/png/logo-white.png"
                alt="Fivents Logo"
                width={32}
                height={32}
                className="hidden dark:block"
              />
              <span className="text-xl font-bold">Fivents OneID</span>
            </div>
            <div className="hidden gap-8 md:flex">
              <a href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                {t('hotsite.nav.features')}
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                {t('hotsite.nav.pricing')}
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                {t('hotsite.nav.contact')}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" size="sm">
                  {t('hotsite.nav.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="from-background via-primary/5 to-background relative overflow-hidden bg-gradient-to-b px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-600/20 blur-3xl dark:bg-blue-600/10" />
          <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl dark:bg-purple-600/10" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="mb-4 border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Sparkles className="mr-2 h-3 w-3" />
            {t('hotsite.hero.badge')}
          </Badge>

          <h1 className="text-foreground mb-6 text-5xl leading-tight font-bold sm:text-7xl">
            {t('hotsite.hero.title')}
          </h1>

          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">{t('hotsite.hero.description')}</p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                {t('hotsite.hero.cta')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              {t('hotsite.hero.demo')}
            </Button>
          </div>

          <div className="text-muted-foreground grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-foreground mb-2 text-3xl font-bold">99%</div>
              <div>{t('hotsite.hero.stats.accuracy')}</div>
            </div>
            <div>
              <div className="text-foreground mb-2 text-3xl font-bold">&lt;1s</div>
              <div>{t('hotsite.hero.stats.checkinTime')}</div>
            </div>
            <div>
              <div className="text-foreground mb-2 text-3xl font-bold">24/7</div>
              <div>{t('hotsite.hero.stats.availability')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="from-background via-muted/30 to-background bg-gradient-to-b px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-4xl font-bold sm:text-5xl">{t('hotsite.features.title')}</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">{t('hotsite.features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuresList.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <CardHeader>
                  <div className="bg-muted mb-4 w-fit rounded-lg p-3">{feature.icon}</div>
                  <CardTitle>{t(feature.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(feature.descriptionKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-background px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-foreground mb-16 text-center text-4xl font-bold sm:text-5xl">
            {t('hotsite.useCases.title')}
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                titleKey: 'hotsite.useCases.corporate.title',
                descriptionKey: 'hotsite.useCases.corporate.description',
                metrics: [
                  'hotsite.useCases.corporate.metric1',
                  'hotsite.useCases.corporate.metric2',
                  'hotsite.useCases.corporate.metric3',
                ],
              },
              {
                titleKey: 'hotsite.useCases.vip.title',
                descriptionKey: 'hotsite.useCases.vip.description',
                metrics: [
                  'hotsite.useCases.vip.metric1',
                  'hotsite.useCases.vip.metric2',
                  'hotsite.useCases.vip.metric3',
                ],
              },
              {
                titleKey: 'hotsite.useCases.registration.title',
                descriptionKey: 'hotsite.useCases.registration.description',
                metrics: [
                  'hotsite.useCases.registration.metric1',
                  'hotsite.useCases.registration.metric2',
                  'hotsite.useCases.registration.metric3',
                ],
              },
              {
                titleKey: 'hotsite.useCases.networking.title',
                descriptionKey: 'hotsite.useCases.networking.description',
                metrics: [
                  'hotsite.useCases.networking.metric1',
                  'hotsite.useCases.networking.metric2',
                  'hotsite.useCases.networking.metric3',
                ],
              },
            ].map((useCase, index) => (
              <Card key={index} className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {t(useCase.titleKey)}
                  </CardTitle>
                  <CardDescription>{t(useCase.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.metrics.map((metricKey, idx) => (
                      <li key={idx} className="text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {t(metricKey)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="from-background via-primary/5 to-background bg-gradient-to-b px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-4xl font-bold sm:text-5xl">{t('hotsite.pricing.title')}</h2>
            <p className="text-muted-foreground text-xl">{t('hotsite.pricing.subtitle')}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/50 h-96 animate-pulse rounded-xl border" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-300 ${
                    index === 1
                      ? 'border-primary/50 ring-primary/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-2 md:scale-105'
                      : 'hover:border-border'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                      <Badge className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {t('hotsite.pricing.popular')}
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-foreground text-4xl font-bold">
                        {plan.discount ? (
                          <>
                            <span className="text-muted-foreground text-2xl line-through">
                              R$ {plan.price.toLocaleString('pt-BR')}
                            </span>
                            <br />
                            R$ {(plan.price * (1 - plan.discount / 100)).toLocaleString('pt-BR')}
                          </>
                        ) : (
                          `R$ ${plan.price.toLocaleString('pt-BR')}`
                        )}
                      </span>
                      <p className="text-muted-foreground mt-1 text-sm">{t('hotsite.pricing.perMonth')}</p>
                    </div>

                    <Button
                      className={`mb-6 w-full ${
                        index === 1
                          ? 'border-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : ''
                      }`}
                      variant={index === 1 ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/login">{t('hotsite.pricing.choosePlan')}</Link>
                    </Button>

                    <div className="space-y-3">
                      {[
                        t('hotsite.pricing.features.facialCheckin'),
                        t('hotsite.pricing.features.dashboard'),
                        t('hotsite.pricing.features.reports'),
                        t('hotsite.pricing.features.participants', { count: String(plan._count?.planFeatures || 10) }),
                      ].map((feature, idx) => (
                        <div key={idx} className="text-muted-foreground flex items-center gap-3 text-sm">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {getDefaultPlans().map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-300 ${
                    index === 1
                      ? 'border-primary/50 ring-primary/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-2 md:scale-105'
                      : 'hover:border-border'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                      <Badge className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {t('hotsite.pricing.popular')}
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-foreground text-4xl font-bold">
                        R$ {(plan.price * 100).toLocaleString('pt-BR')}
                      </span>
                      <p className="text-muted-foreground mt-1 text-sm">{t('hotsite.pricing.perMonth')}</p>
                    </div>

                    <Button
                      className={`mb-6 w-full ${
                        index === 1
                          ? 'border-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : ''
                      }`}
                      variant={index === 1 ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/login">{t('hotsite.pricing.choosePlan')}</Link>
                    </Button>

                    <div className="space-y-3">
                      {[
                        t('hotsite.pricing.features.facialCheckin'),
                        t('hotsite.pricing.features.dashboard'),
                        t('hotsite.pricing.features.reports'),
                        t('hotsite.pricing.features.participants', { count: String(plan.features || 10) }),
                      ].map((feature, idx) => (
                        <div key={idx} className="text-muted-foreground flex items-center gap-3 text-sm">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-muted-foreground mt-16 text-center">
            <p>{t('hotsite.pricing.customPlans')}</p>
            <Button variant="link" className="text-primary h-auto px-0" id="contact">
              {t('hotsite.pricing.contactSales')}
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-20 sm:px-6 sm:py-32 lg:px-8 dark:from-blue-950 dark:to-purple-950">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">{t('hotsite.cta.title')}</h2>
          <p className="mb-8 text-xl text-white/80">{t('hotsite.cta.description')}</p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="border-0 bg-white font-semibold text-blue-600 hover:bg-gray-100">
                {t('hotsite.cta.start')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              {t('hotsite.cta.demo')}
            </Button>
          </div>

          <p className="mt-8 text-sm text-white/60">{t('hotsite.cta.noCard')}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Image
                  src="/png/logo-blue.png"
                  alt="Fivents Logo"
                  width={24}
                  height={24}
                  className="block dark:hidden"
                />
                <Image
                  src="/png/logo-white.png"
                  alt="Fivents Logo"
                  width={24}
                  height={24}
                  className="hidden dark:block"
                />
                <span className="font-bold">Fivents</span>
              </div>
              <p className="text-muted-foreground text-sm">{t('hotsite.footer.description')}</p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">{t('hotsite.footer.product')}</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    {t('hotsite.nav.features')}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    {t('hotsite.nav.pricing')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">{t('hotsite.footer.company')}</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t('hotsite.footer.about')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t('hotsite.footer.careers')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">{t('hotsite.footer.legal')}</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t('hotsite.footer.privacy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t('hotsite.footer.terms')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t('hotsite.nav.contact')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between border-t pt-8 sm:flex-row">
            <p className="text-muted-foreground text-sm">© 2026 Fivents. {t('hotsite.footer.rights')}</p>
            <div className="mt-4 flex gap-6 sm:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Smartphone className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getDefaultPlans(): (Plan & { features?: number })[] {
  return [
    {
      id: '1',
      name: 'Starter',
      description: 'Perfeito para eventos pequenos',
      price: 99,
      isActive: true,
      features: 100,
    },
    {
      id: '2',
      name: 'Professional',
      description: 'Ideal para eventos médios',
      price: 299,
      discount: 10,
      isActive: true,
      features: 1000,
    },
    {
      id: '3',
      name: 'Enterprise',
      description: 'Para eventos em larga escala',
      price: 999,
      isActive: true,
      features: 10000,
    },
  ];
}
