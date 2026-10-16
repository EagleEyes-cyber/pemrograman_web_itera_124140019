// js/modules/data.js
// Konstanta aplikasi dan data awal (seed) yang diekspor untuk modul lain.
import { toDateInputValue } from "./utils.js";

export const STORAGE_KEYS = Object.freeze({
  tasks: "kuliahku:tasks",
  schedule: "kuliahku:schedule",
  theme: "kuliahku:theme",
  quote: "kuliahku:quote"
});

export const API_ENDPOINTS = Object.freeze({
  weather: "https://api.open-meteo.com/v1/forecast",
  quote: "https://dummyjson.com/quotes/random"
});

// Koordinat kampus ITERA (Lampung Selatan)
export const ITERA_COORDS = Object.freeze({ latitude: -5.36, longitude: 105.31 });

export const DAYS = Object.freeze([
  "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
]);

export const PRIORITY_LABELS = Object.freeze({
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah"
});

export const COURSE_SUGGESTIONS = Object.freeze([
  "Pengembangan Aplikasi Web",
  "Basis Data",
  "Struktur Data",
  "Jaringan Komputer",
  "Kalkulus",
  "Organisasi / Kegiatan"
]);

// Dipakai ketika API kutipan tidak dapat dijangkau (offline / error)
export const FALLBACK_QUOTES = Object.freeze([
  { quote: "Mulai saja dulu, sempurnakan sambil jalan.", author: "KuliahKu" },
  { quote: "Tugas kecil yang selesai hari ini lebih baik daripada tugas besar yang ditunda.", author: "KuliahKu" },
  { quote: "Konsisten sedikit setiap hari mengalahkan begadang sekali seminggu.", author: "KuliahKu" }
]);

/** Menghasilkan tanggal "YYYY-MM-DD" yang digeser sekian hari dari hari ini */
const dateFromToday = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateInputValue(date);
};

/** Data contoh tugas untuk pengguna baru (dibuat dengan fungsi agar deadline relatif terhadap hari ini) */
export const createDefaultTasks = () => [
  {
    title: "Selesaikan Tugas Personal Dashboard (Pertemuan 2)",
    course: "Pengembangan Aplikasi Web",
    deadline: "2026-10-17",
    priority: "high"
  },
  {
    title: "Latihan query JOIN untuk praktikum",
    course: "Basis Data",
    deadline: dateFromToday(3),
    priority: "medium"
  },
  {
    title: "Baca materi Binary Tree",
    course: "Struktur Data",
    deadline: dateFromToday(6),
    priority: "low"
  },
  {
    title: "Rapat koordinasi himpunan",
    course: "Organisasi / Kegiatan",
    deadline: dateFromToday(-1),
    priority: "medium"
  }
];

/** Data contoh jadwal kuliah untuk pengguna baru */
export const createDefaultSchedule = () => [
  { course: "Pengembangan Aplikasi Web", day: "Kamis", start: "08:00", end: "10:30", room: "Lab Komputer 2" },
  { course: "Basis Data", day: "Senin", start: "10:00", end: "12:30", room: "GK 2-103" },
  { course: "Struktur Data", day: "Rabu", start: "13:00", end: "15:30", room: "GK 1-204" },
  { course: "Jaringan Komputer", day: "Jumat", start: "09:00", end: "11:30", room: "Lab Jaringan" }
];
