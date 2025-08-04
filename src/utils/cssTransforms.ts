/**
 * CSS Transform utilities for optimized animations
 * Provides hardware-accelerated animations using CSS transforms
 */

export class CSSTransforms {
  /**
   * Create a smooth fade-in animation
   */
  static fadeIn(duration: number = 300, delay: number = 0): string {
    return `
      opacity: 0;
      animation: fadeIn ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
  }

  /**
   * Create a smooth fade-out animation
   */
  static fadeOut(duration: number = 300, delay: number = 0): string {
    return `
      opacity: 1;
      animation: fadeOut ${duration}ms ease-in ${delay}ms forwards;
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
  }

  /**
   * Create a slide-in animation from left
   */
  static slideInLeft(duration: number = 300, delay: number = 0): string {
    return `
      transform: translateX(-100%);
      animation: slideInLeft ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes slideInLeft {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `;
  }

  /**
   * Create a slide-in animation from right
   */
  static slideInRight(duration: number = 300, delay: number = 0): string {
    return `
      transform: translateX(100%);
      animation: slideInRight ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
  }

  /**
   * Create a slide-in animation from top
   */
  static slideInTop(duration: number = 300, delay: number = 0): string {
    return `
      transform: translateY(-100%);
      animation: slideInTop ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes slideInTop {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
    `;
  }

  /**
   * Create a slide-in animation from bottom
   */
  static slideInBottom(duration: number = 300, delay: number = 0): string {
    return `
      transform: translateY(100%);
      animation: slideInBottom ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes slideInBottom {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    `;
  }

  /**
   * Create a scale-in animation
   */
  static scaleIn(duration: number = 300, delay: number = 0): string {
    return `
      transform: scale(0);
      animation: scaleIn ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    `;
  }

  /**
   * Create a scale-out animation
   */
  static scaleOut(duration: number = 300, delay: number = 0): string {
    return `
      transform: scale(1);
      animation: scaleOut ${duration}ms ease-in ${delay}ms forwards;
      
      @keyframes scaleOut {
        from { transform: scale(1); }
        to { transform: scale(0); }
      }
    `;
  }

  /**
   * Create a rotate-in animation
   */
  static rotateIn(duration: number = 300, delay: number = 0): string {
    return `
      transform: rotate(-180deg) scale(0);
      animation: rotateIn ${duration}ms ease-out ${delay}ms forwards;
      
      @keyframes rotateIn {
        from { 
          transform: rotate(-180deg) scale(0);
          opacity: 0;
        }
        to { 
          transform: rotate(0deg) scale(1);
          opacity: 1;
        }
      }
    `;
  }

  /**
   * Create a bounce animation
   */
  static bounce(duration: number = 600, delay: number = 0): string {
    return `
      animation: bounce ${duration}ms ease-out ${delay}ms;
      
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0, 0, 0);
        }
        40%, 43% {
          transform: translate3d(0, -30px, 0);
        }
        70% {
          transform: translate3d(0, -15px, 0);
        }
        90% {
          transform: translate3d(0, -4px, 0);
        }
      }
    `;
  }

  /**
   * Create a pulse animation
   */
  static pulse(duration: number = 1000, delay: number = 0): string {
    return `
      animation: pulse ${duration}ms ease-in-out ${delay}ms infinite;
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
  }

  /**
   * Create a shake animation
   */
  static shake(duration: number = 500, delay: number = 0): string {
    return `
      animation: shake ${duration}ms ease-in-out ${delay}ms;
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }
    `;
  }

  /**
   * Create a loading spinner animation
   */
  static spinner(duration: number = 1000, delay: number = 0): string {
    return `
      animation: spinner ${duration}ms linear ${delay}ms infinite;
      
      @keyframes spinner {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }

  /**
   * Create a progress bar animation
   */
  static progressBar(progress: number, duration: number = 300): string {
    return `
      width: 0%;
      animation: progressBar ${duration}ms ease-out forwards;
      
      @keyframes progressBar {
        to { width: ${progress}%; }
      }
    `;
  }

  /**
   * Create a staggered animation for lists
   */
  static staggeredItem(index: number, staggerDelay: number = 50): string {
    return `
      opacity: 0;
      transform: translateY(20px);
      animation: staggeredItem 300ms ease-out ${index * staggerDelay}ms forwards;
      
      @keyframes staggeredItem {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }

  /**
   * Create a hover effect with transform
   */
  static hoverEffect(): string {
    return `
      transition: transform 0.2s ease-out;
      
      &:hover {
        transform: translateY(-2px) scale(1.02);
      }
    `;
  }

  /**
   * Create a focus effect with transform
   */
  static focusEffect(): string {
    return `
      transition: transform 0.15s ease-out;
      
      &:focus {
        transform: scale(1.05);
      }
    `;
  }

  /**
   * Create a press effect with transform
   */
  static pressEffect(): string {
    return `
      transition: transform 0.1s ease-out;
      
      &:active {
        transform: scale(0.95);
      }
    `;
  }

  /**
   * Create a smooth transition for all properties
   */
  static smoothTransition(properties: string[] = ['all'], duration: number = 200): string {
    return `
      transition: ${properties.join(', ')} ${duration}ms ease-out;
    `;
  }

  /**
   * Create a hardware-accelerated transform
   */
  static hardwareAccelerated(): string {
    return `
      transform: translateZ(0);
      will-change: transform;
      backface-visibility: hidden;
    `;
  }

  /**
   * Create a glass morphism effect
   */
  static glassMorphism(): string {
    return `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    `;
  }

  /**
   * Create a gradient animation
   */
  static gradientAnimation(duration: number = 3000): string {
    return `
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradientAnimation ${duration}ms ease infinite;
      
      @keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
  }

  /**
   * Create a typing animation
   */
  static typingAnimation(text: string, duration: number = 2000): string {
    return `
      overflow: hidden;
      border-right: 2px solid;
      white-space: nowrap;
      animation: typing ${duration}ms steps(${text.length}) forwards,
                 blink 1s infinite;
      
      @keyframes typing {
        from { width: 0; }
        to { width: ${text.length}ch; }
      }
      
      @keyframes blink {
        50% { border-color: transparent; }
      }
    `;
  }

  /**
   * Create a wave animation
   */
  static waveAnimation(duration: number = 1000): string {
    return `
      animation: wave ${duration}ms ease-in-out infinite;
      
      @keyframes wave {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    `;
  }

  /**
   * Create a flip animation
   */
  static flipAnimation(duration: number = 600): string {
    return `
      transform-style: preserve-3d;
      animation: flip ${duration}ms ease-in-out;
      
      @keyframes flip {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(180deg); }
      }
    `;
  }

  /**
   * Create a zoom animation
   */
  static zoomAnimation(duration: number = 300): string {
    return `
      transform: scale(0);
      animation: zoom ${duration}ms ease-out forwards;
      
      @keyframes zoom {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    `;
  }

  /**
   * Create a slide and fade animation
   */
  static slideAndFade(direction: 'left' | 'right' | 'top' | 'bottom' = 'left', duration: number = 300): string {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      top: 'translateY(-100%)',
      bottom: 'translateY(100%)'
    };

    return `
      opacity: 0;
      transform: ${transforms[direction]};
      animation: slideAndFade ${duration}ms ease-out forwards;
      
      @keyframes slideAndFade {
        to {
          opacity: 1;
          transform: translate(0, 0);
        }
      }
    `;
  }
}

export default CSSTransforms; 