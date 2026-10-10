const $ = (id) => document.getElementById(id);

let mahasiswa = [
  { nama: "Budi Santoso", nim: "124140001", jurusan: "Teknik Informatika", nilai: 85 },
  { nama: "Citra Lestari", nim: "124140002", jurusan: "Teknik Informatika", nilai: 92 },
  { nama: "Andi Wijaya", nim: "124140003", jurusan: "Sistem Informasi", nilai: 70 },
  { nama: "Dewi Anggraini", nim: "124140004", jurusan: "Teknik Informatika", nilai: 78 },
  { nama: "Eko Prasetyo", nim: "124140005", jurusan: "Sains Data", nilai: 64 },
];
let tampilan = null;   // null = tampilkan semua
let indexEdit = -1;    // -1 = mode tambah

function rataRata(data) {
  return data.reduce((s, m) => s + m.nilai, 0) / data.length;
}

function render(data = mahasiswa) {
  const tbody = $("tbody");
  tbody.innerHTML = "";
  data.forEach((m, i) => {
    const tr = document.createElement("tr");
    [i + 1, m.nama, m.nim, m.jurusan, m.nilai].forEach((v) => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });
    const aksi = document.createElement("td");
    const idx = mahasiswa.indexOf(m);
    const be = document.createElement("button"); be.textContent = "Edit"; be.className = "alt";
    be.addEventListener("click", () => mulaiEdit(idx));
    const bh = document.createElement("button"); bh.textContent = "Hapus"; bh.className = "del";
    bh.addEventListener("click", () => hapus(idx));
    aksi.append(be, bh);
    tr.appendChild(aksi);
    tbody.appendChild(tr);
  });
}

function tampil(data, info) {
  tampilan = { data, info };
  $("info").textContent = info;
  render(data);
}
function refresh() {
  if (tampilan) { $("info").textContent = tampilan.info; }
  tampil(mahasiswa, `${mahasiswa.length} mahasiswa, rata-rata nilai ${mahasiswa.length ? rataRata(mahasiswa).toFixed(2) : 0}`);
}

// Pencarian nilai tertinggi (reduce)
$("btn-tertinggi").addEventListener("click", () => {
  if (!mahasiswa.length) return;
  const top = mahasiswa.reduce((a, b) => (b.nilai > a.nilai ? b : a));
  tampil([top], `Nilai tertinggi: ${top.nama} (${top.nilai})`);
});
// Filter di atas rata-rata
$("btn-atas").addEventListener("click", () => {
  const r = rataRata(mahasiswa);
  tampil(mahasiswa.filter((m) => m.nilai > r), `Nilai di atas rata-rata (${r.toFixed(2)})`);
});
// Sort berdasarkan nama (salinan agar urutan asli aman)
function urutkan(arah) {
  const hasil = [...mahasiswa].sort((a, b) => arah * a.nama.localeCompare(b.nama, "id"));
  tampil(hasil, arah === 1 ? "Diurutkan nama A-Z" : "Diurutkan nama Z-A");
}
$("btn-asc").addEventListener("click", () => urutkan(1));
$("btn-desc").addEventListener("click", () => urutkan(-1));
$("btn-semua").addEventListener("click", refresh);

// CRUD
function bersihForm() {
  ["f-nama", "f-nim", "f-jurusan", "f-nilai"].forEach((id) => ($(id).value = ""));
  indexEdit = -1;
  $("judul-form").textContent = "Tambah mahasiswa (Create / Update)";
  $("f-err").textContent = "";
}
function mulaiEdit(i) {
  const m = mahasiswa[i];
  $("f-nama").value = m.nama; $("f-nim").value = m.nim;
  $("f-jurusan").value = m.jurusan; $("f-nilai").value = m.nilai;
  indexEdit = i;
  $("judul-form").textContent = "Edit mahasiswa: " + m.nama;
}
function hapus(i) {
  mahasiswa.splice(i, 1);
  bersihForm();
  refresh();
}
$("btn-simpan").addEventListener("click", () => {
  const data = {
    nama: $("f-nama").value.trim(), nim: $("f-nim").value.trim(),
    jurusan: $("f-jurusan").value.trim(), nilai: Number($("f-nilai").value),
  };
  if (!data.nama || !data.nim || !data.jurusan || $("f-nilai").value.trim() === "" || data.nilai < 0 || data.nilai > 100) {
    $("f-err").textContent = "Semua kolom wajib diisi dan nilai harus 0-100.";
    return;
  }
  if (indexEdit === -1) mahasiswa.push(data);
  else mahasiswa[indexEdit] = data;
  bersihForm();
  refresh();
});
$("btn-batal").addEventListener("click", bersihForm);

refresh();
