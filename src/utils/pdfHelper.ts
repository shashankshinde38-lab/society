import jsPDF from "jspdf";

/**
 * Universal Mobile & Desktop PDF Viewer and Downloader
 * 
 * On Mobile (iOS Safari & Android Chrome):
 * Native mobile browsers block direct virtual anchor download of Blobs or display blank pages.
 * By generating an Object URL and opening in a new tab, mobile devices launch their
 * native full-featured PDF viewer with pinch-to-zoom, share, print, and save capabilities.
 * 
 * On Desktop:
 * Directly initiates standard browser file download with the designated filename.
 */
export function openOrDownloadPDF(doc: jsPDF, filename: string): void {
  if (typeof window === "undefined") return;

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

  try {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    if (isMobile) {
      // In iOS Safari / Android Chrome, opening Blob URL launches the native system PDF viewer
      const newWin = window.open(blobUrl, "_blank");
      if (!newWin) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Fallback cleanup after a safe interval
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } else {
      // Desktop: direct download
      doc.save(filename);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);
    }
  } catch {
    // Ultimate fallback
    try {
      doc.save(filename);
    } catch {
      const dataUri = doc.output("datauristring");
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(
          `<iframe width="100%" height="100%" src="${dataUri}" frameborder="0"></iframe>`
        );
      }
    }
  }
}

/**
 * Specifically open PDF in a new tab for instant display on any device
 */
export function viewPDFInNewTab(doc: jsPDF): void {
  if (typeof window === "undefined") return;
  try {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch {
    const dataUri = doc.output("datauristring");
    window.open(dataUri, "_blank");
  }
}
