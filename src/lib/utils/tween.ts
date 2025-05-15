
import * as TWEEN from '@tweenjs/tween.js';

// Initialize TWEEN for use throughout the application
const tween = TWEEN;

// Make sure TWEEN.update is called in an animation loop
const initTweenUpdates = () => {
  function animate(time?: number) {
    requestAnimationFrame(animate);
    TWEEN.update(time);
  }
  
  // Start the animation loop
  requestAnimationFrame(animate);
};

// Call the function to start the animation loop
initTweenUpdates();

export default TWEEN;
