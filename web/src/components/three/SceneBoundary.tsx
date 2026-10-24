import { Component, Suspense, type ReactNode } from 'react';

/**
 * Error boundaries must be class components: React calls getDerivedStateFromError when a child
 * throws (for example when a lazily loaded 3D chunk fails to download).
 */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Wraps a lazily loaded 3D scene. While it loads, nothing is shown; if it fails to load or
 * crashes (old browser, no WebGL, a network error), the page carries on without the scene.
 */
export function SceneBoundary({ children }: { children: ReactNode }) {
  return (
    <SceneErrorBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </SceneErrorBoundary>
  );
}
