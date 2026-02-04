"use client";

import { useEffect, useMemo, useState } from "react";

type SpreadItem = {
  position: string;
  positionIndex: number;
  card: {
    id: string;
    name?: string;
    meaning?: string;
    image?: string;
  };
};

export default function Angeles12Interactive() {
  const [loading, setLoading] = useState(true);
  const [spread, setSpread] = useState<SpreadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Debug: te muestra qué está pasando
  const [debug, setDebug] = useState<string>("");

  const totalCards = 12;
  const maxPicks = 4;

  const [picked, setPicked] = useState<number[]>([]);
  const [showReading, setShowReading] = useState(false);

  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) setEmail(e);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);
        setDebug("Llamando a /api/spread ...");

        const res = await fetch("/api/spread", { cache: "no-store" });

        setDebug((d) => d + `\nRespuesta HTTP: ${res.status}`);

        const data = await res.json();
        setDebug((d) => d + `\nJSON keys: ${Object.keys(data || {}).join(", ")}`);

        if (!data?.ok || !Array.isArray(data?.result)) {
          setDebug((d) => d + `\nRespuesta inválida: ok=${data?.ok} resultIsArray=${Array.isArray(data?.result)}`);
          throw new Error("bad_response");
        }

        setSpread(data.result);
        setDebug((d) => d + `\nOK ✅ Cartas en result: ${data.result.length}`);
      } catch (e: any) {
        setError("No se pudo cargar la tirada.");
        setDebug((d) => d + `\nERROR: ${e?.message || String(e)}`);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  const headline = useMemo(() => {
    if (showReading) return "Tu mensaje está listo ✨";
    if (picked.length === 0) return "Respira hondo y conecta con tu pregunta…";
    if (picked.length < maxPicks) return `Elige ${maxPicks - picked.length} carta(s) más`;
    return "Perfecto. Cuando quieras, revela tu lectura.";
  }, [picked.length, showReading]);

  const onPick = (idx: number) => {
    if (showReading) return;
    if (picked.includes(idx)) return;
    if (picked.length >= maxPicks) return;
    setPicked((prev) => [...prev, idx]);
  };

  const canReveal = picked.length === maxPicks && !loading && !error;

  const sendByEmail = () => {
    if (!spread?.length) return;

    const subject = encodeURIComponent("🌟 Tu mensaje de los Ángeles");
    const body = encodeURIComponent(
      `✨ Tu lectura de los Ángeles ✨\n\n` +
        spread
          .map(
            (r, i) =>
              `${i + 1}. ${r.position}\n${r.card?.name || r.card?.id || ""}\n\n${r.card?.meaning || ""}`
          )
          .join("\n\n----------------------\n\n")
    );

    const to = encodeURIComponent(email || "");
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Mensaje de los Ángeles</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{headline}</p>

      {error && <p style={{ color: "crimson", fontWeight: 700 }}>{error}</p>}

      {/* DEBUG visible (temporal) */}
      <pre
        style={{
          background: "#f6f6f6",
          border: "1px solid #eee",
          padding: 12,
          borderRadius: 10,
          whiteSpace: "pre-wrap",
          fontSize: 12,
          color: "#333",
          maxWidth: 900,
        }}
      >
        {debug}
      </pre>

      {!showReading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            {Array.from({ length: totalCards }).map((_, idx) => {
              const isPicked = picked.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => onPick(idx)}
                  disabled={isPicked || picked.length >= maxPicks}
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    cursor: isPicked ? "default" : "pointer",
                    opacity: isPicked ? 0.65 : 1,
                    transform: isPicked ? "scale(0.98)" : "none",
                  }}
                  aria-label={`Carta ${idx + 1}`}
                >
                  <img
                    src="/card-back.jpg"
                    alt="Carta boca abajo"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      display: "block",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => setShowReading(true)}
              disabled={!canReveal}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111",
                background: canReveal ? "#111" : "#999",
                color: "white",
                cursor: canReveal ? "pointer" : "not-allowed",
              }}
            >
              Ver mi lectura
            </button>
            {loading && <span style={{ marginLeft: 12 }}>Cargando tu tirada…</span>}
          </div>
        </>
      )}

      {showReading && (
        <section style={{ marginTop: 22 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: 20,
              marginTop: 10,
            }}
          >
            {spread.map((item) => {
              const card = item.card ?? ({} as any);
              return (
                <div
                  key={item.positionIndex}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {item.position} (#{item.positionIndex})
                  </div>

                  <div style={{ fontWeight: 800, marginTop: 6 }}>
                    {card.name || card.id}
                  </div>

                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.name || card.id}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        marginTop: 10,
                      }}
                    />
                  )}

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {card.meaning}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email del cliente (opcional)"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                minWidth: 260,
              }}
            />
            <button
              onClick={sendByEmail}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              📧 Enviar lectura por email
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
