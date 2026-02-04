"use client";

import { useMemo, useState } from "react";

type Card = {
  id?: string;
  name: string;
  meaning?: string;
  image?: string;
  reversed?: boolean;
};

type UiCard = Card & { imgOk: boolean };

type ApiResp =
  | { ok: true; cards: Card[] }
  | { ok: false; error: string; details?: string };

export default function Angeles12Page() {
  const backs = useMemo(() => Array.from({ length: 12 }), []);
  const [cards, setCards] = useState<UiCard[] | null>(null);
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
        setError("No se pudo generar la tirada.");
        return;
      }

      const normalized: UiCard[] = data.cards.map((c: any) => {
        const rawImg = c.image || c.img || c.image_url || c.imageUrl || "";
        const cleanImg = typeof rawImg === "string" ? rawImg.trim() : "";

        return {
          ...c,
          image: cleanImg,
          reversed: c.reversed === true,
          imgOk: true,
        };
      });

      setCards(normalized);
    } catch {
      setCards(null);
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>Mensaje de los Ángeles</h1>
      <p style={{ color: "#555", marginTop: 6 }}>
        Tirada de 12 cartas · Solo 1 carta invertida
      </p>

      <button onClick={generar} disabled={loading} style={btnStyle}>
        {loading ? "Generando..." : "Generar tirada"}
      </button>

      {error && (
        <div style={errorStyle}>
          <b>Error:</b> {error}
        </div>
      )}

      {/* 🂠 Boca abajo antes de generar */}
      {!cards && (
        <div style={gridStyle}>
          {backs.map((_, i) => (
            <div key={i} style={cardWrap}>
              <img src="/card-back.jpg" alt="Carta boca abajo" style={cardImg} />
            </div>
          ))}
        </div>
      )}

      {/* 🃏 Reveladas */}
      {cards && (
        <>
          <div style={gridStyle}>
            {cards.map((c, i) => (
              <div key={i} style={cardWrap}>
                {c.image && c.imgOk ? (
                  <img
                    src={encodeURI(c.image)}
                    alt={c.name}
                    onError={() => {
                      // Si falla la imagen, NO ponemos el dorso (para no confundir).
                      // Mostramos una tarjeta informativa.
                      setCards((prev) =>
                        prev ? prev.map((p, idx) => (idx === i ? { ...p, imgOk: false } : p)) : prev
                      );
                    }}
                    style={{
                      ...cardImg,
                      transform: c.reversed ? "rotate(180deg)" : "none",
                    }}
                  />
                ) : (
                  <div style={missingBox}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>Imagen no disponible</div>
                    {c.reversed ? (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800 }}>
                        (invertida)
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: 24, fontSize: 22, fontWeight: 900 }}>
            Interpretación (texto completo)
          </h2>

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {cards.map((c, i) => (
              <div key={i} style={textCard}>
                <div style={{ fontWeight: 900 }}>
                  {i + 1}. {c.name} {c.reversed ? "(invertida)" : ""}
                </div>

                {/* 👇 aquí forzamos que NO se corte el texto */}
                <div
                  style={{
                    marginTop: 8,
                    color: "#222",
                    whiteSpace: "pre-wrap",
                    overflow: "visible",
                    lineHeight: 1.5,
                  }}
                >
                  {c.meaning || "—"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

/* estilos */
const btnStyle: React.CSSProperties = {
  margin: "14px 0",
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const gridStyle: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 12,
};

const cardWrap: React.CSSProperties = {
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid #eee",
  background: "#fff",
  minHeight: 220,
};

const cardImg: React.CSSProperties = {
  width: "100%",
  height: "auto",
  display: "block",
};

const missingBox: React.CSSProperties = {
  height: "100%",
  minHeight: 220,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 12,
  textAlign: "center",
};

const textCard: React.CSSProperties = {
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
