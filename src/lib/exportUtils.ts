import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SumberDana, Transaksi } from "./data";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

// ─── SUMBER DANA ───

export function exportSumberDanaXlsx(data: SumberDana[]) {
  const rows = data.map((d, i) => ({
    No: i + 1,
    "Sumber Donasi": d.namaCabang,
    Nominal: d.nominal,
  }));
  const total = data.reduce((s, d) => s + d.nominal, 0);
  rows.push({ No: null as any, "Sumber Donasi": "TOTAL", Nominal: total });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sumber Dana");
  XLSX.writeFile(wb, "Sumber_Dana_Donasi.xlsx");
}

export function printSumberDanaPdf(data: SumberDana[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Sumber Dana Donasi", 14, 18);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 25);

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

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

// ─── TRANSAKSI ───

export function exportTransaksiXlsx(data: Transaksi[]) {
  const sorted = [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const rows = sorted.map((t, i) => ({
    No: i + 1,
    Tanggal: new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    Keterangan: t.keterangan,
    Jenis: t.jenis === "masuk" ? "Masuk" : "Keluar",
    Kategori: t.kategori,
    Nominal: t.nominal,
    "Bukti URL": t.bukti?.url || "-",
  }));

  const totalMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);
  rows.push({ No: null as any, Tanggal: "", Keterangan: "TOTAL MASUK", Jenis: "", Kategori: "", Nominal: totalMasuk, "Bukti URL": "" });
  rows.push({ No: null as any, Tanggal: "", Keterangan: "TOTAL KELUAR", Jenis: "", Kategori: "", Nominal: totalKeluar, "Bukti URL": "" });
  rows.push({ No: null as any, Tanggal: "", Keterangan: "SALDO", Jenis: "", Kategori: "", Nominal: totalMasuk - totalKeluar, "Bukti URL": "" });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
  XLSX.writeFile(wb, "Laporan_Transaksi.xlsx");
}

export async function printTransaksiPdf(data: Transaksi[]) {
  const sorted = [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const dataMasuk = sorted.filter((t) => t.jenis === "masuk");
  const dataKeluar = sorted.filter((t) => t.jenis === "keluar");
  const totalMasuk = dataMasuk.reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = dataKeluar.reduce((s, t) => s + t.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const printDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // ─── PAGE 1: DANA MASUK ───
  doc.setFontSize(14);
  doc.text("Laporan Dana Masuk", margin, 18);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${printDate}`, margin, 25);

  // Summary box
  doc.setFillColor(37, 160, 100);
  doc.roundedRect(margin, 30, 85, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Total Dana Masuk", margin + 3, 36);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalMasuk), margin + 3, 42);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + 90, 30, 85, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Saldo Akhir", margin + 93, 36);
  doc.setFontSize(11);
  doc.text(formatRupiah(saldo), margin + 93, 42);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 50,
    head: [["No", "Tanggal", "Keterangan", "Sumber Dana", "Nominal", "Bukti"]],
    body: dataMasuk.map((t, i) => [
      i + 1,
      new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      t.keterangan,
      t.kategori,
      formatRupiah(t.nominal),
      t.bukti ? "Ada" : "-",
    ]),
    foot: [["", "", "", "TOTAL", formatRupiah(totalMasuk), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 160, 100] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 32 },
      5: { cellWidth: 14, halign: "center" },
    },
  });

  // ─── PAGE 2: DANA KELUAR ───
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Laporan Dana Keluar", margin, 18);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${printDate}`, margin, 25);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(margin, 30, 85, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Total Dana Keluar", margin + 3, 36);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalKeluar), margin + 3, 42);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + 90, 30, 85, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Saldo Akhir", margin + 93, 36);
  doc.setFontSize(11);
  doc.text(formatRupiah(saldo), margin + 93, 42);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 50,
    head: [["No", "Tanggal", "Keterangan", "Seksi", "Nominal", "Bukti"]],
    body: dataKeluar.map((t, i) => [
      i + 1,
      new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      t.keterangan,
      t.kategori,
      formatRupiah(t.nominal),
      t.bukti ? "Ada" : "-",
    ]),
    foot: [["", "", "", "TOTAL", formatRupiah(totalKeluar), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 53, 69] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 32 },
      5: { cellWidth: 14, halign: "center" },
    },
  });

  // ─── BUKTI DANA MASUK (2x2 grid, 4 per page) ───
  const masukWithBukti = dataMasuk.filter((t) => t.bukti);
  if (masukWithBukti.length > 0) {
    await renderBuktiPages(doc, masukWithBukti, "Lampiran Bukti Pembayaran — Dana Masuk", [37, 160, 100], margin, pageW, pageH, printDate);
  }

  // ─── BUKTI DANA KELUAR (2x2 grid, 4 per page) ───
  const keluarWithBukti = dataKeluar.filter((t) => t.bukti);
  if (keluarWithBukti.length > 0) {
    await renderBuktiPages(doc, keluarWithBukti, "Lampiran Bukti Pembayaran — Dana Keluar", [220, 53, 69], margin, pageW, pageH, printDate);
  }

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

async function renderBuktiPages(
  doc: jsPDF,
  items: Transaksi[],
  title: string,
  color: [number, number, number],
  margin: number,
  pageW: number,
  pageH: number,
  printDate: string,
) {
  const cols = 2;
  const rows = 2;
  const perPage = cols * rows;
  const gap = 6;
  const cellW = (pageW - margin * 2 - gap) / cols;
  const headerH = 32; // space for title + date
  const cellH = (pageH - margin - headerH - margin - gap) / rows;
  const imgPad = 4;
  const labelH = 22; // space for text labels below/above image

  const pages = Math.ceil(items.length / perPage);

  for (let page = 0; page < pages; page++) {
    doc.addPage();

    // Page header
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, margin, pageW - margin * 2, 18, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(title, margin + 5, margin + 7);
    doc.setFontSize(8);
    doc.text(`Dicetak: ${printDate}  —  Halaman ${page + 1} dari ${pages}`, margin + 5, margin + 13);
    doc.setTextColor(0, 0, 0);

    const startY = margin + headerH;

    const pageItems = items.slice(page * perPage, (page + 1) * perPage);

    for (let idx = 0; idx < pageItems.length; idx++) {
      const t = pageItems[idx];
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = margin + col * (cellW + gap);
      const y = startY + row * (cellH + gap);

      // Cell border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cellW, cellH, 2, 2, "S");

      // Label area at top
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(x, y, cellW, 5, 2, 0, "F");
      // Fix bottom corners with small rect
      doc.rect(x, y + 3, cellW, 2, "F");

      const labelType = color[0] === 37 ? "Dana Masuk" : "Dana Keluar";
      const labelCategory = color[0] === 37 ? t.kategori : t.kategori;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.text(`Bukti Pembayaran (${labelType} — ${labelCategory})`, x + 3, y + 4);
      doc.setTextColor(0, 0, 0);

      // Transaction info
      const infoY = y + 10;
      doc.setFontSize(7.5);
      doc.setFont(undefined!, "bold");
      const keteranganLines = doc.splitTextToSize(t.keterangan, cellW - imgPad * 2);
      doc.text(keteranganLines.slice(0, 2), x + imgPad, infoY);
      doc.setFont(undefined!, "normal");
      doc.setFontSize(6.5);
      const dateStr = new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`${dateStr}  •  ${formatRupiah(t.nominal)}`, x + imgPad, infoY + (keteranganLines.length > 1 ? 7 : 4));

      // Image area
      const imgY = infoY + labelH - 6;
      const imgMaxW = cellW - imgPad * 2;
      const imgMaxH = cellH - (imgY - y) - imgPad;

      if (t.bukti?.tipe === "image") {
        try {
          const imgData = await loadImageAsBase64(t.bukti.url);
          if (imgData) {
            const imgProps = doc.getImageProperties(imgData);
            const ratio = imgProps.width / imgProps.height;
            let w = imgMaxW;
            let h = w / ratio;
            if (h > imgMaxH) {
              h = imgMaxH;
              w = h * ratio;
            }
            const imgX = x + imgPad + (imgMaxW - w) / 2;
            doc.addImage(imgData, "JPEG", imgX, imgY, w, h);
          } else {
            drawPlaceholder(doc, x + imgPad, imgY, imgMaxW, imgMaxH, "[Gambar tidak tersedia]");
          }
        } catch {
          drawPlaceholder(doc, x + imgPad, imgY, imgMaxW, imgMaxH, "[Gambar gagal dimuat]");
        }
      } else if (t.bukti) {
        drawPlaceholder(doc, x + imgPad, imgY, imgMaxW, imgMaxH, `Dokumen: ${t.bukti.url.split("/").pop() || "file"}`);
      }

      // Bukti keterangan at bottom
      if (t.bukti?.keterangan) {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        const ketY = y + cellH - 3;
        doc.text(`Ket: ${t.bukti.keterangan}`, x + imgPad, ketY, { maxWidth: cellW - imgPad * 2 });
        doc.setTextColor(0, 0, 0);
      }
    }
  }
}

function drawPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, text: string) {
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(text, x + w / 2, y + h / 2, { align: "center", maxWidth: w - 4 });
  doc.setTextColor(0, 0, 0);
}

// ─── ANGGARAN SEKSI ───

interface SeksiPdfItem {
  nama_seksi: string;
  anggaran: number;
  realisasi: number;
}

export function printSeksiPdf(items: SeksiPdfItem[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Ringkasan Anggaran per Seksi", 14, 18);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 25);

  const totalAnggaran = items.reduce((s, i) => s + i.anggaran, 0);
  const totalRealisasi = items.reduce((s, i) => s + i.realisasi, 0);

  // Summary boxes
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, 30, 58, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Total Anggaran", 17, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(totalAnggaran), 17, 42);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(78, 30, 58, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Total Realisasi", 81, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(totalRealisasi), 81, 42);

  const sisa = totalAnggaran - totalRealisasi;
  doc.setFillColor(sisa >= 0 ? 37 : 220, sisa >= 0 ? 160 : 53, sisa >= 0 ? 100 : 69);
  doc.roundedRect(142, 30, 54, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Sisa Anggaran", 145, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(sisa), 145, 42);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 50,
    head: [["No", "Nama Seksi", "Anggaran", "Realisasi", "Sisa", "%"]],
    body: items.map((item, i) => {
      const sisa = item.anggaran - item.realisasi;
      const persen = item.anggaran > 0 ? Math.round((item.realisasi / item.anggaran) * 100) : (item.realisasi > 0 ? 100 : 0);
      return [
        i + 1,
        item.nama_seksi,
        formatRupiah(item.anggaran),
        formatRupiah(item.realisasi),
        formatRupiah(sisa),
        `${persen}%`,
      ];
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

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

// ─── GRAFIK / CHARTS ───

interface GrafikPdfData {
  totalMasuk: number;
  totalKeluar: number;
  seksiData: { name: string; value: number }[];
  sumberData: { name: string; value: number }[];
}

export function printGrafikPdf(data: GrafikPdfData) {
  const doc = new jsPDF();
  const { totalMasuk, totalKeluar, seksiData, sumberData } = data;
  const saldo = totalMasuk - totalKeluar;

  doc.setFontSize(14);
  doc.text("Laporan Ringkasan Grafik Keuangan", 14, 18);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 25);

  // Summary boxes
  doc.setFillColor(37, 160, 100);
  doc.roundedRect(14, 30, 55, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Total Masuk", 17, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(totalMasuk), 17, 42);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(75, 30, 55, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Total Keluar", 78, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(totalKeluar), 78, 42);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(136, 30, 55, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Saldo", 139, 36);
  doc.setFontSize(10);
  doc.text(formatRupiah(saldo), 139, 42);

  doc.setTextColor(0, 0, 0);

  // Pengeluaran per Seksi table
  doc.setFontSize(12);
  doc.text("Pengeluaran Per Seksi", 14, 54);

  const totalSeksi = seksiData.reduce((s, d) => s + d.value, 0);
  autoTable(doc, {
    startY: 58,
    head: [["No", "Seksi", "Nominal", "Proporsi"]],
    body: seksiData.map((item, i) => [
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

  // Proporsi Donasi per Sumber table
  const afterSeksi = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(12);
  doc.text("Proporsi Donasi Per Sumber", 14, afterSeksi + 10);

  const totalSumber = sumberData.reduce((s, d) => s + d.value, 0);
  autoTable(doc, {
    startY: afterSeksi + 14,
    head: [["No", "Sumber", "Nominal", "Proporsi"]],
    body: sumberData.map((item, i) => [
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

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

// ─── PRINT ALL PDF ───

export interface PrintAllPdfData {
  targetDonasi: number;
  realisasi: number;
  sumberDana: SumberDana[];
  seksiItems: { nama_seksi: string; anggaran: number; realisasi: number }[];
  transaksi: Transaksi[];
  grafikData: {
    totalMasuk: number;
    totalKeluar: number;
    seksiData: { name: string; value: number }[];
    sumberData: { name: string; value: number }[];
  };
}

export async function printAllPdf(data: PrintAllPdfData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const printDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const { targetDonasi, realisasi, sumberDana, seksiItems, transaksi, grafikData } = data;
  const { totalMasuk, totalKeluar, seksiData, sumberData } = grafikData;
  const saldo = totalMasuk - totalKeluar;
  const persen = targetDonasi > 0 ? Math.min(100, Math.round((realisasi / targetDonasi) * 100)) : 0;

  // ════════════════════════════════════════════════════════
  // PAGE 1: SUMMARY CARDS
  // ════════════════════════════════════════════════════════
  doc.setFillColor(30, 136, 56);
  doc.roundedRect(margin, margin, pageW - margin * 2, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Laporan Lengkap HBH MDTI", margin + 6, margin + 10);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${printDate}`, margin + 6, margin + 17);
  doc.setTextColor(0, 0, 0);

  const cardY = margin + 30;
  const cardW = (pageW - margin * 2 - 12) / 3;
  const cardH = 20;

  // Target Donasi card
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, cardY, cardW, cardH, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Target Donasi", margin + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(targetDonasi), margin + 4, cardY + 15);

  // Realisasi card
  const card2X = margin + cardW + 6;
  doc.setFillColor(37, 160, 100);
  doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Realisasi Donasi", card2X + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(realisasi), card2X + 4, cardY + 15);

  // Status card
  const card3X = margin + (cardW + 6) * 2;
  const statusColor: [number, number, number] = persen >= 100 ? [37, 160, 100] : persen >= 50 ? [200, 140, 0] : [220, 53, 69];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Status Pencapaian", card3X + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(`${persen}% — ${persen >= 100 ? "Tercapai" : persen >= 50 ? "Berjalan Baik" : "Perlu Perhatian"}`, card3X + 4, cardY + 15);

  // Dana summary
  const sumY = cardY + cardH + 8;
  const sumCardW = (pageW - margin * 2 - 12) / 3;

  doc.setFillColor(37, 160, 100);
  doc.roundedRect(margin, sumY, sumCardW, cardH, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Total Dana Masuk", margin + 4, sumY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalMasuk), margin + 4, sumY + 15);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(margin + sumCardW + 6, sumY, sumCardW, cardH, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Total Dana Keluar", margin + sumCardW + 10, sumY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalKeluar), margin + sumCardW + 10, sumY + 15);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + (sumCardW + 6) * 2, sumY, sumCardW, cardH, 2, 2, "F");
  doc.setFontSize(8);
  doc.text("Saldo", margin + (sumCardW + 6) * 2 + 4, sumY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(saldo), margin + (sumCardW + 6) * 2 + 4, sumY + 15);

  doc.setTextColor(0, 0, 0);

  // ════════════════════════════════════════════════════════
  // PAGE 2: SUMBER DONASI
  // ════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, margin, pageW - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Sumber Dana Donasi", margin + 5, margin + 6);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${printDate}`, margin + 5, margin + 11);
  doc.setTextColor(0, 0, 0);

  const totalSumber = sumberDana.reduce((s, d) => s + d.nominal, 0);
  autoTable(doc, {
    startY: margin + 20,
    head: [["No", "Sumber Donasi", "Nominal"]],
    body: sumberDana.map((d, i) => [i + 1, d.namaCabang, formatRupiah(d.nominal)]),
    foot: [["", "TOTAL", formatRupiah(totalSumber)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 12 }, 2: { halign: "right", cellWidth: 40 } },
  });

  // ════════════════════════════════════════════════════════
  // PAGE 3: ANGGARAN SEKSI
  // ════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, margin, pageW - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Ringkasan Anggaran per Seksi", margin + 5, margin + 6);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${printDate}`, margin + 5, margin + 11);
  doc.setTextColor(0, 0, 0);

  const totalAng = seksiItems.reduce((s, i) => s + i.anggaran, 0);
  const totalReal = seksiItems.reduce((s, i) => s + i.realisasi, 0);
  const sisaTotal = totalAng - totalReal;

  // Summary boxes for seksi
  const seksiSumY = margin + 20;
  const boxW3 = (pageW - margin * 2 - 8) / 3;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, seksiSumY, boxW3, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Total Anggaran", margin + 3, seksiSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(totalAng), margin + 3, seksiSumY + 10);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(margin + boxW3 + 4, seksiSumY, boxW3, 12, 2, 2, "F");
  doc.setFontSize(7);
  doc.text("Total Realisasi", margin + boxW3 + 7, seksiSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(totalReal), margin + boxW3 + 7, seksiSumY + 10);

  doc.setFillColor(sisaTotal >= 0 ? 37 : 220, sisaTotal >= 0 ? 160 : 53, sisaTotal >= 0 ? 100 : 69);
  doc.roundedRect(margin + (boxW3 + 4) * 2, seksiSumY, boxW3, 12, 2, 2, "F");
  doc.setFontSize(7);
  doc.text("Sisa Anggaran", margin + (boxW3 + 4) * 2 + 3, seksiSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(sisaTotal), margin + (boxW3 + 4) * 2 + 3, seksiSumY + 10);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: seksiSumY + 18,
    head: [["No", "Nama Seksi", "Anggaran", "Realisasi", "Sisa", "%"]],
    body: seksiItems.map((item, i) => {
      const sisa = item.anggaran - item.realisasi;
      const p = item.anggaran > 0 ? Math.round((item.realisasi / item.anggaran) * 100) : (item.realisasi > 0 ? 100 : 0);
      return [i + 1, item.nama_seksi, formatRupiah(item.anggaran), formatRupiah(item.realisasi), formatRupiah(sisa), `${p}%`];
    }),
    foot: [["", "TOTAL", formatRupiah(totalAng), formatRupiah(totalReal), formatRupiah(sisaTotal), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "center", cellWidth: 14 },
    },
    didParseCell: (cellData) => {
      if (cellData.section === "body" && cellData.column.index === 5) {
        const pct = parseInt(cellData.cell.raw as string);
        if (pct > 100) cellData.cell.styles.textColor = [220, 53, 69];
        else if (pct >= 75) cellData.cell.styles.textColor = [200, 140, 0];
        else cellData.cell.styles.textColor = [37, 160, 100];
      }
    },
  });

  // ════════════════════════════════════════════════════════
  // PAGES: TRANSAKSI DANA MASUK
  // ════════════════════════════════════════════════════════
  const sorted = [...transaksi].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const dataMasuk = sorted.filter((t) => t.jenis === "masuk");
  const dataKeluar = sorted.filter((t) => t.jenis === "keluar");
  const tMasuk = dataMasuk.reduce((s, t) => s + t.nominal, 0);
  const tKeluar = dataKeluar.reduce((s, t) => s + t.nominal, 0);

  doc.addPage();
  doc.setFillColor(37, 160, 100);
  doc.roundedRect(margin, margin, pageW - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Laporan Dana Masuk", margin + 5, margin + 6);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${printDate}`, margin + 5, margin + 11);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: margin + 20,
    head: [["No", "Tanggal", "Keterangan", "Sumber Dana", "Nominal", "Bukti"]],
    body: dataMasuk.map((t, i) => [
      i + 1,
      new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      t.keterangan,
      t.kategori,
      formatRupiah(t.nominal),
      t.bukti ? "Ada" : "-",
    ]),
    foot: [["", "", "", "TOTAL", formatRupiah(tMasuk), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 160, 100] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 32 },
      5: { cellWidth: 14, halign: "center" },
    },
  });

  // ════════════════════════════════════════════════════════
  // PAGES: TRANSAKSI DANA KELUAR
  // ════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(220, 53, 69);
  doc.roundedRect(margin, margin, pageW - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Laporan Dana Keluar", margin + 5, margin + 6);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${printDate}`, margin + 5, margin + 11);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: margin + 20,
    head: [["No", "Tanggal", "Keterangan", "Seksi", "Nominal", "Bukti"]],
    body: dataKeluar.map((t, i) => [
      i + 1,
      new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      t.keterangan,
      t.kategori,
      formatRupiah(t.nominal),
      t.bukti ? "Ada" : "-",
    ]),
    foot: [["", "", "", "TOTAL", formatRupiah(tKeluar), ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 53, 69] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 32 },
      5: { cellWidth: 14, halign: "center" },
    },
  });

  // ════════════════════════════════════════════════════════
  // PAGES: BUKTI DANA MASUK (2x2 grid, 4 per page)
  // ════════════════════════════════════════════════════════
  const masukWithBukti = dataMasuk.filter((t) => t.bukti);
  if (masukWithBukti.length > 0) {
    await renderBuktiPages(doc, masukWithBukti, "Lampiran Bukti Pembayaran — Dana Masuk", [37, 160, 100], margin, pageW, pageH, printDate);
  }

  // ════════════════════════════════════════════════════════
  // PAGES: BUKTI DANA KELUAR (2x2 grid, 4 per page)
  // ════════════════════════════════════════════════════════
  const keluarWithBukti = dataKeluar.filter((t) => t.bukti);
  if (keluarWithBukti.length > 0) {
    await renderBuktiPages(doc, keluarWithBukti, "Lampiran Bukti Pembayaran — Dana Keluar", [220, 53, 69], margin, pageW, pageH, printDate);
  }

  // ════════════════════════════════════════════════════════
  // PAGES: GRAFIK - Pengeluaran per Seksi & Proporsi Donasi
  // ════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, margin, pageW - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Laporan Ringkasan Grafik Keuangan", margin + 5, margin + 6);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${printDate}`, margin + 5, margin + 11);
  doc.setTextColor(0, 0, 0);

  // Summary boxes
  const gSumY = margin + 20;
  doc.setFillColor(37, 160, 100);
  doc.roundedRect(margin, gSumY, boxW3, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Total Masuk", margin + 3, gSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(totalMasuk), margin + 3, gSumY + 10);

  doc.setFillColor(220, 53, 69);
  doc.roundedRect(margin + boxW3 + 4, gSumY, boxW3, 12, 2, 2, "F");
  doc.setFontSize(7);
  doc.text("Total Keluar", margin + boxW3 + 7, gSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(totalKeluar), margin + boxW3 + 7, gSumY + 10);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + (boxW3 + 4) * 2, gSumY, boxW3, 12, 2, 2, "F");
  doc.setFontSize(7);
  doc.text("Saldo", margin + (boxW3 + 4) * 2 + 3, gSumY + 5);
  doc.setFontSize(9);
  doc.text(formatRupiah(saldo), margin + (boxW3 + 4) * 2 + 3, gSumY + 10);

  doc.setTextColor(0, 0, 0);

  // Pengeluaran per Seksi table
  doc.setFontSize(11);
  doc.text("Pengeluaran Per Seksi", margin, gSumY + 22);

  const totalSeksiVal = seksiData.reduce((s, d) => s + d.value, 0);
  autoTable(doc, {
    startY: gSumY + 26,
    head: [["No", "Seksi", "Nominal", "Proporsi"]],
    body: seksiData.map((item, i) => [
      i + 1,
      item.name,
      formatRupiah(item.value),
      totalSeksiVal > 0 ? `${((item.value / totalSeksiVal) * 100).toFixed(1)}%` : "0%",
    ]),
    foot: [["", "TOTAL", formatRupiah(totalSeksiVal), "100%"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "center", cellWidth: 22 } },
  });

  // Proporsi Donasi per Sumber table
  const afterSeksiT = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(11);
  doc.text("Proporsi Donasi Per Sumber", margin, afterSeksiT + 10);

  const totalSumberVal = sumberData.reduce((s, d) => s + d.value, 0);
  autoTable(doc, {
    startY: afterSeksiT + 14,
    head: [["No", "Sumber", "Nominal", "Proporsi"]],
    body: sumberData.map((item, i) => [
      i + 1,
      item.name,
      formatRupiah(item.value),
      totalSumberVal > 0 ? `${((item.value / totalSumberVal) * 100).toFixed(1)}%` : "0%",
    ]),
    foot: [["", "TOTAL", formatRupiah(totalSumberVal), "100%"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "center", cellWidth: 22 } },
  });

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
