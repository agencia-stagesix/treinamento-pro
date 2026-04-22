"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Clock,
  Dumbbell,
  Pill,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ProtocoloPage() {
  const [protocolo, setProtocolo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  useEffect(() => {
    api.protocolos
      .meu()
      .then((r: any) => {
        setProtocolo(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const todayDow = new Date().getDay();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!protocolo) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-text">Protocolo</h2>
        <div className="card p-8 text-center">
          <Dumbbell className="w-10 h-10 text-dim mx-auto mb-3" />
          <p className="text-text font-medium">Protocolo não configurado</p>
          <p className="text-dim text-sm mt-1">
            Seu treinador ainda não configurou seu protocolo.
            <br />
            Entre em contato para iniciar seu plano.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Protocolo</h2>
        <span className="text-xs text-dim bg-border px-2 py-1 rounded-lg">
          v{protocolo.versao}
        </span>
      </div>

      {/* Metas */}
      {protocolo.metas && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-cyan" />
            <span className="text-sm font-semibold text-text">Metas</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {protocolo.metas.peso_alvo && (
              <div>
                <p className="text-lg font-bold text-cyan">
                  {protocolo.metas.peso_alvo} kg
                </p>
                <p className="text-xs text-dim">Peso alvo</p>
              </div>
            )}
            {protocolo.metas.gordura_alvo && (
              <div>
                <p className="text-lg font-bold text-amber">
                  {protocolo.metas.gordura_alvo}%
                </p>
                <p className="text-xs text-dim">Gordura alvo</p>
              </div>
            )}
            {protocolo.metas.prazo && (
              <div>
                <p className="text-lg font-bold text-green">
                  {protocolo.metas.prazo}
                </p>
                <p className="text-xs text-dim">Prazo</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planilha de treino */}
      {protocolo.planilha_treino?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-purple" />
            <span className="text-sm font-semibold text-text">
              Planilha de Treino
            </span>
          </div>
          <div className="divide-y divide-border">
            {protocolo.planilha_treino.map((dia: any) => {
              const isToday = dia.dia_semana === todayDow;
              const isOpen = activeDay === dia.dia_semana;

              return (
                <div key={dia.dia_semana}>
                  <button
                    className={`w-full flex items-center justify-between p-4 hover:bg-border/40 transition-colors text-left ${isToday ? "bg-cyan/5" : ""}`}
                    onClick={() => setActiveDay(isOpen ? null : dia.dia_semana)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? "bg-cyan text-bg" : "bg-border text-dim"}`}
                      >
                        {diasSemana[dia.dia_semana]}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-medium ${isToday ? "text-cyan" : "text-text"}`}
                        >
                          {dia.nome}
                        </p>
                        <p className="text-xs text-dim">
                          {dia.exercicios?.length ?? 0} exercícios
                        </p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-dim" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-dim" />
                    )}
                  </button>

                  {isOpen && dia.exercicios?.length > 0 && (
                    <div className="bg-bg/50 divide-y divide-border/50">
                      {dia.exercicios.map((ex: any, i: number) => (
                        <div key={i} className="p-4 pl-16">
                          <p className="text-sm font-medium text-text">
                            {ex.nome}
                          </p>
                          <p className="text-xs text-dim mt-0.5">
                            {ex.series}×{ex.repeticoes}
                            {ex.carga ? ` — ${ex.carga}` : ""}
                            {ex.descanso_seg
                              ? ` — ${ex.descanso_seg}s descanso`
                              : ""}
                          </p>
                          {ex.notas && (
                            <p className="text-xs text-dim2 mt-0.5 italic">
                              {ex.notas}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plano alimentar */}
      {protocolo.plano_alimentar?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber" />
            <span className="text-sm font-semibold text-text">
              Plano Alimentar
            </span>
          </div>
          <div className="divide-y divide-border">
            {protocolo.plano_alimentar.map((ref: any, i: number) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text">
                    {ref.tipo?.replace("-", " ")}
                  </span>
                  <span className="text-xs text-dim font-medium">
                    {ref.horario}
                  </span>
                </div>
                <p className="text-sm text-dim">{ref.descricao}</p>
                {ref.calorias_alvo && (
                  <p className="text-xs text-amber mt-1">
                    ~{ref.calorias_alvo} kcal
                    {ref.proteina_alvo
                      ? ` · ${ref.proteina_alvo}g proteína`
                      : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suplementação */}
      {protocolo.suplementos?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Pill className="w-4 h-4 text-green" />
            <span className="text-sm font-semibold text-text">
              Suplementação
            </span>
          </div>
          <div className="divide-y divide-border">
            {protocolo.suplementos.map((sup: any, i: number) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green/10 flex items-center justify-center text-sm">
                  💊
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{sup.nome}</p>
                  <p className="text-xs text-dim">
                    {sup.dose} · {sup.horario_relativo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-dim text-center pb-2">
        Atualizado em{" "}
        {new Date(protocolo.updated_at).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
