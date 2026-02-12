export interface SumberDana {
  id: string;
  namaCabang: string;
  sumberLain: string;
  skg: number;
  nominal: number;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  keterangan: string;
  jenis: 'masuk' | 'keluar';
  nominal: number;
  kategori: string;
  bukti?: {
    url: string;
    tipe: string; // 'image' | 'document'
    keterangan?: string;
  };
}

export const initialSumberDana: SumberDana[] = [
  { id: '1', namaCabang: 'KANJENG GURU KH IMRONI ABDILLAH', sumberLain: '', skg: 0, nominal: 500000 },
  { id: '2', namaCabang: 'BANDUNG', sumberLain: '', skg: 17, nominal: 1050000 },
  { id: '3', namaCabang: 'BATANG', sumberLain: '', skg: 18, nominal: 450000 },
  { id: '4', namaCabang: 'BOJONEGORO 1 - KAPAS', sumberLain: '', skg: 2, nominal: 200000 },
  { id: '5', namaCabang: 'BOJONEGORO 2 - SEKAR', sumberLain: '', skg: 24, nominal: 300000 },
  { id: '6', namaCabang: 'CIREBON', sumberLain: '', skg: 15, nominal: 450000 },
  { id: '7', namaCabang: 'DEMAK 1 - WONOKETINGAL', sumberLain: '', skg: 40, nominal: 2500000 },
  { id: '8', namaCabang: 'DEMAK 2 - DEMPET', sumberLain: '', skg: 40, nominal: 1400000 },
  { id: '9', namaCabang: 'DEMAK 3 (MRANGGEN)', sumberLain: '', skg: 37, nominal: 950000 },
  { id: '10', namaCabang: 'GARUT', sumberLain: '', skg: 4, nominal: 100000 },
  { id: '11', namaCabang: 'GROBOGAN 1 - PURWODADI', sumberLain: '', skg: 57, nominal: 1000000 },
  { id: '12', namaCabang: 'GROBOGAN 2 - GODONG', sumberLain: '', skg: 16, nominal: 1360000 },
];

export const initialTransaksi: Transaksi[] = [
  { id: '1', tanggal: '2025-03-15', keterangan: 'Donasi Cabang Bandung', jenis: 'masuk', nominal: 1050000, kategori: 'Donasi Cabang' },
  { 
    id: '2', 
    tanggal: '2025-03-18', 
    keterangan: 'Sewa Venue Halal Bi Halal', 
    jenis: 'keluar', 
    nominal: 5000000, 
    kategori: 'Operasional',
    bukti: {
      url: 'https://images.unsplash.com/photo-1562183241-bd70286b63d0?w=800',
      tipe: 'image',
      keterangan: 'Invoice Sewa Venue'
    }
  },
  { id: '3', tanggal: '2025-03-20', keterangan: 'Donasi Cabang Demak 1', jenis: 'masuk', nominal: 2500000, kategori: 'Donasi Cabang' },
  { 
    id: '4', 
    tanggal: '2025-03-25', 
    keterangan: 'Konsumsi Acara', 
    jenis: 'keluar', 
    nominal: 3000000, 
    kategori: 'Konsumsi',
    bukti: {
      url: 'https://images.unsplash.com/photo-1547521868-14fab9fedca2?w=800',
      tipe: 'image',
      keterangan: 'Struk Belanja Konsumsi'
    }
  },
  { id: '5', tanggal: '2025-04-01', keterangan: 'Donasi Cabang Cirebon', jenis: 'masuk', nominal: 450000, kategori: 'Donasi Cabang' },
  { 
    id: '6', 
    tanggal: '2025-04-03', 
    keterangan: 'Cetak Undangan', 
    jenis: 'keluar', 
    nominal: 1500000, 
    kategori: 'Perlengkapan' 
  },
];

export const TARGET_DONASI = 50000000;
