'use client';

import { useEffect, useState } from 'react';

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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Camera className="h-8 w-8 text-blue-500" />,
    title: 'Reconhecimento Facial Avançado',
    description: 'Tecnologia AI de ponta com detecção de rosto em tempo real e 99% de precisão',
  },
  {
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    title: 'Check-in Instantâneo',
    description: 'Reconhecimento em menos de 1 segundo - sem filas, sem fricção',
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: 'Gestão de Participantes',
    description: 'Cadastro simplificado, controle de presença e análise de dados em tempo real',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
    title: 'Análise & Relatórios',
    description: 'Dashboard intuitivo com métricas detalhadas e insights de sua audiência',
  },
  {
    icon: <Shield className="h-8 w-8 text-red-500" />,
    title: 'Segurança Completa',
    description: 'Encriptação de dados, compliance LGPD e proteção de privacidade',
  },
  {
    icon: <Globe className="h-8 w-8 text-cyan-500" />,
    title: 'Multi-tenant Platform',
    description: 'Suporte para múltiplas organizações, eventos e configurações independentes',
  },
];

export default function Home() {
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
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="text-xl font-bold text-white">Fivents OneID</span>
            </div>
            <div className="hidden gap-8 md:flex">
              <a href="#features" className="text-sm text-gray-300 transition-colors hover:text-white">
                Recursos
              </a>
              <a href="#pricing" className="text-sm text-gray-300 transition-colors hover:text-white">
                Preços
              </a>
              <a href="#contact" className="text-sm text-gray-300 transition-colors hover:text-white">
                Contato
              </a>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="mb-4 border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Sparkles className="mr-2 h-3 w-3" />
            Tecnologia de Ponta em Reconhecimento Facial
          </Badge>

          <h1 className="mb-6 text-5xl leading-tight font-bold text-white sm:text-7xl">
            Credenciamento de Eventos com IA
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300">
            Revolucione seu check-in com reconhecimento facial avançado. Instantâneo, seguro e escalável. A plataforma
            perfeita para eventos que exigem eficiência.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Solicitar Demo
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <div className="mb-2 text-3xl font-bold text-white">99%</div>
              <div>Precisão Facial</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-white">&lt;1s</div>
              <div>Tempo de Check-in</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-white">24/7</div>
              <div>Disponibilidade</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gradient-to-b from-black via-blue-950/10 to-black px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Recursos Poderosos</h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-400">
              Tudo que você precisa para gerenciar credenciamento de eventos com segurança e eficiência
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <CardHeader>
                  <div className="mb-4 w-fit rounded-lg bg-white/5 p-3">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-black px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-center text-4xl font-bold text-white sm:text-5xl">Ideal para Qualquer Evento</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: 'Conferências Corporativas',
                description: 'Credenciamento rápido e controle de presença para eventos com centenas de participantes',
                metrics: ['Até 1.000 check-ins/hora', 'Zero filas', 'Relatórios em tempo real'],
              },
              {
                title: 'Eventos VIP & Premium',
                description: 'Experiência premium com reconhecimento de dignitários e registro seguro de presença',
                metrics: ['Segurança reforçada', 'Verificação em 2 níveis', 'Auditoria completa'],
              },
              {
                title: 'Pré-inscrição & Registro',
                description: 'Vinculação automática com pré-cadastro de participantes e coleta de dados',
                metrics: ['Integração com CRM', 'Captura de dados automática', 'Pré-aprovação'],
              },
              {
                title: 'Networking & Socialização',
                description: 'Facilite conexões com análise de encontros e estatísticas de rede',
                metrics: ['Análise de conexões', 'Relatório de networking', 'Matching inteligente'],
              },
            ].map((useCase, index) => (
              <Card key={index} className="border-white/10 bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {useCase.title}
                  </CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.metrics.map((metric, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {metric}
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
      <section id="pricing" className="bg-gradient-to-b from-black to-blue-950/20 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Planos Transparentes</h2>
            <p className="text-xl text-gray-400">
              Escolha o plano perfeito para seu evento. Sem surpresas, sem contratos longos.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-xl border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`flex flex-col border transition-all duration-300 ${
                    index === 1
                      ? 'border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-purple-900/40 ring-2 ring-blue-500/20 md:scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                      <Badge className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        {plan.discount ? (
                          <>
                            <span className="text-2xl text-gray-500 line-through">
                              R$ {plan.price.toLocaleString('pt-BR')}
                            </span>
                            <br />
                            R$ {(plan.price * (1 - plan.discount / 100)).toLocaleString('pt-BR')}
                          </>
                        ) : (
                          `R$ ${plan.price.toLocaleString('pt-BR')}`
                        )}
                      </span>
                      <p className="mt-1 text-sm text-gray-400">/mês</p>
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
                      <Link href="/login">Escolher Plano</Link>
                    </Button>

                    <div className="space-y-3">
                      {[
                        'Check-in facial em tempo real',
                        'Dashboard completo',
                        'Relatórios e analytics',
                        `Até ${plan._count?.planFeatures || 10} participantes`,
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
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
                  className={`flex flex-col border transition-all duration-300 ${
                    index === 1
                      ? 'border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-purple-900/40 ring-2 ring-blue-500/20 md:scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                      <Badge className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        R$ {(plan.price * 100).toLocaleString('pt-BR')}
                      </span>
                      <p className="mt-1 text-sm text-gray-400">/mês</p>
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
                      <Link href="/login">Escolher Plano</Link>
                    </Button>

                    <div className="space-y-3">
                      {[
                        'Check-in facial em tempo real',
                        'Dashboard completo',
                        'Relatórios e analytics',
                        `Até ${plan.features || 10} participantes`,
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
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

          <div className="mt-16 text-center text-gray-400">
            <p>Planos personalizados para eventos maiores? </p>
            <Button variant="link" className="h-auto px-0 text-blue-400 hover:text-blue-300" id="contact">
              Entre em contato com nosso time de vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-950 to-purple-950 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">Pronto para transformar seu evento?</h2>
          <p className="mb-8 text-xl text-gray-300">
            Milhares de eventos já usam Fivents para revolucionar o credenciamento. Junte-se a eles hoje.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="border-0 bg-white font-semibold text-blue-600 hover:bg-gray-100">
                Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Agendar Demo
            </Button>
          </div>

          <p className="mt-8 text-sm text-gray-400">Sem cartão de crédito necessário • Configuração em 5 minutos</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                <span className="font-bold text-white">Fivents</span>
              </div>
              <p className="text-sm text-gray-400">
                Plataforma de credenciamento inteligente com reconhecimento facial de ponta.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="transition-colors hover:text-white">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="transition-colors hover:text-white">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-gray-400">© 2024 Fivents. Todos os direitos reservados.</p>
            <div className="mt-4 flex gap-6 sm:mt-0">
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
                <Smartphone className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
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
