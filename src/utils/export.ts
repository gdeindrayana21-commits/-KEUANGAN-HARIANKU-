import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Account, CategoryBreakdownItem } from '../types';
import { formatRupiah } from './currency';
import { formatTanggalIndonesia } from './date';

interface ExportSummaryData {
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  transactionsCount: number;
}

/**
 * Clean string for CSV escaping
 */
function escapeCsv(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. EXPORT TO CSV (Section 28)
 */
export function exportToCSV(
  transactions: Transaction[],
  summary: ExportSummaryData,
  fileNamePeriod: string = 'Laporan'
) {
  const headers = ['No', 'Tanggal', 'Waktu', 'Jenis', 'Kategori', 'Keterangan', 'Akun', 'Nominal (Rp)'];
  const rows: string[][] = [];

  transactions.forEach((tx, index) => {
    rows.push([
      String(index + 1),
      tx.date,
      tx.time || '-',
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      tx.categoryName,
      tx.description || '-',
      tx.accountName,
      String(Math.round(Number(tx.amount) || 0)),
    ]);
  });

  // Summary lines at the bottom
  const emptyRow = ['', '', '', '', '', '', '', ''];
  const summaryIncomeRow = ['', '', '', '', '', '', 'TOTAL PEMASUKAN', String(summary.totalIncome)];
  const summaryExpenseRow = ['', '', '', '', '', '', 'TOTAL PENGELUARAN', String(summary.totalExpense)];
  const summaryNetRow = ['', '', '', '', '', '', 'SALDO BERSIH', String(summary.netIncome)];
  const summaryCountRow = ['', '', '', '', '', '', 'JUMLAH TRANSAKSI', String(summary.transactionsCount)];

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
    emptyRow.map(escapeCsv).join(','),
    summaryIncomeRow.map(escapeCsv).join(','),
    summaryExpenseRow.map(escapeCsv).join(','),
    summaryNetRow.map(escapeCsv).join(','),
    summaryCountRow.map(escapeCsv).join(','),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = fileNamePeriod.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `Laporan_Keuangan_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. EXPORT TO EXCEL (Section 29)
 * Workbook:
 * Sheet 1: Ringkasan
 * Sheet 2: Transaksi
 * Sheet 3: Kategori
 * Sheet 4: Akun
 */
export function exportToExcel(
  transactions: Transaction[],
  accounts: Account[],
  categoriesBreakdown: CategoryBreakdownItem[],
  summary: ExportSummaryData,
  fileNamePeriod: string = 'Laporan'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const summaryData = [
    ['KEUANGAN HARIANKU - RINGKASAN LAPORAN'],
    ['Periode:', summary.periodLabel],
    ['Tanggal Dibuat:', formatTanggalIndonesia(new Date())],
    [],
    ['Metrik', 'Nilai (Rp / Jumlah)'],
    ['Total Pemasukan', summary.totalIncome],
    ['Total Pengeluaran', summary.totalExpense],
    ['Saldo Bersih Periode', summary.netIncome],
    ['Jumlah Transaksi', summary.transactionsCount],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Transaksi
  const txHeaders = ['No', 'Tanggal', 'Waktu', 'Jenis', 'Kategori', 'Keterangan', 'Akun', 'Nominal (Rp)'];
  const txRows = transactions.map((tx, idx) => [
    idx + 1,
    tx.date,
    tx.time || '-',
    tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    tx.categoryName,
    tx.description || '-',
    tx.accountName,
    Math.round(Number(tx.amount) || 0),
  ]);
  const wsTransactions = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transaksi');

  // Sheet 3: Kategori
  const catHeaders = ['No', 'Kategori', 'Jenis', 'Jumlah Transaksi', 'Total Nominal (Rp)', 'Persentase (%)'];
  const catRows = categoriesBreakdown.map((cat, idx) => [
    idx + 1,
    cat.categoryName,
    cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    cat.transactionsCount,
    cat.totalAmount,
    `${cat.percentage}%`,
  ]);
  const wsCategories = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Kategori');

  // Sheet 4: Akun
  const accHeaders = ['No', 'Nama Akun', 'Jenis', 'Saldo Awal (Rp)', 'Saldo Terkini (Rp)', 'Status'];
  const accRows = accounts.map((acc, idx) => [
    idx + 1,
    acc.name,
    acc.type,
    acc.initialBalance,
    acc.currentBalance,
    acc.isActive ? 'Aktif' : 'Nonaktif',
  ]);
  const wsAccounts = XLSX.utils.aoa_to_sheet([accHeaders, ...accRows]);
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Akun');

  // Download XLSX
  const safeName = fileNamePeriod.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Laporan_Keuangan_${safeName}.xlsx`);
}

/**
 * 3. EXPORT TO PDF (Section 30)
 * Header:
 * KEUANGAN HARIANKU
 * LAPORAN KEUANGAN
 * Periode: ...
 * Tanggal dibuat: ...
 * Ringkasan: Total Pemasukan, Total Pengeluaran, Saldo Bersih, Jumlah Transaksi
 * Tabel transaksi
 */
export function exportToPDF(
  transactions: Transaction[],
  summary: ExportSummaryData,
  fileNamePeriod: string = 'Laporan'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // Emerald color
  doc.text('KEUANGAN HARIANKU', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('LAPORAN KEUANGAN', 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Periode: ${summary.periodLabel}`, 14, 31);
  doc.text(`Tanggal dibuat: ${formatTanggalIndonesia(new Date())}`, 14, 36);

  // Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN', 20, 46);
  doc.text('TOTAL PENGELUARAN', 65, 46);
  doc.text('SALDO BERSIH', 115, 46);
  doc.text('TRANSAKSI', 160, 46);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text(formatRupiah(summary.totalIncome), 20, 54);

  doc.setTextColor(225, 29, 72); // Rose-600
  doc.text(formatRupiah(summary.totalExpense), 65, 54);

  doc.setTextColor(30, 41, 59);
  doc.text(formatRupiah(summary.netIncome), 115, 54);

  doc.setTextColor(30, 41, 59);
  doc.text(`${summary.transactionsCount} tx`, 160, 54);

  // Transactions Table
  const tableData = transactions.map((tx, idx) => [
    String(idx + 1),
    tx.date,
    tx.time || '-',
    tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    tx.categoryName,
    tx.description || '-',
    tx.accountName,
    formatRupiah(tx.amount),
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['No', 'Tanggal', 'Waktu', 'Jenis', 'Kategori', 'Keterangan', 'Akun', 'Nominal']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [51, 65, 85],
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 15 },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 22 },
      7: { cellWidth: 26, halign: 'right' },
    },
    didDrawPage: (data) => {
      // Footer page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} | Keuangan Harianku`,
        14,
        doc.internal.pageSize.height - 10
      );
    },
  });

  const safeName = fileNamePeriod.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Laporan_Keuangan_${safeName}.pdf`);
}

/**
 * 4. PRINT REPORT (Section 31)
 */
export function printReport() {
  window.print();
}
