import jsPDF from "jspdf";

/**
 * Universal Mobile & Desktop PDF Downloader
 * 
 * Initiates standard browser file download with the designated filename.
 * On desktop: downloads directly to Downloads directory.
 * On mobile (Android & iOS): prompts native download and saves clean PDF to device,
 * where tapping it immediately opens in the device's default PDF viewer (Adobe, Google PDF Viewer, Apple Books).
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  if (typeof window === "undefined") return;

  const cleanFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  try {
    // jsPDF built-in save handles direct file download
    doc.save(cleanFilename);
  } catch {
    try {
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFilename;
      link.setAttribute("download", cleanFilename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 5000);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  }
}

/**
 * Universal PDF Open or Download
 * Always downloads valid, uncorrupted PDF across desktop and mobile devices.
 */
export function openOrDownloadPDF(doc: jsPDF, filename: string): void {
  downloadPDF(doc, filename);
}

/**
 * Open PDF in browser or viewer tab
 * 
 * On desktop: opens the PDF in a new browser tab for instant preview.
 * On mobile devices (Android / iOS): mobile Chrome does not support inline blob URLs
 * and displays "Failed to load PDF document". Therefore, on mobile we directly download
 * the PDF so the user can open it instantly with one tap via the device's native PDF viewer.
 */
export function viewPDFInNewTab(doc: jsPDF, filename: string = "Maintenance_Receipt.pdf"): void {
  if (typeof window === "undefined") return;

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    downloadPDF(doc, filename);
    return;
  }

  try {
    const blob = new Blob([doc.output("blob")], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const newTab = window.open(blobUrl, "_blank");
    if (!newTab) {
      downloadPDF(doc, filename);
    }
  } catch {
    downloadPDF(doc, filename);
  }
}
