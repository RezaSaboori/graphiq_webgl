/**
 * Coordinate transformation utilities for world-to-screen and screen-to-world conversions
 * Used by both WebGL rendering and React HTML overlays
 */

// Throttling utility for performance optimization
let throttleTimer;
export function throttle(func, delay) {
  return function(...args) {
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      func.apply(this, args);
      throttleTimer = null;
    }, delay);
  };
}

// Debouncing utility for performance optimization
let debounceTimer;
export function debounce(func, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Convert world coordinates to screen coordinates
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldY - Y coordinate in world space
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} canvas - Canvas element with clientWidth and clientHeight
 * @returns {Object} Screen coordinates { left, top }
 */
export function worldToScreen(worldX, worldY, camera, canvas) {
  return {
    left: (worldX - camera.x) * camera.zoom,
    top: (worldY - camera.y) * camera.zoom,
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param {number} screenX - X coordinate in screen space
 * @param {number} screenY - Y coordinate in screen space
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} canvas - Canvas element with clientWidth and clientHeight
 * @returns {Object} World coordinates { x, y }
 */
export function screenToWorld(screenX, screenY, camera, canvas) {
  return {
    x: screenX / camera.zoom + camera.x,
    y: screenY / camera.zoom + camera.y
  };
}

/**
 * Convert world dimensions to screen dimensions
 * @param {number} worldWidth - Width in world space
 * @param {number} worldHeight - Height in world space
 * @param {Object} camera - Camera object with zoom property
 * @returns {Object} Screen dimensions { width, height }
 */
export function worldToScreenSize(worldWidth, worldHeight, camera) {
  return {
    width: worldWidth * camera.zoom,
    height: worldHeight * camera.zoom
  };
}

/**
 * Get the visible world bounds based on camera and canvas
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} canvas - Canvas element with clientWidth and clientHeight
 * @returns {Object} World bounds { left, right, top, bottom }
 */
export function getVisibleWorldBounds(camera, canvas) {
  const left = camera.x;
  const right = camera.x + (canvas.clientWidth / camera.zoom);
  const top = camera.y;
  const bottom = camera.y + (canvas.clientHeight / camera.zoom);
  
  return { left, right, top, bottom };
}

/**
 * Check if a world object is visible in the current viewport
 * @param {Object} object - Object with x, y, width, height properties
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} canvas - Canvas element
 * @returns {boolean} True if object is visible
 */
export function isObjectVisible(object, camera, canvas) {
  const bounds = getVisibleWorldBounds(camera, canvas);
  
  return !(
    object.x + object.width < bounds.left ||
    object.x > bounds.right ||
    object.y + object.height < bounds.top ||
    object.y > bounds.bottom
  );
}

/**
 * Clamp camera position to world bounds
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} worldBounds - World bounds { minX, maxX, minY, maxY }
 * @param {Object} canvas - Canvas element with clientWidth and clientHeight
 * @returns {Object} Clamped camera position
 */
export function clampCameraToWorldBounds(camera, worldBounds, canvas) {
  const visibleWidth = canvas.clientWidth / camera.zoom;
  const visibleHeight = canvas.clientHeight / camera.zoom;
  
  let clampedX = camera.x;
  let clampedY = camera.y;
  
  // Clamp X position
  if (clampedX < worldBounds.minX) {
    clampedX = worldBounds.minX;
  } else if (clampedX + visibleWidth > worldBounds.maxX) {
    clampedX = worldBounds.maxX - visibleWidth;
  }
  
  // Clamp Y position
  if (clampedY < worldBounds.minY) {
    clampedY = worldBounds.minY;
  } else if (clampedY + visibleHeight > worldBounds.maxY) {
    clampedY = worldBounds.maxY - visibleHeight;
  }
  
  return { ...camera, x: clampedX, y: clampedY };
}

/**
 * Calculate optimal camera position to fit all content in view
 * @param {Array} cards - Array of card objects with x, y, width, height
 * @param {Array} arrows - Array of arrow objects
 * @param {Object} canvas - Canvas element
 * @param {number} padding - Padding around content in world units
 * @returns {Object} Optimal camera position { x, y, zoom }
 */
export function calculateOptimalCamera(cards, arrows, canvas, padding = 100) {
  if (cards.length === 0) {
    return { x: 0, y: 0, zoom: 1.0 };
  }

  // Find bounds of all content
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  cards.forEach(card => {
    minX = Math.min(minX, card.x);
    minY = Math.min(minY, card.y);
    maxX = Math.max(maxX, card.x + card.width);
    maxY = Math.max(maxY, card.y + card.height);
  });

  // Add padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  // Calculate content dimensions
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Calculate zoom to fit content
  const zoomX = canvas.clientWidth / contentWidth;
  const zoomY = canvas.clientHeight / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in beyond 1.0

  // Calculate camera position to center content
  const cameraX = minX + (contentWidth - canvas.clientWidth / zoom) / 2;
  const cameraY = minY + (contentHeight - canvas.clientHeight / zoom) / 2;

  return {
    x: cameraX,
    y: cameraY,
    zoom: zoom
  };
}

/**
 * Smoothly interpolate between two camera positions
 * @param {Object} from - Starting camera position
 * @param {Object} to - Target camera position
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {Object} Interpolated camera position
 */
export function interpolateCamera(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t
  };
}
