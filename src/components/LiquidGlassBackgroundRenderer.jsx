import React, { createContext, useContext } from "react";

// Default settings based on liquid-glass-studio repo
const defaultLiquidGlassSettings = {
  refThickness: 20,
  refFactor: 1.4,
  refDispersion: 7,
  refFresnelRange: 30,
  refFresnelHardness: 20,
  refFresnelFactor: 20,
  glareRange: 30,
  glareHardness: 20,
  glareFactor: 90,
  glareConvergence: 50,
  glareOppositeFactor: 80,
  glareAngle: -45,
  blurRadius: 1,
  tint: { r: 255, g: 255, b: 255, a: 0.2 }, 
  shadowExpand: 25,
  shadowFactor: 15,
  shadowPosition: { x: 0, y: -10 },
  shapeWidth: 200,
  shapeHeight: 200,
  shapeRadius: 80,
  shapeRoundness: 5,
  mergeRate: 0.05,
  showShape1: true,
  step: 9,
};

const LiquidGlassSettingsContext = createContext(defaultLiquidGlassSettings);

export const LiquidGlassSettingsProvider = ({ children, settings }) => {
  const merged = { ...defaultLiquidGlassSettings, ...settings };
  return (
    <LiquidGlassSettingsContext.Provider value={merged}>
      {children}
    </LiquidGlassSettingsContext.Provider>
  );
};

// Simple hook for use in your renderer/background
export const useLiquidGlassSettings = () => useContext(LiquidGlassSettingsContext);
