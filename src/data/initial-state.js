export const initialCards = [
  { 
    id: 1, 
    x: 150, 
    y: 200, 
    width: 250, 
    height: 150, 
    color: [0.2, 0.5, 0.8, 1.0], 
    text: "Input Node", 
    properties: { 
      type: "Input", 
      status: "Active",
      dataType: "JSON",
      frequency: "1Hz"
    } 
  },
  { 
    id: 2, 
    x: 600, 
    y: 500, 
    width: 250, 
    height: 150, 
    color: [0.8, 0.2, 0.5, 1.0], 
    text: "Process Node", 
    properties: { 
      type: "Process", 
      status: "Pending",
      algorithm: "ML Model",
      batchSize: "1000"
    } 
  },
  { 
    id: 3, 
    x: 1000, 
    y: 150, 
    width: 250, 
    height: 150, 
    color: [0.2, 0.8, 0.5, 1.0], 
    text: "Output Node", 
    properties: { 
      type: "Output", 
      status: "Complete",
      format: "CSV",
      destination: "S3"
    } 
  },
  { 
    id: 4, 
    x: 1500, 
    y: 600, 
    width: 250, 
    height: 150, 
    color: [0.9, 0.6, 0.1, 1.0], 
    text: "Storage Node", 
    properties: { 
      type: "Storage", 
      status: "Ready",
      engine: "PostgreSQL",
      capacity: "1TB"
    } 
  },
];

export const initialArrows = [
  { 
    id: 1, 
    from: 1, 
    to: 2, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Data Flow" 
  },
  { 
    id: 2, 
    from: 2, 
    to: 3, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Process Result" 
  },
  { 
    id: 3, 
    from: 3, 
    to: 4, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Store Output" 
  },
  { 
    id: 4, 
    from: 1, 
    to: 3, 
    color: [0.7, 0.7, 0.9, 1.0], 
    label: "Direct Output" 
  },
];
