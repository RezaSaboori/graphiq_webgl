import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../utils/camera';
import { InteractionManager } from '../interaction/InteractionManager';
import { SimpleSpatialIndex } from '../interaction/SimpleSpatialIndex';
import { NodeGraphRenderer, hexToRgbNorm } from '../renderer/NodeGraphRenderer';
import { Graph } from '../graph/Graph';

export default function NodeGraphVisualization({ graphData, nodeWidth = 300 }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const managerRef = useRef(null);

  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [draggedNode, setDraggedNode] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // Setup core systems
    const camera = new Camera({ viewportWidth: canvas.width, viewportHeight: canvas.height });
    const spatial = new SimpleSpatialIndex();

    // Ensure we always operate on a Graph instance
    let graph;
    // Support various shapes: Graph instance, {nodes, edges}, or {graph:{nodes,relationships}}
    const source = graphData?.graph ? graphData.graph : graphData;
    if (source instanceof Graph) {
      graph = source;
    } else if (graphData instanceof Graph) {
      graph = graphData;
    } else {
      graph = new Graph();
      // ingest nodes
      const nodesInput = source?.nodes;
      if (Array.isArray(nodesInput)) {
        for (const node of nodesInput) graph.addNode(node);
      } else if (nodesInput && typeof nodesInput.values === 'function') {
        for (const node of nodesInput.values()) graph.addNode(node);
      } else if (nodesInput && typeof nodesInput === 'object') {
        for (const node of Object.values(nodesInput)) graph.addNode(node);
      }
      // ingest edges
      const edgesInput = source?.edges ?? source?.relationships;
      if (Array.isArray(edgesInput)) {
        for (const edge of edgesInput) graph.addEdge(edge);
      } else if (edgesInput && typeof edgesInput.values === 'function') {
        for (const edge of edgesInput.values()) graph.addEdge(edge);
      } else if (edgesInput && typeof edgesInput === 'object') {
        for (const edge of Object.values(edgesInput)) graph.addEdge(edge);
      }
    }

    spatial.rebuild([...graph.nodes.values()]);

    const renderer = new NodeGraphRenderer(gl, canvas, camera);
    rendererRef.current = renderer;
    // Initial fit to content if available
    const nodesArr = [...graph.nodes.values()];
    if (nodesArr.length > 0) {
      const left = Math.min(...nodesArr.map(n => (n.position?.x ?? 0) - (n.width ?? 300) / 2));
      const right = Math.max(...nodesArr.map(n => (n.position?.x ?? 0) + (n.width ?? 300) / 2));
      const top = Math.min(...nodesArr.map(n => (n.position?.y ?? 0) - (n.height ?? 100) / 2));
      const bottom = Math.max(...nodesArr.map(n => (n.position?.y ?? 0) + (n.height ?? 100) / 2));
      camera.fitWorldRect({ left, top, right, bottom }, 32);
    }
    rendererRef.current.updateGraph(graph, { selectedNodes, nodeWidth });
    // Background color from data if present
    const bgHex = source?.style?.['background-color'] || source?.style?.backgroundColor;
    const bg = bgHex ? [...hexToRgbNorm(bgHex), 1] : undefined;
    if (bg) rendererRef.current.render(bg); else rendererRef.current.render();

    // FSM + manager
    const manager = new InteractionManager(canvas, camera, spatial);
    managerRef.current = manager;

    // High-level subscriptions
    let lastPos = null;
    
    manager.on('dragStart', (ctx) => {
      setDraggedNode(ctx.node?.id ?? null);
      canvas.style.cursor = 'move';
    });
    manager.on('drag', ({ node, pos }) => {
      if (node) {
        node.position.x = pos.x;
        node.position.y = pos.y;
        rendererRef.current.updateGraph(graph, { selectedNodes, nodeWidth });
      }
    });
    manager.on('dragEnd', () => {
      setDraggedNode(null);
      canvas.style.cursor = '';
    });
    
    manager.on('panStart', ({ start }) => {
      lastPos = start;
      canvas.style.cursor = 'grabbing';
    });
    manager.on('pan', ({ pos }) => {
      if (lastPos) {
        const dx = pos.x - lastPos.x;
        const dy = pos.y - lastPos.y;
        camera.panBy(-dx, -dy);
        rendererRef.current.render();
        lastPos = pos;
      }
    });
    manager.on('panEnd', () => {
      lastPos = null;
      canvas.style.cursor = '';
    });

    // Zoom handler (mouse wheel)
    const wheelHandler = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1/1.08;
      camera.zoomTo(camera.zoom * zoomFactor, mouseX, mouseY);
      rendererRef.current.render();
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    const handleResize = () => {
      const box = canvas.parentElement ?? canvas;
      const rect = box.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width || canvas.clientWidth || canvas.width));
      const nextH = Math.max(1, Math.floor(rect.height || canvas.clientHeight || canvas.height));
      canvas.width = nextW;
      canvas.height = nextH;
      renderer.setViewportSize(canvas.width, canvas.height);
      renderer.render();
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas.parentElement ?? canvas);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('wheel', wheelHandler);
      managerRef.current?.destroy?.();
      managerRef.current = null;
      rendererRef.current?.dispose?.();
      rendererRef.current = null;
    };
  }, [graphData, nodeWidth]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}


