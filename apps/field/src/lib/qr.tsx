/** Deterministic QR-style block rendered from a token, client-side, with no
 * external library — ported from the old prototype's mobile/app.js qrSvg()
 * exactly (same hash → seeded-PRNG → finder-pattern algorithm), so a receipt
 * can render immediately after an offline-queued payment with nothing to
 * fetch. It is NOT a real scannable QR code, same as the original — the
 * payer-facing verification is the printed receipt_ref / GET /verify/{token}
 * link, not this render. */
export function QrBlock({ token }: { token: string | null | undefined }) {
  if (!token) return null;

  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  const N = 21;
  const cells: [number, number][] = [];
  let seed = h;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const finder = (x < 7 && y < 7) || (x > N - 8 && y < 7) || (x < 7 && y > N - 8);
      const ring =
        finder &&
        !(x % (N - 7) > 0 && x % (N - 7) < 6 && y > 0 && y < 6 && !(x % (N - 7) > 1 && x % (N - 7) < 5 && y > 1 && y < 5));
      if (finder) {
        if (ring) cells.push([x, y]);
      } else if (rnd() > 0.52) {
        cells.push([x, y]);
      }
    }
  }

  return (
    <svg className="qr" viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges">
      <rect width={N} height={N} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#06281D" />
      ))}
    </svg>
  );
}
