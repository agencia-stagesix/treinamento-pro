import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Bell,
  Zap,
  Shield,
  Users,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-dim hover:text-text text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="btn-primary px-4 py-2 text-sm"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/20 rounded-full px-4 py-1.5 text-cyan text-xs font-semibold mb-6">
            <Zap className="w-3 h-3" />
            Sistema de Telemetria e Coaching Avançado
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Acompanhe seus alunos em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-blue">
              tempo real
            </span>
          </h1>

          <p className="text-lg text-dim max-w-2xl mx-auto mb-10 leading-relaxed">
            Plataforma completa para personal trainers que querem dados
            concretos — biometria, volume de treino, readiness, hidratação e
            nutrição num único painel. Chega de planilhas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="btn-primary px-8 py-3 text-base flex items-center gap-2"
            >
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="btn-ghost px-8 py-3 text-base">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-dim text-sm font-semibold uppercase tracking-widest mb-12">
            Tudo o que você precisa
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Activity}
              color="text-cyan"
              bg="bg-cyan/10"
              title="Score de Readiness"
              desc="Saiba se cada aluno está pronto para treinar hoje — sono, estresse e fadiga calculados automaticamente."
            />
            <FeatureCard
              icon={BarChart3}
              color="text-purple"
              bg="bg-purple/10"
              title="Volume de Treino"
              desc="Acompanhe carga × séries × repetições ao longo do tempo. Dados que o MFit não te dá."
            />
            <FeatureCard
              icon={Bell}
              color="text-red"
              bg="bg-red/10"
              title="Alertas Inteligentes"
              desc="Receba notificações automáticas de estagnação de peso, risco cardíaco e inatividade."
            />
            <FeatureCard
              icon={Users}
              color="text-green"
              bg="bg-green/10"
              title="Esquadrão Completo"
              desc="Visualize todos os alunos num único painel — quem treinou, comeu e bebeu água hoje."
            />
            <FeatureCard
              icon={Shield}
              color="text-amber"
              bg="bg-amber/10"
              title="Protocolo Personalizado"
              desc="Monte planilha de treino, plano alimentar e suplementação direto na plataforma."
            />
            <FeatureCard
              icon={Zap}
              color="text-blue"
              bg="bg-blue/10"
              title="Para alunos também"
              desc="App simplificado para o aluno registrar biometria, hidratação e refeições com 3 toques."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <StatCard
            value="6/6"
            label="personal trainers validaram a dor"
            color="text-cyan"
          />
          <StatCard
            value="100%"
            label="relataram perda de alunos por falta de dados"
            color="text-green"
          />
          <StatCard
            value="0"
            label="planilhas ou PDFs necessários"
            color="text-purple"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-text mb-4">
            Comece hoje, é grátis
          </h2>
          <p className="text-dim mb-8">
            Cadastre-se como treinador, convide seus alunos com um código único
            e tenha dados reais em menos de 5 minutos.
          </p>
          <Link
            href="/auth/register"
            className="btn-primary px-10 py-3 text-base inline-flex items-center gap-2"
          >
            Criar minha conta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <p className="text-dim text-sm">
          © {new Date().getFullYear()} Treinamento Pro Avançado
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  color,
  bg,
  title,
  desc,
}: {
  icon: any;
  color: string;
  bg: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-5 hover:border-border transition-colors">
      <div
        className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <p className="text-dim text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div>
      <p className={`text-3xl sm:text-4xl font-extrabold ${color} mb-2`}>
        {value}
      </p>
      <p className="text-dim text-sm leading-snug">{label}</p>
    </div>
  );
}
