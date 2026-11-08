"use client";

import { Component, type ReactNode } from "react";

// Contains a render or effect exception so the page shows a plain message and a way to recover,
// not a blank screen or an endless animation. Reloading is the only recovery: no state is retried.
export class LabErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="lab-error" role="alert">
      <p>This example could not be displayed. Reload the lab.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload the lab</button>
    </main>;
  }
}
