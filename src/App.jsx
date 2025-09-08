import React from "react";
import NodeGraphVisualization from "./components/NodeGraphVisualization";
import { GraphDataService } from "./services/GraphDataService";
import data from "./data/data.json";

export default function App() {
  const graphData = GraphDataService.loadGraphFromJSON(data);

  return (
    <div className="App" style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <NodeGraphVisualization graphData={graphData} nodeWidth={300} />
    </div>
  );
}
