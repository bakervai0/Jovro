import React from 'react';

interface State { hasError: boolean; message?: string; }

/** Keeps one broken screen from taking the whole app down. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // Demo app: log for the console, never surface a stack trace to the customer.
    console.error('[Jovro] screen error', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="material-symbols-outlined text-[46px] text-secondary">error</span>
          <h2 className="text-[16px] font-bold text-on-surface">কিছু একটা ভুল হয়েছে</h2>
          <p className="text-[12px] text-on-surface-variant">Something went wrong on this screen. Please try again.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="mt-1 rounded-full bg-primary px-5 py-2 text-[12.5px] font-semibold text-white"
          >
            আবার চেষ্টা করুন / Retry
          </button>
          {this.state.message && (
            <p className="mt-2 max-w-[300px] break-words text-[10px] text-on-surface-variant/60">{this.state.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
