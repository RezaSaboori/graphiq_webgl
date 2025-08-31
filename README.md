# GraphIQ - Hybrid WebGL/React Application

A high-performance hybrid application that combines WebGL for efficient graphics rendering with React for UI components. This application is designed to handle thousands of cards and arrows efficiently by leveraging WebGL's GPU acceleration for graphics while using HTML/CSS for text and UI elements.

**Repository**: [https://github.com/RezaSaboori/graphiq_webgl](https://github.com/RezaSaboori/graphiq_webgl)

## Architecture

The application follows a hybrid approach:
- **WebGL**: Handles all graphics rendering (cards, arrows, arrowheads) using GPU acceleration
- **React**: Manages UI state, HTML overlays for text labels, and user interactions
- **Separation of Concerns**: Graphics rendering is completely separate from UI logic

## Project Structure

```
src/
├── components/
│   ├── Canvas/                 # Main canvas component
│   │   ├── Canvas.jsx         # Holds state, renders canvas & UI overlays
│   │   └── style.css          # Canvas positioning and layout
│   │
│   ├── Card/                  # Card UI components
│   │   ├── Card.jsx           # Renders HTML overlay for card properties
│   │   └── style.css          # Card styling
│   │
│   └── ArrowLabel/            # Arrow label components
│       ├── ArrowLabel.jsx     # Renders HTML overlay for arrow labels
│       └── style.css          # Label styling
│
├── webgl/                     # WebGL rendering system
│   ├── Renderer.js            # Main WebGL renderer class
│   └── utils/
│       ├── gl-helpers.js      # WebGL utility functions
│       ├── matrix.js          # Matrix math operations
│       └── proto-arrows.js    # Arrow curve calculations
│
├── hooks/
│   └── useWebGLRenderer.js    # Custom hook for WebGL renderer management
│
├── data/
│   └── initial-state.js       # Initial cards and arrows data
│
├── App.jsx                    # Main application component
└── index.js                   # React root
```

## Key Features

### Performance Optimizations
- **Instanced Rendering**: Uses WebGL instancing for efficient arrow rendering
- **GPU-based Calculations**: Bézier curve calculations happen on the GPU
- **Minimal State Updates**: Only updates WebGL when necessary
- **Efficient VAOs**: Vertex Array Objects for optimal GPU state management

### Graphics Features
- **Cards**: Rendered as colored rectangles with depth ordering
- **Arrows**: Smooth Bézier curves with intelligent routing between boxes
- **Arrowheads**: Directional indicators with proper rotation
- **Z-indexing**: Proper depth ordering for overlapping elements

### UI Features
- **Draggable Cards**: Click and drag to move cards around
- **Property Display**: Each card shows its properties in HTML overlay
- **Arrow Labels**: Text labels positioned along arrows
- **Responsive Design**: Adapts to different screen sizes

## Technical Details

### WebGL Implementation
- **WebGL2 Context**: Modern WebGL features for better performance
- **Shader Programs**: Separate shaders for cards, arrows, and arrowheads
- **Vertex Attributes**: Efficient data layout for instanced rendering
- **Matrix Transformations**: Orthographic projection with proper scaling

### React Integration
- **Custom Hooks**: `useWebGLRenderer` manages WebGL lifecycle
- **State Management**: React state for cards and arrows positions
- **Event Handling**: Mouse events for dragging and interaction
- **Component Composition**: Modular components for maintainability

## Getting Started

### Prerequisites
- Node.js 16+ 
- Modern browser with WebGL2 support

### Installation
```bash
# Clone the repository
git clone https://github.com/RezaSaboori/graphiq_webgl.git
cd graphiq_webgl

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. The application will display a canvas with sample cards and arrows
2. Click and drag cards to move them around
3. Arrows will automatically update their paths
4. Card properties are displayed in HTML overlays
5. Arrow labels show the relationship between cards

## Performance Considerations

### For Large Numbers of Elements
- **Cards**: Rendering is O(n) but very efficient due to simple geometry
- **Arrows**: Uses instanced rendering for O(1) draw calls regardless of count
- **Memory**: Efficient buffer management with minimal GPU memory usage
- **Updates**: Only updates WebGL buffers when data changes

### Scalability
- **Thousands of Cards**: Efficient due to simple quad rendering
- **Thousands of Arrows**: Efficient due to instanced rendering
- **Memory Usage**: Minimal overhead per element
- **Frame Rate**: Maintains 60fps even with complex scenes

## Browser Compatibility

- **Chrome**: 51+ (WebGL2 support)
- **Firefox**: 51+ (WebGL2 support)
- **Safari**: 15+ (WebGL2 support)
- **Edge**: 79+ (WebGL2 support)

## Development

### Adding New Features
1. **New Graphics**: Add to WebGL renderer with appropriate shaders
2. **New UI**: Create React components for HTML overlays
3. **New Interactions**: Add event handlers in Canvas component
4. **New Data**: Extend the data structures in initial-state.js

### Debugging
- WebGL errors are logged to console
- React DevTools for component debugging
- Browser WebGL inspector for graphics debugging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Author

**Reza Saboori** - [GitHub Profile](https://github.com/RezaSaboori)

---

⭐ **Star this repository if you find it helpful!**
