const $ = (id) => document.getElementById(id);
const PER_HALAMAN = 5;
let semuaPost = [];
let hasilFilter = [];
let halaman = 1;

// Dark mode: toggle class pada body, pilihan disimpan di localStorage
try { if (localStorage.getItem("tema") === "dark") document.body.classList.add("dark"); } catch (e) {}
$("btn-dark").addEventListener("click", () => {
  const gelap = document.body.classList.toggle("dark");
  try { localStorage.setItem("tema", gelap ? "dark" : "light"); } catch (e) {}
});

// Fetch API dengan async/await
$("btn-fetch").addEventListener("click", async () => {
  $("status").className = "out";
  $("status").textContent = "Memuat data...";
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!res.ok) throw new Error("HTTP " + res.status);
    semuaPost = await res.json();
    $("cari").disabled = false;
    $("status").textContent = `${semuaPost.length} post berhasil dimuat.`;
    terapkanFilter();
  } catch (error) {
    $("status").className = "out err";
    $("status").textContent = "Gagal mengambil data: " + error.message;
  }
});

// Search / filter berdasarkan title
function terapkanFilter() {
  const kata = $("cari").value.trim().toLowerCase();
  hasilFilter = semuaPost.filter((p) => p.title.toLowerCase().includes(kata));
  halaman = 1;
  tampilHalaman();
}
$("cari").addEventListener("input", terapkanFilter);

// Pagination
function tampilHalaman() {
  const totalHalaman = Math.max(1, Math.ceil(hasilFilter.length / PER_HALAMAN));
  const awal = (halaman - 1) * PER_HALAMAN;
  const daftar = $("daftar");
  daftar.innerHTML = "";
  hasilFilter.slice(awal, awal + PER_HALAMAN).forEach((p) => {
    const div = document.createElement("div");
    div.className = "post";
    const h = document.createElement("strong"); h.textContent = p.title;
    const b = document.createElement("p"); b.textContent = p.body;
    div.append(h, b);
    daftar.appendChild(div);
  });
  if (!hasilFilter.length) daftar.textContent = "Tidak ada post yang cocok.";
  $("halaman").textContent = ` Halaman ${halaman} dari ${totalHalaman} `;
  $("btn-prev").disabled = halaman <= 1;
  $("btn-next").disabled = halaman >= totalHalaman;
}
$("btn-prev").addEventListener("click", () => { halaman--; tampilHalaman(); });
$("btn-next").addEventListener("click", () => { halaman++; tampilHalaman(); });
