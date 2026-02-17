import React, { useState } from 'react';
import { 
  Trash2, 
  Settings, 
  Share2, 
 
} from 'lucide-react';

const GraphEditor = () => {

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [isDirected, setIsDirected] = useState(true);
  const [hasWeights, setHasWeights] = useState(true);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [pendingEdge, setPendingEdge] = useState(null);
  const [weightValue, setWeightValue] = useState(' ');


  // Funciones
  const handleDoubleClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  
  if (checkNodeCollision(x, y)) {
      return; 
    }

    const newNode = {
      id: nextNodeId,
      x,
      y
    };

    setNodes([...nodes, newNode]);
    setNextNodeId(nextNodeId + 1);
  };
  
  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (hasMoved) {
      setHasMoved(false);
      return;
    }

    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode === nodeId) {
      const loopEdge = {
        id: `loop-${nodeId}-${Date.now()}`,
        from: nodeId,
        to: nodeId,
        isLoop: true,
        weight: null
      };

      const loopExists = edges.some(
        edge => edge.from === nodeId && edge.to === nodeId
      );

      if (!loopExists) {
        if (hasWeights) {
          setPendingEdge(loopEdge);
          setWeightValue(' ');
          setShowWeightInput(true);
        } else {
          addEdge(loopEdge);
        }
      }

      setSelectedNode(null);
    } else {
      const newEdge = {
        id: `${selectedNode}-${nodeId}-${Date.now()}`,
        from: selectedNode,
        to: nodeId,
        isLoop: false,
        weight: null
      };

      if (hasWeights) {

        setPendingEdge(newEdge);
        setWeightValue(' ');
        setShowWeightInput(true);
      } else {
        addEdge(newEdge);
      }

      setSelectedNode(null);
    }
  };

  
  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNextNodeId(1);
  };

  const getNodeById = (id) => {
    return nodes.find(node => node.id === id);
  };
  const checkNodeCollision = (x, y, excludeId = null) => {
  const minDistance = 30; 
  return nodes.some(node => {
      if (node.id === excludeId) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
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
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      setHasMoved(true);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (checkNodeCollision(x, y, draggedNode)) {
        return;
      }

      setNodes(nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, x, y }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const addEdge = (edge) => {
    const edgeExists = edges.some(e => {
      if (isDirected) {
        return e.from === edge.from && e.to === edge.to;
      } else {
        return (e.from === edge.from && e.to === edge.to) ||
              (e.from === edge.to && e.to === edge.from);
      }
    });

    if (!edgeExists) {
      setEdges([...edges, edge]);
    }
  };

  const handleWeightConfirm = () => {
    if (pendingEdge && weightValue) {
      const edgeWithWeight = {
        ...pendingEdge,
        weight: parseFloat(weightValue) || 1
      };
      addEdge(edgeWithWeight);
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
    
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };


  return (
    <div className="flex h-screen bg-[#0a0c14] text-white font-sans overflow-hidden">

      <aside className="w-80 border-r border-white/5 bg-[#0d1117] flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Share2 size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Graficador</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
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

          
        </div>


        <div className="p-6 border-t border-white/5 space-y-4">
          <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-all active:scale-95"
          onClick={handleClear}>
            <Trash2 size={18} />
            Limpiar Todo
          </button>
          
          <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/10">
            <p className="text-[11px] text-gray-500 leading-relaxed italic">
              * Haz clic derecho para añadir nodos. Arrastra entre nodos para crear aristas. Haz click izquierdo para eliminar el nodo
            </p>
          </div>
        </div>
      </aside>

      
      <main className="flex-1 relative flex flex-col">

        


        <div className="flex-1 relative bg-[#0a0c14] overflow-hidden"
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        >
          
          <div className="absolute inset-0" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle, #ffffff10 1px, transparent 1px)', 
                 backgroundSize: '30px 30px' 
               }} 
          />
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
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

              return (
                <g key={edge.id}>
                  <path
                    d={`
                      M ${startX} ${startY}
                      C ${fromNode.x - loopRadius} ${fromNode.y - loopRadius * 1.2}
                        ${fromNode.x + loopRadius} ${fromNode.y - loopRadius * 1.2}
                        ${endX} ${endY}
                    `}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    markerEnd={isDirected ? "url(#arrowhead)" : ""}
                  />
                  {hasWeights && (
                    <text
                      x={fromNode.x}
                      y={fromNode.y - loopRadius * 1.2 - 10}
                      fill="#fff"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {edge.weight}
                    </text>
                  )}
                </g>
              );
            }
            const hasOppositeEdge = isDirected && edges.some(
              e => e.from === toNode.id && e.to === fromNode.id && e.id !== edge.id
            );

              
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);

                const nodeRadius = 21;
                const arrowOffset = isDirected ? 6 : 0;


                const x1 = fromNode.x + nodeRadius * Math.cos(angle);
                const y1 = fromNode.y + nodeRadius * Math.sin(angle);
                const x2 = toNode.x - (nodeRadius + arrowOffset) * Math.cos(angle);
                const y2 = toNode.y - (nodeRadius + arrowOffset) * Math.sin(angle);


              return (
              <g key={edge.id}>
                {hasOppositeEdge ? (
                  <path
                    d={`
                      M ${x1} ${y1}
                      Q ${(x1 + x2) / 2 + (y2 - y1) * 0.2} ${(y1 + y2) / 2 - (x2 - x1) * 0.2}
                        ${x2} ${y2}
                    `}
                    fill="none"
                    stroke="#666"
                    strokeWidth="2"
                    markerEnd={isDirected ? "url(#arrowhead)" : ""}
                  />
                ) : (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#fff"
                    strokeWidth="2"
                    markerEnd={isDirected ? "url(#arrowhead)" : ""}
                  />
                )}
                {hasWeights && (
                  <text
                    x={(fromNode.x + toNode.x) / 2 + (hasOppositeEdge ? (y2 - y1) * 0.1 : 0)}
                    y={(fromNode.y + toNode.y) / 2 - (hasOppositeEdge ? (x2 - x1) * 0.1 : 0) - 10}
                    fill="#fff"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
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
                onContextMenu={(e) => handleNodeRightClick(e, node.id)}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                style={{
                  position: 'absolute',
                  left: node.x - 20,
                  top: node.y - 20,
                  width: '40px',
                  height: '40px',
                  borderRadius: '100%',
                  backgroundColor: selectedNode === node.id ? '#4CAF50' : '#2196F3',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: draggedNode === node.id ? 'grabbing' : (hasMoved ? 'grabbing' : 'grab'),
                  transition: draggedNode === node.id ? 'none' : 'all 0.2s',
                  fontSize: '14px',
                  userSelect: 'none'
                }}
              >
                {node.id}
              </div>
            ))}
        </div>
        {showWeightInput && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={handleWeightCancel}
              >
                <div
                  style={{
                    backgroundColor: '#0a0c14',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    minWidth: '300px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>Peso de la arista</h3>
                  <input
                    type="number"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleWeightConfirm();
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '16px',
                      border: '2px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '15px',
                      boxSizing: 'border-box',
                      color: '#000000'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleWeightCancel}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#9E9E9E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleWeightConfirm}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

        
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