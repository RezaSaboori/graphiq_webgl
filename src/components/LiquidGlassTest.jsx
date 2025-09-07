import React, { useEffect } from 'react';

/**
 * Test component to enable debug mode for liquid glass effect
 */
export const LiquidGlassTest = () => {
  useEffect(() => {
    // Enable debug mode
    window.DEBUG_LIQUID_GLASS = true;
    console.log('Liquid Glass Debug Mode Enabled');
    
    return () => {
      window.DEBUG_LIQUID_GLASS = false;
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>🔍 Liquid Glass Debug Mode</div>
      <div>Check console for debug logs</div>
    </div>
  );
};

export default LiquidGlassTest;
