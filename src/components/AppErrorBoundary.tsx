import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/** Evita una schermata bianca senza spiegazioni quando un componente fallisce in render. */
export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Turni Corvetto] Errore non gestito nell’interfaccia:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <section role="alert" className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-3">
            <h1 className="text-lg font-bold">Si è verificato un errore nell’applicazione</h1>
            <p className="text-sm text-slate-300">
              I dati salvati su Firebase non vengono cancellati da questo errore. Ricarica la pagina; se il problema si ripete, comunica questo messaggio all’assistenza.
            </p>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-rose-200">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Ricarica applicazione
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
