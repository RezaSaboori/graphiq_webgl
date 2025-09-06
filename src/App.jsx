import React from "react";
import NodeGraphVisualization from "./components/NodeGraphVisualization";
import { loadGraphFromJSON } from "./graph/loadGraphFromJSON";
import data from "./data/data.json";

export default function App() {
  const graphData = loadGraphFromJSON(data);

  return (
    <div className="App" style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <NodeGraphVisualization graphData={graphData} nodeWidth={300} />
    </div>
  );
}
