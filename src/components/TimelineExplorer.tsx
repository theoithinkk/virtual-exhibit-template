import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, GitCompare, Cpu } from "lucide-react";

interface Processor {
    id: string;
    name: string;
    eraId: string;
    cores: number;
    coreConfig: string;
    clockSpeedGHz: number;
    dieSizeMm2: number;
    transistorCount: string;
    processNodeNm: number;
    notableFeature: string;
    reference?: { source: string; url: string };
}

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
    processors: Processor[];
    eras: Era[];
}

const ERA_COLORS: Record<string, string> = {
    "birth-of-mobile-cpus": "#22D3EE",
    "arm-revolution": "#34D399",
    "multicore-era": "#F59E0B",
    "system-on-chip-era": "#A78BFA",
    "ai-efficiency-era": "#F472B6",
};

// Rough compute proxy used for the "relative to latest" bar. Data-driven, not invented.
const computeScore = (p: Processor) => p.cores * p.clockSpeedGHz;

function SpecBar({
    value,
    max,
    color,
}: {
    value: number;
    max: number;
    color: string;
}) {
    // Linear: bar width always equals value/max so it matches any % shown next to it.
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div
            style={{
                height: 3,
                borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
                marginTop: 3,
            }}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                }}
                style={{
                    height: "100%",
                    borderRadius: 99,
                    background: color,
                    opacity: 0.8,
                }}
            />
        </div>
    );
}

// ↑ wins / ↓ loses indicator for compare mode
function WinArrow({ win, color }: { win: boolean | null; color: string }) {
    if (win === null) return null;
    return (
        <span
            role="img"
            style={{
                fontSize: 13,
                marginLeft: 5,
                color: win ? color : "var(--text-secondary)",
            }}
            aria-label={win ? "better" : "lower"}
        >
            {win ? "▲" : "▾"}
        </span>
    );
}

function SpecCard({
    proc,
    allProcessors,
    onClose,
    closeRef,
    color,
    compareWith,
    onCompare,
}: {
    proc: Processor;
    allProcessors: Processor[];
    onClose: () => void;
    closeRef: React.Ref<HTMLButtonElement>;
    color: string;
    compareWith?: Processor | null;
    onCompare?: () => void;
}) {
    const prefersReduced = useReducedMotion();

    const maxClock = Math.max(...allProcessors.map((p) => p.clockSpeedGHz));
    const maxDie = Math.max(...allProcessors.map((p) => p.dieSizeMm2));
    const maxScore = Math.max(...allProcessors.map(computeScore));

    // winner direction vs the other chip (null when not comparing)
    const winClock = compareWith
        ? proc.clockSpeedGHz >= compareWith.clockSpeedGHz
        : null;
    const winCores = compareWith ? proc.cores >= compareWith.cores : null;
    const winNode = compareWith
        ? proc.processNodeNm <= compareWith.processNodeNm
        : null; // smaller = better

    const specs: Array<{
        label: string;
        value: string;
        raw: number | null;
        max: number | null;
        win: boolean | null;
    }> = [
        {
            label: "Process Node",
            value: `${proc.processNodeNm} nm`,
            raw: null,
            max: null,
            win: winNode,
        },
        {
            label: "Transistors",
            value: proc.transistorCount,
            raw: null,
            max: null,
            win: null,
        },
        {
            label: "Cores",
            value: proc.coreConfig,
            raw: null,
            max: null,
            win: winCores,
        },
        {
            label: "Clock Speed",
            value: `${proc.clockSpeedGHz} GHz`,
            raw: proc.clockSpeedGHz,
            max: maxClock,
            win: winClock,
        },
        {
            label: "Die Size",
            value: `${proc.dieSizeMm2} mm²`,
            raw: proc.dieSizeMm2,
            max: maxDie,
            win: null,
        },
    ];

    return (
        <motion.div
            role="dialog"
            aria-label={`${proc.name} specifications`}
            aria-modal="false"
            initial={
                prefersReduced ? false : { opacity: 0, y: 10, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
                prefersReduced ? undefined : { opacity: 0, y: 6, scale: 0.97 }
            }
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: `linear-gradient(to bottom, ${color}14, var(--bg-surface) 64px)`,
                border: `1px solid ${color}2e`,
                borderRadius: 12,
                padding: 18,
                position: "relative",
                boxShadow: `0 0 0 1px ${color}14, 0 12px 40px rgba(0,0,0,0.55)`,
            }}
        >
            <button
                ref={closeRef}
                onClick={onClose}
                aria-label={`Close ${proc.name} specifications`}
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: "1px solid var(--border-mid)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "color 150ms, background 150ms",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                }}
            >
                <X size={12} aria-hidden="true" />
            </button>

            <p
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color,
                    marginBottom: 4,
                }}
            >
                {proc.eraId.replace(/-/g, " ")}
            </p>

            <h3
                style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "var(--text-primary)",
                    marginBottom: 14,
                    paddingRight: 24,
                    lineHeight: 1.2,
                }}
            >
                {proc.name}
            </h3>

            <dl style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {specs.map(({ label, value, raw, max, win }) => (
                    <div key={label}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                            }}
                        >
                            <dt
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 11,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {label}
                            </dt>
                            <dd
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {value}
                                <WinArrow win={win} color={color} />
                            </dd>
                        </div>
                        {raw !== null && max !== null && (
                            <SpecBar value={raw} max={max} color={color} />
                        )}
                    </div>
                ))}

                {/* Relative to latest processor, linear scale */}
                <div
                    style={{
                        marginTop: 4,
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-subtle)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                        }}
                    >
                        <dt
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Relative to Latest (2025)
                        </dt>
                        <dd
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12,
                                color,
                            }}
                        >
                            {(
                                (computeScore(proc) /
                                    Math.max(
                                        ...allProcessors.map(computeScore),
                                    )) *
                                100
                            ).toFixed(1)}
                            %
                        </dd>
                    </div>
                    <SpecBar
                        value={computeScore(proc)}
                        max={maxScore}
                        color={color}
                    />
                </div>
            </dl>

            <p
                style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid var(--border-subtle)",
                }}
            >
                {proc.notableFeature}
            </p>

            {proc.reference && (
                <p
                    style={{
                        fontSize: 12,
                        marginTop: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.03em",
                    }}
                >
                    <span
                        style={{ color: "var(--text-secondary)", opacity: 0.7 }}
                    >
                        Source:{" "}
                    </span>
                    <a
                        href={proc.reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color,
                            textDecoration: "underline",
                            textUnderlineOffset: 2,
                        }}
                    >
                        {proc.reference.source}
                    </a>
                </p>
            )}

            {onCompare && (
                <button
                    onClick={onCompare}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        width: "100%",
                        marginTop: 16,
                        padding: "9px 12px",
                        borderRadius: 7,
                        border: `1px solid ${color}55`,
                        background: `${color}12`,
                        color,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "background 150ms, border-color 150ms",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                            `${color}22`;
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                            `${color}12`;
                    }}
                >
                    <GitCompare size={13} aria-hidden="true" />
                    Compare with another chip
                </button>
            )}
        </motion.div>
    );
}

export default function TimelineExplorer({ processors, eras }: Props) {
    const [selectedEra, setSelectedEra] = useState<string | null>(null);
    // One click = look at one chip's data. Comparison is a separate, opt-in mode.
    const [openId, setOpenId] = useState<string | null>(null);
    // compare === null: not comparing. b === null: chip A pinned, waiting for a partner.
    const [compare, setCompare] = useState<{
        a: string;
        b: string | null;
    } | null>(null);

    const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const closeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const pickMode = compare !== null && compare.b === null;

    const filteredProcessors = selectedEra
        ? processors.filter((p) => p.eraId === selectedEra)
        : processors;
    const byEra = eras
        .map((era) => ({
            era,
            procs: filteredProcessors.filter((p) => p.eraId === era.id),
        }))
        .filter((g) => g.procs.length > 0);

    // Tile click: in pick-mode it fills the second compare slot; otherwise it
    // just toggles that chip's single data card. The two intents never overlap.
    const handleTile = useCallback(
        (id: string) => {
            if (compare && compare.b === null) {
                if (id === compare.a) {
                    setCompare(null); // clicking the pinned chip again cancels
                    setTimeout(() => nodeRefs.current[id]?.focus(), 50);
                    return;
                }
                setCompare({ a: compare.a, b: id });
                setOpenId(null);
                setTimeout(() => closeRefs.current[id]?.focus(), 400);
                return;
            }
            setCompare(null);
            setOpenId((prev) => {
                const next = prev === id ? null : id;
                if (next === null)
                    setTimeout(() => nodeRefs.current[id]?.focus(), 50);
                return next;
            });
        },
        [compare],
    );

    const startCompare = useCallback((id: string) => {
        setOpenId(null);
        setCompare({ a: id, b: null });
    }, []);

    const clearCompare = useCallback(() => setCompare(null), []);

    const isActive = (id: string) =>
        openId === id || compare?.a === id || compare?.b === id;

    // Global compute max drives each tile's little performance bar, so the
    // evolution reads at a glance: tiny bars in the 1990s, full bars today.
    const maxScore = Math.max(...processors.map(computeScore), 1);

    const filterBtnBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 12px",
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: "pointer",
        border: "1px solid",
        transition: "all 150ms",
    };

    return (
        <div role="region" aria-label="Timeline Explorer">
            {/* Era filters */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 32,
                }}
                role="group"
                aria-label="Filter by era"
            >
                <button
                    onClick={() => setSelectedEra(null)}
                    aria-pressed={selectedEra === null}
                    style={{
                        ...filterBtnBase,
                        background:
                            selectedEra === null
                                ? "var(--ui-primary)"
                                : "transparent",
                        borderColor:
                            selectedEra === null
                                ? "var(--ui-primary)"
                                : "var(--border-mid)",
                        color:
                            selectedEra === null
                                ? "#05050A"
                                : "var(--text-secondary)",
                    }}
                >
                    All
                </button>
                {eras.map((era) => {
                    const active = selectedEra === era.id;
                    const color = ERA_COLORS[era.id] ?? "#22D3EE";
                    return (
                        <button
                            key={era.id}
                            onClick={() =>
                                setSelectedEra((prev) =>
                                    prev === era.id ? null : era.id,
                                )
                            }
                            aria-pressed={active}
                            aria-label={`Filter by ${era.name}`}
                            title={era.name}
                            style={{
                                ...filterBtnBase,
                                background: active ? color : "transparent",
                                borderColor: active
                                    ? color
                                    : "var(--border-mid)",
                                color: active
                                    ? "#05050A"
                                    : "var(--text-secondary)",
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 99,
                                    background: active ? "#05050A" : color,
                                    flex: "none",
                                }}
                                aria-hidden="true"
                            />
                            Era {era.order}
                        </button>
                    );
                })}
            </div>

            {/* Pick-mode banner: only shown once you've opted into comparison */}
            {pickMode &&
                (() => {
                    const a = processors.find((p) => p.id === compare!.a);
                    const ca = a
                        ? (ERA_COLORS[a.eraId] ?? "#22D3EE")
                        : "#22D3EE";
                    return (
                        <div
                            aria-live="polite"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                                padding: "12px 16px",
                                marginBottom: 20,
                                borderRadius: 8,
                                border: `1px solid ${ca}55`,
                                background: `${ca}12`,
                            }}
                        >
                            <GitCompare
                                size={15}
                                style={{ color: ca, flex: "none" }}
                                aria-hidden="true"
                            />
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                    lineHeight: 1.5,
                                }}
                            >
                                Comparing{" "}
                                <strong style={{ color: ca }}>{a?.name}</strong>{" "}
                                — now pick a second chip to compare it against.
                            </span>
                            <button
                                onClick={clearCompare}
                                style={{
                                    marginLeft: "auto",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "5px 12px",
                                    borderRadius: 5,
                                    border: "1px solid var(--border-mid)",
                                    background: "transparent",
                                    color: "var(--text-secondary)",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 12,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                }}
                            >
                                <X size={12} aria-hidden="true" /> Cancel
                            </button>
                        </div>
                    );
                })()}

            {/* Compare view — conditional render (no AnimatePresence) so it
                always unmounts cleanly the instant you clear the comparison. */}
            {compare !== null &&
                compare.b !== null &&
                (() => {
                    const a = processors.find((p) => p.id === compare.a)!;
                    const b = processors.find((p) => p.id === compare.b)!;
                    const ca = ERA_COLORS[a.eraId] ?? "#22D3EE";
                    const cb = ERA_COLORS[b.eraId] ?? "#22D3EE";
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            style={{ marginBottom: 32 }}
                            aria-live="polite"
                            aria-label="Comparison view"
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    marginBottom: 12,
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        fontSize: 12,
                                        letterSpacing: "0.15em",
                                        textTransform: "uppercase",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    <GitCompare size={11} aria-hidden="true" />{" "}
                                    Comparing
                                </span>
                                <button
                                    onClick={clearCompare}
                                    style={{
                                        marginLeft: "auto",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "4px 10px",
                                        borderRadius: 5,
                                        border: "1px solid var(--border-mid)",
                                        background: "transparent",
                                        color: "var(--text-secondary)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        fontSize: 11,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        cursor: "pointer",
                                    }}
                                >
                                    <X size={11} aria-hidden="true" /> Clear
                                </button>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto 1fr",
                                    gap: 0,
                                    alignItems: "stretch",
                                }}
                                className="cmp-grid"
                            >
                                <SpecCard
                                    proc={a}
                                    allProcessors={processors}
                                    onClose={clearCompare}
                                    closeRef={(el) => {
                                        closeRefs.current[a.id] = el;
                                    }}
                                    color={ca}
                                    compareWith={b}
                                />
                                {/* VS divider */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "0 14px",
                                    }}
                                    aria-hidden="true"
                                >
                                    <div
                                        style={{
                                            width: 1,
                                            flex: 1,
                                            background: `linear-gradient(to bottom, ${ca}, transparent)`,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontFamily:
                                                "'Space Grotesk', sans-serif",
                                            fontWeight: 700,
                                            fontSize: 15,
                                            letterSpacing: "0.1em",
                                            background: `linear-gradient(135deg, ${ca}, ${cb})`,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            padding: "8px 0",
                                        }}
                                    >
                                        VS
                                    </span>
                                    <div
                                        style={{
                                            width: 1,
                                            flex: 1,
                                            background: `linear-gradient(to top, ${cb}, transparent)`,
                                        }}
                                    />
                                </div>
                                <SpecCard
                                    proc={b}
                                    allProcessors={processors}
                                    onClose={clearCompare}
                                    closeRef={(el) => {
                                        closeRefs.current[b.id] = el;
                                    }}
                                    color={cb}
                                    compareWith={a}
                                />
                            </div>
                        </motion.div>
                    );
                })()}

            {/* Timeline rows */}
            <div style={{ display: "flex", flexDirection: "column" }}>
                {byEra.map(({ era, procs }, eraIdx) => {
                    const color = ERA_COLORS[era.id] ?? "#22D3EE";
                    const isLastEra = eraIdx === byEra.length - 1;
                    const nextColor =
                        ERA_COLORS[byEra[eraIdx + 1]?.era.id] ?? color;
                    return (
                        <div key={era.id} style={{ display: "flex", gap: 16 }}>
                            {/* Left rail: a numbered station node + connector */}
                            <div
                                aria-hidden="true"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    flexShrink: 0,
                                    width: 34,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        border: `2px solid ${color}`,
                                        background: `${color}1f`,
                                        color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily:
                                            "'Space Grotesk', sans-serif",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        boxShadow: `0 0 16px ${color}40`,
                                        flexShrink: 0,
                                    }}
                                >
                                    {era.order}
                                </div>
                                {!isLastEra && (
                                    <div
                                        style={{
                                            flex: 1,
                                            width: 2,
                                            minHeight: 24,
                                            marginTop: 4,
                                            background: `linear-gradient(to bottom, ${color}66, ${nextColor}33)`,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Right content: era header + chip tiles */}
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    paddingBottom: isLastEra ? 0 : 40,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        marginBottom: 2,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontFamily:
                                                "'Space Grotesk', sans-serif",
                                            fontWeight: 700,
                                            fontSize: 18,
                                            color,
                                            letterSpacing: "-0.01em",
                                            margin: 0,
                                        }}
                                    >
                                        {era.name}
                                    </h3>
                                    <span
                                        style={{
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            fontSize: 11,
                                            color: "var(--text-secondary)",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {procs.length} chip
                                        {procs.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        fontSize: 12,
                                        letterSpacing: "0.08em",
                                        color: "var(--text-secondary)",
                                        margin: "0 0 16px",
                                    }}
                                >
                                    {era.period}
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {procs.map((proc) => {
                                        const active = isActive(proc.id);
                                        const pinned =
                                            pickMode && compare?.a === proc.id;
                                        const label = pinned
                                            ? `${proc.name} is pinned for comparison. Click to cancel.`
                                            : pickMode
                                              ? `Compare ${proc.name} against the pinned chip.`
                                              : `${proc.name}: ${proc.cores} core${proc.cores > 1 ? "s" : ""}, ${proc.clockSpeedGHz} GHz. ${active ? "Close" : "View"} specs.`;
                                        const scorePct = Math.max(
                                            5,
                                            Math.round(
                                                (computeScore(proc) /
                                                    maxScore) *
                                                    100,
                                            ),
                                        );
                                        return (
                                            <div
                                                key={proc.id}
                                                id={proc.id}
                                                className="tl-tile-wrap"
                                                style={{ flexShrink: 0 }}
                                            >
                                                <button
                                                    ref={(el) => {
                                                        nodeRefs.current[
                                                            proc.id
                                                        ] = el;
                                                    }}
                                                    onClick={() =>
                                                        handleTile(proc.id)
                                                    }
                                                    aria-expanded={
                                                        openId === proc.id
                                                    }
                                                    aria-label={label}
                                                    className="tl-tile"
                                                    style={{
                                                        ["--c" as string]:
                                                            color,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "stretch",
                                                        gap: 8,
                                                        padding:
                                                            "11px 12px 12px",
                                                        borderRadius: 11,
                                                        width: 140,
                                                        textAlign: "left",
                                                        border: `1px solid ${active ? color + "66" : "var(--border-subtle)"}`,
                                                        borderTop: `2.5px solid ${active ? color : color + "66"}`,
                                                        background: active
                                                            ? `${color}12`
                                                            : "var(--bg-surface)",
                                                        cursor: "pointer",
                                                        transition:
                                                            "border-color 200ms, background 200ms, box-shadow 200ms, transform 200ms",
                                                        boxShadow: active
                                                            ? `0 0 0 1px ${color}25, 0 8px 26px ${color}22, 0 6px 18px rgba(0,0,0,0.45)`
                                                            : "none",
                                                        transform: active
                                                            ? "translateY(-2px)"
                                                            : undefined,
                                                    }}
                                                >
                                                    {/* Top: process-node badge + chip glyph */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontFamily:
                                                                    "'JetBrains Mono', monospace",
                                                                fontSize: 10,
                                                                letterSpacing:
                                                                    "0.04em",
                                                                padding:
                                                                    "2px 7px",
                                                                borderRadius: 999,
                                                                border: `1px solid ${color}44`,
                                                                background: `${color}14`,
                                                                color,
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {proc.processNodeNm}{" "}
                                                            nm
                                                        </span>
                                                        <div
                                                            style={{
                                                                position:
                                                                    "relative",
                                                                width: 22,
                                                                height: 22,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {active && (
                                                                <motion.div
                                                                    animate={{
                                                                        scale: [
                                                                            1,
                                                                            1.6,
                                                                        ],
                                                                        opacity:
                                                                            [
                                                                                0.4,
                                                                                0,
                                                                            ],
                                                                    }}
                                                                    transition={{
                                                                        duration: 1.2,
                                                                        repeat: Infinity,
                                                                        ease: "easeOut",
                                                                    }}
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        inset: 0,
                                                                        borderRadius:
                                                                            "50%",
                                                                        border: `1px solid ${color}`,
                                                                    }}
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div
                                                                style={{
                                                                    position:
                                                                        "absolute",
                                                                    inset: 0,
                                                                    borderRadius: 6,
                                                                    border: `1.5px solid ${active ? color : "rgba(255,255,255,0.16)"}`,
                                                                    background:
                                                                        active
                                                                            ? `${color}1f`
                                                                            : "transparent",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    transition:
                                                                        "border-color 200ms, background 200ms",
                                                                }}
                                                                aria-hidden="true"
                                                            >
                                                                <Cpu
                                                                    size={11}
                                                                    style={{
                                                                        color: active
                                                                            ? color
                                                                            : "rgba(255,255,255,0.3)",
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Chip name */}
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                "'Space Grotesk', sans-serif",
                                                            fontWeight: 600,
                                                            fontSize: 13,
                                                            lineHeight: 1.25,
                                                            color: "var(--text-primary)",
                                                            minHeight: 33,
                                                        }}
                                                    >
                                                        {proc.name}
                                                    </span>

                                                    {/* Cores + clock */}
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                "'JetBrains Mono', monospace",
                                                            fontSize: 10.5,
                                                            color: "var(--text-secondary)",
                                                            lineHeight: 1.3,
                                                        }}
                                                    >
                                                        {proc.cores} core
                                                        {proc.cores > 1
                                                            ? "s"
                                                            : ""}{" "}
                                                        · {proc.clockSpeedGHz}{" "}
                                                        GHz
                                                    </span>

                                                    {/* Relative-performance bar across the whole timeline */}
                                                    <div
                                                        style={{ marginTop: 1 }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                marginBottom: 3,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace",
                                                                    fontSize: 9,
                                                                    letterSpacing:
                                                                        "0.04em",
                                                                    color: "var(--text-secondary)",
                                                                    opacity: 0.75,
                                                                }}
                                                            >
                                                                {
                                                                    proc.transistorCount
                                                                }
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace",
                                                                    fontSize: 9,
                                                                    color,
                                                                    opacity: 0.9,
                                                                }}
                                                            >
                                                                {scorePct}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: 3,
                                                                borderRadius: 99,
                                                                background:
                                                                    "rgba(255,255,255,0.06)",
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                            title="Relative compute vs. the newest chip"
                                                        >
                                                            <div
                                                                style={{
                                                                    height: "100%",
                                                                    width: `${scorePct}%`,
                                                                    borderRadius: 99,
                                                                    background:
                                                                        color,
                                                                    opacity: 0.85,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {openId === proc.id &&
                                                        !compare && (
                                                            <div
                                                                style={{
                                                                    marginTop: 8,
                                                                    width: 264,
                                                                    maxWidth:
                                                                        "90vw",
                                                                }}
                                                            >
                                                                <SpecCard
                                                                    proc={proc}
                                                                    allProcessors={
                                                                        processors
                                                                    }
                                                                    onClose={() =>
                                                                        setOpenId(
                                                                            null,
                                                                        )
                                                                    }
                                                                    closeRef={(
                                                                        el,
                                                                    ) => {
                                                                        closeRefs.current[
                                                                            proc.id
                                                                        ] = el;
                                                                    }}
                                                                    color={
                                                                        color
                                                                    }
                                                                    onCompare={() =>
                                                                        startCompare(
                                                                            proc.id,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProcessors.length === 0 && (
                <p
                    style={{
                        textAlign: "center",
                        padding: "64px 0",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 14,
                        color: "var(--text-secondary)",
                    }}
                >
                    No processors match this filter.
                </p>
            )}

            <style>{`
        .tl-tile:hover {
          border-color: color-mix(in srgb, var(--c) 50%, transparent) !important;
          transform: translateY(-3px);
          box-shadow: 0 -1px 0 var(--c), 0 12px 26px rgba(0,0,0,0.5);
        }
        @media (max-width: 480px) {
          /* Two cards per row, filling the column instead of one 140px tile
             floating in empty space. */
          .tl-tile-wrap { flex: 1 1 calc(50% - 5px) !important; min-width: 0 !important; }
          .tl-tile-wrap .tl-tile { width: 100% !important; }
        }
        @media (max-width: 640px) {
          .cmp-grid { grid-template-columns: 1fr !important; }
          .cmp-grid > div[aria-hidden="true"] { flex-direction: row !important; padding: 10px 0 !important; }
          .cmp-grid > div[aria-hidden="true"] > div { width: auto !important; height: 1px !important; flex: 1 !important; }
        }
      `}</style>
        </div>
    );
}
