"use client";

import { useMemo, useState } from "react";

type Card = {
  id?: string;
  name: string;
  meaning?: string;
  image?: string;
  reversed?: boolean;
};

type ApiResp =
  | {
      ok: true;
      cards: Card[];
      reading?: { text?: string; week?: string; cached?: boolean } | null;
      meta?: any;
      reversedIndex?: number;
    }
  | { ok: false; error: string; details?: string };

type UiCard = Card & { imgOk: boolean };

function safeEncodeUrl(url: string) {
  return (url || "").trim().replace(/\s/g, "%20");
}

function pickRevealIndexes(cards: UiCard[], revealCount: number) {
  const n = cards.length;
  const idxReversed = cards.findIndex((c) => c.reversed === true);

  const set = new Set<number>();
  // Siempre intentamos incluir la invertida entre las 4 reveladas
  if (idxReversed >= 0) set.add(idxReversed);

  // Añadimos aleatorias hasta llegar a revealCount
  while (set.size < Math.min(revealCount, n)) {
    const r = Math.floor(Math.random() * n);
    set.add(r);
  }

  return Array.from(set);
}

function buildEmailBody(params: {
  cards: UiCard[];
  revealIdx: number[];
  longText: string;
}) {
  const { cards, revealIdx, longText } = params;

  const revealedCards = revealIdx
    .map((i, k) => {
      const c = cards[i];
      const inv = c.reversed ? " (invertida)" : "";
      return `${k + 1}. ${c.name}${inv}\n${c.meaning || ""}`.trim();
    })
    .join("\n\n");

  return `
TIRADA DE ÁNGELES (12 cartas)
Se revelan 4 cartas:

${revealedCards}

----------------------------------------

INTERPRETACIÓN LARGA:

${longText}
`.trim();
}

export default function Angeles12Page() {
  const backs = useMemo(() => Array.from({ length: 12 }), []);
  const [cards, setCards] = useState<UiCard[] | null>(null);
  const [revealIdx, setRevealIdx] = useState<number[]>([]);
  const [longText, setLongText] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/angeles_12/spread", { cache: "no-store" });
      const data: ApiResp = await res.json();

      if (!res.ok || !data.ok) {
        setCards(null);
        setRevealIdx([]);
        setLongText("");
        setError("No se pudo generar la tirada.");
        return;
      }

      const normalized: UiCard[] = (data.cards || []).map((c: any) => {
        const rawImg = c.image || c.img || c.image_url || c.imageUrl || "";
        const cleanImg = typeof rawImg === "string" ? rawImg.trim() : "";

        return {
          ...c,
          image: cleanImg,
          reversed: c.reversed === true,
          imgOk: true,
        };
      });

      // ✅ Verificar baraja entera
      if (normalized.length !== 12) {
        setCards(normalized);
        setRevealIdx([]);
        setLongText("");
        setError(`La API devolvió ${normalized.length} cartas. Deben ser 12.`);
        return;
      }

      // ✅ Solo 4 cartas reveladas (siempre incluye la invertida si existe)
      const picked = pickRevealIndexes(normalized, 4);
      setCards(normalized);
      setRevealIdx(picked);

      // ✅ Texto largo: si viene de IA semanal, lo usamos.
      // Si no viene, fallback “largo básico” con las 4 cartas reveladas.
      const aiText = (data as any)?.reading?.text?.trim();
      if (aiText && aiText.length > 50) {
        setLongText(aiText);
      } else {
        const fallback = picked
          .map((i) => {
            const c = normalized[i];
            return `✨ ${c.name}${c.reversed ? " (invertida)" : ""}\n${
              c.meaning || ""
            }`;
          })
          .join("\n\n");
        setLongText(fallback);
      }
    } catch {
      setCards(null);
      setRevealIdx([]);
      setLongText("");
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  function enviarEmail() {
    if (!cards || revealIdx.length === 0) return;

    const to = (clientEmail || "").trim();
    if (!to) {
      setError("Escribe el correo del cliente antes de enviar.");
      return;
    }

    const subject = encodeURIComponent("Tu tirada de Ángeles (semanal)");
    const body = encodeURIComponent(
      buildEmailBody({ cards, revealIdx, longText })
    );

    // mailto (abre el cliente de correo)
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  }

  const isRevealed = (i: number) => revealIdx.includes(i);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>Mensaje de los Ángeles</h1>
      <p style={{ color: "#555", marginTop: 6 }}>
        Baraja completa (12) · Se revelan 4 cartas · Máx 8 tiradas/día
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={generar} disabled={loading} style={btnStyle}>
          {loading ? "Generando..." : "Generar tirada"}
        </button>

        <input
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="Correo del cliente"
          style={inputStyle}
          type="email"
        />

        <button
          onClick={enviarEmail}
          disabled={!cards || revealIdx.length === 0}
          style={btnStyle}
        >
          Enviar por correo
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          <b>Error:</b> {error}
        </div>
      )}

      {/* 🂠 Baraja completa: antes de generar */}
      {!cards && (
        <div style={gridStyle}>
          {backs.map((_, i) => (
            <div key={`back-${i}`} style={cardWrap}>
              <img src="/card-back.jpg" alt="Carta boca abajo" style={cardImg} />
            </div>
          ))}
        </div>
      )}

      {/* 🃏 Baraja completa: después de generar (solo 4 se revelan) */}
      {cards && (
        <>
          <div style={gridStyle}>
            {cards.map((c, i) => {
              const showFront = isRevealed(i);
              const src =
                showFront && c.image && c.imgOk
                  ? safeEncodeUrl(c.image)
                  : "/card-back.jpg";

              return (
                <div
                  key={c.id ?? `${c.name}-${i}`} // ✅ key estable (evita bugs como el de Miguel)
                  style={{
                    ...cardWrap,
                    transform: showFront && c.reversed ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease",
                    opacity: showFront ? 1 : 0.95,
                  }}
                  title={showFront ? c.name : "Carta boca abajo"}
                >
                  <img
                    src={src}
                    alt={c.name}
                    loading="lazy"
                    style={cardImg}
                    onError={(e) => {
                      // Si falla la imagen frontal, la cambiamos al dorso, pero solo para esa carta
                      const el = e.currentTarget;
                      if (el.src.includes("/card-back.jpg")) return;

                      el.src = "/card-back.jpg";
                      setCards((prev) =>
                        prev
                          ? prev.map((p, idx) => (idx === i ? { ...p, imgOk: false } : p))
                          : prev
                      );
                    }}
                  />

                  {/* Etiqueta si está revelada */}
                  {showFront && (
                    <div style={label}>
                      <div style={{ fontWeight: 900 }}>
                        {c.name} {c.reversed ? "· invertida" : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <h2 style={{ marginTop: 24, fontSize: 22, fontWeight: 900 }}>
            Descripción larga
          </h2>

          <div style={textCard}>
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                color: "#222",
              }}
            >
              {longText || "—"}
            </div>
          </div>

          <h3 style={{ marginTop: 18, fontSize: 18, fontWeight: 900 }}>
            Las 4 cartas reveladas
          </h3>

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {revealIdx.map((idx, k) => {
              const c = cards[idx];
              return (
                <div key={`r-${c.id ?? idx}`} style={miniCard}>
                  <div style={{ fontWeight: 900 }}>
                    {k + 1}. {c.name} {c.reversed ? "(invertida)" : ""}
                  </div>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                    {c.meaning || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

/* estilos */
const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  minWidth: 240,
};

const gridStyle: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 12,
};

const cardWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid #eee",
  background: "#fff",
  height: 260,
};

const cardImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const label: React.CSSProperties = {
  position: "absolute",
  left: 8,
  right: 8,
  bottom: 8,
  padding: "8px 10px",
  borderRadius: 12,
  background: "rgba(0,0,0,0.55)",
  color: "white",
};

const textCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 14,
  background: "white",
  marginTop: 10,
};

const miniCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 14,
  background: "white",
};

const errorStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  background: "#fff3f3",
  border: "1px solid #ffd0d0",
};
