/**
 * Three.js coordinate transformation utilities
 * Adapted from the original WebGL coordinate utilities for Three.js world space
 */

import * as THREE from 'three';

/**
 * Convert world coordinates to screen coordinates using Three.js camera
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldY - Y coordinate in world space
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size { width, height }
 * @returns {Object} Screen coordinates { x, y }
 */
export function worldToScreenThree(worldX, worldY, camera, size) {
  const vector = new THREE.Vector3(worldX, worldY, 0);
  vector.project(camera);
  
  return {
    x: (vector.x * 0.5 + 0.5) * size.width,
    y: (vector.y * -0.5 + 0.5) * size.height
  };
}

/**
 * Convert screen coordinates to world coordinates using Three.js camera
 * @param {number} screenX - X coordinate in screen space
 * @param {number} screenY - Y coordinate in screen space
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size { width, height }
 * @returns {Object} World coordinates { x, y }
 */
export function screenToWorldThree(screenX, screenY, camera, size) {
  const vector = new THREE.Vector3(
    (screenX / size.width) * 2 - 1,
    -(screenY / size.height) * 2 + 1,
    0
  );
  
  vector.unproject(camera);
  
  return {
    x: vector.x,
    y: vector.y
  };
}

/**
 * Get the visible world bounds based on Three.js camera
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size { width, height }
 * @returns {Object} World bounds { left, right, top, bottom }
 */
export function getVisibleWorldBoundsThree(camera, size) {
  if (camera.isOrthographicCamera) {
    const left = camera.position.x + camera.left / camera.zoom;
    const right = camera.position.x + camera.right / camera.zoom;
    const top = camera.position.y + camera.top / camera.zoom;
    const bottom = camera.position.y + camera.bottom / camera.zoom;
    
    return { left, right, top, bottom };
  } else {
    // For perspective camera, calculate frustum bounds
    const distance = Math.abs(camera.position.z);
    const vFov = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * camera.aspect;
    
    return {
      left: camera.position.x - width / 2,
      right: camera.position.x + width / 2,
      top: camera.position.y + height / 2,
      bottom: camera.position.y - height / 2
    };
  }
}

/**
 * Check if a world object is visible in the current Three.js viewport
 * @param {Object} object - Object with x, y, width, height properties
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size
 * @returns {boolean} True if object is visible
 */
export function isObjectVisibleThree(object, camera, size) {
  const bounds = getVisibleWorldBoundsThree(camera, size);
  
  return !(
    object.x + object.width < bounds.left ||
    object.x > bounds.right ||
    object.y + object.height < bounds.top ||
    object.y > bounds.bottom
  );
}

/**
 * Calculate optimal camera position to fit all content in Three.js view
 * @param {Array} cards - Array of card objects with x, y, width, height
 * @param {Array} arrows - Array of arrow objects
 * @param {Object} size - Canvas size
 * @param {number} padding - Padding around content in world units
 * @returns {Object} Optimal camera position { x, y, zoom }
 */
export function calculateOptimalCameraThree(cards, arrows, size, padding = 100) {
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
  const zoomX = size.width / contentWidth;
  const zoomY = size.height / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in beyond 1.0

  // Calculate camera position to center content
  const cameraX = minX + (contentWidth - size.width / zoom) / 2;
  const cameraY = minY + (contentHeight - size.height / zoom) / 2;

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
export function interpolateCameraThree(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t
  };
}

/**
 * Clamp camera position to world bounds for Three.js
 * @param {Object} camera - Camera object with x, y, zoom properties
 * @param {Object} worldBounds - World bounds { minX, maxX, minY, maxY }
 * @param {Object} size - Canvas size
 * @returns {Object} Clamped camera position
 */
export function clampCameraToWorldBoundsThree(camera, worldBounds, size) {
  const visibleWidth = size.width / camera.zoom;
  const visibleHeight = size.height / camera.zoom;
  
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
 * Convert mouse event coordinates to world coordinates
 * @param {MouseEvent} event - Mouse event
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size
 * @returns {Object} World coordinates { x, y }
 */
export function mouseToWorldThree(event, camera, size) {
  const rect = event.target.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  return screenToWorldThree(mouseX, mouseY, camera, size);
}

/**
 * Create a ray from camera through mouse position for hit testing
 * @param {MouseEvent} event - Mouse event
 * @param {THREE.Camera} camera - Three.js camera
 * @param {Object} size - Canvas size
 * @returns {THREE.Ray} Ray for hit testing
 */
export function createRayFromMouseThree(event, camera, size) {
  const rect = event.target.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  const vector = new THREE.Vector3(
    (mouseX / size.width) * 2 - 1,
    -(mouseY / size.height) * 2 + 1,
    0
  );
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(vector, camera);
  
  return raycaster.ray;
}
