// js/app.js
// Logika inti aplikasi (model + state + localStorage + fetch API).
// Tidak ada manipulasi DOM di sini; semua rendering ada di main.js.
import {
  STORAGE_KEYS,
  API_ENDPOINTS,
  ITERA_COORDS,
  DAYS,
  FALLBACK_QUOTES,
  createDefaultTasks,
  createDefaultSchedule
} from "./modules/data.js";
import { generateId, daysUntil, timeToMinutes, toDateInputValue } from "./modules/utils.js";

const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };
const REQUEST_TIMEOUT_MS = 8000;

/* ------------------------------------------------------------------ */
/*  MODEL                                                              */
/* ------------------------------------------------------------------ */

/** Memodelkan satu item tugas kuliah. Objek bersifat immutable: perubahan lewat with(). */
export class TaskItem {
  constructor({
    id = generateId("task"),
    title,
    course = "Umum",
    deadline,
    priority = "medium",
    done = false,
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.title = title.trim();
    this.course = course.trim() || "Umum";
    this.deadline = deadline;
    this.priority = priority;
    this.done = done;
    this.createdAt = createdAt;
  }

  get daysLeft() {
    return daysUntil(this.deadline);
  }

  get isOverdue() {
    return !this.done && this.daysLeft < 0;
  }

  /** Membuat salinan baru dengan perubahan (spread), tidak memutasi objek lama */
  with(changes) {
    return new TaskItem({ ...this.toJSON(), ...changes });
  }

  toJSON() {
    const { id, title, course, deadline, priority, done, createdAt } = this;
    return { id, title, course, deadline, priority, done, createdAt };
  }
}

/** Memodelkan satu entri jadwal kuliah mingguan. */
export class ScheduleItem {
  constructor({ id = generateId("class"), course, day, start, end, room = "" }) {
    this.id = id;
    this.course = course.trim();
    this.day = day;
    this.start = start;
    this.end = end;
    this.room = room.trim();
  }

  with(changes) {
    return new ScheduleItem({ ...this.toJSON(), ...changes });
  }

  toJSON() {
    const { id, course, day, start, end, room } = this;
    return { id, course, day, start, end, room };
  }
}

/* ------------------------------------------------------------------ */
/*  VALIDASI                                                           */
/* ------------------------------------------------------------------ */

const assertValidTask = ({ title = "", deadline = "" }) => {
  if (!title.trim()) throw new Error("Judul tugas tidak boleh kosong.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) throw new Error("Deadline wajib diisi.");
};

const assertValidClass = ({ course = "", day = "", start = "", end = "" }) => {
  if (!course.trim()) throw new Error("Nama mata kuliah tidak boleh kosong.");
  if (!DAYS.includes(day)) throw new Error("Hari kuliah tidak valid.");
  if (!start || !end) throw new Error("Jam mulai dan jam selesai wajib diisi.");
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    throw new Error("Jam selesai harus lebih akhir dari jam mulai.");
  }
};

const TASK_FILTERS = {
  all: () => true,
  active: ({ done }) => !done,
  done: ({ done }) => done,
  overdue: ({ isOverdue }) => isOverdue
};

/* ------------------------------------------------------------------ */
/*  DASHBOARD APP                                                      */
/* ------------------------------------------------------------------ */

/** Mengelola state, penyimpanan localStorage, dan pemanggilan fetch() API eksternal. */
export class DashboardApp {
  #listeners = new Set();

  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.state = {
      tasks: [],
      schedule: [],
      filter: "all",
      search: "",
      theme: "light",
      weather: { status: "idle", data: null },
      quote: { status: "idle", data: null }
    };
    this.load();
  }

  /* ---------- observer sederhana ---------- */

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit() {
    this.#listeners.forEach((listener) => listener(this.state));
  }

  /** State tidak pernah dimutasi langsung: selalu dibuat objek baru dengan spread */
  #setState(partial) {
    this.state = { ...this.state, ...partial };
    this.#emit();
  }

  /* ---------- localStorage ---------- */

  #read(key, fallback = null) {
    try {
      const raw = this.storage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn(`Gagal membaca "${key}" dari localStorage:`, error);
      return fallback;
    }
  }

  #write(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Gagal menyimpan "${key}" ke localStorage:`, error);
      return false;
    }
  }

  /** Mengubah state lalu menyimpan bagian yang berubah ke localStorage */
  #commit(partial) {
    this.#setState(partial);
    if ("tasks" in partial) this.#write(STORAGE_KEYS.tasks, this.state.tasks);
    if ("schedule" in partial) this.#write(STORAGE_KEYS.schedule, this.state.schedule);
    if ("theme" in partial) this.#write(STORAGE_KEYS.theme, this.state.theme);
  }

  /** Memuat data dari localStorage; jika belum pernah ada (null), isi dengan data contoh */
  load() {
    const storedTasks = this.#read(STORAGE_KEYS.tasks);
    const storedSchedule = this.#read(STORAGE_KEYS.schedule);
    const storedTheme = this.#read(STORAGE_KEYS.theme, "light");

    const tasks = (storedTasks ?? createDefaultTasks()).map((raw) => new TaskItem(raw));
    const schedule = (storedSchedule ?? createDefaultSchedule()).map((raw) => new ScheduleItem(raw));

    this.state = { ...this.state, tasks, schedule, theme: storedTheme };
    if (storedTasks === null) this.#write(STORAGE_KEYS.tasks, tasks);
    if (storedSchedule === null) this.#write(STORAGE_KEYS.schedule, schedule);
  }

  resetAll() {
    Object.values(STORAGE_KEYS).forEach((key) => this.storage.removeItem(key));
    const tasks = createDefaultTasks().map((raw) => new TaskItem(raw));
    const schedule = createDefaultSchedule().map((raw) => new ScheduleItem(raw));
    this.#commit({ tasks, schedule, theme: "light", filter: "all", search: "" });
  }

  /* ---------- CRUD tugas ---------- */

  addTask(data) {
    assertValidTask(data);
    const task = new TaskItem(data);
    this.#commit({ tasks: [task, ...this.state.tasks] });
    return task;
  }

  updateTask(id, changes) {
    assertValidTask({ ...this.state.tasks.find((task) => task.id === id), ...changes });
    this.#commit({
      tasks: this.state.tasks.map((task) => (task.id === id ? task.with(changes) : task))
    });
  }

  toggleTask(id) {
    this.#commit({
      tasks: this.state.tasks.map((task) => (task.id === id ? task.with({ done: !task.done }) : task))
    });
  }

  deleteTask(id) {
    this.#commit({ tasks: this.state.tasks.filter((task) => task.id !== id) });
  }

  clearCompleted() {
    const remaining = this.state.tasks.filter(({ done }) => !done);
    const removed = this.state.tasks.length - remaining.length;
    this.#commit({ tasks: remaining });
    return removed;
  }

  /* ---------- CRUD jadwal ---------- */

  addClass(data) {
    assertValidClass(data);
    this.#commit({ schedule: [...this.state.schedule, new ScheduleItem(data)] });
  }

  updateClass(id, changes) {
    assertValidClass({ ...this.state.schedule.find((item) => item.id === id), ...changes });
    this.#commit({
      schedule: this.state.schedule.map((item) => (item.id === id ? item.with(changes) : item))
    });
  }

  deleteClass(id) {
    this.#commit({ schedule: this.state.schedule.filter((item) => item.id !== id) });
  }

  /* ---------- filter, pencarian, tema ---------- */

  setFilter(filter) {
    this.#setState({ filter });
  }

  setSearch(search) {
    this.#setState({ search });
  }

  toggleTheme() {
    this.#commit({ theme: this.state.theme === "dark" ? "light" : "dark" });
  }

  /* ---------- turunan state (getter) ---------- */

  get visibleTasks() {
    const { tasks, filter, search } = this.state;
    const keyword = search.trim().toLowerCase();

    return tasks
      .filter(TASK_FILTERS[filter] ?? TASK_FILTERS.all)
      .filter(({ title, course }) => `${title} ${course}`.toLowerCase().includes(keyword))
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          a.deadline.localeCompare(b.deadline) ||
          PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      );
  }

  get sortedSchedule() {
    return [...this.state.schedule].sort(
      (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || timeToMinutes(a.start) - timeToMinutes(b.start)
    );
  }

  get stats() {
    const { tasks } = this.state;
    const done = tasks.filter(({ done }) => done).length;
    const overdue = tasks.filter(({ isOverdue }) => isOverdue).length;
    const [next = null] = tasks
      .filter(({ done }) => !done)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    return {
      total: tasks.length,
      done,
      active: tasks.length - done,
      overdue,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
      next
    };
  }

  /* ---------- fetch API eksternal (async/await) ---------- */

  /** Cuaca real-time kampus ITERA dari Open-Meteo */
  async fetchWeather() {
    this.#setState({ weather: { status: "loading", data: null } });
    try {
      const { latitude, longitude } = ITERA_COORDS;
      const url = `${API_ENDPOINTS.weather}?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Asia%2FJakarta`;
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { current_weather: { temperature, windspeed, weathercode } } = await response.json();
      this.#setState({ weather: { status: "success", data: { temperature, windspeed, weathercode } } });
    } catch (error) {
      this.#setState({ weather: { status: "error", data: null, message: error.message } });
    }
  }

  /** Kutipan motivasi harian dari DummyJSON (di-cache per hari agar hemat request) */
  async fetchQuote({ force = false } = {}) {
    const today = toDateInputValue();
    const cached = this.#read(STORAGE_KEYS.quote);

    if (!force && cached?.date === today) {
      this.#setState({ quote: { status: "success", data: cached.data } });
      return;
    }

    this.#setState({ quote: { status: "loading", data: this.state.quote.data } });
    try {
      const response = await fetch(API_ENDPOINTS.quote, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { quote, author } = await response.json();
      const data = { quote, author };
      this.#write(STORAGE_KEYS.quote, { date: today, data });
      this.#setState({ quote: { status: "success", data } });
    } catch (error) {
      const fallback = FALLBACK_QUOTES[new Date().getDate() % FALLBACK_QUOTES.length];
      this.#setState({ quote: { status: "error", data: fallback, message: error.message } });
    }
  }

  /** Memanggil kedua API secara paralel; kegagalan salah satu tidak menggagalkan yang lain */
  refreshRemote = () => Promise.allSettled([this.fetchWeather(), this.fetchQuote()]);
}
