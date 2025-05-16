import * as TWEEN from '@tweenjs/tween.js';

let animationFrame: number | null = null;

// Animation function that updates TWEEN on each frame
function animate(time?: number) {
  // Ensure we keep requesting animation frames
  animationFrame = requestAnimationFrame(animate);
  
  // Update all active tweens
  TWEEN.update(time);
}

// Start the animation loop immediately
animate();

// Clean up function if needed
export function stopTweenAnimations() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

// Export the TWEEN library for use in other files
export default TWEEN;
