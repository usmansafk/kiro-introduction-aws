/**
 * InputHandler - Manages all user input (keyboard, mouse, touch)
 * Provides callbacks for jump and pause actions
 */
class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.jumpCallback = null;
    this.pauseCallback = null;
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for all input types
   */
  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Mouse events
    this.canvas.addEventListener('click', () => this.handleJumpOrStart());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default touch behavior
      this.handleJumpOrStart();
    });
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Spacebar - jump or start
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent page scroll
      this.handleJumpOrStart();
    }
    
    // Escape - pause
    if (e.code === 'Escape') {
      this.handlePause();
    }
  }

  /**
   * Handle jump or start action based on game state
   * Triggers the registered jump callback
   */
  handleJumpOrStart() {
    if (this.jumpCallback) {
      this.jumpCallback();
    }
  }

  /**
   * Handle pause action
   * Triggers the registered pause callback
   */
  handlePause() {
    if (this.pauseCallback) {
      this.pauseCallback();
    }
  }

  /**
   * Register callback for jump/start actions
   * @param {Function} callback - Function to call on jump input
   */
  onJump(callback) {
    this.jumpCallback = callback;
  }

  /**
   * Register callback for pause actions
   * @param {Function} callback - Function to call on pause input
   */
  onPause(callback) {
    this.pauseCallback = callback;
  }
}

export default InputHandler;
