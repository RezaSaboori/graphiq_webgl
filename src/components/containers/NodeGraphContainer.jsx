import React, { useEffect, useRef } from 'react';
import { InteractionManager } from '../../interaction/InteractionManager';
import { SimpleSpatialIndex } from '../../interaction/SimpleSpatialIndex';
import { NodeGraphRenderer, hexToRgbNorm } from '../../renderer/NodeGraphRenderer';
import { Graph } from '../../graph/Graph';
import { SceneModel } from '../../scene/SceneModel';
import { DrawLoop } from '../../scene/DrawLoop';
import { Camera } from '../../scene/Camera';
import { GraphDataService } from '../../services/GraphDataService';
import { BACKGROUND_STYLE } from '../../style/WebglTheme';
import NodeGraphCanvas from '../NodeGraphCanvas';

/**
 * Container component that handles all the complex WebGL setup, data processing,
 * and business logic for the node graph visualization.
 * This is the "smart" component that manages state and interactions.
 */
export default function NodeGraphContainer({ graphData, nodeWidth = 300 }) {
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

    // 2. Process graph data using the service
    const graph = GraphDataService.processGraphData(graphData);

    // 3. Handle resize first to get proper canvas size
    const handleResize = () => {
      const box = canvas.parentElement ?? canvas;
      const rect = box.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width || canvas.clientWidth || canvas.width));
      const nextH = Math.max(1, Math.floor(rect.height || canvas.clientHeight || canvas.height));
      canvas.width = nextW;
      canvas.height = nextH;
      return { width: nextW, height: nextH };
    };
    const { width: canvasWidth, height: canvasHeight } = handleResize();

    // 4. Setup camera system with proper viewport size
    const camera = new Camera(canvasWidth, canvasHeight);
    
    // 5. Setup renderer and draw loop
    const renderer = new NodeGraphRenderer(gl, canvas);
    rendererRef.current = renderer;
    renderer.camera = camera; // Save reference for renderer
    renderer.spatialIndex = spatial; // Save reference for frustum culling
    renderer.graph = graph; // Ensure renderer has graph reference for rendering
    renderer.setViewportSize(canvasWidth, canvasHeight); // Set initial WebGL viewport
    
    const drawLoop = new DrawLoop(renderer, null); // Will be updated after sceneModel is created
    drawLoopRef.current = drawLoop;

    // 6. Create scene model (centralized state management)
    const sceneModel = new SceneModel(graph, spatial, renderer, () => drawLoop.markDirty());
    sceneModelRef.current = sceneModel;
    sceneModel.camera = camera; // Make camera accessible for pan/zoom/fit
    
    // Update drawLoop with sceneModel reference
    drawLoop.sceneModel = sceneModel;

    // 7. Initialize spatial index
    spatial.rebuild([...graph.nodes.values()]);

    // 8. Setup interaction manager
    const manager = new InteractionManager(canvas, spatial, camera);
    managerRef.current = manager;

    // 9. Wire FSM events to scene model (FSM-driven updates)
    manager.on('dragStart', ({ node }) => {
      // All drag state is managed in SceneModel, not React
      if (node) {
        sceneModel.setDraggedNode(node.id);
      }
      canvas.style.cursor = 'move';
    });

    manager.on('drag', ({ node, world }) => {
      if (node && world) {
        sceneModel.moveNode(node.id, world);
      }
    });

    manager.on('dragEnd', () => {
      sceneModel.clearDraggedNode();
      canvas.style.cursor = '';
    });

    // Add camera change listener for pan/zoom
    manager.on('cameraChanged', () => {
      drawLoop.markDirty();
    });

    // 10. Handle resize for future changes
    const handleResizeUpdate = () => {
      const box = canvas.parentElement ?? canvas;
      const rect = box.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width || canvas.clientWidth || canvas.width));
      const nextH = Math.max(1, Math.floor(rect.height || canvas.clientHeight || canvas.height));
      canvas.width = nextW;
      canvas.height = nextH;
      
      // Update camera and WebGL viewport
      camera.setViewportSize(canvas.width, canvas.height);
      renderer.setViewportSize(canvas.width, canvas.height);
      
      // Refit the view after resize
      const nodes = [...graph.nodes.values()];
      camera.fitToView(nodes);
    };
    const ro = new ResizeObserver(handleResizeUpdate);
    ro.observe(canvas.parentElement ?? canvas);

    // 11. Initial scene setup
    // Set initial graph and background
    sceneModel.updateGraph(graph);
    sceneModel.setNodeWidth(nodeWidth);
    
    // Fit the view to show the entire graph
    const nodes = [...graph.nodes.values()];
    camera.fitToView(nodes);
    
    // Set up dotted background configuration
    const backgroundConfig = {
      backgroundColor: BACKGROUND_STYLE.backgroundColor ? [...hexToRgbNorm(BACKGROUND_STYLE.backgroundColor), 1] : [0.12, 0.12, 0.13, 1],
      dotColor: BACKGROUND_STYLE.dotColor ? [...hexToRgbNorm(BACKGROUND_STYLE.dotColor), 1] : [0.8, 0.8, 0.8, 1.0],
      dotSpacing: BACKGROUND_STYLE.dotSpacing || 20.0,
      dotRadius: BACKGROUND_STYLE.dotRadius || 2.5
    };
    sceneModel.setBackgroundConfig(backgroundConfig);
    
    // Extract background color using the service (for compatibility)
    const bgHex = GraphDataService.extractBackgroundColor(graphData);
    const bg = bgHex ? [...hexToRgbNorm(bgHex), 1] : undefined;
    if (bg) {
      sceneModel.setBackground(bg);
      // Update background config with extracted color
      backgroundConfig.backgroundColor = bg;
      sceneModel.setBackgroundConfig(backgroundConfig);
    }
    
    drawLoop.markDirty(); // Mark dirty for initial render

    // 12. Start the draw loop
    drawLoop.start();

    // 13. Cleanup
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

  return <NodeGraphCanvas ref={canvasRef} />;
}
