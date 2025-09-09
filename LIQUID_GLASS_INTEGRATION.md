# Liquid Glass Node Effect Integration

This document describes the complete integration of liquid glass node effects into GraphIQ WebGL, following the specifications provided.

## Overview

The liquid glass effect creates realistic glass-like nodes with refraction, reflection, and glare effects. All nodes share the same global uniforms for consistent visual appearance, with proper z-ordering support for drag interactions.

## Architecture

### Core Components

1. **LiquidGlassNodeRenderer.js** - Main renderer class handling the glass effect pipeline
2. **NodeGraphRenderer.js** - Updated main renderer with liquid glass integration
3. **LiquidGlassBackgroundRenderer.jsx** - React context for glass settings
4. **Shaders** - Existing fragment and vertex shaders for the glass effect

### Key Features

- **Shared Global Uniforms**: All nodes use identical glass effect parameters
- **Z-Order Support**: Proper rendering order with drag-to-front functionality
- **Multi-Pass Rendering**: Background snapshot, blur passes, and glass composition
- **Performance Optimized**: Scissor testing and efficient framebuffer usage

## Usage

### Basic Integration

```javascript
import { LiquidGlassNodeRenderer } from './renderer/LiquidGlassNodeRenderer';
import { LiquidGlassSettingsProvider } from './components/LiquidGlassBackgroundRenderer';

// Wrap your app with the settings provider
<LiquidGlassSettingsProvider settings={customSettings}>
  <YourGraphComponent />
</LiquidGlassSettingsProvider>
```

### Node Rendering

The liquid glass effect is automatically applied to all nodes in the graph. Nodes are sorted by z-index and rendered with the glass effect:

```javascript
// Nodes are automatically sorted by z-index
const sortedNodes = nodes.sort((a, b) => (a.z || 0) - (b.z || 0));

// Each node gets the liquid glass effect
for (const node of sortedNodes) {
  liquidGlassRenderer.drawNode(
    node.x, 
    node.y, 
    node.width, 
    node.height, 
    node.z,
    sceneRenderCallback,
    camera
  );
}
```

### Drag Interaction

When dragging nodes, bring them to the front:

```javascript
// On drag start
renderer.bringNodeToFront(nodeId);

// Or set specific z-order
renderer.updateNodeZOrder(nodeId, newZ);
```

## Glass Effect Parameters

All parameters are defined in `GLASS_UNIFORMS` and can be customized:

```javascript
export const GLASS_UNIFORMS = {
  refThickness: 20,           // Refraction thickness
  refFactor: 1.4,             // Refraction factor
  refDispersion: 7,           // Chromatic dispersion
  refFresnelRange: 30,        // Fresnel effect range
  refFresnelHardness: 20,     // Fresnel hardness
  refFresnelFactor: 20,       // Fresnel intensity
  glareRange: 30,             // Glare effect range
  glareHardness: 20,          // Glare hardness
  glareFactor: 90,            // Glare intensity
  glareConvergence: 50,       // Glare convergence
  glareOppositeFactor: 80,    // Opposite side glare
  glareAngle: -45,            // Glare angle
  blurRadius: 1,              // Blur radius
  tint: [1.0, 1.0, 1.0, 0.2], // RGBA tint
  shapeWidth: 200,            // Default shape width
  shapeHeight: 200,           // Default shape height
  shapeRadius: 80,            // Shape corner radius
  shapeRoundness: 5,          // Shape roundness
  mergeRate: 0.05,            // Shape merge rate
  showShape1: 1,              // Show shape 1
  step: 9                     // Shader step
};
```

## Rendering Pipeline

The liquid glass effect uses a multi-pass rendering approach:

1. **Background Snapshot**: Capture the scene excluding the current node
2. **Horizontal Blur**: Apply horizontal Gaussian blur to the background
3. **Vertical Blur**: Apply vertical Gaussian blur to the horizontal result
4. **Glass Composition**: Combine blurred background with glass effects (refraction, reflection, glare)
5. **Final Composite**: Render the final result to the main framebuffer

## Performance Considerations

- **Scissor Testing**: Only renders within node bounds for efficiency
- **Framebuffer Caching**: Reuses framebuffers when possible
- **LOD Support**: Integrates with existing level-of-detail system
- **Z-Order Optimization**: Only recalculates when nodes move or z-order changes

## Integration with Existing Code

The liquid glass renderer integrates seamlessly with the existing GraphIQ architecture:

- Uses existing shader files (`fragment-main.glsl`, `vertex.glsl`, etc.)
- Compatible with existing camera and spatial indexing systems
- Works with the current node and edge rendering pipeline
- Supports the existing LOD and frustum culling systems

## Customization

### Custom Glass Settings

```javascript
const customSettings = {
  refThickness: 25,
  glareFactor: 100,
  tint: { r: 0.8, g: 0.9, b: 1.0, a: 0.3 }
};

<LiquidGlassSettingsProvider settings={customSettings}>
  <YourComponent />
</LiquidGlassSettingsProvider>
```

### Per-Node Customization

While all nodes share the same glass effect parameters, you can customize individual node properties:

```javascript
const node = {
  id: 'node1',
  x: 100,
  y: 100,
  width: 150,    // Custom width
  height: 150,   // Custom height
  z: 5           // Custom z-order
};
```

## Troubleshooting

### Common Issues

1. **WebGL Context Lost**: Ensure proper context management and error handling
2. **Performance Issues**: Reduce blur radius or disable glass effect for distant nodes
3. **Visual Artifacts**: Check that framebuffers are properly sized and cleared
4. **Z-Order Problems**: Ensure nodes have proper z-index values

### Debug Mode

Enable debug logging by setting:

```javascript
window.DEBUG_LIQUID_GLASS = true;
```

This will log rendering information and performance metrics.

## Future Enhancements

- **Dynamic Settings**: Runtime modification of glass parameters
- **Node-Specific Effects**: Different glass types per node
- **Animation Support**: Smooth transitions between glass states
- **Mobile Optimization**: Reduced quality modes for mobile devices

## API Reference

### LiquidGlassNodeRenderer

#### Constructor
```javascript
new LiquidGlassNodeRenderer(gl, width, height)
```

#### Methods
- `drawNode(x, y, width, height, z, sceneRenderCallback, camera)` - Render a glass node
- `setViewportSize(width, height)` - Update viewport size
- `dispose()` - Clean up resources

### NodeGraphRenderer

#### New Methods
- `updateNodeZOrder(nodeId, newZ)` - Update node z-order
- `bringNodeToFront(nodeId)` - Bring node to front

#### Updated Methods
- `render()` - Now includes liquid glass rendering
- `setViewportSize()` - Now updates liquid glass renderer

## Conclusion

The liquid glass integration provides a sophisticated visual effect system that enhances the GraphIQ user experience while maintaining performance and compatibility with existing systems. The shared uniform approach ensures visual consistency while the z-ordering system provides intuitive interaction patterns.
