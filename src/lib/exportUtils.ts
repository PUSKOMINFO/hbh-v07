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
  const totalMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  const doc = new jsPDF();

  // Title
  doc.setFontSize(14);
  doc.text("Laporan Dana Masuk & Keluar", 14, 18);
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

  // Transaction table
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

  // Now add bukti images on separate pages
  const itemsWithBukti = sorted.filter((t) => t.bukti);
  if (itemsWithBukti.length > 0) {
    doc.addPage();
    doc.setFontSize(13);
    doc.text("Lampiran Bukti Transaksi", 14, 18);
    let yPos = 28;

    for (const t of itemsWithBukti) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 18;
      }

      doc.setFontSize(9);
      doc.setFont(undefined!, "bold");
      doc.text(t.keterangan, 14, yPos);
      doc.setFont(undefined!, "normal");
      doc.setFontSize(8);
      doc.text(
        `${new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} — ${formatRupiah(t.nominal)} (${t.jenis === "masuk" ? "Masuk" : "Keluar"})`,
        14,
        yPos + 5
      );

      if (t.bukti?.tipe === "image") {
        try {
          const imgData = await loadImageAsBase64(t.bukti.url);
          if (imgData) {
            const imgProps = doc.getImageProperties(imgData);
            const maxW = 80;
            const ratio = imgProps.width / imgProps.height;
            const w = Math.min(maxW, imgProps.width * 0.26);
            const h = w / ratio;
            doc.addImage(imgData, "JPEG", 14, yPos + 8, w, h);
            yPos += h + 16;
          } else {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`[Gambar: ${t.bukti.url}]`, 14, yPos + 10);
            doc.setTextColor(0, 0, 0);
            yPos += 18;
          }
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`[Gambar tidak dapat dimuat]`, 14, yPos + 10);
          doc.setTextColor(0, 0, 0);
          yPos += 18;
        }
      } else if (t.bukti) {
        doc.setFontSize(8);
        doc.setTextColor(37, 99, 235);
        doc.textWithLink(`Dokumen: ${t.bukti.url.split("/").pop() || "file"}`, 14, yPos + 10, { url: t.bukti.url });
        doc.setTextColor(0, 0, 0);
        yPos += 18;
      }

      if (t.bukti?.keterangan) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Ket: ${t.bukti.keterangan}`, 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }
    }
  }

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
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
