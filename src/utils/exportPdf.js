import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const GAP_MM = 6;

// Captures each selected card (in the given display order) as an image
// and stacks them down an A4 page, starting a new page whenever a card
// wouldn't fit in the remaining space. cardNodes is { [id]: HTMLElement }.
export async function exportCardsToPdf(orderedIds, cardNodes, filename) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const usableWidth = PAGE_WIDTH_MM - MARGIN_MM * 2;
  let y = MARGIN_MM;
  let placedAny = false;

  for (const id of orderedIds) {
    const node = cardNodes[id];
    if (!node) continue;

    const canvas = await html2canvas(node, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 2,
    });

    const imgHeight = (canvas.height * usableWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    if (y + imgHeight > PAGE_HEIGHT_MM - MARGIN_MM && placedAny) {
      pdf.addPage();
      y = MARGIN_MM;
    }

    pdf.addImage(imgData, 'PNG', MARGIN_MM, y, usableWidth, imgHeight);
    y += imgHeight + GAP_MM;
    placedAny = true;
  }

  if (!placedAny) return false;
  pdf.save(filename);
  return true;
}
