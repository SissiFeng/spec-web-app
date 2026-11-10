import { useState } from "react";
import { ArrowRight, Check, CircleDot, Sparkles } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { formatUSD } from "../data/constants";
import { PHASES } from "../lib/health";
import { PROVIDER_COLORS } from "../data/cloudCatalog";
import { Badge } from "./shared";

const SEVERITY_STYLE = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-50 text-blue-600",
};

const scoreColor = (s) => (s >= 80 ? "text-emerald-600" : s >= 55 ? "text-amber-600" : "text-red-600");
const ringColor = (s) => (s >= 80 ? "#10b981" : s >= 55 ? "#f59e0b" : "#ef4444");

function ScoreRing({ score }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle cx="56" cy="56" r={r} fill="none" stroke={ringColor(score)} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 56 56)" />
      <text x="56" y="54" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 26, fontWeight: 700 }}>{score}</text>
      <text x="56" y="72" textAnchor="middle" className="fill-gray-400" style={{ fontSize: 10 }}>readiness</text>
    </svg>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone || "text-gray-900"}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Overview({ health, onFix, onSetPhase, onNavigate }) {
  const config = useProjectConfig();
  const [bucketFilter, setBucketFilter] = useState(null);
  const { stats } = health;
  const phase = config.meta?.phase || "discovery";
  const phaseIdx = PHASES.findIndex((p) => p.key === phase);
  const gates = health.gates[phase] || [];
  const gatesDone = gates.filter((g) => g.done).length;
  const next = PHASES[phaseIdx + 1];

  const findings = bucketFilter ? health.findings.filter((f) => f.bucket === bucketFilter) : health.findings;
  const providers = Object.entries(stats.costByProvider).filter(([, v]) => v > 0);
  const maxCost = Math.max(1, ...providers.map(([, v]) => v));

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Phase stepper */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2">
          {PHASES.map((p, i) => (
            <div key={p.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => onSetPhase(p.key)}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${i === phaseIdx ? "bg-gray-900 text-white" : i < phaseIdx ? "text-emerald-700 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-50"}`}
                title={`Set phase to ${p.label}`}
              >
                {i < phaseIdx ? <Check size={14} /> : <CircleDot size={14} />}
                {p.label}
              </button>
              {i < PHASES.length - 1 && <div className={`h-px flex-1 ${i < phaseIdx ? "bg-emerald-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">
              {PHASES[phaseIdx]?.label} exit criteria · {gatesDone}/{gates.length} met
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {gates.map((g) => (
                <div key={g.label} className={`flex items-center gap-2 text-sm ${g.done ? "text-gray-500" : "text-gray-800"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${g.done ? "bg-emerald-500 text-white" : "border border-gray-300"}`}>
                    {g.done && <Check size={10} />}
                  </span>
                  {g.label}
                </div>
              ))}
            </div>
          </div>
          {next && (
            <button
              onClick={() => onSetPhase(next.key)}
              disabled={gatesDone < gates.length}
              title={gatesDone < gates.length ? "Meet all exit criteria first (or click the phase above to override)" : ""}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Advance to {next.label} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Score + pillars */}
      <div className="bg-white border rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center">
        <ScoreRing score={health.overall} />
        <div className="flex-1 w-full grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {health.buckets.map((b) => (
            <button
              key={b.key}
              onClick={() => setBucketFilter(bucketFilter === b.key ? null : b.key)}
              className={`text-left rounded-lg px-2 py-1 -mx-2 transition-colors ${bucketFilter === b.key ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{b.label}</span>
                <span className={`font-semibold ${scoreColor(b.score)}`}>{b.score}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className={`h-full ${b.bar} rounded-full`} style={{ width: `${b.score}%` }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pillars with NFRs" value={`${stats.pillarsCovered}/5`} tone={stats.pillarsCovered === 5 ? "text-emerald-600" : "text-amber-600"} />
        <Stat label="Must-haves traced" value={stats.tracedPct === null ? "—" : `${stats.tracedPct}%`} sub="to architecture components" />
        <Stat label="Open high-impact risks" value={stats.openHighRisks} tone={stats.openHighRisks ? "text-red-600" : "text-gray-900"} />
        <Stat label="Decisions pending" value={stats.pendingAdrs} sub="ADRs in proposed" />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5 items-start">
        {/* Next best actions */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-800">
              <Sparkles size={15} className="text-violet-500" /> Next best actions
              {bucketFilter && (
                <button onClick={() => setBucketFilter(null)} className="text-xs font-normal text-gray-400 hover:text-gray-600">
                  · {health.bucketLabel(bucketFilter)} ✕
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400">{findings.length} findings</span>
          </div>
          <div className="divide-y">
            {findings.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No gaps detected — nice work.</div>
            )}
            {findings.slice(0, 15).map((f) => (
              <div key={f.id} className="px-5 py-2.5 flex items-center gap-3">
                <Badge text={f.severity} color={SEVERITY_STYLE[f.severity]} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-800 truncate">{f.title}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {health.bucketLabel(f.bucket)}{f.detail ? ` · ${f.detail}` : ""}
                  </div>
                </div>
                {f.fix && (
                  <button onClick={() => onFix(f.fix)} className="shrink-0 text-xs px-2.5 py-1 rounded-md border hover:bg-gray-50 text-gray-700 flex items-center gap-1">
                    {f.fix.label || "Fix"} <ArrowRight size={11} />
                  </button>
                )}
              </div>
            ))}
            {findings.length > 15 && <div className="px-5 py-2 text-xs text-gray-400">+{findings.length - 15} more</div>}
          </div>
        </div>

        {/* Cost */}
        <div className="bg-white border rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-800">Estimated run-rate</div>
          <div className="text-2xl font-semibold mt-1">{formatUSD(stats.monthlyCost)}<span className="text-sm font-normal text-gray-400"> / month</span></div>
          {stats.budget && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400"><span>Budget</span><span>{formatUSD(stats.budget)}</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className={`h-full rounded-full ${stats.monthlyCost > stats.budget ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (100 * stats.monthlyCost) / stats.budget)}%` }} />
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {providers.map(([p, v]) => (
              <div key={p}>
                <div className="flex justify-between text-xs"><Badge text={p} color={PROVIDER_COLORS[p]} /><span className="text-gray-600">{formatUSD(v)}</span></div>
                <div className="h-1 bg-gray-100 rounded-full mt-1"><div className="h-full bg-gray-400 rounded-full" style={{ width: `${(100 * v) / maxCost}%` }} /></div>
              </div>
            ))}
            {providers.length === 0 && <div className="text-xs text-gray-400">No costed components yet.</div>}
          </div>
          <button onClick={() => onNavigate("architecture")} className="mt-4 text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
            Open architecture <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
