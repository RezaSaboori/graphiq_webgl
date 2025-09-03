import React, { useEffect, useRef } from "react";
import { Camera } from "./utils/camera";
import { NodeGraphRenderer, hexToRgbNorm } from "./renderer/NodeGraphRenderer";
import { loadGraphFromJSON } from "./graph/loadGraphFromJSON";
import data from "./data/data.json";

function App() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const graphRef = useRef(null);
  const bgColorRef = useRef([0.12, 0.12, 0.13, 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      alert("WebGL2 not supported!");
      return;
    }
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    cameraRef.current = new Camera({
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
      zoom: 1,
    });
    rendererRef.current = new NodeGraphRenderer(gl, canvas, cameraRef.current);
    // Ensure viewport matches the canvas size before first render
    rendererRef.current.setViewportSize(canvas.width, canvas.height);

    // --- KEY PART: Load and assign the graph ---
    graphRef.current = loadGraphFromJSON(data);
    rendererRef.current.graph = graphRef.current; // <--- CRITICAL
    const hex = data.graph?.style?.["background-color"] || "#222222";
    bgColorRef.current = hexToRgbNorm(hex).concat([1]);

    // On resize
    const handleResize = () => {
      setCanvasSize();
      cameraRef.current.setViewportSize(canvas.width, canvas.height);
      rendererRef.current.setViewportSize(canvas.width, canvas.height);
      rendererRef.current.render(bgColorRef.current);
    };
    window.addEventListener("resize", handleResize);

    // Initial render (full graph)
    rendererRef.current.render(bgColorRef.current);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="App" style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100vw", height: "100vh", display: "block", background: "transparent" }}
        tabIndex={0}
      />
    </div>
  );
}

export default App;
