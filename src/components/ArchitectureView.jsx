import { useMemo, useState } from "react";
import { Plus, ShieldAlert } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { LAYERS, PROVIDERS, PROVIDER_COLORS, suggestServices } from "../data/cloudCatalog";
import { formatUSD } from "../data/constants";
import { itemTitle } from "../data/itemTypes";
import { Badge, StatusBadge, Ref } from "./shared";

// Target architecture laid out by layer, with cost roll-ups and the
// layer gaps the health engine flagged inline.

export default function ArchitectureView({ items, refs, onSelect, onCreate, health }) {
  const config = useProjectConfig();
  const clouds = config.meta?.clouds?.length ? config.meta.clouds : PROVIDERS.slice(0, 1);
  const [provider, setProvider] = useState("all");

  const comps = useMemo(
    () => items.filter((i) => i.type === "component" && i.status !== "retired" && (provider === "all" || i.provider === provider)),
    [items, provider]
  );
  const total = comps.reduce((s, c) => s + (Number(c.monthlyCost) || 0), 0);
  const gapLayers = new Set(health.findings.filter((f) => f.id.startsWith("arch-layer-")).map((f) => f.id.replace("arch-layer-", "")));
  const usedProviders = [...new Set(items.filter((i) => i.type === "component").map((c) => c.provider).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-white border rounded-lg p-0.5">
          {["all", ...usedProviders].map((p) => (
            <button key={p} onClick={() => setProvider(p)} className={`px-2.5 py-1 text-xs rounded-md ${provider === p ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {p === "all" ? "All providers" : p}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          {comps.length} components · <span className="font-semibold text-gray-900">{formatUSD(total)}</span> / month
          {health.stats.budget ? <span className="text-gray-400"> of {formatUSD(health.stats.budget)} budget</span> : null}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {LAYERS.map((layer) => {
          const list = comps.filter((c) => c.layer === layer);
          const cost = list.reduce((s, c) => s + (Number(c.monthlyCost) || 0), 0);
          const gap = gapLayers.has(layer);
          const suggestion = suggestServices(clouds[0], layer)[0];
          return (
            <div key={layer} className={`rounded-xl border bg-white flex flex-col ${gap ? "border-dashed border-red-300" : ""}`}>
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">{layer}</div>
                <div className="text-xs text-gray-400">{cost ? formatUSD(cost) : ""}</div>
              </div>
              <div className="p-2 space-y-1.5 flex-1">
                {gap && (
                  <div className="text-xs text-red-600 flex items-start gap-1.5 bg-red-50 rounded-md p-2">
                    <ShieldAlert size={13} className="shrink-0 mt-px" />
                    <span>Required layer missing{suggestion ? ` — e.g. ${suggestion}` : ""}</span>
                  </div>
                )}
                {list.map((c) => (
                  <div key={c.id} onClick={() => onSelect(c)} className="rounded-lg border p-2 hover:shadow-sm cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Ref value={refs[c.id]} />
                      <span className="text-sm font-medium text-gray-800 truncate flex-1">{itemTitle(c)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{[c.service, c.sku].filter(Boolean).join(" · ") || "Service not chosen"}</div>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <Badge text={c.provider || "?"} color={PROVIDER_COLORS[c.provider]} />
                      <StatusBadge status={c.status} />
                      {c.haPattern && c.haPattern !== "single-zone" && <Badge text="HA" title={c.haPattern} color="bg-sky-100 text-sky-700" />}
                      <span className={`ml-auto text-xs ${c.monthlyCost ? "text-gray-600" : "text-amber-600"}`}>
                        {c.monthlyCost ? formatUSD(c.monthlyCost) : c.provider === "On-prem" ? "" : "no estimate"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onCreate({ layer, provider: provider !== "all" ? provider : clouds[0], service: suggestion || "", title: suggestion || "" })}
                className="m-2 mt-0 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-md py-1.5 flex items-center justify-center gap-1 border border-dashed"
              >
                <Plus size={12} /> Add to {layer}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
