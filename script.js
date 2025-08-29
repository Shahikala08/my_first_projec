let timetable = {};
let lastNotifiedId = null;

async function loadTimetable() {
  const res = await fetch("timetable.json");
  timetable = await res.json();
  fetchNow();
  fetchToday();
}

function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function parseTime(s) {
  const [hh, mm] = s.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

function findCurrentAndNext() {
  const now = new Date();
  const day = todayName();
  const sessions = timetable[day] || [];
  let current = null, next = null;

  for (let i = 0; i < sessions.length; i++) {
    const [start, end, subject] = sessions[i];
    const st = parseTime(start), et = parseTime(end);

    if (now >= st && now < et) {
      current = { start, end, subject, day };
      if (i + 1 < sessions.length) {
        const [ns, ne, subj] = sessions[i + 1];
        next = { start: ns, end: ne, subject: subj, day };
      }
      break;
    }
    if (now < st && !next) {
      next = { start, end, subject, day };
    }
  }

  return { current, next };
}

function fetchNow() {
  const { current, next } = findCurrentAndNext();
  showNow(current);
  showNext(next);

  if (current) {
    const id = `${current.day}|${current.subject}|${current.start}`;
    if (id !== lastNotifiedId) {
      sendNotification(current, next);
      lastNotifiedId = id;
    }
  }
}

function fetchToday() {
  const day = todayName();
  const sessions = timetable[day] || [];
  const container = document.getElementById("todayList");
  if (sessions.length === 0) {
    container.innerText = `No sessions for ${day}`;
    return;
  }
  let html = `<strong>${day}</strong><ul>`;
  for (const [start, end, subject] of sessions) {
    html += `<li>${start} - ${end} → ${subject}</li>`;
  }
  html += `</ul>`;
  container.innerHTML = html;
}

function showNow(current) {
  const el = document.getElementById("nowInfo");
  if (!current) {
    el.innerHTML = `<div class="small">No class is running right now.</div>`;
    return;
  }
  el.innerHTML = `<div><strong>${current.subject}</strong></div>
                  <div class="small">${current.day} • ${current.start} - ${current.end}</div>`;
}

function showNext(next) {
  const el = document.getElementById("nextInfo");
  if (!next) {
    el.innerHTML = `<div class="small">No upcoming session found.</div>`;
    return;
  }
  el.innerHTML = `<div><strong>${next.subject}</strong></div>
                  <div class="small">${next.day} • ${next.start} - ${next.end}</div>`;
}

function sendNotification(current, next) {
  if (!current) return;
  const title = `Now: ${current.subject}`;
  let body = `${current.start} — ${current.end}`;
  if (next) body += `\nNext: ${next.subject} (${next.start} - ${next.end})`;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

document.getElementById("btnRefresh").addEventListener("click", () => {
  fetchNow();
  fetchToday();
});

document.getElementById("btnPerm").addEventListener("click", async () => {
  const p = await Notification.requestPermission();
  alert("Notification permission: " + p);
});

// Initial load
loadTimetable();
setInterval(fetchNow, 20 * 1000);
