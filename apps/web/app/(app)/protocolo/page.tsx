"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Timer,
  Dumbbell,
} from "lucide-react";

export default function ProtocoloPage() {
  const [ativos, setAtivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [execucao, setExecucao] = useState<any>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [descanso, setDescanso] = useState<number | null>(null);
  const [rodando, setRodando] = useState(false);
  const [dadosSet, setDadosSet] = useState({
    carga_kg: "",
    esforco_percebido: "",
    repeticoes_realizadas: "",
  });
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    api.protocolos.treinamento.aluno
      .ativos()
      .then((r: any) => {
        setAtivos(r.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (descanso === null || !rodando) return;
    if (descanso <= 0) {
      playBeep();
      concluirAtual();
      return;
    }
    const t = setTimeout(() => setDescanso((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [descanso, rodando]);

  function playBeep() {
    if (typeof window === "undefined") return;
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  const itens = execucao?.itens ?? [];
  const itemAtual = itens[indiceAtual];

  async function iniciar(vinculoId: string) {
    const r = (await api.protocolos.treinamento.aluno.iniciarExecucao(
      vinculoId,
    )) as any;
    setExecucao(r.data);
    setIndiceAtual(0);
    setDescanso(null);
    setRodando(false);
  }

  async function concluirAtual() {
    if (!execucao || !itemAtual) return;
    await api.protocolos.treinamento.aluno.atualizarItem(
      execucao.execucao.id,
      itemAtual.id,
      {
        repeticoes_realizadas: dadosSet.repeticoes_realizadas
          ? Number(dadosSet.repeticoes_realizadas)
          : undefined,
        carga_kg: dadosSet.carga_kg ? Number(dadosSet.carga_kg) : undefined,
        esforco_percebido: dadosSet.esforco_percebido
          ? Number(dadosSet.esforco_percebido)
          : undefined,
        descanso_real_seg: itemAtual.descanso_planejado_seg,
        concluido: true,
      },
    );

    setDadosSet({
      carga_kg: "",
      esforco_percebido: "",
      repeticoes_realizadas: "",
    });

    if (indiceAtual >= itens.length - 1) {
      setFinalizando(true);
      await api.protocolos.treinamento.aluno.finalizarExecucao(
        execucao.execucao.id,
      );
      setFinalizando(false);
      setRodando(false);
      setDescanso(null);
      return;
    }

    const nextIdx = indiceAtual + 1;
    setIndiceAtual(nextIdx);
    setDescanso(itens[nextIdx]?.descanso_planejado_seg ?? 0);
    setRodando(true);
  }

  function iniciarDescanso() {
    if (!itemAtual) return;
    setDescanso(itemAtual.descanso_planejado_seg ?? 0);
    setRodando(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ativos || ativos.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-text">Treinamento</h2>
        <div className="card p-8 text-center">
          <Dumbbell className="w-10 h-10 text-dim mx-auto mb-3" />
          <p className="text-text font-medium">Sem séries ativas</p>
          <p className="text-dim text-sm mt-1">
            Seu treinador ainda não vinculou séries de treinamento ativas.
            <br />
            Entre em contato para iniciar seu plano.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text">Treinamento</h2>

      {!execucao && (
        <div className="flex flex-col gap-3">
          {ativos.map((v) => (
            <div key={v.id} className="card p-4">
              <p className="font-semibold text-text">
                {v.template?.nome ?? "Série"}
              </p>
              <p className="text-xs text-dim mt-1">
                Válida até {new Date(v.validade_em).toLocaleDateString("pt-BR")}
              </p>
              <button
                onClick={() => iniciar(v.id)}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Iniciar execução
              </button>
            </div>
          ))}
        </div>
      )}

      {execucao && itemAtual && (
        <div className="card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dim">
              Exercício {indiceAtual + 1} de {itens.length}
            </p>
            <button
              className="text-xs text-dim hover:text-text flex items-center gap-1"
              onClick={() => {
                setExecucao(null);
                setRodando(false);
                setDescanso(null);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
            </button>
          </div>

          <div>
            <p className="text-lg font-bold text-text">
              {itemAtual.exercicio?.nome}
            </p>
            <p className="text-sm text-dim">
              Planejado: {itemAtual.repeticoes_planejadas} reps • descanso{" "}
              {itemAtual.descanso_planejado_seg}s
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              className="input text-sm"
              placeholder="Reps"
              value={dadosSet.repeticoes_realizadas}
              onChange={(e) =>
                setDadosSet((p) => ({
                  ...p,
                  repeticoes_realizadas: e.target.value,
                }))
              }
            />
            <input
              className="input text-sm"
              placeholder="Carga kg"
              value={dadosSet.carga_kg}
              onChange={(e) =>
                setDadosSet((p) => ({ ...p, carga_kg: e.target.value }))
              }
            />
            <input
              className="input text-sm"
              placeholder="Esforço 6-10"
              value={dadosSet.esforco_percebido}
              onChange={(e) =>
                setDadosSet((p) => ({
                  ...p,
                  esforco_percebido: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
              onClick={() => setRodando((v) => !v)}
              disabled={descanso === null}
            >
              {rodando ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {rodando ? "Pausar" : "Retomar"}
            </button>
            <button
              aria-label="Iniciar descanso"
              className="btn-secondary"
              onClick={iniciarDescanso}
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              aria-label="Avançar exercício"
              className="btn-primary"
              onClick={concluirAtual}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {descanso !== null && (
            <div className="rounded-xl bg-cyan/10 border border-cyan/20 p-4 text-center">
              <p className="text-xs text-dim mb-1">Descanso</p>
              <p className="text-3xl font-bold text-cyan tabular-nums">
                {descanso}s
              </p>
              <p className="text-xs text-dim mt-1">
                Ao zerar toca áudio e avança automaticamente.
              </p>
            </div>
          )}

          {finalizando && (
            <p className="text-sm text-dim">Finalizando execução...</p>
          )}
        </div>
      )}
    </div>
  );
}
