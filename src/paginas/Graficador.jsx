import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Settings, 
  Share2,
  Pencil,
  Link,
  X,
  Download,
  Upload,
  FileJson,
  Save,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from "react-router-dom";


const GraphEditor = () => {
  const navigate = useNavigate();


  const getSaved = (key, fallback) => {
    try {
      const v = sessionStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };

  const [nodes, setNodes] = useState(() => getSaved('graph_nodes', []));
  const [edges, setEdges] = useState(() => getSaved('graph_edges', []));
  const [selectedNode, setSelectedNode] = useState(null);
  const [nextNodeId, setNextNodeId] = useState(() => getSaved('graph_nextId', 1));
  const [isDirected, setIsDirected] = useState(() => getSaved('graph_isDirected', true));
  const [hasWeights, setHasWeights] = useState(() => getSaved('graph_hasWeights', true));
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [pendingEdge, setPendingEdge] = useState(null);
  const [weightValue, setWeightValue] = useState(' ');

  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [activeTab, setActiveTab] = useState('export'); 
  const fileInputRef = useRef(null);


  useEffect(() => { sessionStorage.setItem('graph_nodes', JSON.stringify(nodes)); }, [nodes]);
  useEffect(() => { sessionStorage.setItem('graph_edges', JSON.stringify(edges)); }, [edges]);
  useEffect(() => { sessionStorage.setItem('graph_nextId', JSON.stringify(nextNodeId)); }, [nextNodeId]);
  useEffect(() => { sessionStorage.setItem('graph_isDirected', JSON.stringify(isDirected)); }, [isDirected]);
  useEffect(() => { sessionStorage.setItem('graph_hasWeights', JSON.stringify(hasWeights)); }, [hasWeights]);

  const getGraphJSON = () => JSON.stringify({ isDirected, hasWeights, nodes, edges }, null, 2);

  const handleExportDownload = () => {
    const blob = new Blob([getGraphJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grafo.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (text) => {
    setImportError('');
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('Formato inválido: faltan "nodes" o "edges"');
      setNodes(data.nodes);
      setEdges(data.edges);
      if (typeof data.isDirected === 'boolean') setIsDirected(data.isDirected);
      if (typeof data.hasWeights === 'boolean') setHasWeights(data.hasWeights);
      const maxId = data.nodes.reduce((m, n) => Math.max(m, n.id), 0);
      setNextNodeId(maxId + 1);
      setSelectedNode(null);
      setShowSaveModal(false);
      setImportText('');
    } catch (err) {
      setImportError(err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleImportJSON(ev.target.result);
    reader.readAsText(file);
  };


  const [contextMenu, setContextMenu] = useState(null); 

  const [renameModal, setRenameModal] = useState(null); 
  const [renameValue, setRenameValue] = useState('');

  
  const [edgeEditModal, setEdgeEditModal] = useState(null); 
  const [edgeEditValue, setEdgeEditValue] = useState('');

  const handleDoubleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (checkNodeCollision(x, y)) return;

    const newNode = { id: nextNodeId, x, y, label: null };
    setNodes([...nodes, newNode]);
    setNextNodeId(nextNodeId + 1);
  };
  
  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    closeContextMenu();
    if (hasMoved) {
      setHasMoved(false);
      return;
    }

    if (selectedNode === null) return;

    if (selectedNode === nodeId) {
      const loopEdge = {
        id: `loop-${nodeId}-${Date.now()}`,
        from: nodeId, to: nodeId, isLoop: true, weight: null
      };
      const loopExists = edges.some(edge => edge.from === nodeId && edge.to === nodeId);
      if (!loopExists) {
        if (hasWeights) { setPendingEdge(loopEdge); setWeightValue(' '); setShowWeightInput(true); }
        else addEdge(loopEdge);
      }
    } else {
      const newEdge = {
        id: `${selectedNode}-${nodeId}-${Date.now()}`,
        from: selectedNode, to: nodeId, isLoop: false, weight: null
      };
      if (hasWeights) { setPendingEdge(newEdge); setWeightValue(' '); setShowWeightInput(true); }
      else addEdge(newEdge);
    }
    setSelectedNode(null);
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleContextDelete = () => {
    const { nodeId } = contextMenu;
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
    closeContextMenu();
  };

  const handleContextRename = () => {
    const node = nodes.find(n => n.id === contextMenu.nodeId);
    setRenameValue(node.label || String(node.id));
    setRenameModal({ nodeId: contextMenu.nodeId });
    closeContextMenu();
  };

  const handleContextConnect = () => {
    setSelectedNode(contextMenu.nodeId);
    closeContextMenu();
  };

  const handleRenameConfirm = () => {
    setNodes(nodes.map(n =>
      n.id === renameModal.nodeId
        ? { ...n, label: renameValue.trim() || String(n.id) }
        : n
    ));
    setRenameModal(null);
    setRenameValue('');
  };

  const handleEdgeRightClick = (e, edgeId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasWeights) return;
    const edge = edges.find(ed => ed.id === edgeId);
    setEdgeEditValue(edge.weight !== null ? String(edge.weight) : '');
    setEdgeEditModal({ edgeId, x: e.clientX, y: e.clientY });
  };

  const handleEdgeEditConfirm = () => {
    const num = parseFloat(edgeEditValue);
    if (isNaN(num)) return;
    setEdges(edges.map(e => e.id === edgeEditModal.edgeId ? { ...e, weight: num } : e));
    setEdgeEditModal(null);
    setEdgeEditValue('');
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNextNodeId(1);
    ['graph_nodes','graph_edges','graph_nextId','graph_isDirected','graph_hasWeights'].forEach(k => sessionStorage.removeItem(k));
  };

  const getNodeById = (id) => nodes.find(node => node.id === id);

  const checkNodeCollision = (x, y, excludeId = null) => {
    const minDistance = 30;
    return nodes.some(node => {
      if (node.id === excludeId) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
  };

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    setHasMoved(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (draggedNode === null) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      setHasMoved(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (checkNodeCollision(x, y, draggedNode)) return;
      setNodes(nodes.map(node => node.id === draggedNode ? { ...node, x, y } : node));
    }
  };

  const handleMouseUp = () => setDraggedNode(null);

  const addEdge = (edge) => {
    const edgeExists = edges.some(e => {
      if (isDirected) return e.from === edge.from && e.to === edge.to;
      return (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from);
    });
    if (!edgeExists) setEdges([...edges, edge]);
  };

  const handleWeightConfirm = () => {
    if (pendingEdge && weightValue) {
      addEdge({ ...pendingEdge, weight: parseFloat(weightValue) || 1 });
    }
    setShowWeightInput(false);
    setPendingEdge(null);
    setWeightValue('');
  };

  const handleWeightCancel = () => {
    setShowWeightInput(false);
    setPendingEdge(null);
    setWeightValue(' ');
  };

  const handleNodeRightClick = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  const handleMatrizClick = () => {
    if (hasWeights) {
      navigate("/matriz", { state: { nodes, edges } });
    } else {
      alert("No puedes acceder");
    }
  };

  const getNodeDisplay = (node) => node.label || String(node.id);

  return (
    <div
      className="flex h-screen bg-[#0a0c14] text-white font-sans overflow-hidden"
      onClick={closeContextMenu}
    >
      <aside className="w-80 border-r border-white/5 bg-[#0d1117] flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Share2 size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Graficador</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Settings size={14} />
              Configuración del Grafo
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm font-medium text-gray-300">Con Peso</span>
                <button 
                  onClick={() => setHasWeights(!hasWeights)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${hasWeights ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${hasWeights ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm font-medium text-gray-300">Con Dirección</span>
                <button 
                  onClick={() => setIsDirected(!isDirected)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isDirected ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDirected ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Cómo usar
            </div>
            <div className="space-y-2">
              {[
                { icon: '🖱️', action: 'Doble clic', desc: 'en el canvas para crear un nodo' },
                { icon: '📋', action: 'Clic derecho', desc: 'en un nodo para ver opciones (conectar, renombrar, eliminar)' },
                { icon: '🔗', action: 'Conectar', desc: 'elige "Conectar" en el menú y luego haz clic en el nodo destino' },
                { icon: '✏️', action: 'Aristas', desc: 'clic derecho sobre una arista para editar su peso' },
                { icon: '✋', action: 'Arrastrar', desc: 'mantén presionado y mueve para reposicionar nodos' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <span className="text-base flex-shrink-0">{step.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-blue-400">{step.action} </span>
                    <span className="text-xs text-gray-400">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-all active:scale-95"
            onClick={handleClear}
          >
            <Trash2 size={18} />
            Limpiar Todo
          </button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col">

        {/* Top toolbar */}
        <div className="h-12 px-4 border-b border-white/5 bg-[#0d1117] flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={() => { setShowSaveModal(true); setActiveTab('export'); setImportError(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '6px 14px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '12px', letterSpacing: '0.04em',
              boxShadow: '0 2px 12px rgba(29,78,216,0.35)'
            }}
          >
            <Save size={14} />
            Guardar / Exportar
          </button>
          <button
            onClick={() => { setShowSaveModal(true); setActiveTab('import'); setImportError(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '6px 14px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', fontWeight: '700', fontSize: '12px', letterSpacing: '0.04em'
            }}
          >
            <Upload size={14} />
            Importar
          </button>
        </div>


        {showSaveModal && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSaveModal(false)}
          >
            <div
              style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 24px 80px rgba(0,0,0,0.9)', width: '520px', maxWidth: '95vw', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileJson size={20} color="#60a5fa" />
                  <span style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>Guardar / Exportar Grafo</span>
                </div>
                <button onClick={() => setShowSaveModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', padding: '16px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[['export', 'Exportar', Download], ['import', 'Importar', Upload]].map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setImportError(''); }}
                    style={{
                      padding: '8px 20px', background: 'none', border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab === tab ? '#60a5fa' : '#64748b',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginBottom: '-1px', transition: 'color 0.15s'
                    }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '20px 24px 24px' }}>
                {activeTab === 'export' ? (
                  <>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
                      JSON del grafo actual — cópialo o descárgalo para guardar tu trabajo.
                    </p>
                    <textarea
                      readOnly
                      value={getGraphJSON()}
                      style={{
                        width: '100%', height: '220px', padding: '12px',
                        backgroundColor: '#070a10', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', color: '#86efac', fontSize: '11.5px',
                        fontFamily: 'monospace', resize: 'none', boxSizing: 'border-box',
                        outline: 'none', lineHeight: 1.6
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(getGraphJSON())}
                        style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <FileJson size={14} /> Copiar JSON
                      </button>
                      <button
                        onClick={handleExportDownload}
                        style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Download size={14} /> Descargar .json
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
                      Pega un JSON exportado anteriormente o sube un archivo <code style={{ color: '#86efac' }}>.json</code> para restaurar tu grafo.
                    </p>
                    <textarea
                      value={importText}
                      onChange={e => { setImportText(e.target.value); setImportError(''); }}
                      placeholder='Pega aquí el JSON del grafo...'
                      style={{
                        width: '100%', height: '200px', padding: '12px',
                        backgroundColor: '#070a10', border: `1px solid ${importError ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '10px', color: '#e2e8f0', fontSize: '11.5px',
                        fontFamily: 'monospace', resize: 'none', boxSizing: 'border-box',
                        outline: 'none', lineHeight: 1.6
                      }}
                    />
                    {importError && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#f87171' }}>⚠ {importError}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => fileInputRef.current.click()}
                        style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Upload size={14} /> Subir archivo .json
                      </button>
                      <button
                        onClick={() => handleImportJSON(importText)}
                        disabled={!importText.trim()}
                        style={{ flex: 1, padding: '10px', background: importText.trim() ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'rgba(255,255,255,0.05)', color: importText.trim() ? '#fff' : '#475569', border: 'none', borderRadius: '8px', cursor: importText.trim() ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <ChevronDown size={14} /> Cargar grafo
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <div
          className="flex-1 relative bg-[#0a0c14] overflow-hidden"
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #ffffff10 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }}
          />

          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 6 3, 0 6" fill="#fff" />
              </marker>
            </defs>

            {edges.map(edge => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;

              if (edge.isLoop) {
                const nodeRadius = 21;
                const loopRadius = 50;
                const arrowOffset = isDirected ? 6 : 0;
                const startAngle = -3 * Math.PI / 4;
                const startX = fromNode.x + nodeRadius * Math.cos(startAngle);
                const startY = fromNode.y + nodeRadius * Math.sin(startAngle);
                const endAngle = -Math.PI / 4;
                const endX = fromNode.x + (nodeRadius + arrowOffset) * Math.cos(endAngle);
                const endY = fromNode.y + (nodeRadius + arrowOffset) * Math.sin(endAngle);
                const pathD = `M ${startX} ${startY} C ${fromNode.x - loopRadius} ${fromNode.y - loopRadius * 1.2} ${fromNode.x + loopRadius} ${fromNode.y - loopRadius * 1.2} ${endX} ${endY}`;

                return (
                  <g key={edge.id} style={{ pointerEvents: 'all' }} onContextMenu={(e) => handleEdgeRightClick(e, edge.id)}>
                    {/* invisible hit area */}
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" style={{ cursor: hasWeights ? 'pointer' : 'default' }} />
                    <path d={pathD} fill="none" stroke="#fff" strokeWidth="2" markerEnd={isDirected ? "url(#arrowhead)" : ""} style={{ pointerEvents: 'none' }} />
                    {hasWeights && (
                      <text x={fromNode.x} y={fromNode.y - loopRadius * 1.2 - 10} fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                        {edge.weight}
                      </text>
                    )}
                  </g>
                );
              }

              const hasOppositeEdge = isDirected && edges.some(e => e.from === toNode.id && e.to === fromNode.id && e.id !== edge.id);
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const angle = Math.atan2(dy, dx);
              const nodeRadius = 21;
              const arrowOffset = isDirected ? 6 : 0;
              const x1 = fromNode.x + nodeRadius * Math.cos(angle);
              const y1 = fromNode.y + nodeRadius * Math.sin(angle);
              const x2 = toNode.x - (nodeRadius + arrowOffset) * Math.cos(angle);
              const y2 = toNode.y - (nodeRadius + arrowOffset) * Math.sin(angle);
              const midX = (fromNode.x + toNode.x) / 2 + (hasOppositeEdge ? (y2 - y1) * 0.1 : 0);
              const midY = (fromNode.y + toNode.y) / 2 - (hasOppositeEdge ? (x2 - x1) * 0.1 : 0) - 10;
              const curveD = `M ${x1} ${y1} Q ${(x1 + x2) / 2 + (y2 - y1) * 0.2} ${(y1 + y2) / 2 - (x2 - x1) * 0.2} ${x2} ${y2}`;

              return (
                <g key={edge.id} style={{ pointerEvents: 'all' }} onContextMenu={(e) => handleEdgeRightClick(e, edge.id)}>
                  {hasOppositeEdge
                    ? <path d={curveD} fill="none" stroke="transparent" strokeWidth="12" style={{ cursor: hasWeights ? 'pointer' : 'default' }} />
                    : <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="12" style={{ cursor: hasWeights ? 'pointer' : 'default' }} />
                  }
                  {hasOppositeEdge
                    ? <path d={curveD} fill="none" stroke="#fff" strokeWidth="2" markerEnd={isDirected ? "url(#arrowhead)" : ""} style={{ pointerEvents: 'none' }} />
                    : <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" markerEnd={isDirected ? "url(#arrowhead)" : ""} style={{ pointerEvents: 'none' }} />
                  }
                  {hasWeights && (
                    <text x={midX} y={midY} fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                      {edge.weight}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map(node => (
            <div
              key={node.id}
              onClick={(e) => handleNodeClick(e, node.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasMoved) return;
                setContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              style={{
                position: 'absolute',
                left: node.x - 20,
                top: node.y - 20,
                width: '40px',
                height: '40px',
                borderRadius: '100%',
                backgroundColor: selectedNode === node.id ? '#4CAF50' : '#2196F3',
                border: selectedNode === node.id ? '3px solid #8BC34A' : '3px solid #fff',
                boxShadow: selectedNode === node.id ? '0 0 12px #4CAF5080' : '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                cursor: draggedNode === node.id ? 'grabbing' : 'grab',
                transition: draggedNode === node.id ? 'none' : 'all 0.2s',
                fontSize: node.label && node.label.length > 2 ? '9px' : '13px',
                userSelect: 'none'
              }}
            >
              {getNodeDisplay(node)}
            </div>
          ))}

          {/* Connecting mode indicator */}
          {selectedNode !== null && (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#4CAF5020', border: '1px solid #4CAF5060',
              color: '#8BC34A', padding: '6px 16px', borderRadius: '20px',
              fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none'
            }}>
              Selecciona el nodo destino para conectar · <span style={{ opacity: 0.7 }}>ESC para cancelar</span>
            </div>
          )}
        </div>

        {/* Node Context Menu */}
        {contextMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 2000,
              backgroundColor: '#0d1117',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              minWidth: '180px'
            }}
          >
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Nodo {getNodeDisplay(nodes.find(n => n.id === contextMenu.nodeId))}
            </div>
            <button
              onClick={handleContextConnect}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: 'none', border: 'none', color: '#60a5fa',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Link size={15} />
              Conectar con otro nodo
            </button>
            <button
              onClick={handleContextRename}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: 'none', border: 'none', color: '#a78bfa',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(167,139,250,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Pencil size={15} />
              Cambiar nombre
            </button>
            <button
              onClick={handleContextDelete}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: 'none', border: 'none', color: '#f87171',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'left',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={15} />
              Eliminar nodo
            </button>
          </div>
        )}

        {/* Edge Weight Edit Modal */}
        {edgeEditModal && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
            onClick={() => setEdgeEditModal(null)}
          >
            <div
              style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: '300px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Editar peso de la arista</h3>
                <button onClick={() => setEdgeEditModal(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <input
                type="number"
                value={edgeEditValue}
                onChange={e => setEdgeEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEdgeEditConfirm();
                  if (e.key === 'Escape') setEdgeEditModal(null);
                }}
                autoFocus
                placeholder="Valor numérico..."
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  backgroundColor: '#161b27', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px', color: '#fff', boxSizing: 'border-box',
                  outline: 'none', marginBottom: '8px'
                }}
              />
              {edgeEditValue !== '' && isNaN(parseFloat(edgeEditValue)) && (
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#f87171' }}>⚠ Solo se permiten valores numéricos</p>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setEdgeEditModal(null)}
                  style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdgeEditConfirm}
                  disabled={edgeEditValue === '' || isNaN(parseFloat(edgeEditValue))}
                  style={{ padding: '8px 16px', backgroundColor: edgeEditValue !== '' && !isNaN(parseFloat(edgeEditValue)) ? '#2563eb' : '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: edgeEditValue !== '' && !isNaN(parseFloat(edgeEditValue)) ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '13px', opacity: edgeEditValue !== '' && !isNaN(parseFloat(edgeEditValue)) ? 1 : 0.5 }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {renameModal && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
            onClick={() => setRenameModal(null)}
          >
            <div
              style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: '300px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Cambiar nombre del nodo</h3>
                <button onClick={() => setRenameModal(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenameModal(null); }}
                autoFocus
                placeholder="Nuevo nombre..."
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  backgroundColor: '#161b27', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px', color: '#fff', boxSizing: 'border-box',
                  outline: 'none', marginBottom: '16px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setRenameModal(null)}
                  style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRenameConfirm}
                  style={{ padding: '8px 16px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weight Input Modal */}
        {showWeightInput && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={handleWeightCancel}
          >
            <div
              style={{ backgroundColor: '#0a0c14', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: '300px' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>Peso de la arista</h3>
              <input
                type="number"
                value={weightValue}
                onChange={e => setWeightValue(e.target.value)}
                onKeyPress={e => { if (e.key === 'Enter') handleWeightConfirm(); }}
                autoFocus
                style={{ width: '100%', padding: '8px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '4px', marginBottom: '15px', boxSizing: 'border-box', color: '#000000' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={handleWeightCancel} style={{ padding: '8px 16px', backgroundColor: '#9E9E9E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancelar
                </button>
                <button onClick={handleWeightConfirm} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleMatrizClick}
          style={{
            margin: '0',
            padding: '0 28px',
            height: '48px',
            backgroundColor: hasWeights ? '#1d4ed8' : '#1e293b',
            color: hasWeights ? '#fff' : '#475569',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            cursor: hasWeights ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            width: '100%',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (hasWeights) e.currentTarget.style.backgroundColor = '#1e40af'; }}
          onMouseLeave={e => { if (hasWeights) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Matriz de Adyacencia
          {!hasWeights && <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(requiere pesos)</span>}
        </button>
        
        <footer className="h-10 px-6 border-t border-white/5 bg-[#0d1117] flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Nodos: {nodes.length}</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Aristas: {edges.length}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default GraphEditor;