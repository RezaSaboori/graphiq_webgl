import React from "react";
import GraphVisualization from "./components/GraphVisualization";
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
    <div className="app">
      <header className="app-header" style={{padding: 16, background: "#222", color: "#fff"}}>
        <h1>GraphIQ - Medical Data Visualization</h1>
      </header>
      <main className="app-main" style={{height: "calc(100vh - 64px)", position: "relative"}}>
        <GraphVisualization 
          initialData={data}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
        />
      </main>
    </div>
  );
}

export default App;
