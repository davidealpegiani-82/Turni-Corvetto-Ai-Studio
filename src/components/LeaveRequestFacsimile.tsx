import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, ZoomIn, ZoomOut, Maximize2, Check, FileText, Info } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { LeaveRequest } from '../types/turni';
import { CENTROEDILE_LOGO_BASE64 } from '../constants/logo';
import { buildLeaveRequestPDF, formatDateItalian, formatHoursLabel } from '../services/pdf';

// Configurazione worker PDF.js compatibile con Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (err) {
  console.warn('PDF.js worker initialization error:', err);
}

export const CAUSALI_COL1 = [
  'Ferie',
  'Permesso retribuito',
  'Permesso Non retribuito',
  'Congedo Matrimoniale',
  'Visita Medica (segue certificato)'
] as const;

export const CAUSALI_COL2 = [
  'Visita c/o cantiere',
  'Partecipazione corso',
  'Visita Fiera',
  'Donazione Sangue (segue certificato)',
  'Malattia / Ricovero'
] as const;

export const CAUSALI_LIST = [...CAUSALI_COL1, ...CAUSALI_COL2] as const;

export function isCausaleChecked(reqTipo?: string, label?: string): boolean {
  if (!reqTipo || !label) return false;
  return reqTipo === label || (Boolean(reqTipo) && label.startsWith(reqTipo));
}

// Stampa diretta tramite la finestra di stampa di sistema del browser
export function triggerDirectPrint() {
  window.print();
}

/**
 * Visualizzatore PDF esatto tramite PDF.js su Canvas:
 * Renderizza direttamente il PDF generato da jsPDF sul canvas,
 * garantendo il 100% di conformità visiva, margini, font e impaginazione
 * senza alcun rischio di blocco iframe da parte di Chrome.
 */
export const PdfLeaveCanvas: React.FC<{
  req: LeaveRequest;
  workerName: string;
  title?: string;
  zoom?: number;
}> = ({ req, workerName, title = 'CORVETTO', zoom = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderPdf() {
      setLoading(true);
      setError(null);

      try {
        const doc = buildLeaveRequestPDF(req, workerName, title);
        const arrayBuffer = doc.output('arraybuffer');

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer)
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdf.getPage(1);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scala base ad alta risoluzione (150 DPI) moltiplicata per il livello di zoom
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const baseScale = 1.6 * zoom;
        const viewport = page.getViewport({ scale: baseScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        // @ts-ignore
        await page.render(renderContext).promise;

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('PDF Canvas Render Error:', err);
        if (!isCancelled) {
          setError(err?.message || 'Errore nel caricamento del PDF vettoriale');
          setLoading(false);
        }
      }
    }

    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [req, workerName, title, zoom]);

  if (error) {
    // In caso di errore nel motore PDF.js, fallback istantaneo al foglio HTML conforme
    return <LeaveRequestA4Sheet req={req} workerName={workerName} title={title} />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-600">
              Generazione anteprima PDF A4...
            </span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full max-w-[210mm] bg-white shadow-2xl rounded-sm border border-slate-300/80 transition-shadow duration-200"
        style={{
          aspectRatio: '210 / 297',
          display: 'block'
        }}
      />
    </div>
  );
};

/**
 * Foglio A4 visuale rendered in HTML conforme alle specifiche CENTROEDILE:
 * - Nessuna barra o linea blu decorativa (linee neutre grigio chiaro).
 * - Logo CENTROEDILE MILANO centrato.
 * - Sotto al logo solo "Filiale di Corvetto".
 * - Causali disposte su 2 colonne ordinate.
 * - Firma del Responsabile posizionata SOTTO alla Firma del Dipendente.
 * - Luogo e Data posizionato SOTTO alle firme debitamente distanziato.
 */
export const LeaveRequestA4Sheet: React.FC<{
  req: LeaveRequest;
  workerName: string;
  title?: string;
  id?: string;
}> = ({ req, workerName, title = 'CORVETTO', id = 'printable-leave-document' }) => {
  const hoursStr = formatHoursLabel(req.hours);
  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedRequestDate = formatDateItalian(req.requestDate || todayStr);
  const locationAndDate = `${req.place || 'Milano'}, ${formattedRequestDate}`;

  return (
    <div
      id={id}
      className="w-full max-w-[210mm] min-h-[285mm] mx-auto bg-white text-slate-900 p-8 sm:p-12 md:p-14 shadow-2xl rounded-sm border border-slate-200 font-sans select-text flex flex-col justify-between"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* Intestazione con Logo Ufficiale e Sede (senza linea blu superiore) */}
        <div className="text-center mb-2 pt-2">
          <img
            src={CENTROEDILE_LOGO_BASE64}
            alt="CENTROEDILE MILANO"
            className="h-14 sm:h-16 mx-auto object-contain"
          />
          {/* Sotto al logo solo "Filiale di Corvetto" */}
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide mt-1.5">
            Filiale di Corvetto
          </p>
        </div>

        {/* Linea divisoria sottile grigio neutro */}
        <div className="h-[1px] bg-slate-200 w-4/5 mx-auto my-3" />

        {/* Titolo Modulo */}
        <h2 className="text-center text-base sm:text-lg font-extrabold tracking-widest text-slate-900 uppercase my-4">
          RICHIESTA FERIE / PERMESSI
        </h2>

        {/* Sezione Dipendente */}
        <div className="text-sm text-slate-800 flex items-baseline mb-2">
          <span className="font-medium">Il Sig. / La Sig.ra:</span>
          <span className="ml-3 font-extrabold text-base uppercase text-slate-950 border-b border-dotted border-slate-400 flex-1 pb-0.5 tracking-wide">
            {workerName || '_________________________________'}
          </span>
        </div>

        <p className="text-sm text-slate-700 mt-2 mb-3">
          chiede di potersi assentare dal servizio per la seguente causale:
        </p>

        {/* Griglia Causali (10 voci ordinate su 2 colonne, box neutri) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 my-4 text-xs sm:text-sm">
          <div>
            {CAUSALI_COL1.map((label) => {
              const checked = isCausaleChecked(req.tipo, label);
              return (
                <div key={label} className="flex items-center gap-2.5 py-1">
                  <div
                    className={`w-4 h-4 border rounded-[2px] flex items-center justify-center font-black text-xs shrink-0 ${
                      checked
                        ? 'border-slate-800 bg-slate-100 text-slate-950'
                        : 'border-slate-500 bg-white text-transparent'
                    }`}
                  >
                    X
                  </div>
                  <span className={`${checked ? 'font-bold text-slate-950' : 'text-slate-800'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            {CAUSALI_COL2.map((label) => {
              const checked = isCausaleChecked(req.tipo, label);
              return (
                <div key={label} className="flex items-center gap-2.5 py-1">
                  <div
                    className={`w-4 h-4 border rounded-[2px] flex items-center justify-center font-black text-xs shrink-0 ${
                      checked
                        ? 'border-slate-800 bg-slate-100 text-slate-950'
                        : 'border-slate-500 bg-white text-transparent'
                    }`}
                  >
                    X
                  </div>
                  <span className={`${checked ? 'font-bold text-slate-950' : 'text-slate-800'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linea di separazione neutra grigio chiaro (senza linee blu) */}
        <div className="h-[1px] bg-slate-200 w-full my-4" />

        {/* Dettagli Giorno e Orari */}
        <div className="text-sm text-slate-800 my-4 space-y-2">
          {req.mode === 'single' ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-900">Il Giorno:</span>
              <span className="font-semibold text-slate-900 underline decoration-slate-300">
                {formatDateItalian(req.day)}
              </span>
              {req.fullDay ? (
                <span className="text-slate-600 sm:ml-4">
                  (Intera Giornata - Totale {hoursStr} ore lavorative)
                </span>
              ) : (
                <span className="text-slate-600 sm:ml-4">
                  Dalle ore: <strong>{req.fromTime || '--:--'}</strong> &nbsp; Alle ore:{' '}
                  <strong>{req.toTime || '--:--'}</strong> &nbsp; (Totale {hoursStr} ore lavorative)
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-4">
              <div>
                <span className="font-bold text-slate-900">Dal Giorno:</span>{' '}
                <span className="font-semibold underline decoration-slate-300">
                  {formatDateItalian(req.fromDay)}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Al Giorno:</span>{' '}
                <span className="font-semibold underline decoration-slate-300">
                  {req.toDay
                    ? formatDateItalian(req.toDay)
                    : req.openEnded
                    ? 'In corso (fine prognosi da definire)'
                    : '___/___/______'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Note / Protocollo (se presenti) */}
        {req.note && (
          <div className="my-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
            <strong className="text-slate-800 not-italic">Note / Protocollo:</strong> {req.note}
          </div>
        )}
      </div>

      {/* Sezione Firme e Luogo/Data:
          1. Firma del Dipendente
          2. Firma del Responsabile (sotto alla firma del dipendente)
          3. Luogo e Data (spostato SOTTO alle firme debitamente distanziato) */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-sm text-slate-900 space-y-6">
        <div>
          <span className="font-bold">Firma del Dipendente:</span>{' '}
          <span className="inline-block border-b border-dotted border-slate-600 w-64 sm:w-80 ml-2 h-4 align-bottom" />
        </div>

        <div>
          <span className="font-bold">Firma del Responsabile:</span>{' '}
          <span className="inline-block border-b border-dotted border-slate-600 w-64 sm:w-80 ml-2 h-4 align-bottom" />
        </div>

        {/* Spostato SOTTO alle firme debitamente distanziato */}
        <div className="pt-6">
          <span className="font-bold">Luogo e Data:</span>{' '}
          <span className="font-medium ml-2">{locationAndDate}</span>
        </div>
      </div>
    </div>
  );
};

// Modal Completo Anteprima Modulo (Zero blocchi iframe di Chrome)
interface LeaveRequestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  req: LeaveRequest;
  workerName: string;
  title?: string;
  onSave?: () => void;
}

export const LeaveRequestPreviewModal: React.FC<LeaveRequestPreviewModalProps> = ({
  isOpen,
  onClose,
  req,
  workerName,
  title = 'CORVETTO',
  onSave
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'canvas' | 'html'>('canvas');

  if (!isOpen) return null;

  // Apertura dialogo di stampa di sistema
  const handlePrint = () => {
    triggerDirectPrint();
  };

  // Download del file PDF A4
  const handleDownload = () => {
    const doc = buildLeaveRequestPDF(req, workerName, title);
    const safeWorkerName = (workerName || 'modulo').replace(/\s+/g, '_');
    const safeTipo = (req.tipo || 'Richiesta').replace(/\s+/g, '_');
    doc.save(`Richiesta_${safeTipo}_${safeWorkerName}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-5xl h-[94vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden text-white">
        {/* Header Modale Anteprima */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Anteprima Ufficiale Modulo — {workerName || 'Collaboratore'}
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Layout esatto A4 conforme CENTROEDILE MILANO per stampa e download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Selettore Vista PDF esatto vs HTML */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'canvas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizzazione esatta del PDF vettoriale"
              >
                PDF Ufficiale
              </button>
              <button
                type="button"
                onClick={() => setViewMode('html')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'html'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizzazione modulo HTML"
              >
                Modulo Web
              </button>
            </div>

            {/* Controlli Zoom */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                className="p-1 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                title="Riduci zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono text-[11px]">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                className="p-1 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                title="Aumenta zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-white rounded hover:bg-slate-700 cursor-pointer ml-1"
                title="Ripristina 100%"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Pulsante Stampa Modulo (Collega alle stampanti) */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer active:scale-95"
              title="Apre la finestra di stampa per inviare il modulo alla tua stampante"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Modulo</span>
            </button>

            {/* Pulsante Scarica PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-95"
              title="Scarica il file PDF sul computer o dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scarica PDF</span>
            </button>

            {/* Pulsante Chiudi */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Chiudi anteprima"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner Informativo Stampanti */}
        <div className="bg-slate-800/70 border-b border-slate-700/60 px-4 py-2 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Collegamento Stampanti:</strong> cliccando <strong>Stampa Modulo</strong> si aprirà la finestra di sistema.
              Seleziona la tua stampante fisica nel menu <em>"Destinazione"</em>.
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Formato: A4 Verticale
          </div>
        </div>

        {/* Area di Visualizzazione Documento con Scroll e Zoom */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start">
          <div
            id="printable-leave-document"
            className="printable-document w-full max-w-[210mm] shadow-2xl"
            style={{
              transform: viewMode === 'html' ? `scale(${zoomLevel})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            {viewMode === 'canvas' ? (
              <PdfLeaveCanvas req={req} workerName={workerName} title={title} zoom={zoomLevel} />
            ) : (
              <LeaveRequestA4Sheet req={req} workerName={workerName} title={title} />
            )}
          </div>
        </div>

        {/* Footer Modale */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">✓ Impaginazione identica:</span>
            <span>Nessuna linea blu, causali a 2 colonne, luogo e data sotto le firme.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Torna alla Modifica
            </button>
            {onSave && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSave();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salva Richiesta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
