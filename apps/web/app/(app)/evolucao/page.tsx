"use client";
import { useEffect, useState } from "react";
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

type Period = "30" | "90" | "180" | "365";

const PERIODS: { label: string; value: Period }[] = [
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "6m", value: "180" },
  { label: "1a", value: "365" },
];

export default function EvolucaoPage() {
  const [period, setPeriod] = useState<Period>("90");
  const [biometria, setBiometria] = useState<any[]>([]);
  const [volume, setVolume] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [bio, vol] = await Promise.allSettled([
        api.biometria.list({ limit: parseInt(period) }),
        api.treinos.volume(parseInt(period)),
      ]);
      if (bio.status === "fulfilled") {
        const data = ((bio.value as any).data ?? []).reverse();
        setBiometria(data);
      }
      if (vol.status === "fulfilled") {
        setVolume((vol.value as any).data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [period]);

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

  const latestBio = biometria[biometria.length - 1];
  const firstBio = biometria[0];
  const pesoVariacao =
    latestBio && firstBio ? (latestBio.peso - firstBio.peso).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Evolução</h2>
        {/* Period selector */}
        <div className="flex gap-1 bg-border rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${period === p.value ? "bg-cyan text-bg" : "text-dim hover:text-text"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : biometria.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-dim">Nenhum dado de biometria ainda.</p>
          <p className="text-dim text-sm mt-1">
            Registre seu primeiro peso na aba{" "}
            <strong className="text-text">Hoje</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard
              label="Peso atual"
              value={latestBio?.peso ? `${latestBio.peso} kg` : "—"}
              subtext={
                pesoVariacao
                  ? `${parseFloat(pesoVariacao) > 0 ? "+" : ""}${pesoVariacao} kg no período`
                  : undefined
              }
              color={
                !pesoVariacao
                  ? undefined
                  : parseFloat(pesoVariacao) < 0
                    ? "text-green"
                    : parseFloat(pesoVariacao) > 0
                      ? "text-amber"
                      : "text-dim"
              }
            />
            <SummaryCard
              label="Gordura"
              value={
                latestBio?.percentual_gordura
                  ? `${latestBio.percentual_gordura}%`
                  : "—"
              }
              color="text-amber"
            />
            <SummaryCard
              label="Músculo"
              value={
                latestBio?.massa_muscular
                  ? `${latestBio.massa_muscular} kg`
                  : "—"
              }
              color="text-green"
            />
          </div>

          {/* Weight chart */}
          <ChartCard title="Peso (kg)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={biometria}
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
          </ChartCard>

          {/* Body fat chart */}
          {biometria.some((d) => d.percentual_gordura) && (
            <ChartCard title="Gordura Corporal (%)">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={biometria}
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
                    dataKey="percentual_gordura"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    name="%"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Volume chart */}
          {volume.length > 0 && (
            <ChartCard title="Volume de Treino (kg total)">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={volume}
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
            </ChartCard>
          )}

          {/* History table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-text">
                Histórico completo
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-dim font-medium">Data</th>
                    <th className="text-right p-3 text-dim font-medium">
                      Peso
                    </th>
                    <th className="text-right p-3 text-dim font-medium">
                      Gord.
                    </th>
                    <th className="text-right p-3 text-dim font-medium">
                      Músculo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...biometria].reverse().map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-border/30"
                    >
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
                        {row.massa_muscular ? `${row.massa_muscular} kg` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="card p-3 text-center">
      <p className="text-xs text-dim mb-1">{label}</p>
      <p className={`text-lg font-bold ${color ?? "text-text"}`}>{value}</p>
      {subtext && (
        <p className={`text-[10px] mt-0.5 ${color ?? "text-dim"}`}>{subtext}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-text mb-3">{title}</p>
      {children}
    </div>
  );
}
