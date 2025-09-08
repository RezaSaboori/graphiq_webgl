import React from "react";
import NodeGraphVisualization from "./components/NodeGraphVisualization";
import ErrorBoundary from "./components/ErrorBoundary";
import { GraphDataService } from "./services/GraphDataService";
import data from "./data/data.json";

export default function App() {
  console.log("App component rendering...");

  let graphData;
  try {
    graphData = GraphDataService.loadGraphFromJSON(data);
    console.log("Graph data loaded:", graphData);
  } catch (error) {
    console.error("Error loading graph data:", error);
    return <div>Error loading graph data: {error.message}</div>;
  }

  return (
    <ErrorBoundary>
      <div className="App" style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
        <NodeGraphVisualization graphData={graphData} nodeWidth={300} />
      </div>
    </ErrorBoundary>
  );
}
