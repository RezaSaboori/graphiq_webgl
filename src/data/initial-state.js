export const initialCards = [
  { 
    id: 1, 
    x: 150, 
    y: 200, 
    width: 280, 
    height: 180, 
    color: [0.2, 0.5, 0.8, 1.0], 
    text: "family history", 
    properties: { 
      name: "Family history of diseases of the blood or blood-forming organs",
      exclusions: "Occupational exposure to risk-factors"
    } 
  },
  { 
    id: 2, 
    x: 600, 
    y: 500, 
    width: 280, 
    height: 180, 
    color: [0.8, 0.2, 0.5, 1.0], 
    text: "medical condition", 
    properties: { 
      diagnosis: "Type 2 Diabetes Mellitus",
      severity: "Moderate",
      onset: "Adult onset"
    } 
  },
  { 
    id: 3, 
    x: 1000, 
    y: 150, 
    width: 280, 
    height: 180, 
    color: [0.2, 0.8, 0.5, 1.0], 
    text: "medication", 
    properties: { 
      name: "Metformin Hydrochloride",
      dosage: "500mg twice daily",
      route: "Oral"
    } 
  },
  { 
    id: 4, 
    x: 1500, 
    y: 600, 
    width: 280, 
    height: 180, 
    color: [0.9, 0.6, 0.1, 1.0], 
    text: "symptom", 
    properties: { 
      description: "Chronic fatigue and weakness",
      duration: "3 months",
      frequency: "Daily"
    } 
  },
];

export const initialArrows = [
  { 
    id: 1, 
    from: 1, 
    to: 2, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Data Flow",
    labelWidth: 80, 
    labelHeight: 25, 
    labelColor: [0.15, 0.15, 0.15, 0.7] 
  },
  { 
    id: 2, 
    from: 2, 
    to: 3, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Process Result",
    labelWidth: 100, 
    labelHeight: 25, 
    labelColor: [0.15, 0.15, 0.15, 0.7] 
  },
  { 
    id: 3, 
    from: 3, 
    to: 4, 
    color: [0.9, 0.9, 0.9, 1.0], 
    label: "Store Output",
    labelWidth: 90, 
    labelHeight: 25, 
    labelColor: [0.15, 0.15, 0.15, 0.7] 
  },
  { 
    id: 4, 
    from: 1, 
    to: 3, 
    color: [0.7, 0.7, 0.9, 1.0], 
    label: "Direct Output",
    labelWidth: 95, 
    labelHeight: 25, 
    labelColor: [0.15, 0.15, 0.15, 0.7] 
  },
];
