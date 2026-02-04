"use client";

import React, { useEffect, useMemo, useState } from "react";

type SpreadResponse = {
  ok: boolean;
  product_id?: string;
  spread?: string;
  deck?: { slug?: string; name?: string };
  seed?: string | null;
  timestamp?: string;
  result?: Array<{
    position: string;
    positionIndex: number;
    card: {
      id: string;
      name: string;
      meaning: string;
      image?: string;
    };
  }>;
  error?: string;
};

const PRODUCT_ID = "angeles_12";
const PICK_LIMIT = 4;

function safeText(s: any) {
  return typeof s === "string" ? s : "";
}

export default function Angeles12Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SpreadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // índices de la "baraja" boca abajo
  const [pickedIndexes, setPickedIndexes] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  // email para "enviar por correo" (por ahora: abre el cliente de correo del usuario)
  const [email, setEmail] = useState("");

  // 12 cartas boca abajo (solo UX)
  const deckBackCards = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // llamamos a tu proxy (evita problemas CORS)
        const res = await fetch("/api/spread", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as SpreadResponse;

        if (!json?.ok || !Array.isArray(json?.result)) {
          throw new Error("Respuesta inválida de la API");
        }

        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setError(e?.message || "No se pudo cargar la tirada.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const remaining = PICK_LIMIT - pickedIndexes.length;

  const canPickMore = pickedIndexes.length < PICK_LIMIT;

  const onPick = (idx: number) => {
    if (!canPickMore) return;
    if (pickedIndexes.includes(idx)) return;

    setPickedIndexes((prev) => [...prev, idx]);
  };

  const onReveal = () => {
    if (pickedIndexes.length !== PICK_LIMIT) return;
    setRevealed(true);
  };

  const onSendEmail = () => {
    if (!data?.result?.length) return;

    const subject = encodeURIComponent("Tu lectura: Mensaje de los Ángeles");
    const body = encodeURIComponent(
      [
        "Gracias por confiar en nosotros ✨",
        "",
        `Producto: ${PRODUCT_ID}`,
        data.timestamp ? `Fecha: ${data.timestamp}` : "",
        "",
        "Tu lectura:",
        "",
        ...data.result.map((r) => {
          const title = `${r.position} (#${r.positionIndex})`;
          const cardName = r.card?.name || r.card?.id || "";
          const meaning = safeText(r.card?.meaning);
          return `${title}\n${cardName}\n\n${meaning}\n`;
        }),
      ]
        .filter(Boolean)
        .join("\n")
    );

    // Enviar usando el cliente de correo del usuario (mailto)
    // Más adelante lo cambiamos por envío real desde backend (sin depender del mailto)
    const to = encodeURIComponent(email.trim());
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Mensaje de los Ángeles</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Respira hondo y conecta con tu pregunta…
      </p>

      {loading && <p>Cargando tirada…</p>}

      {error && (
        <p style={{ color: "crimson", fontWeight: 600 }}>
          No se pudo cargar la tirada: {error}
        </p>
      )}

      {/* BARJA BOCA ABAJO */}
      <section style={{ marginTop: 18 }}>
        {!revealed ? (
          <>
            <p style={{ marginBottom: 10 }}>
              {remaining > 0
                ? `Elige ${remaining} carta(s) más`
                : "Listo. Pulsa “Ver lectura” para revelar."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              {deckBackCards.map((idx) => {
                const isPicked = pickedIndexes.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => onPick(idx)}
                    disabled={!canPickMore && !isPicked}
                    style={{
                      border: isPicked ? "3px solid #d7c08a" : "1px solid #e5e5e5",
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#fff",
                      padding: 0,
                      cursor: isPicked ? "default" : "pointer",
                      opacity: !canPickMore && !isPicked ? 0.6 : 1,
                    }}
                    aria-label={`Carta ${idx + 1}`}
                    title={isPicked ? "Seleccionada" : "Seleccionar"}
                  >
                    <img
                      src="/card-back.jpg"
                      alt="Dorso de la carta"
                      style={{
                        width: "100%",
                        height: 260,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={onReveal}
                disabled={pickedIndexes.length !== PICK_LIMIT}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #111",
                  background: pickedIndexes.length === PICK_LIMIT ? "#111" : "#ddd",
                  color: pickedIndexes.length === PICK_LIMIT ? "#fff" : "#555",
                  cursor: pickedIndexes.length === PICK_LIMIT ? "pointer" : "not-allowed",
                  fontWeight: 700,
                }}
              >
                Ver lectura
              </button>

              <span style={{ color: "#666" }}>
                (seleccionadas: {pickedIndexes.length}/{PICK_LIMIT})
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 10, fontSize: 22 }}>Tu lectura</h2>

            {/* RESULTADO */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 18,
                marginTop: 12,
              }}
            >
              {(data?.result || []).map((r) => (
                <article
                  key={`${r.positionIndex}-${r.card?.id}`}
                  style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>
                    {r.position} (#{r.positionIndex})
                  </div>

                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
                    {r.card?.name || r.card?.id}
                  </div>

                  {r.card?.image ? (
                    <img
                      src={r.card.image}
                      alt={r.card?.name || r.card?.id}
                      style={{
                        width: "100%",
                        height: 360,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid #eee",
                        marginBottom: 12,
                      }}
                    />
                  ) : null}

                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#222" }}>
                    {safeText(r.card?.meaning)}
                  </div>
                </article>
              ))}
            </div>

            {/* ENVIAR POR EMAIL */}
            <section
              style={{
                marginTop: 22,
                padding: 14,
                border: "1px solid #e6e6e6",
                borderRadius: 14,
                background: "#fafafa",
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 10 }}>Enviar esta lectura por email</h3>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@cliente.com"
                  type="email"
                  style={{
                    padding: "12px 12px",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    minWidth: 260,
                    flex: "1 1 260px",
                  }}
                />

                <button
                  onClick={onSendEmail}
                  disabled={!email.trim()}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid #111",
                    background: email.trim() ? "#111" : "#ddd",
                    color: email.trim() ? "#fff" : "#555",
                    cursor: email.trim() ? "pointer" : "not-allowed",
                    fontWeight: 700,
                  }}
                >
                  Enviar
                </button>
              </div>

              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: "#666" }}>
                Nota: ahora mismo se abre el cliente de correo (mailto). Si quieres, el
                siguiente paso es enviarlo automáticamente desde servidor (sin depender
                del mailto).
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
