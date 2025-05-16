
import * as TWEEN from '@tweenjs/tween.js';

let animationFrame: number | null = null;

// Animation function that updates TWEEN on each frame
function animate(time?: number) {
  animationFrame = requestAnimationFrame(animate);
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

export default TWEEN;
