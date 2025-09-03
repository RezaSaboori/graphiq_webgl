import React from "react";
import NodeGraphVisualization from "./components/NodeGraphVisualization";
import data from "./data/data.json";
import "./App.css";

function App() {
  const handleNodeSelect = (nodeId, nodeData) => {
    console.log("Node selected:", nodeId, nodeData);
  };

  const handleEdgeSelect = (edgeId, edgeData) => {
    console.log("Edge selected:", edgeId, edgeData);
  };

  return (
    <div className="app" style={{width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden"}}>
      <header className="app-header" style={{padding: 16, background: "#222", color: "#fff", height: "60px", boxSizing: "border-box"}}>
        <h1>GraphIQ - Medical Data Visualization</h1>
      </header>
      <main className="app-main" style={{height: "calc(100vh - 60px)", position: "relative", width: "100%", overflow: "hidden"}}>
        <NodeGraphVisualization 
          graphData={data}
        />
      </main>
    </div>
  );
}

export default App;
