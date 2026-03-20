'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Zap,
  Users,
  BarChart3,
  Shield,
  Camera,
  ArrowRight,
  Sparkles,
  Globe,
  Smartphone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [error, setError] = useState<string | null>(null);

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
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Preços
              </a>
              <a href="#contact" className="text-sm text-gray-300 hover:text-white transition-colors">
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
      <section className="relative overflow-hidden bg-black px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <Sparkles className="mr-2 h-3 w-3" />
            Tecnologia de Ponta em Reconhecimento Facial
          </Badge>

          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
            Credenciamento de Eventos com IA
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Revolucione seu check-in com reconhecimento facial avançado. Instantâneo, seguro e escalável.
            A plataforma perfeita para eventos que exigem eficiência.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Solicitar Demo
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 text-gray-300 text-sm">
            <div>
              <div className="text-3xl font-bold text-white mb-2">99%</div>
              <div>Precisão Facial</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">&lt;1s</div>
              <div>Tempo de Check-in</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div>Disponibilidade</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gradient-to-b from-black via-blue-950/10 to-black px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar credenciamento de eventos com segurança e eficiência
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <CardHeader>
                  <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit">
                    {feature.icon}
                  </div>
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
      <section className="bg-black px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-16 text-center">
            Ideal para Qualquer Evento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Card key={index} className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {useCase.title}
                  </CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.metrics.map((metric, idx) => (
                      <li key={idx} className="text-gray-300 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
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
      <section id="pricing" className="bg-gradient-to-b from-black to-blue-950/20 px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Planos Transparentes
            </h2>
            <p className="text-xl text-gray-400">
              Escolha o plano perfeito para seu evento. Sem surpresas, sem contratos longos.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-white/5 rounded-xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        {plan.discount ? (
                          <>
                            <span className="line-through text-gray-500 text-2xl">
                              R$ {plan.price.toLocaleString('pt-BR')}
                            </span>
                            <br />
                            R$ {(plan.price * (1 - plan.discount / 100)).toLocaleString('pt-BR')}
                          </>
                        ) : (
                          `R$ ${plan.price.toLocaleString('pt-BR')}`
                        )}
                      </span>
                      <p className="text-gray-400 text-sm mt-1">/mês</p>
                    </div>

                    <Button
                      className={`w-full mb-6 ${
                        index === 1
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0'
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
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        R$ {(plan.price * 100).toLocaleString('pt-BR')}
                      </span>
                      <p className="text-gray-400 text-sm mt-1">/mês</p>
                    </div>

                    <Button
                      className={`w-full mb-6 ${
                        index === 1
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0'
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
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
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
            <Button
              variant="link"
              className="text-blue-400 hover:text-blue-300 px-0 h-auto"
              id="contact"
            >
              Entre em contato com nosso time de vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-blue-950 to-purple-950 px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pronto para transformar seu evento?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Milhares de eventos já usam Fivents para revolucionar o credenciamento.
            Junte-se a eles hoje.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 border-0 font-semibold"
              >
                Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Agendar Demo
            </Button>
          </div>

          <p className="text-gray-400 text-sm mt-8">
            Sem cartão de crédito necessário • Configuração em 5 minutos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                <span className="font-bold text-white">Fivents</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plataforma de credenciamento inteligente com reconhecimento facial de ponta.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Fivents. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Smartphone className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
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
