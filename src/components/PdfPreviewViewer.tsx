import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfPreviewViewerProps = { url: string };

export function PdfPreviewViewer({ url }: PdfPreviewViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let loadedDocument: any = null;
    setLoading(true);
    setError('');
    setPdf(null);
    setPage(1);

    const loadPdf = async () => {
      try {
        // Legge direttamente il Blob URL creato da jsPDF, senza affidarsi al visualizzatore PDF nativo del browser.
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Impossibile leggere il PDF (HTTP ${response.status})`);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength < 100 || new TextDecoder().decode(buffer.slice(0, 5)) !== '%PDF-') {
          throw new Error('Il documento generato non contiene un PDF valido.');
        }
        const task = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        loadedDocument = await task.promise;
        if (cancelled) {
          await loadedDocument.destroy();
          return;
        }
        setPdf(loadedDocument);
        setPageCount(loadedDocument.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[Anteprima PDF] Errore caricamento:', err);
          setError(err?.message || 'Errore durante la lettura del PDF.');
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      if (loadedDocument) loadedDocument.destroy().catch(() => {});
    };
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;
      try {
        setLoading(true);
        const pdfPage = await pdf.getPage(page);
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Il browser non supporta la visualizzazione del PDF.');
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const availableWidth = Math.max(280, Math.min(canvas.parentElement?.clientWidth || 900, 1100) - 24);
        const scale = Math.min(2, Math.max(0.5, availableWidth / baseViewport.width));
        const viewport = pdfPage.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        await pdfPage.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[Anteprima PDF] Errore rendering pagina:', err);
          setError(err?.message || 'Impossibile visualizzare questa pagina.');
          setLoading(false);
        }
      }
    };
    renderPage();
    return () => { cancelled = true; };
  }, [pdf, page]);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-700 text-xs text-slate-300">
        <span>{pageCount ? `Pagina ${page} di ${pageCount}` : 'Documento PDF'}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={!pdf || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg bg-slate-700 disabled:opacity-40">Precedente</button>
          <button type="button" disabled={!pdf || page >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))} className="px-3 py-1.5 rounded-lg bg-slate-700 disabled:opacity-40">Successiva</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 flex justify-center items-start bg-slate-700/40">
        {loading && <div className="py-8 text-sm text-slate-300">Caricamento anteprima PDF…</div>}
        {error && <div role="alert" className="m-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm">{error}<div className="mt-2 text-xs text-red-200/80">Puoi comunque utilizzare il pulsante Scarica per aprire il file con un lettore PDF esterno.</div></div>}
        <canvas ref={canvasRef} className="max-w-full h-auto bg-white shadow-xl rounded-sm" />
      </div>
    </div>
  );
}
