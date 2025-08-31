# World Coordinate System Implementation

This document describes the implementation of a world coordinate system with seamless zooming and panning for the hybrid React/WebGL application.

## Features

### 1. **World Coordinate System**
- All objects (cards, arrows) use world coordinates
- Camera transforms world coordinates to screen coordinates
- Seamless synchronization between WebGL and React overlays

### 2. **Camera Controls**
- **Panning**: Click and drag on empty space to pan the view
- **Zooming**: Mouse wheel to zoom in/out (zooms toward mouse position)
- **Keyboard Navigation**: Arrow keys to move camera
- **Reset**: Press '0' to reset camera to origin
- **Fit to View**: Press 'F' to fit all content in view

### 3. **Coordinate Transformations**
- `worldToScreen()`: Convert world coordinates to screen coordinates
- `screenToWorld()`: Convert screen coordinates to world coordinates
- `worldToScreenSize()`: Convert world dimensions to screen dimensions
- Automatic scaling and positioning of HTML overlays

### 4. **Performance Features**
- Efficient WebGL rendering with camera-based projection matrices
- Minimal React re-renders with proper dependency management
- Responsive panning and zooming

## Architecture

### Core Components

1. **Canvas.jsx**: Main component managing camera state and interactions
2. **WebGL Renderer**: Renders graphics using camera projection matrices
3. **Coordinate Utils**: Utility functions for coordinate transformations
4. **Card/ArrowLabel Components**: HTML overlays synchronized with WebGL

### Camera State

```javascript
const [camera, setCamera] = useState({
  x: 0,        // World X coordinate of top-left visible area
  y: 0,        // World Y coordinate of top-left visible area
  zoom: 1.0    // Zoom level (1.0 = 100% world scale)
});
```

### Key Functions

- **Panning**: Updates camera x/y based on mouse drag
- **Zooming**: Updates camera zoom and repositions to zoom toward mouse
- **Coordinate Conversion**: Maintains perfect sync between WebGL and HTML

## Usage

### Mouse Controls
- **Left Click + Drag on Card**: Move individual cards
- **Left Click + Drag on Empty Space**: Pan the entire view
- **Mouse Wheel**: Zoom in/out toward cursor position

### Keyboard Controls
- **Arrow Keys**: Move camera in world space
- **0**: Reset camera to origin (0, 0, 1.0)
- **F**: Fit all content to view
- **+/-**: Zoom in/out

### Camera Info Display
The top-right corner shows:
- Current camera position in world coordinates
- Current zoom level
- Available controls

## Technical Details

### WebGL Integration
- Projection matrix calculated from camera state
- All rendering uses world coordinates
- Automatic viewport updates on canvas resize

### React Overlay Synchronization
- HTML overlays positioned using world-to-screen transformations
- Automatic scaling and positioning updates
- Z-index management for proper layering

### Performance Optimizations
- Efficient coordinate calculations
- Minimal state updates
- Proper event listener cleanup

## Benefits

1. **Scalability**: Handle thousands of nodes without performance degradation
2. **Precision**: Pixel-perfect synchronization between WebGL and HTML
3. **User Experience**: Intuitive pan/zoom with mouse and keyboard
4. **Maintainability**: Centralized coordinate transformation logic
5. **Flexibility**: Easy to extend with additional camera features

## Future Enhancements

- Smooth camera animations
- Camera bounds and constraints
- Multi-touch support for mobile devices
- Camera presets and bookmarks
- Export/import camera positions
