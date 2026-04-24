"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { ArrowLeft, Edit3 } from "lucide-react";

export default function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.dashboard
      .aluno(id as string)
      .then((r: any) => {
        const d = r.data ?? {};
        setData({
          ...d,
          biometria: d.biometria ?? [],
          volume: d.volume ?? d.treinos ?? [],
          readiness: d.readiness ?? [],
          treino_execucoes: d.treino_execucoes ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 text-xs">
        <p className="text-dim mb-1">{formatDate(label)}</p>
        {payload.map((p: any) => (
          <p
            key={p.dataKey}
            style={{ color: p.color }}
            className="font-semibold"
          >
            {p.value?.toFixed?.(1) ?? p.value} {p.name}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/trainer/dashboard" className="text-dim hover:text-text">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-text">Perfil do Aluno</h2>
        <Link
          href={`/trainer/protocolo/${id}`}
          className="ml-auto btn-ghost flex items-center gap-1.5 text-sm"
        >
          <Edit3 className="w-3.5 h-3.5" /> Treinamento
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <p className="text-dim">Erro ao carregar dados do aluno.</p>
      ) : (
        <>
          {/* Biometria chart */}
          {data.biometria.length > 0 ? (
            <div className="card p-4">
              <p className="text-sm font-semibold text-text mb-3">Peso (kg)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={[...data.biometria].reverse()}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="data_registro"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    name="kg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-dim text-sm">
                Nenhum dado de biometria registrado.
              </p>
            </div>
          )}

          {/* Volume chart */}
          {data.volume.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-text mb-3">
                Volume de Treino (kg)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={data.volume}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="data_treino"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="volume_total"
                    fill="#a78bfa"
                    radius={[4, 4, 0, 0]}
                    name="kg"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Readiness chart */}
          {data.readiness.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-text mb-3">
                Score de Readiness
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={[...data.readiness].reverse()}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="data_registro"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score_calculado"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                    name="pts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Biometria table */}
          {data.biometria.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-semibold text-text">
                  Histórico de Biometria
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-dim font-medium">
                        Data
                      </th>
                      <th className="text-right p-3 text-dim font-medium">
                        Peso
                      </th>
                      <th className="text-right p-3 text-dim font-medium">
                        Gordura
                      </th>
                      <th className="text-right p-3 text-dim font-medium">
                        Músculo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.biometria.map((row: any) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="p-3 text-dim">
                          {new Date(row.data_registro).toLocaleDateString(
                            "pt-BR",
                          )}
                        </td>
                        <td className="p-3 text-right font-medium text-cyan">
                          {row.peso} kg
                        </td>
                        <td className="p-3 text-right text-amber">
                          {row.percentual_gordura
                            ? `${row.percentual_gordura}%`
                            : "—"}
                        </td>
                        <td className="p-3 text-right text-green">
                          {row.massa_muscular
                            ? `${row.massa_muscular} kg`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.treino_execucoes?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-semibold text-text">
                  Resultados de Execução do Treinamento
                </p>
              </div>
              <div className="divide-y divide-border">
                {data.treino_execucoes.map((exec: any) => {
                  const itens = exec.itens ?? [];
                  const concluidos = itens.filter(
                    (i: any) => i.concluido_em,
                  ).length;
                  const esforcoMedio =
                    itens
                      .filter((i: any) => i.esforco_percebido)
                      .reduce(
                        (acc: number, i: any) =>
                          acc + Number(i.esforco_percebido),
                        0,
                      ) /
                    Math.max(
                      itens.filter((i: any) => i.esforco_percebido).length,
                      1,
                    );
                  return (
                    <div key={exec.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text">
                          {exec.vinculo?.serie_template_id
                            ? "Série vinculada"
                            : "Treino"}
                        </p>
                        <p className="text-xs text-dim">
                          {new Date(exec.iniciado_em).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <p className="text-xs text-dim mt-1">
                        {concluidos}/{itens.length} exercícios concluídos ·
                        esforço médio{" "}
                        {Number.isFinite(esforcoMedio)
                          ? esforcoMedio.toFixed(1)
                          : "-"}
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        {itens.slice(0, 4).map((item: any) => (
                          <div
                            key={item.id}
                            className="text-xs rounded-lg bg-border/40 px-2 py-1.5 flex items-center justify-between"
                          >
                            <span className="text-text">
                              {item.exercicio?.nome}
                            </span>
                            <span className="text-dim">
                              {item.repeticoes_realizadas ??
                                item.repeticoes_planejadas}{" "}
                              reps · {item.carga_kg ?? "-"}kg · RPE{" "}
                              {item.esforco_percebido ?? "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
