export default async function Angeles12Page() {
  const res = await fetch(
    "https://tarot-api-vercel.vercel.app/api/products/angeles_12/spread",
    { cache: "no-store" }
  );

  const data = await res.json();

  const spread = data.result ?? [];

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Mensaje de los Ángeles</h1>
      <p>Tirada automática de 4 cartas</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
          gap: 20,
          marginTop: 24,
        }}
      >
        {spread.map((item: any) => {
          const card = item.card ?? {};
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
                {card.id}
              </div>

              {card.image && (
                <img
                  src={card.image}
                  alt={card.id}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                />
              )}

              <div style={{ marginTop: 10, fontSize: 14, whiteSpace: "pre-wrap" }}>
                {card.meaning}
              </div>
            </div>
          );
        })}
      </div>

      <details style={{ marginTop: 28 }}>
        <summary style={{ cursor: "pointer" }}>Ver JSON (debug)</summary>
        <pre
          style={{
            marginTop: 12,
            padding: 16,
            background: "#fafafa",
            borderRadius: 12,
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </main>
  );
}
