/**
 * FPS Monitor - Track frames per second during scrolling
 */
export class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 60;
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.start();
  }

  private start(): void {
    const tick = () => {
      this.frames++;
      const currentTime = performance.now();
      const delta = currentTime - this.lastTime;

      if (delta >= 1000) {
        this.fps = Math.round((this.frames * 1000) / delta);
        this.frames = 0;
        this.lastTime = currentTime;
        this.updateDisplay();
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private updateDisplay(): void {
    this.element.textContent = `FPS: ${this.fps}`;

    // Color code based on performance
    this.element.classList.remove('low-fps', 'medium-fps');
    if (this.fps < 30) {
      this.element.classList.add('low-fps');
    } else if (this.fps < 50) {
      this.element.classList.add('medium-fps');
    }
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}
