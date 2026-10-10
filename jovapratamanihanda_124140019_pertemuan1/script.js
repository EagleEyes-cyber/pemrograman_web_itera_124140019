// ===== Konstanta =====
const STORAGE_KEY = "miniPosKeranjang";
const MIN_HARGA = 500;
const MIN_DISKON_OTOMATIS = 50000;
const PERSEN_DISKON = 0.1;
const KODE_PROMO = "HEMAT10";

// ===== State =====
let keranjang = [];
let promoAktif = false;

// ===== Elemen DOM =====
const form = document.getElementById("form-barang");
const inputNama = document.getElementById("nama");
const inputHarga = document.getElementById("harga");
const inputQty = document.getElementById("qty");
const inputPromo = document.getElementById("promo");
const inputBayar = document.getElementById("bayar");
const tbody = document.getElementById("isi-keranjang");
const pesanKosong = document.getElementById("keranjang-kosong");

// ===== Util =====
function formatRupiah(angka) {
  return "Rp " + Math.round(angka).toLocaleString("id-ID");
}

// ===== LocalStorage =====
function simpanKeranjang() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keranjang));
}

function muatKeranjang() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    keranjang = Array.isArray(data) ? data : [];
  } catch (e) {
    keranjang = [];
  }
}

// ===== Validasi =====
function tampilkanError(input, idError, pesan) {
  document.getElementById(idError).textContent = pesan;
  input.classList.toggle("invalid", pesan !== "");
}

function validasiForm() {
  const nama = inputNama.value.trim();
  const harga = inputHarga.value.trim() === "" ? NaN : Number(inputHarga.value);
  const qty = inputQty.value.trim() === "" ? NaN : Number(inputQty.value);
  let valid = true;

  if (nama.length < 3) {
    tampilkanError(inputNama, "error-nama", "Nama barang wajib diisi, minimal 3 karakter.");
    valid = false;
  } else tampilkanError(inputNama, "error-nama", "");

  if (isNaN(harga)) {
    tampilkanError(inputHarga, "error-harga", "Harga wajib diisi dengan angka.");
    valid = false;
  } else if (harga < MIN_HARGA) {
    tampilkanError(inputHarga, "error-harga", "Harga minimal Rp 500.");
    valid = false;
  } else tampilkanError(inputHarga, "error-harga", "");

  if (isNaN(qty)) {
    tampilkanError(inputQty, "error-qty", "Jumlah wajib diisi dengan angka.");
    valid = false;
  } else if (!Number.isInteger(qty) || qty < 1) {
    tampilkanError(inputQty, "error-qty", "Jumlah harus bilangan bulat minimal 1.");
    valid = false;
  } else tampilkanError(inputQty, "error-qty", "");

  return valid ? { nama, harga, qty } : null;
}

// ===== Aksi keranjang =====
function tambahBarang(event) {
  event.preventDefault();
  const data = validasiForm();
  if (!data) return;
  keranjang.push(data);
  simpanKeranjang();
  form.reset();
  inputNama.focus();
  render();
}

function hapusBarang(index) {
  keranjang.splice(index, 1);
  simpanKeranjang();
  render();
}

function transaksiBaru() {
  if (keranjang.length > 0 && !confirm("Kosongkan keranjang dan mulai transaksi baru?")) return;
  keranjang = [];
  promoAktif = false;
  localStorage.removeItem(STORAGE_KEY);
  inputPromo.value = "";
  inputBayar.value = "";
  setPesan("pesan-promo", "", "");
  render();
}

// ===== Kalkulator =====
function hitungTotal() {
  return keranjang.reduce((sum, item) => sum + item.harga * item.qty, 0);
}

function hitungDiskon(total) {
  const otomatis = total >= MIN_DISKON_OTOMATIS;
  if (total > 0 && (otomatis || promoAktif)) {
    return { nominal: total * PERSEN_DISKON, sumber: otomatis ? "10% (min. Rp 50.000)" : "10% (kode HEMAT10)" };
  }
  return { nominal: 0, sumber: "" };
}

function pakaiPromo() {
  const kode = inputPromo.value.trim().toUpperCase();
  if (kode === KODE_PROMO) {
    promoAktif = true;
    setPesan("pesan-promo", "Kode promo dipakai: diskon 10%.", "ok");
  } else {
    promoAktif = false;
    setPesan("pesan-promo", "Kode promo tidak valid.", "bad");
  }
  render();
}

function setPesan(id, teks, kelas) {
  const el = document.getElementById(id);
  el.textContent = teks;
  el.className = "msg " + kelas;
}

// ===== Render =====
function render() {
  tbody.innerHTML = "";
  keranjang.forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${i + 1}</td>` +
      `<td></td>` +
      `<td class="num">${formatRupiah(item.harga)}</td>` +
      `<td class="num">${item.qty}</td>` +
      `<td class="num">${formatRupiah(item.harga * item.qty)}</td>` +
      `<td><button type="button" class="btn small">Hapus</button></td>`;
    tr.children[1].textContent = item.nama; // textContent mencegah injeksi HTML
    tr.querySelector("button").addEventListener("click", () => hapusBarang(i));
    tbody.appendChild(tr);
  });
  pesanKosong.classList.toggle("hidden", keranjang.length > 0);

  const total = hitungTotal();
  const diskon = hitungDiskon(total);
  const totalAkhir = total - diskon.nominal;
  document.getElementById("total-belanja").textContent = formatRupiah(total);
  document.getElementById("nominal-diskon").textContent = "- " + formatRupiah(diskon.nominal);
  document.getElementById("info-diskon").textContent = diskon.sumber ? "(" + diskon.sumber + ")" : "";
  document.getElementById("total-akhir").textContent = formatRupiah(totalAkhir);
  hitungKembalian(totalAkhir);
}

function hitungKembalian(totalAkhir) {
  const out = document.getElementById("kembalian");
  if (inputBayar.value.trim() === "") {
    out.textContent = formatRupiah(0);
    setPesan("pesan-bayar", "", "");
    return;
  }
  const bayar = Number(inputBayar.value);
  if (totalAkhir === 0) {
    out.textContent = formatRupiah(0);
    setPesan("pesan-bayar", "Keranjang masih kosong.", "bad");
  } else if (bayar < totalAkhir) {
    out.textContent = formatRupiah(0);
    setPesan("pesan-bayar", "Uang belum mencukupi, kurang " + formatRupiah(totalAkhir - bayar) + ".", "bad");
  } else {
    out.textContent = formatRupiah(bayar - totalAkhir);
    setPesan("pesan-bayar", "Pembayaran cukup.", "ok");
  }
}

// ===== Event & inisialisasi =====
form.addEventListener("submit", tambahBarang);
document.getElementById("btn-promo").addEventListener("click", pakaiPromo);
document.getElementById("btn-reset").addEventListener("click", transaksiBaru);
inputBayar.addEventListener("input", () => {
  const total = hitungTotal();
  hitungKembalian(total - hitungDiskon(total).nominal);
});
[inputNama, inputHarga, inputQty].forEach((el) =>
  el.addEventListener("input", () => {
    el.classList.remove("invalid");
    document.getElementById("error-" + el.id).textContent = "";
  })
);

muatKeranjang();
render();
