"use client";

import React, { useMemo, useState } from "react";

type SpreadResultItem = {
  position: string;
  positionIndex: number;
  card: {
    id: string;
    name?: string;
    meaning?: string;
    image?: string;
  };
};

type SpreadResponse = {
  ok: boolean;
  product_id?: string;
  spread?: string;
  deck?: { slug?: string; name?: string };
  seed?: string | null;
  timestamp?: string;
  result?: SpreadResultItem[];
  error?: string;
  status?: number;
};

const TOTAL_CARDS = 12;
const PICK_COUNT = 4;

export default function Angeles12Page() {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<SpreadResponse | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const remaining = PICK_COUNT - selected.length;

  function toggleCard(i: number) {
    // si ya hay lectura cargada, no permitimos cambiar selección (evita confusión)
    if (data?.ok) return;

    setErrorMsg("");
    setSelected((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= PICK_COUNT) return prev;
      return [...prev, i];
    });
  }

  async function fetchSpread() {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/spread", { cache: "no-store" });
      if (!res.ok) {
        setErrorMsg("No se pudo cargar la tirada.");
        setData(null);
        return;
      }
      const json = (await res.json()) as SpreadResponse;
      if (!json?.ok || !json.result || json.result.length === 0) {
        setErrorMsg("No se pudo cargar la tirada.");
        setData(json ?? null);
        return;
      }
      setData(json);
    } catch {
      setErrorMsg("No se pudo cargar la tirada.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // cuando el usuario ha elegido 4 cartas, cargamos la tirada
  React.useEffect(() => {
    if (selected.length === PICK_COUNT && !data?.ok && !loading) {
      void fetchSpread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.length]);

  const title = "Mensaje de los Ángeles";
  const subtitle = "Respira hondo y conecta con tu pregunta...";

  const prettyReadingText = useMemo(() => {
    if (!data?.ok || !data.result) return "";

    const lines: string[] = [];
    lines.push(title);
    lines.push("");
    for (const item of data.result.sort((a, b) => a.positionIndex - b.positionIndex)) {
      const cardTitle = item.card?.name?.trim() || item.card?.id || "Carta";
      const meaning = (item.card?.meaning || "").trim();

      lines.push(`${item.positionIndex}. ${item.position} — ${cardTitle}`);
      if (meaning) {
        // recortamos un poco para que el mail no sea infinito
        const short = meaning.length > 2500 ? meaning.slice(0, 2500) + "…" : meaning;
        lines.push(short);
      }
      lines.push("");
    }
    lines.push(`Lectura generada en: ${data.timestamp ?? "—"}`);
    lines.push(`Enlace: ${typeof window !== "undefined" ? window.location.href : ""}`);

    return lines.join("\n");
  }, [data]);

  function validateEmail(value: string) {
    const v = value.trim();
    if (!v) return "Escribe el email del cliente.";
    // validación simple
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) return "El email no parece válido.";
    return "";
  }

  function onSendEmail() {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    if (!data?.ok || !data.result) {
      setEmailError("Primero genera la lectura (elige 4 cartas).");
      return;
    }

    const subject = encodeURIComponent("Tu lectura: Mensaje de los Ángeles");
    const body = encodeURIComponent(prettyReadingText);

    // Abre el cliente de correo (mailto)
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${body}`;
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 42, margin: 0 }}>{title}</h1>
      <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>{subtitle}</p>

      {!data?.ok && (
        <>
          <p style={{ marginTop: 18, marginBottom: 10, fontSize: 16 }}>
            Tirada automática de {PICK_COUNT} cartas.
            <br />
            <strong>Elige {remaining} carta(s) más</strong>
          </p>

          {errorMsg && (
            <div style={{ color: "#b00020", marginBottom: 14, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(140px, 1fr))",
              gap: 18,
              alignItems: "start",
            }}
          >
            {Array.from({ length: TOTAL_CARDS }).map((_, i) => {
              const isSelected = selected.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleCard(i)}
                  disabled={loading}
                  style={{
                    border: isSelected ? "4px solid #e9d6a8" : "0px solid transparent",
                    borderRadius: 14,
                    padding: 0,
                    background: "transparent",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    outline: "none",
                  }}
                  aria-label={`Carta ${i + 1}`}
                  title={isSelected ? "Seleccionada" : "Seleccionar"}
                >
                  <img
                    src="/card-back.jpg"
                    alt="Dorso de carta"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      opacity: isSelected ? 0.65 : 1,
                      transform: "translateZ(0)",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {loading && (
            <p style={{ marginTop: 16, opacity: 0.8 }}>Generando lectura…</p>
          )}
        </>
      )}

      {data?.ok && data.result && (
        <>
          <h2 style={{ marginTop: 28, fontSize: 26 }}>Tu lectura</h2>

          {errorMsg && (
            <div style={{ color: "#b00020", marginBottom: 14, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: 18,
              marginTop: 14,
            }}
          >
            {data.result
              .slice()
              .sort((a, b) => a.positionIndex - b.positionIndex)
              .map((item) => {
                const cardTitle = item.card?.name?.trim() || item.card?.id || "Carta";
                const meaning = (item.card?.meaning || "").trim();
                const img = item.card?.image;

                return (
                  <div
                    key={item.positionIndex}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                      padding: 16,
                      boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                      background: "white",
                    }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
                      {item.position} (#{item.positionIndex})
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                      {cardTitle}
                    </div>

                    {img ? (
                      <img
                        src={img}
                        alt={cardTitle}
                        style={{
                          width: "100%",
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.08)",
                          marginBottom: 12,
                        }}
                      />
                    ) : null}

                    {meaning ? (
                      <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                        {meaning}
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, opacity: 0.7 }}>
                        (Sin texto de significado)
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* EMAIL */}
          <div
            style={{
              marginTop: 22,
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.08)",
              padding: 16,
              background: "white",
              boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Enviar esta lectura por email</div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="correo@cliente.com"
                style={{
                  flex: "1 1 320px",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.18)",
                  fontSize: 14,
                }}
              />

              <button
                onClick={onSendEmail}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.25)",
                  background: "#f3f3f3",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Enviar
              </button>
            </div>

            {emailError ? (
              <div style={{ marginTop: 10, color: "#b00020", fontWeight: 600 }}>
                {emailError}
              </div>
            ) : null}

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Nota: ahora mismo se abre el cliente de correo (mailto). Si quieres, el siguiente paso
              es enviarlo automáticamente desde servidor (sin depender del mailto).
            </div>
          </div>
        </>
      )}
    </main>
  );
}
