import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, RotateCcw, ChevronDown } from "lucide-react";

interface Era {
    id: string;
    name: string;
    period: string;
    order: number;
    notableFeature: string;
    description: string;
    accentColor: string;
}

interface Props {
    eras: Era[];
}

const PERFORMANCE: Record<string, number> = {
    "birth-of-mobile-cpus": 1,
    "arm-revolution": 4,
    "multicore-era": 12,
    "system-on-chip-era": 40,
    "ai-efficiency-era": 120,
};

const ERA_HIGHLIGHTS: Record<
    string,
    { cores: string; speed: string; innovation: string }
> = {
    "birth-of-mobile-cpus": {
        cores: "1 core",
        speed: "≤ 400 MHz",
        innovation: "Low-power RISC, Thumb ISA",
    },
    "arm-revolution": {
        cores: "1 core",
        speed: "600 MHz – 1 GHz",
        innovation: "ARMv7 Cortex-A, in-order superscalar",
    },
    "multicore-era": {
        cores: "2–4 cores",
        speed: "1.0 – 1.7 GHz",
        innovation: "Multi-core, 64-bit ARMv8",
    },
    "system-on-chip-era": {
        cores: "4–10 cores",
        speed: "1.85 – 2.6 GHz",
        innovation: "Custom µarch, integrated modem",
    },
    "ai-efficiency-era": {
        cores: "6–10 cores",
        speed: "3.2 – 4.61 GHz",
        innovation: "Custom cores + NPU, 3 nm N3P",
    },
};

const ERA_COLORS: Record<string, string> = {
    "birth-of-mobile-cpus": "#22D3EE",
    "arm-revolution": "#34D399",
    "multicore-era": "#F59E0B",
    "system-on-chip-era": "#A78BFA",
    "ai-efficiency-era": "#F472B6",
};

const SLOWEST_MS = 3000; // the slowest selected era takes this long; faster finish sooner
const TICK_MS = 40;

export default function EvolutionSimulator({ eras }: Props) {
    const prefersReduced = useReducedMotion();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [done, setDone] = useState(false);
    const liveRef = useRef<HTMLParagraphElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const selectedEras = eras.filter((e) => selected.has(e.id));
    const canStart = selected.size >= 2;

    // completion time per era: slowest (min score) = SLOWEST_MS, faster finish proportionally earlier
    const completionMs = (id: string): number => {
        const scores = [...selected].map((s) => PERFORMANCE[s] ?? 1);
        const minScore = Math.min(...scores);
        return SLOWEST_MS * (minScore / (PERFORMANCE[id] ?? 1));
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
        setProgress({});
        setDone(false);
    };

    const toggleEra = (id: string) => {
        if (running) return;
        setSelected((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
        setProgress({});
        setDone(false);
    };

    const simulate = () => {
        if (!canStart) return;
        reset();
        if (prefersReduced) {
            const r: Record<string, number> = {};
            for (const id of selected) r[id] = 100;
            setProgress(r);
            setDone(true);
            if (liveRef.current)
                liveRef.current.textContent = "Simulation complete.";
            return;
        }
        setRunning(true);
        const start = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            const updated: Record<string, number> = {};
            let allDone = true;
            for (const id of selected) {
                const pct = Math.min(100, (elapsed / completionMs(id)) * 100);
                updated[id] = pct;
                if (pct < 100) allDone = false;
            }
            setProgress(updated);
            if (allDone) {
                clearInterval(timerRef.current!);
                setRunning(false);
                setDone(true);
                if (liveRef.current)
                    liveRef.current.textContent =
                        "Simulation complete. See results below.";
            }
        }, TICK_MS);
    };

    useEffect(
        () => () => {
            if (timerRef.current) clearInterval(timerRef.current);
        },
        [],
    );

    const fastestId = selectedEras.reduce(
        (best, e) => (PERFORMANCE[e.id] > PERFORMANCE[best] ? e.id : best),
        selectedEras[0]?.id ?? "",
    );

    const checkBase: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderRadius: 8,
        border: "1px solid",
        cursor: running ? "not-allowed" : "pointer",
        transition: "all 150ms",
        userSelect: "none",
        opacity: running ? 0.5 : 1,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
    };

    return (
        <div
            role="region"
            aria-label="Evolution Simulator"
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
            <p ref={liveRef} aria-live="polite" className="sr-only" />

            {/* Era selector */}
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-secondary)",
                        marginBottom: 12,
                        display: "block",
                    }}
                >
                    Select 2 or more eras to compare
                </legend>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {eras.map((era) => {
                        const checked = selected.has(era.id);
                        const color = ERA_COLORS[era.id] ?? "#22D3EE";
                        return (
                            <label
                                key={era.id}
                                style={{
                                    ...checkBase,
                                    borderColor: checked
                                        ? color + "60"
                                        : "var(--border-mid)",
                                    background: checked
                                        ? color + "0f"
                                        : "transparent",
                                    color: checked
                                        ? color
                                        : "var(--text-secondary)",
                                    pointerEvents: running ? "none" : "auto",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleEra(era.id)}
                                    disabled={running}
                                    className="sr-only"
                                    aria-label={`Include ${era.name}`}
                                />
                                <span
                                    style={{
                                        width: 13,
                                        height: 13,
                                        borderRadius: 3,
                                        border: `1px solid ${checked ? color : "rgba(255,255,255,0.5)"}`,
                                        background: checked
                                            ? color
                                            : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        transition: "all 150ms",
                                    }}
                                    aria-hidden="true"
                                >
                                    {checked && (
                                        <svg
                                            width="8"
                                            height="8"
                                            viewBox="0 0 8 8"
                                            fill="none"
                                        >
                                            <path
                                                d="M1 4l2 2 4-4"
                                                stroke="#05050A"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </span>
                                Era {era.order}: {era.name}
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            {/* Controls */}
            <div style={{ display: "flex", gap: 10 }}>
                <button
                    onClick={simulate}
                    disabled={!canStart || running}
                    className="btn-secondary"
                    style={{
                        fontSize: 15,
                        padding: "8px 20px",
                        opacity: !canStart || running ? 0.35 : 1,
                        pointerEvents: !canStart || running ? "none" : "auto",
                    }}
                    aria-disabled={!canStart || running}
                >
                    <Play size={13} aria-hidden="true" />
                    {running ? "Simulating…" : "Simulate"}
                </button>
                <button
                    onClick={reset}
                    className="btn-ghost"
                    style={{ fontSize: 15 }}
                    aria-label="Reset simulation"
                >
                    <RotateCcw size={13} aria-hidden="true" />
                    Reset
                </button>
            </div>

            {/* Racing lanes */}
            {selectedEras.length > 0 &&
                (Object.keys(progress).length > 0 || running) && (
                    <div
                        style={{
                            background: "rgba(0,0,0,0.22)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 12,
                            padding: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                        }}
                        aria-label="Simulation progress"
                    >
                        {selectedEras.map((era) => {
                            const pct = progress[era.id] ?? 0;
                            const isFastest = era.id === fastestId;
                            const color = ERA_COLORS[era.id] ?? "#22D3EE";
                            const finished = pct >= 100;
                            return (
                                <div
                                    key={era.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    {/* Ordinal badge */}
                                    <span
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 99,
                                            border: `1.5px solid ${color}`,
                                            background: `${color}1a`,
                                            color,
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                        aria-hidden="true"
                                    >
                                        {era.order}
                                    </span>

                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                    fontSize: 13,
                                                    color: "var(--text-primary)",
                                                }}
                                            >
                                                {done && isFastest && (
                                                    <span
                                                        aria-label="Fastest"
                                                        style={{ fontSize: 14 }}
                                                    >
                                                        🏆
                                                    </span>
                                                )}
                                                {era.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                    fontSize: 13,
                                                    color,
                                                    minWidth: 36,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {pct.toFixed(0)}%
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                height: 7,
                                                borderRadius: 99,
                                                background: `${color}12`,
                                                overflow: "hidden",
                                                position: "relative",
                                            }}
                                            role="progressbar"
                                            aria-valuenow={Math.round(pct)}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`${era.name} progress`}
                                        >
                                            <motion.div
                                                style={{
                                                    height: "100%",
                                                    borderRadius: 99,
                                                    background: `linear-gradient(to right, ${color}90, ${color})`,
                                                    boxShadow: `0 0 8px ${color}70`,
                                                    position: "relative",
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={
                                                    prefersReduced
                                                        ? { duration: 0 }
                                                        : {
                                                              duration:
                                                                  TICK_MS /
                                                                  1000,
                                                              ease: "linear",
                                                          }
                                                }
                                            />
                                            {/* finish flash + checker */}
                                            {finished && (
                                                <motion.div
                                                    initial={{ opacity: 0.9 }}
                                                    animate={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.6,
                                                    }}
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: "#fff",
                                                    }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {finished && (
                                                <div
                                                    aria-hidden="true"
                                                    style={{
                                                        position: "absolute",
                                                        right: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: 16,
                                                        backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 3px, transparent 3px, transparent 6px)`,
                                                        opacity: 0.6,
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {done && (
                                            <p
                                                style={{
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                    fontSize: 11,
                                                    color: "var(--text-secondary)",
                                                    marginTop: 5,
                                                }}
                                            >
                                                {PERFORMANCE[era.id]}× relative
                                                performance · Finished in{" "}
                                                {(
                                                    completionMs(era.id) / 1000
                                                ).toFixed(2)}
                                                s
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            {/* Results */}
            {done && selectedEras.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 16,
                    }}
                >
                    <details
                        open
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 12,
                            padding: 20,
                        }}
                    >
                        <summary
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: 16,
                                color: "var(--text-primary)",
                                listStyle: "none",
                                userSelect: "none",
                            }}
                        >
                            Era Highlights
                            <ChevronDown
                                size={14}
                                style={{ color: "var(--text-secondary)" }}
                                aria-hidden="true"
                            />
                        </summary>
                        <div
                            style={{
                                marginTop: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                            {selectedEras.map((era) => {
                                const color = ERA_COLORS[era.id] ?? "#22D3EE";
                                const h = ERA_HIGHLIGHTS[era.id];
                                return (
                                    <div key={era.id}>
                                        <p
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                                fontSize: 12,
                                                letterSpacing: "0.12em",
                                                color,
                                                marginBottom: 8,
                                                opacity: 0.85,
                                            }}
                                        >
                                            {era.name}
                                        </p>
                                        <dl
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "repeat(3, 1fr)",
                                                gap: 8,
                                            }}
                                        >
                                            {[
                                                {
                                                    label: "Cores",
                                                    value: h?.cores ?? "—",
                                                },
                                                {
                                                    label: "Speed",
                                                    value: h?.speed ?? "—",
                                                },
                                                {
                                                    label: "Innovation",
                                                    value: h?.innovation ?? "—",
                                                },
                                            ].map(({ label, value }) => (
                                                <div key={label}>
                                                    <dt
                                                        style={{
                                                            fontFamily:
                                                                "'JetBrains Mono', monospace",
                                                            fontSize: 11,
                                                            color: "var(--text-secondary)",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.1em",
                                                            marginBottom: 2,
                                                        }}
                                                    >
                                                        {label}
                                                    </dt>
                                                    <dd
                                                        style={{
                                                            fontFamily:
                                                                "'JetBrains Mono', monospace",
                                                            fontSize: 12,
                                                            color: "var(--text-primary)",
                                                            lineHeight: 1.4,
                                                        }}
                                                    >
                                                        {value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                );
                            })}
                        </div>
                    </details>

                    <details
                        open
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 12,
                            padding: 20,
                        }}
                    >
                        <summary
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: 16,
                                color: "var(--text-primary)",
                                listStyle: "none",
                                userSelect: "none",
                            }}
                        >
                            Performance Metrics
                            <ChevronDown
                                size={14}
                                style={{ color: "var(--text-secondary)" }}
                                aria-hidden="true"
                            />
                        </summary>
                        <div style={{ marginTop: 16 }}>
                            <table
                                style={{
                                    width: "100%",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 13,
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            color: "var(--text-secondary)",
                                            borderBottom:
                                                "1px solid var(--border-subtle)",
                                        }}
                                    >
                                        <th
                                            scope="col"
                                            style={{
                                                textAlign: "left",
                                                fontWeight: "normal",
                                                paddingBottom: 8,
                                                fontSize: 11,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Era
                                        </th>
                                        <th
                                            scope="col"
                                            style={{
                                                textAlign: "left",
                                                fontWeight: "normal",
                                                paddingBottom: 8,
                                                fontSize: 11,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Perf.
                                        </th>
                                        <th
                                            scope="col"
                                            style={{
                                                textAlign: "left",
                                                fontWeight: "normal",
                                                paddingBottom: 8,
                                                fontSize: 11,
                                                letterSpacing: "0.1em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedEras
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                PERFORMANCE[b.id] -
                                                PERFORMANCE[a.id],
                                        )
                                        .map((era) => {
                                            const color =
                                                ERA_COLORS[era.id] ?? "#22D3EE";
                                            return (
                                                <tr
                                                    key={era.id}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid rgba(255,255,255,0.04)",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: "8px 0",
                                                            color: "var(--text-primary)",
                                                        }}
                                                    >
                                                        {era.name}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "8px 0",
                                                            color,
                                                        }}
                                                    >
                                                        {PERFORMANCE[era.id]}×
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "8px 0",
                                                            color: "var(--text-secondary)",
                                                        }}
                                                    >
                                                        {(
                                                            completionMs(
                                                                era.id,
                                                            ) / 1000
                                                        ).toFixed(2)}
                                                        s
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
