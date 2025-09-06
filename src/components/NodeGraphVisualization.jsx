import React, { useEffect, useRef } from 'react';
import { InteractionManager } from '../interaction/InteractionManager';
import { SimpleSpatialIndex } from '../interaction/SimpleSpatialIndex';
import { NodeGraphRenderer, hexToRgbNorm } from '../renderer/NodeGraphRenderer';
import { Graph } from '../graph/Graph';
import { SceneModel } from '../scene/SceneModel';
import { DrawLoop } from '../scene/DrawLoop';

export default function NodeGraphVisualization({ graphData, nodeWidth = 300 }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const managerRef = useRef(null);
  const sceneModelRef = useRef(null);
  const drawLoopRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // === PROFESSIONAL ARCHITECTURE SETUP ===

    // 1. Setup core systems
    const spatial = new SimpleSpatialIndex();

    // 2. Process graph data
    let graph;
    const source = graphData?.graph ? graphData.graph : graphData;
    if (source instanceof Graph) {
      graph = source;
    } else if (graphData instanceof Graph) {
      graph = graphData;
    } else {
      graph = new Graph();
      // Ingest nodes
      const nodesInput = source?.nodes;
      if (Array.isArray(nodesInput)) {
        for (const node of nodesInput) graph.addNode(node);
      } else if (nodesInput && typeof nodesInput.values === 'function') {
        for (const node of nodesInput.values()) graph.addNode(node);
      } else if (nodesInput && typeof nodesInput === 'object') {
        for (const node of Object.values(nodesInput)) graph.addNode(node);
      }
      // Ingest edges
      const edgesInput = source?.edges ?? source?.relationships;
      if (Array.isArray(edgesInput)) {
        for (const edge of edgesInput) graph.addEdge(edge);
      } else if (edgesInput && typeof edgesInput.values === 'function') {
        for (const edge of edgesInput.values()) graph.addEdge(edge);
      } else if (edgesInput && typeof edgesInput === 'object') {
        for (const edge of Object.values(edgesInput)) graph.addEdge(edge);
      }
    }

    // 3. Setup renderer and draw loop
    const renderer = new NodeGraphRenderer(gl, canvas);
    rendererRef.current = renderer;
    
    const drawLoop = new DrawLoop(renderer);
    drawLoopRef.current = drawLoop;

    // 4. Create scene model (centralized state management)
    const sceneModel = new SceneModel(graph, spatial, renderer, () => drawLoop.markDirty());
    sceneModelRef.current = sceneModel;

    // 5. Initialize spatial index
    spatial.rebuild([...graph.nodes.values()]);

    // 6. Setup interaction manager
    const manager = new InteractionManager(canvas, spatial);
    managerRef.current = manager;

    // 7. Wire FSM events to scene model (FSM-driven updates)
    manager.on('dragStart', ({ node }) => {
      // All drag state is managed in SceneModel, not React
      if (node) {
        sceneModel.setDraggedNode(node.id);
      }
      canvas.style.cursor = 'move';
    });

    manager.on('drag', ({ node, pos }) => {
      if (node && pos) {
        sceneModel.moveNode(node.id, pos);
      }
    });

    manager.on('dragEnd', () => {
      sceneModel.clearDraggedNode();
      canvas.style.cursor = '';
    });



    // 9. Handle resize
    const handleResize = () => {
      const box = canvas.parentElement ?? canvas;
      const rect = box.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width || canvas.clientWidth || canvas.width));
      const nextH = Math.max(1, Math.floor(rect.height || canvas.clientHeight || canvas.height));
      canvas.width = nextW;
      canvas.height = nextH;
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas.parentElement ?? canvas);

    // 10. Initial scene setup

    // Set initial graph and background
    sceneModel.updateGraph(graph);
    sceneModel.setNodeWidth(nodeWidth);
    
    const bgHex = source?.style?.['background-color'] || source?.style?.backgroundColor;
    const bg = bgHex ? [...hexToRgbNorm(bgHex), 1] : undefined;
    if (bg) {
      sceneModel.setBackground(bg);
      renderer.render(bg); // Initial render with background
    } else {
      drawLoop.markDirty(); // Mark dirty for initial render
    }

    // 11. Start the draw loop
    drawLoop.start();

    // 12. Cleanup
    return () => {
      ro.disconnect();
      drawLoop.stop();
      manager?.destroy?.();
      renderer?.dispose?.();
      // Clear refs
      managerRef.current = null;
      rendererRef.current = null;
      sceneModelRef.current = null;
      drawLoopRef.current = null;
    };
  }, [graphData, nodeWidth]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
        pointerEvents: 'auto',
        background: '#222',
        outline: 'none'
      }}
    />
  );
}