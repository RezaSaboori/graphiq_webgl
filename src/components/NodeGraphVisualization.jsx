import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../utils/camera';
import { InteractionManager } from '../interaction/InteractionManager';
import { SimpleSpatialIndex } from '../interaction/SimpleSpatialIndex';
import { NodeGraphRenderer } from '../renderer/NodeGraphRenderer';

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
    if (graphData?.nodes) {
      const nodesArray = Array.isArray(graphData.nodes) ? graphData.nodes : [...graphData.nodes.values?.() ?? []];
      spatial.rebuild(nodesArray);
    }

    const renderer = new NodeGraphRenderer(gl, canvas, camera);
    rendererRef.current = renderer;
    rendererRef.current.updateGraph(graphData, { selectedNodes, nodeWidth });

    // FSM + manager
    const manager = new InteractionManager(canvas, camera, spatial);
    managerRef.current = manager;

    // High-level subscriptions
    manager.on('dragStart', (ctx) => {
      setDraggedNode(ctx.node?.id ?? null);
    });
    manager.on('drag', ({ node, pos }) => {
      if (node) {
        node.position.x = pos.x;
        node.position.y = pos.y;
        rendererRef.current.updateGraph(graphData, { selectedNodes, nodeWidth });
      }
    });
    manager.on('dragEnd', () => {
      setDraggedNode(null);
    });
    manager.on('pan', ({ pos, start }) => {
      if (start) {
        const dx = pos.x - start.x;
        const dy = pos.y - start.y;
        camera.panTo(camera.x - dx, camera.y - dy);
        rendererRef.current.render(graphData, { selectedNodes, nodeWidth });
      }
    });

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      renderer.setViewportSize(canvas.width, canvas.height);
      renderer.render();
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      managerRef.current?.destroy?.();
      rendererRef.current?.dispose?.();
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


