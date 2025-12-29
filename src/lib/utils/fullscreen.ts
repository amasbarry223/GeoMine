/**
 * Utility functions for handling fullscreen mode
 */

export function requestFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }
  // @ts-ignore - for older browsers
  if (element.webkitRequestFullscreen) {
    // @ts-ignore
    return element.webkitRequestFullscreen();
  }
  // @ts-ignore
  if (element.mozRequestFullScreen) {
    // @ts-ignore
    return element.mozRequestFullScreen();
  }
  // @ts-ignore
  if (element.msRequestFullscreen) {
    // @ts-ignore
    return element.msRequestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

export function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }
  // @ts-ignore
  if (document.webkitExitFullscreen) {
    // @ts-ignore
    return document.webkitExitFullscreen();
  }
  // @ts-ignore
  if (document.mozCancelFullScreen) {
    // @ts-ignore
    return document.mozCancelFullScreen();
  }
  // @ts-ignore
  if (document.msExitFullscreen) {
    // @ts-ignore
    return document.msExitFullscreen();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    // @ts-ignore
    document.webkitFullscreenElement ||
    // @ts-ignore
    document.mozFullScreenElement ||
    // @ts-ignore
    document.msFullscreenElement
  );
}

export function toggleFullscreen(element: HTMLElement): Promise<void> {
  if (isFullscreen()) {
    return exitFullscreen();
  } else {
    return requestFullscreen(element);
  }
}



