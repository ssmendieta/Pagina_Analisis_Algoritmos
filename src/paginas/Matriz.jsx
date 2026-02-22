import { useMemo } from "react";
import { useLocation } from "react-router-dom";


function useAdjacencyMatrix(nodeList, edgeList) {
    return useMemo(() => {
    const matrix = {};
    nodeList.forEach((r) => {
        matrix[r.id] = {};
        nodeList.forEach((c) => (matrix[r.id][c.id] = null));
    });

    edgeList.forEach(({ from, to, weight, isLoop }) => {
        if (matrix[from] && matrix[from][to] !== undefined) {
        matrix[from][to] = weight !== null ? weight : 1;
        if (isLoop) matrix[from][to] = weight !== null ? weight : "∞";
    }
    });

    return matrix;
}, [nodeList, edgeList]);
}

// ─── Helpers de color ─────────────────────────────────────────────────────
function getCellStyle(value, isLoop, isDiagonal) {
    if (isLoop && value !== null)
    return { bg: "#6366f1", text: "#fff", shadow: "0 0 12px #6366f180" };
    if (value !== null)
    return { bg: "#22d3ee", text: "#0f172a", shadow: "0 0 10px #22d3ee60" };
    if (isDiagonal)
    return { bg: "#1e293b", text: "#475569", shadow: "none" };
    return { bg: "#0f172a", text: "#334155", shadow: "none" };
}

export default function AdjacencyMatrix() {
    const location = useLocation();
    const { nodes, edges } = location.state ?? { nodes: [], edges: [] };
    const matrix = useAdjacencyMatrix(nodes, edges);

  // Estadísticas rápidas
    const edgeCount = edges.filter((e) => !e.isLoop).length;
    const loopCount = edges.filter((e) => e.isLoop).length;
  const density = ((edgeCount / (nodes.length * (nodes.length - 1))) * 100).toFixed(1);

    const rowSums = {};
    nodes.forEach((row) => {
    rowSums[row.id] = nodes.reduce((acc, col) => acc + (matrix[row.id][col.id] ?? 0), 0);
    });

    // Suma por columna
    const colSums = {};
    nodes.forEach((col) => {
    colSums[col.id] = nodes.reduce((acc, row) => acc + (matrix[row.id][col.id] ?? 0), 0);
    });

    return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
      
        <h1 style={styles.title}>Matriz de Adyacencia</h1>
        <div style={styles.stats}>
          <Stat label="Nodos" value={nodes.length} color="#22d3ee" />
          <Stat label="Aristas" value={edgeCount} color="#a78bfa" />          
        </div>
      </div>
      {/* Matriz */}
      <div style={styles.matrixWrapper}>
        <div style={styles.matrixScroll}>
          <table style={styles.table}>
            <thead>
            <tr>
                <th style={styles.cornerCell}>↓ from / to →</th>
                {nodes.map((col) => (
                <th key={col.id} style={styles.headerCell}>{col.id}</th>
                ))}
                <th>Sum Filas</th>
            </tr>
            </thead>
            <tbody>
            {nodes.map((row) => (
                <tr key={row.id}>
                <td style={styles.rowHeaderCell}>{row.id}</td>
                {nodes.map((col) => {
                    const val = matrix[row.id][col.id];
                    const isDiag = row.id === col.id;
                    const isLoop = isDiag && val !== null;
                    const { bg, text, shadow } = getCellStyle(val, isLoop, isDiag);
                    return (
                    <td
                        key={col.id}
                        title={`${row.id} → ${col.id}: ${val ?? "sin conexión"}`}
                        style={{ ...styles.cell, background: bg, color: text, boxShadow: shadow }}
                    >
                        {val !== null ? val : <span style={styles.null}>∅</span>}
                    </td>
                    );
                })}
                <td style={{ ...styles.cell, background: "#1e293b", color: "#f472b6", fontWeight: 700 }}>
                {rowSums[row.id]}
                </td>
                </tr>
            ))}
            <tr>
            <td >Sum column</td>
            {nodes.map((col) => (
                <td
                key={col.id}
                style={{ ...styles.cell, background: "#1e293b", color: "#f472b6", fontWeight: 700 }}
                >
                {colSums[col.id]}
                </td>
            ))}
            {/* Celda esquina: suma total */}
            
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de aristas */}
      <div style={styles.edgeList}>
        <h2 style={styles.sectionTitle}>Aristas registradas</h2>
        <div style={styles.edgeGrid}>
          {edges.map((e) => (
            <div key={e.id} style={styles.edgeCard}>
              <span style={styles.edgeRoute}>
                {e.from}
                <span style={styles.arrow}>{e.isLoop ? " ↩" : " →"}</span>
                {e.to}
              </span>
              {e.weight !== null && (
                <span style={styles.edgeWeight}>w: {e.weight}</span>
              )}
              {e.isLoop && <span style={styles.loopBadge}>loop</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={styles.stat}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={styles.legendItem}>
      <div style={{ ...styles.legendDot, background: color }} />
      <span style={styles.legendText}>{label}</span>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#060b14",
    color: "#e2e8f0",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: "40px 24px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  badge: {
    display: "inline-block",
    background: "#22d3ee20",
    color: "#22d3ee",
    border: "1px solid #22d3ee40",
    borderRadius: 4,
    fontSize: 11,
    letterSpacing: 4,
    padding: "3px 12px",
    marginBottom: 12,
  },
  title: {
    fontSize: "clamp(24px, 5vw, 42px)",
    fontWeight: 700,
    margin: "0 0 24px",
    letterSpacing: -1,
    background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  legend: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "8px 24px",
    marginBottom: 32,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    border: "1px solid #334155",
  },
  legendText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  matrixWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 40,
  },
  matrixScroll: {
    overflowX: "auto",
    borderRadius: 12,
    border: "1px solid #1e3a5f",
    boxShadow: "0 0 40px #22d3ee10",
  },
  table: {
    borderCollapse: "separate",
    borderSpacing: 3,
    padding: 8,
    background: "#07111e",
  },
  cornerCell: {
    padding: "8px 12px",
    fontSize: 9,
    color: "#334155",
    fontWeight: 400,
    letterSpacing: 0.5,
    textAlign: "center",
    minWidth: 100,
  },
  headerCell: {
    padding: "8px 0",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#22d3ee",
    minWidth: 52,
    letterSpacing: 1,
  },
  rowHeaderCell: {
    padding: "0 14px 0 8px",
    fontSize: 13,
    fontWeight: 700,
    color: "#22d3ee",
    textAlign: "right",
    letterSpacing: 1,
  },
  cell: {
    width: 52,
    height: 52,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 6,
    transition: "all 0.2s",
    cursor: "default",
    userSelect: "none",
  },
  null: {
    fontSize: 16,
    opacity: 0.25,
  },
  edgeList: {
    maxWidth: 700,
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  edgeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 8,
  },
  edgeCard: {
    background: "#0f1f33",
    border: "1px solid #1e3a5f",
    borderRadius: 8,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  edgeRoute: {
    fontSize: 14,
    fontWeight: 700,
    color: "#cbd5e1",
  },
  arrow: {
    color: "#22d3ee",
  },
  edgeWeight: {
    fontSize: 11,
    color: "#a78bfa",
  },
  loopBadge: {
    fontSize: 10,
    background: "#6366f120",
    color: "#a5b4fc",
    border: "1px solid #6366f140",
    borderRadius: 4,
    padding: "1px 6px",
    alignSelf: "flex-start",
    letterSpacing: 1,
  },
};