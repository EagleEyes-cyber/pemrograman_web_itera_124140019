const $ = (id) => document.getElementById(id);
const angka = (id) => ($(id).value.trim() === "" ? NaN : Number($(id).value));
const tulis = (id, teks, kelas = "") => { $(id).textContent = teks; $(id).className = "out " + kelas; };

// 1. Data diri (const untuk nilai tetap, let untuk nilai yang bisa berubah)
const nama = "Jova Pratama Nihanda";
const nim = "124140019";
let umurSaya = 20;
let kotaAsal = "Bandar Lampung";
$("data-diri").textContent = `Nama: ${nama} | NIM: ${nim} | Umur: ${umurSaya} | Kota asal: ${kotaAsal}`;
console.log(nama, nim, umurSaya, kotaAsal);

// 2. Kelulusan
$("btn-lulus").addEventListener("click", () => {
  const n = angka("nilai-lulus");
  if (isNaN(n)) return tulis("out-lulus", "Masukkan nilai yang valid.", "err");
  if (n >= 70) tulis("out-lulus", `Nilai ${n}: LULUS`, "ok");
  else tulis("out-lulus", `Nilai ${n}: TIDAK LULUS`, "err");
});

// 3. Kategori umur
function kategoriUmur(u) {
  if (u < 12) return "Anak";
  else if (u <= 17) return "Remaja";
  else if (u <= 59) return "Dewasa";
  return "Lansia";
}
$("btn-umur").addEventListener("click", () => {
  const u = angka("umur");
  if (isNaN(u) || u < 0) return tulis("out-umur", "Masukkan umur yang valid.", "err");
  tulis("out-umur", `Umur ${u} tahun: ${kategoriUmur(u)}`);
});

// 4. Switch-case hari
function namaHariInggris(h) {
  switch (h) {
    case 1: return "Monday";
    case 2: return "Tuesday";
    case 3: return "Wednesday";
    case 4: return "Thursday";
    case 5: return "Friday";
    case 6: return "Saturday";
    case 7: return "Sunday";
    default: return null;
  }
}
$("btn-hari").addEventListener("click", () => {
  const h = angka("hari");
  const hasil = namaHariInggris(h);
  if (hasil === null) return tulis("out-hari", "Masukkan angka 1 sampai 7.", "err");
  tulis("out-hari", `Hari ke-${h}: ${hasil}`);
});

// 5. Grade dengan ternary (bersarang)
$("btn-grade").addEventListener("click", () => {
  const n = angka("nilai-grade");
  if (isNaN(n) || n < 0 || n > 100) return tulis("out-grade", "Masukkan nilai 0-100.", "err");
  const grade = n >= 90 ? "A" : n >= 80 ? "B" : n >= 70 ? "C" : n >= 60 ? "D" : "E";
  tulis("out-grade", `Nilai ${n}: Grade ${grade}`);
});
