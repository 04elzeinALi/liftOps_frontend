// A titled read-only table for the per-user activity pages. `headers` is an
// array of column labels; `rows` is an array of arrays of cell content (each
// inner array matching the headers). Shows an empty state when there are none.
export default function ActivityTable({ title, headers, rows, emptyText }) {
  return (
    <div className="mb-6">
      <h2 className="font-display mb-2 text-lg font-bold" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {rows.length === 0 ? (
          <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>
            {emptyText}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11.5px] font-bold uppercase"
                    style={{ color: "var(--text-muted)", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {cells.map((cell, j) => (
                    <td key={j} className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
