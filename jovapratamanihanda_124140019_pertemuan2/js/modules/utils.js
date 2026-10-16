// js/modules/utils.js
// Kumpulan fungsi utilitas murni (tanpa efek samping) yang diekspor ke modul lain.

/** Mencegah XSS: semua teks dari pengguna di-escape sebelum masuk ke innerHTML. */
export const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

/** Membuat ID unik, contoh: task_lq3k9x2ab1c */
export const generateId = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Mengubah Date menjadi string "YYYY-MM-DD" (zona waktu lokal) untuk <input type="date"> */
export const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Parse "YYYY-MM-DD" menjadi objek Date lokal (menghindari bug pergeseran zona waktu UTC) */
const parseLocalDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** Selisih hari antara hari ini dan deadline (negatif = sudah lewat) */
export const daysUntil = (isoDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(isoDate) - today) / 86_400_000);
};

export const formatDate = (isoDate) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parseLocalDate(isoDate));

export const formatLongDate = (date = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);

export const formatClock = (date = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date).replace(/\./g, ":");

/** Teks relatif untuk deadline, misal "Besok" atau "Terlambat 2 hari" */
export const describeDeadline = (days) => {
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
};

export const getGreeting = (hour = new Date().getHours()) => {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

/** Konversi "HH:MM" menjadi menit sejak tengah malam (untuk validasi & sorting jadwal) */
export const timeToMinutes = (time = "00:00") => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Menerjemahkan kode cuaca WMO dari Open-Meteo menjadi label & ikon */
export const weatherCodeToText = (code) => {
  if (code === 0) return { label: "Cerah", icon: "☀️" };
  if (code <= 2) return { label: "Cerah berawan", icon: "🌤️" };
  if (code === 3) return { label: "Mendung", icon: "☁️" };
  if (code <= 48) return { label: "Berkabut", icon: "🌫️" };
  if (code <= 57) return { label: "Gerimis", icon: "🌦️" };
  if (code <= 67) return { label: "Hujan", icon: "🌧️" };
  if (code <= 77) return { label: "Salju", icon: "❄️" };
  if (code <= 82) return { label: "Hujan lokal", icon: "🌧️" };
  return { label: "Badai petir", icon: "⛈️" };
};

/** Menunda eksekusi fungsi sampai pengguna berhenti mengetik */
export const debounce = (callback, delay = 250) => {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), delay);
  };
};
