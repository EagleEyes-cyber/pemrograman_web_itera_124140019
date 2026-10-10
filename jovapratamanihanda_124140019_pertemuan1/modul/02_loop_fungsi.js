const $ = (id) => document.getElementById(id);
const angka = (id) => ($(id).value.trim() === "" ? NaN : Number($(id).value));
const tulis = (id, teks, kelas = "") => { $(id).textContent = teks; $(id).className = "out " + kelas; };

// 1. Tabel perkalian (for loop)
function buatTabelPerkalian(n) {
  const baris = [];
  for (let i = 1; i <= 10; i++) baris.push(`${n} x ${i} = ${n * i}`);
  return baris;
}
$("btn-kali").addEventListener("click", () => {
  const n = angka("angka-kali");
  if (isNaN(n)) return tulis("out-kali", "Masukkan angka yang valid.", "err");
  $("out-kali").className = "out";
  $("out-kali").innerHTML = "";
  for (const teks of buatTabelPerkalian(n)) {
    const p = document.createElement("div");
    p.textContent = teks;
    $("out-kali").appendChild(p);
  }
});

// 2. Faktorial
function faktorial(n) {
  let hasil = 1;
  for (let i = 2; i <= n; i++) hasil *= i;
  return hasil;
}
$("btn-fak").addEventListener("click", () => {
  const n = angka("angka-fak");
  if (!Number.isInteger(n) || n < 0 || n > 170) return tulis("out-fak", "Masukkan bilangan bulat 0-170.", "err");
  tulis("out-fak", `${n}! = ${faktorial(n)}`);
});

// 3. Bilangan prima
function isPrima(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
$("btn-prima").addEventListener("click", () => {
  const n = angka("angka-prima");
  if (!Number.isInteger(n)) return tulis("out-prima", "Masukkan bilangan bulat.", "err");
  tulis("out-prima", `${n} ${isPrima(n) ? "adalah" : "bukan"} bilangan prima`, isPrima(n) ? "ok" : "");
});

// 4. BMI
function hitungBMI(beratKg, tinggiCm) {
  const m = tinggiCm / 100;
  return beratKg / (m * m);
}
function kategoriBMI(bmi) {
  if (bmi < 18.5) return "Kurus";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Gemuk";
  return "Obesitas";
}
$("btn-bmi").addEventListener("click", () => {
  const b = angka("berat"), t = angka("tinggi");
  if (isNaN(b) || isNaN(t) || b <= 0 || t <= 0) return tulis("out-bmi", "Masukkan berat dan tinggi yang valid.", "err");
  const bmi = hitungBMI(b, t);
  tulis("out-bmi", `BMI: ${bmi.toFixed(1)} (${kategoriBMI(bmi)})`);
});

// 5. FizzBuzz
$("btn-fizz").addEventListener("click", () => {
  $("out-fizz").innerHTML = "";
  for (let i = 1; i <= 100; i++) {
    let teks = i;
    if (i % 15 === 0) teks = "FizzBuzz";
    else if (i % 3 === 0) teks = "Fizz";
    else if (i % 5 === 0) teks = "Buzz";
    const s = document.createElement("span");
    s.textContent = teks;
    $("out-fizz").appendChild(s);
  }
});
