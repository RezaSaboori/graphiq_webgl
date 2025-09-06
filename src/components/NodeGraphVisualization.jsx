import React, { useEffect, useRef } from 'react';
import { Camera } from '../utils/camera';
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
  const cameraRef = useRef(null);
  const sceneModelRef = useRef(null);
  const drawLoopRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // === PROFESSIONAL ARCHITECTURE SETUP ===

    // 1. Setup core systems
    const camera = new Camera({ viewportWidth: canvas.width, viewportHeight: canvas.height });
    cameraRef.current = camera;
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
    const renderer = new NodeGraphRenderer(gl, canvas, camera);
    rendererRef.current = renderer;
    
    // Set initial graph on renderer
    renderer.graph = graph;
    
    const drawLoop = new DrawLoop(renderer);
    drawLoopRef.current = drawLoop;

    // 4. Create scene model (centralized state management)
    const sceneModel = new SceneModel(graph, camera, spatial, renderer, () => drawLoop.markDirty());
    sceneModelRef.current = sceneModel;

    // 5. Initialize spatial index
    spatial.rebuild([...graph.nodes.values()]);

    // 6. Setup interaction manager
    const manager = new InteractionManager(canvas, camera, spatial);
    managerRef.current = manager;

    // 7. Wire FSM events to scene model (FSM-driven updates)
    manager.on('dragStart', (node) => {
      console.log('React: dragStart received', node);
      // All drag state is managed in SceneModel, not React
      if (node) {
        sceneModel.setDraggedNode(node.id);
      }
    });

    manager.on('drag', ({ node, pos }) => {
      console.log('React: drag received', { node, pos });
      if (node && pos) {
        sceneModel.moveNode(node.id, pos);
      }
    });

    manager.on('dragEnd', (node) => {
      console.log('React: dragEnd received', node);
      sceneModel.clearDraggedNode();
    });

    manager.on('panStart', ({ world }) => {
      console.log('React: panStart received', { world });
      // Pan start - no action needed, just cursor change
    });

    manager.on('pan', ({ dx, dy }) => {
      console.log('React: pan received', { dx, dy });
      sceneModel.panBy(dx, dy);
    });

    manager.on('panEnd', () => {
      console.log('React: panEnd received');
      // Pan end - no action needed
    });

    manager.on('click', (node) => {
      console.log('React: click received', node);
      if (node) {
        sceneModel.selectNode(node.id);
      } else {
        sceneModel.clearSelection();
      }
    });

    manager.on('hover', (node) => {
      console.log('React: hover received', node);
      sceneModel.setHoveredNode(node?.id || null);
    });

    manager.on('cursor', (cursor) => {
      console.log('React: cursor received', cursor);
      canvas.style.cursor = cursor;
    });

    // 8. Handle zoom (direct wheel event - not through FSM as it's continuous)
    const wheelHandler = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      sceneModel.zoomTo(camera.zoom * zoomFactor, mouseX, mouseY);
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    // 8.5. Handle keyboard panning (for testing)
    const keyHandler = (e) => {
      const panSpeed = 50; // pixels per key press
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          sceneModel.panBy(panSpeed, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          sceneModel.panBy(-panSpeed, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          sceneModel.panBy(0, panSpeed);
          break;
        case 'ArrowDown':
          e.preventDefault();
          sceneModel.panBy(0, -panSpeed);
          break;
        case ' ':
          e.preventDefault();
          // Space bar - could be used for reset view or other actions
          break;
      }
    };
    window.addEventListener('keydown', keyHandler);

    // 9. Handle resize
    const handleResize = () => {
      const box = canvas.parentElement ?? canvas;
      const rect = box.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width || canvas.clientWidth || canvas.width));
      const nextH = Math.max(1, Math.floor(rect.height || canvas.clientHeight || canvas.height));
      canvas.width = nextW;
      canvas.height = nextH;
      sceneModel.setViewportSize(canvas.width, canvas.height);
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas.parentElement ?? canvas);

    // 10. Initial scene setup - center camera on graph (maintain 1:1 pixel ratio)
    const nodesArr = [...graph.nodes.values()];
    console.log('Graph nodes:', nodesArr.length, 'nodes');
    console.log('Node positions:', nodesArr.map(n => ({ id: n.id, position: n.position, width: n.width, height: n.height })));
    
    if (nodesArr.length > 0) {
      // Calculate graph center without changing zoom (maintain 1:1 pixel ratio)
      const left = Math.min(...nodesArr.map(n => (n.position?.x ?? 0) - (n.width ?? 300) / 2));
      const right = Math.max(...nodesArr.map(n => (n.position?.x ?? 0) + (n.width ?? 300) / 2));
      const top = Math.min(...nodesArr.map(n => (n.position?.y ?? 0) - (n.height ?? 100) / 2));
      const bottom = Math.max(...nodesArr.map(n => (n.position?.y ?? 0) + (n.height ?? 100) / 2));
      
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      
      console.log('Graph bounds:', { left, top, right, bottom });
      console.log('Graph center:', { centerX, centerY });
      console.log('Canvas size:', { width: canvas.width, height: canvas.height });
      
      // Center camera on graph center (keep zoom at 1.0 for 1:1 pixel ratio)
      camera.panTo(centerX - canvas.width / 2, centerY - canvas.height / 2);
      
      console.log('Camera after center:', { x: camera.x, y: camera.y, zoom: camera.zoom });
    }

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
      canvas.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('keydown', keyHandler);
      drawLoop.stop();
      manager?.destroy?.();
      renderer?.dispose?.();
      // Clear refs
      managerRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      sceneModelRef.current = null;
      drawLoopRef.current = null;
    };
  }, [graphData, nodeWidth]);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
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