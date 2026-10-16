// js/main.js
// Entry point: menghubungkan DashboardApp (logika) dengan DOM (tampilan & event).
import { DashboardApp } from "./app.js";
import { DAYS, PRIORITY_LABELS, COURSE_SUGGESTIONS } from "./modules/data.js";
import {
  escapeHtml,
  formatDate,
  formatClock,
  formatLongDate,
  describeDeadline,
  getGreeting,
  weatherCodeToText,
  toDateInputValue,
  debounce
} from "./modules/utils.js";

const app = new DashboardApp();

const $ = (selector) => document.querySelector(selector);
const todayName = () => DAYS[(new Date().getDay() + 6) % 7]; // getDay(): 0 = Minggu

// State UI lokal (mode edit) - nilainya berubah sehingga memakai let
let editingTaskId = null;
let editingClassId = null;
let toastTimer;

/* ------------------------------------------------------------------ */
/*  TEMPLATE (template literals)                                       */
/* ------------------------------------------------------------------ */

const taskTemplate = ({ id, title, course, deadline, priority, done, daysLeft, isOverdue }) => `
  <li class="task priority-${priority} ${done ? "is-done" : ""} ${isOverdue ? "is-overdue" : ""}" data-id="${id}">
    <input class="task__check" type="checkbox" data-action="toggle-task" ${done ? "checked" : ""}
           aria-label="Tandai selesai: ${escapeHtml(title)}">
    <div class="task__body">
      <p class="task__title">${escapeHtml(title)}</p>
      <div class="task__meta">
        <span class="badge badge--course">${escapeHtml(course)}</span>
        <span class="badge badge--${priority}">Prioritas ${PRIORITY_LABELS[priority]}</span>
        <span class="task__due">📅 ${formatDate(deadline)} · <strong>${done ? "Selesai" : describeDeadline(daysLeft)}</strong></span>
      </div>
    </div>
    <div class="task__actions">
      <button class="btn btn--ghost btn--sm" data-action="edit-task">Edit</button>
      <button class="btn btn--danger btn--sm" data-action="delete-task">Hapus</button>
    </div>
  </li>`;

const classTemplate = ({ id, course, start, end, room }) => `
  <li class="class-item" data-id="${id}">
    <div class="class-item__time">${start}<span>${end}</span></div>
    <div class="class-item__body">
      <p class="class-item__course">${escapeHtml(course)}</p>
      <p class="class-item__room">📍 ${escapeHtml(room) || "Ruangan belum diisi"}</p>
    </div>
    <div class="task__actions">
      <button class="btn btn--ghost btn--sm" data-action="edit-class">Edit</button>
      <button class="btn btn--danger btn--sm" data-action="delete-class">Hapus</button>
    </div>
  </li>`;

const emptyTemplate = (icon, message) => `
  <li class="empty"><span>${icon}</span><p>${message}</p></li>`;

/* ------------------------------------------------------------------ */
/*  RENDER                                                             */
/* ------------------------------------------------------------------ */

const renderWeather = ({ status, data }) => {
  if (status === "idle" || status === "loading") {
    return `<h2>Cuaca Kampus ITERA</h2><p class="muted skeleton">Memuat data cuaca…</p>`;
  }
  if (status === "error") {
    return `
      <h2>Cuaca Kampus ITERA</h2>
      <p class="muted">Data cuaca tidak dapat dimuat. Periksa koneksi internet.</p>
      <button class="btn btn--ghost btn--sm" data-action="refresh-weather">Coba lagi</button>`;
  }
  const { temperature, windspeed, weathercode } = data;
  const { label, icon } = weatherCodeToText(weathercode);
  return `
    <h2>Cuaca Kampus ITERA</h2>
    <div class="weather">
      <span class="weather__icon" aria-hidden="true">${icon}</span>
      <div>
        <p class="weather__temp">${Math.round(temperature)}°C</p>
        <p class="muted">${label} · Angin ${windspeed} km/j</p>
      </div>
    </div>`;
};

const renderQuote = ({ status, data }) => {
  if (!data) return `<h2>Kutipan Hari Ini</h2><p class="muted skeleton">Memuat kutipan…</p>`;
  const { quote, author } = data;
  return `
    <h2>Kutipan Hari Ini</h2>
    <blockquote class="quote">“${escapeHtml(quote)}”<footer>— ${escapeHtml(author)}</footer></blockquote>
    <div class="quote__actions">
      <button class="btn btn--ghost btn--sm" data-action="refresh-quote" ${status === "loading" ? "disabled" : ""}>
        ${status === "loading" ? "Memuat…" : "🔄 Kutipan lain"}
      </button>
      ${status === "error" ? `<span class="muted small">Mode offline</span>` : ""}
    </div>`;
};

const renderStats = ({ total, done, active, overdue, progress, next }) => `
  <h2>Ringkasan Tugas</h2>
  <div class="stats">
    <div><strong>${total}</strong><span>Total</span></div>
    <div><strong>${active}</strong><span>Aktif</span></div>
    <div><strong>${done}</strong><span>Selesai</span></div>
    <div class="${overdue ? "stats__alert" : ""}"><strong>${overdue}</strong><span>Terlambat</span></div>
  </div>
  <div class="progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
    <div class="progress__bar" style="width:${progress}%"></div>
  </div>
  <p class="muted small">${progress}% tugas selesai${
    next ? ` · Terdekat: <strong>${escapeHtml(next.title)}</strong> (${describeDeadline(next.daysLeft)})` : ""
  }</p>`;

const renderTasks = (tasks, { filter, search }) => {
  if (tasks.length) return tasks.map(taskTemplate).join("");
  return search || filter !== "all"
    ? emptyTemplate("🔍", "Tidak ada tugas yang cocok dengan filter/pencarian.")
    : emptyTemplate("🎉", "Belum ada tugas. Tambahkan tugas pertama kamu!");
};

const renderSchedule = (schedule) => {
  if (!schedule.length) return emptyTemplate("📚", "Belum ada jadwal kuliah.");

  // Kelompokkan per hari memakai reduce + spread
  const grouped = schedule.reduce(
    (acc, item) => ({ ...acc, [item.day]: [...(acc[item.day] ?? []), item] }),
    {}
  );

  return DAYS.filter((day) => grouped[day])
    .map((day) => {
      const isToday = day === todayName();
      return `
        <li class="day ${isToday ? "is-today" : ""}">
          <h3>${day} ${isToday ? `<span class="badge badge--today">Hari ini</span>` : ""}</h3>
          <ul class="class-list">${grouped[day].map(classTemplate).join("")}</ul>
        </li>`;
    })
    .join("");
};

const renderFilters = (activeFilter) => {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
};

const render = (state) => {
  document.documentElement.dataset.theme = state.theme;
  $("#theme-toggle").textContent = state.theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap";
  $("#weather-widget").innerHTML = renderWeather(state.weather);
  $("#quote-widget").innerHTML = renderQuote(state.quote);
  $("#stats-widget").innerHTML = renderStats(app.stats);
  $("#task-list").innerHTML = renderTasks(app.visibleTasks, state);
  $("#schedule-list").innerHTML = renderSchedule(app.sortedSchedule);
  renderFilters(state.filter);
};

/* ------------------------------------------------------------------ */
/*  UTILITAS UI                                                        */
/* ------------------------------------------------------------------ */

const showToast = (message, type = "success") => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast toast--${type} is-visible`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const tickClock = () => {
  const now = new Date();
  $("#clock").textContent = formatClock(now);
  $("#today-date").textContent = formatLongDate(now);
  $("#greeting").textContent = `${getGreeting(now.getHours())}, Mahasiswa!`;
};

/** Membungkus aksi yang mungkin melempar error validasi dari DashboardApp */
const safely = (action, successMessage) => {
  try {
    action();
    if (successMessage) showToast(successMessage);
    return true;
  } catch (error) {
    showToast(error.message, "error");
    return false;
  }
};

/* ------------------------------------------------------------------ */
/*  FORM TUGAS                                                         */
/* ------------------------------------------------------------------ */

const taskForm = $("#task-form");

const resetTaskForm = () => {
  editingTaskId = null;
  taskForm.reset();
  taskForm.elements.deadline.value = toDateInputValue();
  $("#task-submit").textContent = "＋ Tambah Tugas";
  $("#task-cancel").hidden = true;
  $("#task-form-title").textContent = "Tambah Tugas Baru";
};

const startEditTask = (id) => {
  const task = app.state.tasks.find((item) => item.id === id);
  if (!task) return;
  const { title, course, deadline, priority } = task;

  editingTaskId = id;
  taskForm.elements.title.value = title;
  taskForm.elements.course.value = course;
  taskForm.elements.deadline.value = deadline;
  taskForm.elements.priority.value = priority;
  $("#task-submit").textContent = "💾 Simpan Perubahan";
  $("#task-cancel").hidden = false;
  $("#task-form-title").textContent = "Edit Tugas";
  taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
  taskForm.elements.title.focus();
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(taskForm));

  const ok = editingTaskId
    ? safely(() => app.updateTask(editingTaskId, data), "Tugas berhasil diperbarui.")
    : safely(() => app.addTask(data), "Tugas baru ditambahkan.");

  if (ok) resetTaskForm();
});

$("#task-cancel").addEventListener("click", resetTaskForm);

/* ------------------------------------------------------------------ */
/*  FORM JADWAL                                                        */
/* ------------------------------------------------------------------ */

const classForm = $("#class-form");

const resetClassForm = () => {
  editingClassId = null;
  classForm.reset();
  classForm.elements.day.value = todayName();
  $("#class-submit").textContent = "＋ Tambah Jadwal";
  $("#class-cancel").hidden = true;
};

const startEditClass = (id) => {
  const item = app.state.schedule.find((entry) => entry.id === id);
  if (!item) return;
  const { course, day, start, end, room } = item;

  editingClassId = id;
  classForm.elements.course.value = course;
  classForm.elements.day.value = day;
  classForm.elements.start.value = start;
  classForm.elements.end.value = end;
  classForm.elements.room.value = room;
  $("#class-submit").textContent = "💾 Simpan Perubahan";
  $("#class-cancel").hidden = false;
  classForm.scrollIntoView({ behavior: "smooth", block: "center" });
};

classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(classForm));

  const ok = editingClassId
    ? safely(() => app.updateClass(editingClassId, data), "Jadwal berhasil diperbarui.")
    : safely(() => app.addClass(data), "Jadwal baru ditambahkan.");

  if (ok) resetClassForm();
});

$("#class-cancel").addEventListener("click", resetClassForm);

/* ------------------------------------------------------------------ */
/*  EVENT DELEGATION UNTUK TOMBOL DINAMIS                              */
/* ------------------------------------------------------------------ */

const actionHandlers = {
  "toggle-task": (id) => app.toggleTask(id),
  "edit-task": (id) => startEditTask(id),
  "delete-task": (id) => {
    const task = app.state.tasks.find((item) => item.id === id);
    if (task && confirm(`Hapus tugas "${task.title}"?`)) {
      if (editingTaskId === id) resetTaskForm();
      app.deleteTask(id);
      showToast("Tugas dihapus.");
    }
  },
  "edit-class": (id) => startEditClass(id),
  "delete-class": (id) => {
    const item = app.state.schedule.find((entry) => entry.id === id);
    if (item && confirm(`Hapus jadwal "${item.course}" hari ${item.day}?`)) {
      if (editingClassId === id) resetClassForm();
      app.deleteClass(id);
      showToast("Jadwal dihapus.");
    }
  },
  "refresh-weather": () => app.fetchWeather(),
  "refresh-quote": () => app.fetchQuote({ force: true })
};

document.addEventListener("click", ({ target }) => {
  const trigger = target.closest("[data-action]");
  if (!trigger) return;
  const id = trigger.closest("[data-id]")?.dataset.id;
  actionHandlers[trigger.dataset.action]?.(id);
});

/* ------------------------------------------------------------------ */
/*  FILTER, PENCARIAN, TEMA, RESET                                     */
/* ------------------------------------------------------------------ */

$("#task-filters").addEventListener("click", ({ target }) => {
  const button = target.closest("[data-filter]");
  if (button) app.setFilter(button.dataset.filter);
});

$("#task-search").addEventListener(
  "input",
  debounce(({ target }) => app.setSearch(target.value), 200)
);

$("#clear-completed").addEventListener("click", () => {
  const completed = app.state.tasks.filter(({ done }) => done).length;
  if (!completed) return showToast("Belum ada tugas yang selesai.", "error");
  if (confirm(`Hapus ${completed} tugas yang sudah selesai?`)) {
    showToast(`${app.clearCompleted()} tugas selesai dihapus.`);
  }
});

$("#theme-toggle").addEventListener("click", () => app.toggleTheme());

$("#reset-data").addEventListener("click", () => {
  if (confirm("Reset semua data ke kondisi awal? Perubahan yang kamu buat akan hilang.")) {
    resetTaskForm();
    resetClassForm();
    app.resetAll();
    showToast("Data dikembalikan ke kondisi awal.");
  }
});

/* ------------------------------------------------------------------ */
/*  INISIALISASI                                                       */
/* ------------------------------------------------------------------ */

const init = () => {
  $("#course-options").innerHTML = COURSE_SUGGESTIONS.map(
    (course) => `<option value="${escapeHtml(course)}"></option>`
  ).join("");
  $("#class-day").innerHTML = DAYS.map((day) => `<option value="${day}">${day}</option>`).join("");

  resetTaskForm();
  resetClassForm();

  app.subscribe(render);
  render(app.state);

  tickClock();
  setInterval(tickClock, 1000);

  app.refreshRemote();
};

init();
