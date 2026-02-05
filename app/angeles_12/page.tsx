"use client";

import React, { useMemo, useState } from "react";

type Card = {
  id?: string;
  name: string;
  meaning?: string;      // corto (JSON/Airtable)
  longMeaning?: string;  // largo semanal (IA)
  image?: string;
  reversed?: boolean;
};

type ApiResp =
  | { ok: true; cards: Card[]; reversedIndex?: number }
  | { ok: false; error: string; details?: string };

export default function Angeles12Page() {
  const backs = useMemo(() => Array.from({ length: 12 }), []);
  const [deck, setDeck] = useState<Card[] | null>(null);

  // índices que el cliente ha decidido voltear
  const [picked, setPicked] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");

  async function generar() {
    setLoading(true);
    setError(null);
    setPicked([]);

    try {
      // ✅ Ideal: proxy en tarot-lecturas (app/api/spread/route.ts)
      // Debe terminar llamando a: https://tarot-api-vercel.vercel.app/api/products/angeles_12/spread
      const res = await fetch("/api/spread?product_id=angeles_12", { cache: "no-store" });
      const data: ApiResp = await res.json();

      if (!res.ok || !data.ok) {
        setDeck(null);
        setError(data && "error" in data ? (data.details || data.error) : "No se pudo generar la tirada.");
        return;
      }

      const normalized = (data.cards || []).map((c) => {
        const rawImg = (c as any).image || (c as any).img || (c as any).image_url || (c as any).imageUrl || "";
        const cleanImg = typeof rawImg === "string" ? rawImg.trim() : "";
        return {
          ...c,
          image: cleanImg,
          reversed: c.reversed === true,
        } as Card;
      });

      setDeck(normalized);
    } catch (e: any) {
      setDeck(null);
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  function togglePick(i: number) {
    if (!deck) return;

    // si ya está elegida, la quitamos
    if (picked.includes(i)) {
      setPicked((prev) => prev.filter((x) => x !== i));
      return;
    }

    // máximo 4
    if (picked.length >= 4) return;

    setPicked((prev) => [...prev, i]);
  }

  const pickedCards = deck ? picked.map((idx) => deck[idx]) : [];

  async function enviarPorCorreo() {
    setError(null);

    if (!deck || picked.length !== 4) {
      setError("Elige 4 cartas para enviar.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }

    setSending(true);
    try {
      // ✅ Este endpoint debe enviar email REAL desde tu servidor
      // (tarot-lecturas -> proxy -> tarot-api)
      const res = await fetch("/api/send-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.trim(),
          product_id: "angeles_12",
          pickedIndices: picked,
          cards: pickedCards,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.details || data?.error || "No se pudo enviar el correo.");
        return;
      }
    } catch {
      setError("Error enviando el correo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>Mensaje de los Ángeles</h1>
      <p style={{ color: "#555", marginTop: 6 }}>
        Baraja completa (12) · El cliente elige 4 cartas · Solo 1 carta invertida
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={generar} disabled={loading} style={btnStyle}>
          {loading ? "Generando..." : "Generar tirada"}
        </button>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo del cliente"
          style={inputStyle}
        />

        <button
          onClick={enviarPorCorreo}
          disabled={sending || !deck || picked.length !== 4}
          style={btnPrimary}
        >
          {sending ? "Enviando..." : "Enviar por correo"}
        </button>

        <div style={{ color: "#555", fontWeight: 700 }}>
          Seleccionadas: {picked.length}/4
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          <b>Error:</b> {error}
        </div>
      )}

      {/* 🂠 Boca abajo antes de generar */}
      {!deck && (
        <div style={gridStyle}>
          {backs.map((_, i) => (
            <div key={i} style={cardWrap}>
              <img src="/card-back.jpg" alt="Carta boca abajo" style={cardImg} />
            </div>
          ))}
        </div>
      )}

      {/* 🃏 Baraja completa: el usuario elige 4 para voltear */}
      {deck && (
        <>
          <div style={gridStyle}>
            {deck.map((c, i) => {
              const isPicked = picked.includes(i);

              return (
                <button
                  key={i}
                  onClick={() => togglePick(i)}
                  style={{
                    ...cardWrap,
                    cursor: "pointer",
                    outline: isPicked ? "3px solid #111" : "none",
                  }}
                  title={isPicked ? "Quitar selección" : "Seleccionar carta"}
                >
                  {!isPicked ? (
                    <img src="/card-back.jpg" alt="Carta boca abajo" style={cardImg} />
                  ) : c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      onError={(ev) => {
                        // si falla imagen, mostramos fallback visual pero NO rompemos todo
                        (ev.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = ev.currentTarget.parentElement;
                        if (parent) {
                          const div = document.createElement("div");
                          div.style.padding = "12px";
                          div.style.textAlign = "center";
                          div.style.fontWeight = "800";
                          div.innerText = `Imagen no disponible\n${c.name}`;
                          parent.appendChild(div);
                        }
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
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Descripción larga SOLO de las 4 elegidas */}
          <h2 style={{ marginTop: 24, fontSize: 22, fontWeight: 900 }}>
            Descripción larga (4 cartas elegidas)
          </h2>

          {picked.length !== 4 ? (
            <div style={{ marginTop: 10, color: "#555" }}>
              Elige 4 cartas haciendo clic en la baraja.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
              {pickedCards.map((c, idx) => (
                <div key={idx} style={textCard}>
                  <div style={{ fontWeight: 900 }}>
                    {idx + 1}. {c.name} {c.reversed ? "(invertida)" : ""}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "#222",
                      whiteSpace: "pre-wrap",
                      overflow: "visible",
                      lineHeight: 1.5,
                    }}
                  >
                    {c.longMeaning || c.meaning || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
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

const btnPrimary: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  minWidth: 260,
  fontWeight: 700,
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
  padding: 0,
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
