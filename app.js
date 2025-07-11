// --- Firebase Config (Replace with your config) ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentNickname = '';
let selectedDate = new Date();
let tasksCache = []; // For filtering/sorting/search

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const todoSection = document.getElementById('todo-section');
const logoutBtn = document.getElementById('logout-btn');
const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const profileNickname = document.getElementById('profile-nickname');
const modalBackdrop = document.getElementById('modal-backdrop');

const calendarEl = document.getElementById('calendar');
const taskList = document.getElementById('task-list');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskModalTitle = document.getElementById('task-modal-title');
const searchBar = document.getElementById('search-bar');
const filterPriority = document.getElementById('filter-priority');
const sortTasks = document.getElementById('sort-tasks');
const themeToggle = document.getElementById('theme-toggle');

// --- THEME ---
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}
themeToggle.onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
setTheme(localStorage.getItem('theme') || 'light');

// --- AUTH LOGIC ---
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    await loadProfile();
    authSection.classList.add('hidden');
    todoSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    renderCalendar(selectedDate);
    fetchTasks();
  } else {
    currentUser = null;
    currentNickname = '';
    authSection.classList.remove('hidden');
    todoSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
});
loginForm.onsubmit = async e => {
  e.preventDefault();
  const email = loginForm['login-email'].value, pw = loginForm['login-password'].value;
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    loginForm.reset();
  } catch (err) { alert(err.message); }
};
signupForm.onsubmit = async e => {
  e.preventDefault();
  const email = signupForm['signup-email'].value, pw = signupForm['signup-password'].value, nick = signupForm['signup-nickname'].value;
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    await db.collection('users').doc(cred.user.uid).set({ nickname: nick });
    signupForm.reset();
  } catch (err) { alert(err.message); }
};
showSignup.onclick = e => { e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); };
showLogin.onclick = e => { e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };
logoutBtn.onclick = () => auth.signOut();

// --- PROFILE ---
async function loadProfile() {
  const doc = await db.collection('users').doc(currentUser.uid).get();
  currentNickname = doc.exists ? doc.data().nickname : '';
}
profileBtn.onclick = () => { profileNickname.value = currentNickname || ''; showModal(profileModal); };
profileForm.onsubmit = async e => {
  e.preventDefault();
  const newNick = profileNickname.value.trim();
  await db.collection('users').doc(currentUser.uid).set({ nickname: newNick }, { merge: true });
  currentNickname = newNick;
  hideModal(profileModal);
};
document.getElementById('profile-cancel').onclick = () => hideModal(profileModal);

// --- MODALS ---
function showModal(modal) {
  modal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');
}
function hideModal(modal) {
  modal.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
}
modalBackdrop.onclick = () => {
  [taskModal, profileModal].forEach(m => m.classList.add('hidden'));
  modalBackdrop.classList.add('hidden');
};

// --- CALENDAR UI ---
function renderCalendar(date) {
  calendarEl.innerHTML = '';
  const year = date.getFullYear(), month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdays.forEach(day => {
    const wd = document.createElement('div');
    wd.textContent = day;
    wd.className = 'calendar-day calendar-day-header';
    wd.style.fontWeight = 'bold';
    calendarEl.appendChild(wd);
  });
  // Blank days
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day';
    blank.style.visibility = 'hidden';
    calendarEl.appendChild(blank);
  }
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    const dayDate = new Date(year, month, d);
    const isoStr = dayDate.toISOString().slice(0, 10);
    dayEl.dataset.date = isoStr;
    if (isoStr === (new Date()).toISOString().slice(0, 10)) dayEl.classList.add('calendar-day-today');
    if (isoStr === selectedDate.toISOString().slice(0, 10)) dayEl.classList.add('selected');
    dayEl.innerHTML = `<span class="date-num">${d}</span>`;
    // Task dot indicator
    const taskCount = tasksCache.filter(t => t.date === isoStr).length;
    if (taskCount > 0) {
      for (let i = 0; i < taskCount && i < 3; i++)
        dayEl.innerHTML += `<span class="task-dot"></span>`;
      if (taskCount > 3) dayEl.innerHTML += `<span style="font-size:0.8em;">+${taskCount-3}</span>`;
    }
    dayEl.onclick = () => { selectedDate = dayDate; renderCalendar(selectedDate); renderTasks(); };
    calendarEl.appendChild(dayEl);
  }
}

// --- TASK CRUD ---
addTaskBtn.onclick = () => openTaskModal();
let editingTaskId = null;
function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  taskModalTitle.textContent = editingTaskId ? 'Edit Task' : 'Add Task';
  taskForm['task-title'].value = task ? task.title : '';
  taskForm['task-desc'].value = task ? task.desc : '';
  taskForm['task-date'].value = task ? task.date : selectedDate.toISOString().slice(0,10);
  taskForm['task-time'].value = task ? task.time || '' : '';
  taskForm['task-priority'].value = task ? task.priority : 'medium';
  taskForm['task-labels'].value = task ? (task.labels ? task.labels.join(', ') : '') : '';
  taskForm['task-reminder'].checked = task ? !!task.reminder : false;
  showModal(taskModal);
}
taskForm.onsubmit = async e => {
  e.preventDefault();
  const title = taskForm['task-title'].value.trim();
  const desc = taskForm['task-desc'].value.trim();
  const date = taskForm['task-date'].value;
  const time = taskForm['task-time'].value;
  const priority = taskForm['task-priority'].value;
  const labels = taskForm['task-labels'].value.split(',').map(l => l.trim()).filter(l => l);
  const reminder = taskForm['task-reminder'].checked;
  const task = { title, desc, date, time, priority, labels, completed: false, reminder, created: Date.now(), updated: Date.now() };
  if (editingTaskId) {
    await db.collection('users').doc(currentUser.uid).collection('tasks').doc(editingTaskId).update(task);
  } else {
    await db.collection('users').doc(currentUser.uid).collection('tasks').add(task);
  }
  hideModal(taskModal);
  fetchTasks();
};
document.getElementById('cancel-task-btn').onclick = () => hideModal(taskModal);

// --- FETCH & RENDER TASKS ---
function fetchTasks() {
  db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('date').onSnapshot(qs => {
    tasksCache = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCalendar(selectedDate);
    renderTasks();
  });
}
function renderTasks() {
  const dateStr = selectedDate.toISOString().slice(0,10);
  let filtered = tasksCache.filter(task => task.date === dateStr);
  // Search/filter
  const q = searchBar.value.toLowerCase();
  if (q) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.desc && t.desc.toLowerCase().includes(q)) ||
    (t.labels && t.labels.some(l => l.toLowerCase().includes(q)))
  );
  if (filterPriority.value) filtered = filtered.filter(t => t.priority === filterPriority.value);
  // Sort
  if (sortTasks.value === 'priority') filtered.sort((a,b) => priorityRank(b.priority)-priorityRank(a.priority));
  else if (sortTasks.value === 'completed') filtered.sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1));
  else filtered.sort((a,b) => (a.time||'').localeCompare(b.time||''));
  // Render
  taskList.innerHTML = '';
  if (filtered.length === 0) {
    taskList.innerHTML = `<div class="card">No tasks for this day.</div>`;
    return;
  }
  filtered.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card' + (task.completed ? ' completed':'');
    // Drag-and-drop (optional)
    card.draggable = true;
    card.ondragstart = e => { e.dataTransfer.setData('text/plain', task.id); };
    card.ondragover = e => e.preventDefault();
    card.ondrop = e => {
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId !== task.id) reorderTask(draggedId, task.id);
    };
    // Title row
    card.innerHTML = `
      <div class="task-title-row">
        <span class="task-title">${task.title}</span>
        <div class="task-actions">
          <button class="task-complete-btn" title="${task.completed ? 'Undo' : 'Complete'}">${task.completed ? '⟳' : '✔'}</button>
          <button class="task-edit-btn" title="Edit">✎</button>
          <button class="task-duplicate-btn" title="Duplicate">⧉</button>
          <button class="task-delete-btn" title="Delete">🗑</button>
        </div>
      </div>
      <div class="task-meta">
        <span class="task-date">${task.date}${task.time ? ', '+task.time : ''}</span>
        <span class="task-priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
        ${task.labels && task.labels.length ? task.labels.map(l => `<span class="task-labels">${l}</span>`).join('') : ''}
        ${task.reminder ? '<span class="task-reminder">🔔</span>' : ''}
      </div>
      ${task.desc ? `<div>${task.desc}</div>` : ''}
    `;
    // Action buttons
    card.querySelector('.task-edit-btn').onclick = () => openTaskModal(task);
    card.querySelector('.task-delete-btn').onclick = () => deleteTask(task.id);
    card.querySelector('.task-complete-btn').onclick = () => toggleComplete(task.id, !task.completed);
    card.querySelector('.task-duplicate-btn').onclick = () => duplicateTask(task.id, task.date);
    taskList.appendChild(card);
    // Reminder notification
    if (task.reminder && !task.completed && isToday(task.date)) {
      scheduleReminder(task);
    }
  });
}
// --- Search/Filter ---
searchBar.oninput = renderTasks;
filterPriority.onchange = renderTasks;
sortTasks.onchange = renderTasks;

// --- Task Helpers ---
function priorityRank(p) { return {high:3, medium:2, low:1}[p] || 0; }
function isToday(dateStr) {
  const today = new Date().toISOString().slice(0,10);
  return dateStr === today;
}
async function deleteTask(id) {
  if (confirm('Delete this task?')) {
    await db.collection('users').doc(currentUser.uid).collection('tasks').doc(id).delete();
  }
}
async function toggleComplete(id, completed) {
  await db.collection('users').doc(currentUser.uid).collection('tasks').doc(id).update({ completed });
}
async function duplicateTask(id, date) {
  const task = tasksCache.find(t => t.id === id);
  if (!task) return;
  // Prompt for target date
  const targetDate = prompt('Enter date to duplicate to (YYYY-MM-DD):', date);
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return alert('Invalid date');
  const newTask = { ...task, date: targetDate, completed: false, created: Date.now(), updated: Date.now() };
  delete newTask.id;
  await db.collection('users').doc(currentUser.uid).collection('tasks').add(newTask);
}

// --- Drag-and-drop reorder (optional) ---
async function reorderTask(draggedId, targetId) {
  // Optionally swap created/updated fields for order
  // Not implemented: Firestore doesn't support array reordering natively for lists. Could implement by storing an "order" field.
}

// --- Reminders (Browser Notifications) ---
function scheduleReminder(task) {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
    return;
  }
  if (task.time) {
    const now = Date.now();
    const [h, m] = task.time.split(':');
    const taskTime = new Date(task.date + 'T' + h.padStart(2, '0') + ':' + m.padStart(2, '0')).getTime();
    if (taskTime > now && taskTime - now < 1000 * 60 * 60) { // only schedule within 1h
      setTimeout(() => {
        new Notification('Task Reminder', { body: task.title });
      }, taskTime - now);
    }
  }
}

// --- PWA Manifest (Service Worker registration) ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// --- ESC to close modals
window.onkeydown = e => {
  if (e.key === 'Escape') {
    [taskModal, profileModal].forEach(m => m.classList.add('hidden'));
    modalBackdrop.classList.add('hidden');
  }
}