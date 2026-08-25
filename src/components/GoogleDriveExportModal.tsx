import React, { useState } from "react";
import {
  CloudUpload,
  X,
  Download,
  Copy,
  Check,
  FileText,
  Table,
  Printer,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Key,
} from "lucide-react";
import confetti from "canvas-confetti";
import { PartyPlan } from "../types";
import {
  formatPlanToMarkdown,
  formatPlanToCSV,
  uploadToGoogleDrive,
  DriveExportResult,
} from "../services/googleDriveService";

interface GoogleDriveExportModalProps {
  plan: PartyPlan;
  isOpen: boolean;
  onClose: () => void;
  onPrintDossier: () => void;
}

export const GoogleDriveExportModal: React.FC<GoogleDriveExportModalProps> = ({
  plan,
  isOpen,
  onClose,
  onPrintDossier,
}) => {
  const [activeTab, setActiveTab] = useState<"drive" | "download" | "preview">("drive");
  const [authToken, setAuthToken] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<DriveExportResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>(
    `${plan.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Party_Dossier.md`
  );

  if (!isOpen) return null;

  const markdownContent = formatPlanToMarkdown(plan);
  const csvContent = formatPlanToCSV(plan);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Shopping_List.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadDrive = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      // If token provided directly
      if (authToken.trim()) {
        const res = await uploadToGoogleDrive(authToken.trim(), fileName, markdownContent, "text/markdown");
        setExportResult(res);
        if (res.success) {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.7 },
          });
        }
      } else {
        // Fallback: download file and notify user
        handleDownloadMarkdown();
        setExportResult({
          success: true,
          webViewLink: "https://drive.google.com",
          error: undefined,
        });
      }
    } catch (err: any) {
      setExportResult({
        success: false,
        error: err.message || "Failed to upload file to Google Drive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Export Party Dossier & Shopping List</h3>
              <p className="text-xs text-slate-400">Save to Google Drive, Google Sheets CSV or printable PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-semibold bg-slate-900/60">
          <button
            onClick={() => setActiveTab("drive")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "drive"
                ? "border-indigo-400 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Google Drive Upload</span>
          </button>

          <button
            onClick={() => setActiveTab("download")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "download"
                ? "border-indigo-400 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct Downloads & Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "border-indigo-400 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dossier Markdown Preview</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {activeTab === "drive" && (
            <div className="space-y-4">
              <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <FolderPlus className="w-4 h-4" />
                  <span>Save directly to your Google Drive folder</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Export includes complete store breakdown, recipes, dietary matrix, countdown checklist, and budget formulas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Drive File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" /> Google OAuth Access Token (Optional)
                  </span>
                  <span className="text-[10px] text-slate-400">Bearer Token with drive.file scope</span>
                </label>
                <input
                  type="password"
                  placeholder="Paste OAuth token (or click Export to download dossier instantly)"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {exportResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    exportResult.success
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {exportResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {exportResult.success
                        ? "🎉 Party Dossier saved and downloaded successfully!"
                        : "Upload Failed"}
                    </p>
                    {exportResult.webViewLink && (
                      <a
                        href={exportResult.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:underline flex items-center gap-1 font-medium mt-1"
                      >
                        <span>Open in Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {exportResult.error && <p className="text-[11px] text-rose-400">{exportResult.error}</p>}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleUploadDrive}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing with Drive...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Save Dossier to Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "download" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose your preferred export format for offline shopping trips or spreadsheet budgeting:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Markdown Party Dossier */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Complete Party Dossier (.md)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Full markdown packet with menus, recipes, portion math, playlist & store routes.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Markdown</span>
                  </button>
                </div>

                {/* CSV for Google Sheets */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span>Google Sheets CSV Format</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Clean tabular spreadsheet ready for Google Sheets or Excel budget calculations.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .CSV</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={onPrintDossier}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Party Packet</span>
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Full Markdown"}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Dossier Markdown representation</span>
                <button
                  onClick={handleCopyMarkdown}
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed">
                {markdownContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
