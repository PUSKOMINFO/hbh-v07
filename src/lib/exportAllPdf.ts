import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SumberDana, Transaksi } from "./data";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const PAGE_W = 210; // A4 width
const MARGIN = 14;

interface SeksiItem {
  nama_seksi: string;
  anggaran: number;
  realisasi: number;
}

interface GrafikData {
  totalMasuk: number;
  totalKeluar: number;
  seksiData: { name: string; value: number }[];
  sumberData: { name: string; value: number }[];
}

interface PrintAllParams {
  sumberDana: SumberDana[];
  transaksi: Transaksi[];
  seksiItems: SeksiItem[];
  grafik: GrafikData;
  tahunHbh: string;
}

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(14);
  doc.setFont(undefined!, "bold");
  doc.text(title, MARGIN, 18);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(9);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    MARGIN,
    25
  );
}

function addSummaryBoxes(
  doc: jsPDF,
  boxes: { label: string; value: string; color: [number, number, number] }[],
  y: number
) {
  const count = boxes.length;
  const gap = 6;
  const boxW = (PAGE_W - 2 * MARGIN - (count - 1) * gap) / count;

  boxes.forEach((box, i) => {
    const x = MARGIN + i * (boxW + gap);
    doc.setFillColor(...box.color);
    doc.roundedRect(x, y, boxW, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(box.label, x + 3, y + 6);
    doc.setFontSize(10);
    doc.text(box.value, x + 3, y + 12);
  });
  doc.setTextColor(0, 0, 0);
}

// ─── PAGE 1+: SUMBER DONASI ───
function renderSumberDana(doc: jsPDF, data: SumberDana[]) {
  addHeader(doc, "1. Sumber Dana Donasi");
  const total = data.reduce((s, d) => s + d.nominal, 0);

  autoTable(doc, {
    startY: 30,
    head: [["No", "Sumber Donasi", "Nominal"]],
    body: data.map((d, i) => [i + 1, d.namaCabang, formatRupiah(d.nominal)]),
    foot: [["", "TOTAL", formatRupiah(total)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 15 }, 2: { halign: "right" } },
  });
}

// ─── TRANSAKSI TABLE ───
function renderTransaksi(doc: jsPDF, data: Transaksi[]) {
  doc.addPage();
  addHeader(doc, "2. Laporan Dana Masuk & Keluar");

  const sorted = [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const totalMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);

  addSummaryBoxes(doc, [
    { label: "Total Masuk", value: formatRupiah(totalMasuk), color: [37, 160, 100] },
    { label: "Total Keluar", value: formatRupiah(totalKeluar), color: [220, 53, 69] },
    { label: "Saldo", value: formatRupiah(totalMasuk - totalKeluar), color: [37, 99, 235] },
  ], 30);

  autoTable(doc, {
    startY: 50,
    head: [["No", "Tanggal", "Keterangan", "Jenis", "Kategori", "Nominal", "Bukti"]],
    body: sorted.map((t, i) => [
      i + 1,
      new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      t.keterangan,
      t.jenis === "masuk" ? "Masuk" : "Keluar",
      t.kategori,
      formatRupiah(t.nominal),
      t.bukti ? "Ada" : "-",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      3: { cellWidth: 16 },
      5: { halign: "right", cellWidth: 30 },
      6: { cellWidth: 14, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val === "Masuk") data.cell.styles.textColor = [37, 160, 100];
        else if (val === "Keluar") data.cell.styles.textColor = [220, 53, 69];
      }
    },
  });

  return sorted;
}

// ─── BUKTI TRANSAKSI (2x2 grid, 4 per page) ───
async function renderBuktiPages(doc: jsPDF, sorted: Transaksi[]) {
  const itemsWithBukti = sorted.filter((t) => t.bukti);
  if (itemsWithBukti.length === 0) return;

  const COL_COUNT = 2;
  const ROW_COUNT = 2;
  const PER_PAGE = COL_COUNT * ROW_COUNT;
  const cellW = (PAGE_W - 2 * MARGIN - 8) / COL_COUNT; // 8px gap between cols
  const cellH = 115; // height per cell
  const GAP_X = 8;
  const GAP_Y = 8;
  const START_Y = 28;

  for (let pageIdx = 0; pageIdx < Math.ceil(itemsWithBukti.length / PER_PAGE); pageIdx++) {
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont(undefined!, "bold");
    doc.text("Lampiran Bukti Transaksi", MARGIN, 18);
    doc.setFont(undefined!, "normal");
    doc.setFontSize(8);
    doc.text(`Halaman ${pageIdx + 1} dari ${Math.ceil(itemsWithBukti.length / PER_PAGE)}`, PAGE_W - MARGIN - 40, 18);

    const pageItems = itemsWithBukti.slice(pageIdx * PER_PAGE, (pageIdx + 1) * PER_PAGE);

    for (let i = 0; i < pageItems.length; i++) {
      const t = pageItems[i];
      const col = i % COL_COUNT;
      const row = Math.floor(i / COL_COUNT);
      const x = MARGIN + col * (cellW + GAP_X);
      const y = START_Y + row * (cellH + GAP_Y);

      // Card border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cellW, cellH, 2, 2, "S");

      // Header bg
      doc.setFillColor(245, 245, 245);
      doc.rect(x, y, cellW, 14, "F");

      // Text info
      doc.setFontSize(8);
      doc.setFont(undefined!, "bold");
      const keteranganTrunc = t.keterangan.length > 30 ? t.keterangan.substring(0, 28) + "..." : t.keterangan;
      doc.text(keteranganTrunc, x + 3, y + 5);
      doc.setFont(undefined!, "normal");
      doc.setFontSize(7);
      doc.text(
        `${new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} — ${formatRupiah(t.nominal)} (${t.jenis === "masuk" ? "Masuk" : "Keluar"})`,
        x + 3,
        y + 11
      );

      // Image area
      const imgAreaY = y + 16;
      const imgAreaH = cellH - 18;

      if (t.bukti?.tipe === "image") {
        try {
          const imgData = await loadImageAsBase64(t.bukti.url);
          if (imgData) {
            const imgProps = doc.getImageProperties(imgData);
            const maxW = cellW - 6;
            const maxH = imgAreaH - 4;
            const ratio = imgProps.width / imgProps.height;
            let w = maxW;
            let h = w / ratio;
            if (h > maxH) {
              h = maxH;
              w = h * ratio;
            }
            const imgX = x + 3 + (maxW - w) / 2;
            const imgY = imgAreaY + 2;
            doc.addImage(imgData, "JPEG", imgX, imgY, w, h);
          } else {
            drawPlaceholder(doc, x + 3, imgAreaY + 2, cellW - 6, imgAreaH - 4, "Gambar tidak tersedia");
          }
        } catch {
          drawPlaceholder(doc, x + 3, imgAreaY + 2, cellW - 6, imgAreaH - 4, "Gagal memuat gambar");
        }
      } else if (t.bukti) {
        drawPlaceholder(doc, x + 3, imgAreaY + 2, cellW - 6, imgAreaH - 4, `Dokumen: ${t.bukti.url.split("/").pop() || "file"}`);
      }

      // Bukti keterangan
      if (t.bukti?.keterangan) {
        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text(`Ket: ${t.bukti.keterangan}`, x + 3, y + cellH - 2);
        doc.setTextColor(0, 0, 0);
      }
    }
  }
}

function drawPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, text: string) {
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(x, y, w, h, 1, 1, "FD");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(text, x + w / 2, y + h / 2, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

// ─── SEKSI ───
function renderSeksi(doc: jsPDF, items: SeksiItem[]) {
  doc.addPage();
  addHeader(doc, "3. Ringkasan Anggaran per Seksi");

  const totalAnggaran = items.reduce((s, i) => s + i.anggaran, 0);
  const totalRealisasi = items.reduce((s, i) => s + i.realisasi, 0);
  const sisa = totalAnggaran - totalRealisasi;

  addSummaryBoxes(doc, [
    { label: "Total Anggaran", value: formatRupiah(totalAnggaran), color: [37, 99, 235] },
    { label: "Total Realisasi", value: formatRupiah(totalRealisasi), color: [220, 53, 69] },
    { label: "Sisa Anggaran", value: formatRupiah(sisa), color: sisa >= 0 ? [37, 160, 100] : [220, 53, 69] },
  ], 30);

  autoTable(doc, {
    startY: 50,
    head: [["No", "Nama Seksi", "Anggaran", "Realisasi", "Sisa", "%"]],
    body: items.map((item, i) => {
      const s = item.anggaran - item.realisasi;
      const persen = item.anggaran > 0 ? Math.round((item.realisasi / item.anggaran) * 100) : item.realisasi > 0 ? 100 : 0;
      return [i + 1, item.nama_seksi, formatRupiah(item.anggaran), formatRupiah(item.realisasi), formatRupiah(s), `${persen}%`];
    }),
    foot: [["", "TOTAL", formatRupiah(totalAnggaran), formatRupiah(totalRealisasi), formatRupiah(sisa), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "center", cellWidth: 14 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const pct = parseInt(data.cell.raw as string);
        if (pct > 100) data.cell.styles.textColor = [220, 53, 69];
        else if (pct >= 75) data.cell.styles.textColor = [200, 140, 0];
        else data.cell.styles.textColor = [37, 160, 100];
      }
    },
  });
}

// ─── GRAFIK (tables only for PDF) ───
function renderGrafik(doc: jsPDF, data: GrafikData) {
  doc.addPage();
  addHeader(doc, "4. Ringkasan Grafik Keuangan");

  addSummaryBoxes(doc, [
    { label: "Total Masuk", value: formatRupiah(data.totalMasuk), color: [37, 160, 100] },
    { label: "Total Keluar", value: formatRupiah(data.totalKeluar), color: [220, 53, 69] },
    { label: "Saldo", value: formatRupiah(data.totalMasuk - data.totalKeluar), color: [37, 99, 235] },
  ], 30);

  // Pengeluaran per Seksi
  doc.setFontSize(12);
  doc.text("Pengeluaran Per Seksi", MARGIN, 54);
  const totalSeksi = data.seksiData.reduce((s, d) => s + d.value, 0);

  autoTable(doc, {
    startY: 58,
    head: [["No", "Seksi", "Nominal", "Proporsi"]],
    body: data.seksiData.map((item, i) => [
      i + 1,
      item.name,
      formatRupiah(item.value),
      totalSeksi > 0 ? `${((item.value / totalSeksi) * 100).toFixed(1)}%` : "0%",
    ]),
    foot: [["", "TOTAL", formatRupiah(totalSeksi), "100%"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "center", cellWidth: 22 } },
  });

  // Proporsi Donasi per Sumber
  const afterSeksi = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(12);
  doc.text("Proporsi Donasi Per Sumber", MARGIN, afterSeksi + 10);
  const totalSumber = data.sumberData.reduce((s, d) => s + d.value, 0);

  autoTable(doc, {
    startY: afterSeksi + 14,
    head: [["No", "Sumber", "Nominal", "Proporsi"]],
    body: data.sumberData.map((item, i) => [
      i + 1,
      item.name,
      formatRupiah(item.value),
      totalSumber > 0 ? `${((item.value / totalSumber) * 100).toFixed(1)}%` : "0%",
    ]),
    foot: [["", "TOTAL", formatRupiah(totalSumber), "100%"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "center", cellWidth: 22 } },
  });
}

// ─── MAIN EXPORT ───
export async function printAllPdf(params: PrintAllParams) {
  const doc = new jsPDF();

  // Cover / Title page
  doc.setFontSize(18);
  doc.setFont(undefined!, "bold");
  doc.text("Laporan Lengkap", PAGE_W / 2, 50, { align: "center" });
  doc.text(`Halal Bi Halal ${params.tahunHbh}`, PAGE_W / 2, 60, { align: "center" });
  doc.setFont(undefined!, "normal");
  doc.setFontSize(12);
  doc.text("Majelis Dzikir Tasbih Indonesia", PAGE_W / 2, 72, { align: "center" });
  doc.setFontSize(9);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    PAGE_W / 2,
    84,
    { align: "center" }
  );

  // Daftar Isi
  doc.setFontSize(11);
  doc.setFont(undefined!, "bold");
  doc.text("Daftar Isi:", MARGIN, 105);
  doc.setFont(undefined!, "normal");
  doc.setFontSize(10);
  doc.text("1. Sumber Dana Donasi", MARGIN + 4, 115);
  doc.text("2. Laporan Dana Masuk & Keluar", MARGIN + 4, 123);
  doc.text("   - Lampiran Bukti Transaksi", MARGIN + 4, 131);
  doc.text("3. Ringkasan Anggaran per Seksi", MARGIN + 4, 139);
  doc.text("4. Ringkasan Grafik Keuangan", MARGIN + 4, 147);

  // 1. Sumber Donasi
  doc.addPage();
  renderSumberDana(doc, params.sumberDana);

  // 2. Transaksi
  const sorted = renderTransaksi(doc, params.transaksi);

  // 2b. Bukti Transaksi (2x2 grid)
  await renderBuktiPages(doc, sorted);

  // 3. Seksi
  renderSeksi(doc, params.seksiItems);

  // 4. Grafik
  renderGrafik(doc, params.grafik);

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Halaman ${i} / ${totalPages}`, PAGE_W / 2, 290, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
