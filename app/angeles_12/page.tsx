"use client";

import { useEffect, useState } from "react";

type CardResult = {
  position: string;
  card: {
    name: string;
    meaning: string;
    image: string;
  };
};

export default function Angeles12Page() {
  const TOTAL_CARDS = 12;
  const MAX_SELECTION = 4;

  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<CardResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleCard = (index: number) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
      return;
    }
    if (selected.length < MAX_SELECTION) {
      setSelected([...selected, index]);
    }
  };

  useEffect(() => {
    if (selected.length === MAX_SELECTION) {
      fetchReading();
    }
  }, [selected]);

  const fetchReading = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/spread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: "angeles_12",
          spread: "angeles_4",
        }),
      });

      if (!res.ok) throw new Error("No se pudo cargar la tirada.");

      const data = await res.json();
      setResult(data.result);
    } catch (e: any) {
      setError("No se pudo cargar la tirada.");
    } finally {
      setLoading(false);
    }
  };

  const sendByEmail = () => {
    if (!result) return;

    const subject = encodeURIComponent("🌟 Tu mensaje de los Ángeles");
    const body = encodeURIComponent(
      "✨ Tu lectura de los Ángeles ✨\n\n" +
        result
          .map(
            (r, i) =>
              `${i + 1}. ${r.position}\n${r.card.meaning}\n`
          )
          .join("\n\n")
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Mensaje de los Ángeles</h1>
      <p>Tirada automática de 4 cartas</p>

      {!result && (
        <>
          <p>Elige {MAX_SELECTION - selected.length} carta(s) más</p>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
              <div
                key={i}
                onClick={() => toggleCard(i)}
                style={{
                  cursor: "pointer",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: selected.includes(i)
                    ? "3px solid #f5c77a"
                    : "2px solid transparent",
                  opacity: selected.includes(i) ? 0.7 : 1,
                }}
              >
                <img
                  src="/card-back.jpg"
                  alt="Carta boca abajo"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            ))}
          </div>

          {loading && <p>Cargando lectura...</p>}
        </>
      )}

      {result && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            {result.map((r, i) => (
              <div key={i}>
                <h3>
                  {r.position} ({i + 1})
                </h3>
                <img
                  src={r.card.image}
                  alt={r.card.name}
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    marginBottom: "10px",
                  }}
                />
                <p>{r.card.meaning}</p>
              </div>
            ))}
          </div>

          {/* BOTÓN EMAIL */}
          <button
            onClick={sendByEmail}
            style={{
              marginTop: "30px",
              padding: "14px 22px",
              borderRadius: "12px",
              border: "none",
              background: "#1e3a5f",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            📧 Enviar lectura por email
          </button>
        </>
      )}
    </div>
  );
}
