export default async function Angeles12Page() {
  const res = await fetch(
    "https://tarot-api-vercel.vercel.app/api/products/angeles_12/spread",
    { cache: "no-store" }
  );

  const data = await res.json();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Mensaje de los Ángeles</h1>
      <p>Tirada automática de 4 cartas</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
          gap: 20,
          marginTop: 24,
        }}
      >
        {data.cards?.map((card: any, index: number) => (
          <div
            key={index}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Posición {card.position}
            </div>

            <h3 style={{ marginTop: 8 }}>{card.name}</h3>

            {card.image && (
              <img
                src={card.image}
                alt={card.name}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  marginTop: 10,
                }}
              />
            )}

            <p style={{ marginTop: 10, fontSize: 14 }}>
              {card.meaning}
            </p>
          </div>
        ))}
      </div>

      <pre
        style={{
          marginTop: 40,
          padding: 16,
          background: "#fafafa",
          borderRadius: 12,
          fontSize: 12,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
