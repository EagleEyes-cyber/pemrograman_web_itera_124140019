const $ = (id) => document.getElementById(id);

// ---- Helper localStorage (JSON.stringify / JSON.parse) ----
function muat(kunci) {
  try {
    const data = JSON.parse(localStorage.getItem(kunci));
    return Array.isArray(data) ? data : [];
  } catch (e) { return []; }
}
function simpan(kunci, data) {
  localStorage.setItem(kunci, JSON.stringify(data));
}

// ---- Form mahasiswa dengan validasi ----
let daftarMhs = muat("latihanMahasiswa");

function renderMhs() {
  const tbody = $("tbody-mhs");
  tbody.innerHTML = "";
  daftarMhs.forEach((m, i) => {
    const tr = document.createElement("tr");
    [m.nama, m.nim, m.jurusan, m.nilai].forEach((v) => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });
    const td = document.createElement("td");
    const b = document.createElement("button");
    b.textContent = "Hapus"; b.className = "del";
    b.addEventListener("click", () => { daftarMhs.splice(i, 1); simpan("latihanMahasiswa", daftarMhs); renderMhs(); });
    td.appendChild(b);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

function validasiMhs() {
  const nama = $("m-nama").value.trim();
  const nim = $("m-nim").value.trim();
  const jurusan = $("m-jurusan").value.trim();
  const nilaiTeks = $("m-nilai").value.trim();
  const nilai = Number(nilaiTeks);
  const error = {
    nama: nama.length < 3 ? "Nama minimal 3 karakter." : "",
    nim: !/^\d{9}$/.test(nim) ? "NIM harus 9 digit angka." : "",
    jurusan: jurusan === "" ? "Jurusan wajib diisi." : "",
    nilai: nilaiTeks === "" || nilai < 0 || nilai > 100 ? "Nilai harus 0-100." : "",
  };
  Object.keys(error).forEach((k) => ($("e-" + k).textContent = " " + error[k]));
  return Object.values(error).every((e) => e === "") ? { nama, nim, jurusan, nilai } : null;
}

$("btn-tambah-mhs").addEventListener("click", () => {
  const data = validasiMhs();
  if (!data) return;
  daftarMhs.push(data);
  simpan("latihanMahasiswa", daftarMhs);
  ["m-nama", "m-nim", "m-jurusan", "m-nilai"].forEach((id) => ($(id).value = ""));
  renderMhs();
});

// ---- Todo list: tambah, hapus, tandai selesai ----
let todos = muat("latihanTodo");

function renderTodo() {
  const ul = $("todo-list");
  ul.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.selesai) li.className = "done";
    const cek = document.createElement("input");
    cek.type = "checkbox"; cek.checked = t.selesai;
    cek.addEventListener("change", () => { t.selesai = cek.checked; simpan("latihanTodo", todos); renderTodo(); });
    const teks = document.createElement("span");
    teks.textContent = t.teks;
    const hapus = document.createElement("button");
    hapus.textContent = "Hapus"; hapus.className = "del";
    hapus.addEventListener("click", () => { todos.splice(i, 1); simpan("latihanTodo", todos); renderTodo(); });
    li.append(cek, teks, hapus);
    ul.appendChild(li);
  });
}

function tambahTodo() {
  const teks = $("todo-input").value.trim();
  if (teks === "") { $("e-todo").textContent = " Tugas tidak boleh kosong."; return; }
  $("e-todo").textContent = "";
  todos.push({ teks, selesai: false });
  simpan("latihanTodo", todos);
  $("todo-input").value = "";
  renderTodo();
}
$("btn-todo").addEventListener("click", tambahTodo);
$("todo-input").addEventListener("keydown", (e) => { if (e.key === "Enter") tambahTodo(); });

renderMhs();
renderTodo();
