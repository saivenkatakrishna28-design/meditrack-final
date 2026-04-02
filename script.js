const medicineForm = document.getElementById("medicineForm");
const healthForm = document.getElementById("healthForm");
const contactForm = document.getElementById("contactForm");

const medicineList = document.getElementById("medicineList");
const healthList = document.getElementById("healthList");
const contactDisplay = document.getElementById("contactDisplay");

const totalMeds = document.getElementById("totalMeds");
const todayWater = document.getElementById("todayWater");
const latestSleep = document.getElementById("latestSleep");
const latestBP = document.getElementById("latestBP");
const latestSugar = document.getElementById("latestSugar");
const latestWeight = document.getElementById("latestWeight");
const emergencyStatus = document.getElementById("emergencyStatus");

const healthScore = document.getElementById("healthScore");
const scoreBar = document.getElementById("scoreBar");
const scoreMessage = document.getElementById("scoreMessage");
const riskBadge = document.getElementById("riskBadge");
const wellnessText = document.getElementById("wellnessText");

const notificationStatus = document.getElementById("notificationStatus");
const reminderDescription = document.getElementById("reminderDescription");
const upcomingReminder = document.getElementById("upcomingReminder");

const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const clearMedsBtn = document.getElementById("clearMedsBtn");
const clearHealthBtn = document.getElementById("clearHealthBtn");

const recordDateInput = document.getElementById("recordDate");
const toastContainer = document.getElementById("toastContainer");

const STORAGE_KEYS = {
  medicines: "meditrack_final_medicines",
  logs: "meditrack_final_health_logs",
  contact: "meditrack_final_contact"
};

let medicines = JSON.parse(localStorage.getItem(STORAGE_KEYS.medicines)) || [];
let healthLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.logs)) || [];
let emergencyContact = JSON.parse(localStorage.getItem(STORAGE_KEYS.contact)) || null;

recordDateInput.value = todayString();

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.medicines, JSON.stringify(medicines));
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(healthLogs));
  localStorage.setItem(STORAGE_KEYS.contact, JSON.stringify(emergencyContact));
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "--";
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function minutesFromTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function parseBP(bp) {
  const parts = String(bp).split("/");
  if (parts.length !== 2) return null;
  const systolic = Number(parts[0]);
  const diastolic = Number(parts[1]);
  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) return null;
  return { systolic, diastolic };
}

function getSortedLogs() {
  return [...healthLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getLatestLog() {
  const sorted = getSortedLogs();
  return sorted.length ? sorted[0] : null;
}

function calculateHealthScore(log) {
  if (!log) {
    return {
      score: 0,
      risk: "neutral",
      message: "Waiting for health data",
      wellness: "Add your first health log to generate insights"
    };
  }

  let score = 100;

  const sleep = Number(log.sleep);
  const water = Number(log.water);
  const sugar = Number(log.sugar);
  const bpData = parseBP(log.bp);

  if (sleep < 6 || sleep > 10) score -= 20;
  else if (sleep < 7 || sleep > 9) score -= 10;

  if (water < 1.5) score -= 20;
  else if (water < 2.5) score -= 10;

  if (sugar < 70 || sugar > 180) score -= 20;
  else if (sugar < 80 || sugar > 140) score -= 10;

  if (bpData) {
    const { systolic, diastolic } = bpData;
    const severeBP = systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
    const mildBP = systolic > 130 || diastolic > 85;
    if (severeBP) score -= 20;
    else if (mildBP) score -= 10;
  } else {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let risk = "low";
  let message = "Strong daily health profile";
  let wellness = "Overall wellness appears stable based on the latest log";

  if (score < 60) {
    risk = "high";
    message = "Needs attention";
    wellness = "Some health indicators need closer monitoring";
  } else if (score < 80) {
    risk = "moderate";
    message = "Moderate daily profile";
    wellness = "Health data is acceptable but can be improved";
  }

  return { score, risk, message, wellness };
}

function setRiskBadge(risk, text) {
  riskBadge.className = "risk-badge";
  if (risk === "low") riskBadge.classList.add("low");
  else if (risk === "moderate") riskBadge.classList.add("moderate");
  else if (risk === "high") riskBadge.classList.add("high");
  else riskBadge.classList.add("neutral");
  riskBadge.textContent = text;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function renderDashboard() {
  totalMeds.textContent = medicines.length;

  const today = todayString();
  const todayLogs = healthLogs.filter(log => log.date === today);
  const totalWater = todayLogs.reduce((sum, log) => sum + Number(log.water || 0), 0);
  todayWater.textContent = `${totalWater.toFixed(1)} L`;

  const latest = getLatestLog();
  if (latest) {
    latestSleep.textContent = `${Number(latest.sleep).toFixed(1)} hrs`;
    latestBP.textContent = latest.bp;
    latestSugar.textContent = `${latest.sugar} mg/dL`;
    latestWeight.textContent = `${latest.weight} kg`;
  } else {
    latestSleep.textContent = "0.0 hrs";
    latestBP.textContent = "--";
    latestSugar.textContent = "--";
    latestWeight.textContent = "--";
  }

  const scoreData = calculateHealthScore(latest);
  healthScore.textContent = scoreData.score;
  scoreBar.style.width = `${scoreData.score}%`;
  scoreMessage.textContent = scoreData.message;
  wellnessText.textContent = scoreData.wellness;

  if (scoreData.risk === "neutral") {
    setRiskBadge("neutral", "No Data");
  } else if (scoreData.risk === "low") {
    setRiskBadge("low", "Low Risk");
  } else if (scoreData.risk === "moderate") {
    setRiskBadge("moderate", "Moderate Risk");
  } else {
    setRiskBadge("high", "High Risk");
  }

  emergencyStatus.textContent = emergencyContact ? "Saved" : "Not Saved";
}

function renderMedicines() {
  if (!medicines.length) {
    medicineList.className = "records-list empty-box";
    medicineList.innerHTML = "No medicine reminders added yet.";
    return;
  }

  const sorted = [...medicines].sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time));

  medicineList.className = "records-list";
  medicineList.innerHTML = sorted.map(med => `
    <div class="record-item">
      <div class="record-top">
        <div>
          <div class="record-title">${med.name}</div>
          <div class="record-meta">
            Dosage: ${med.dosage}<br>
            Time: ${formatTime(med.time)}<br>
            Frequency: ${med.frequency}<br>
            Notes: ${med.notes ? med.notes : "No additional notes"}
          </div>
        </div>
        <div class="record-actions">
          <button class="delete-btn" onclick="deleteMedicine('${med.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderHealthLogs() {
  if (!healthLogs.length) {
    healthList.className = "records-list empty-box";
    healthList.innerHTML = "No health records saved yet.";
    return;
  }

  const sorted = getSortedLogs();

  healthList.className = "records-list";
  healthList.innerHTML = sorted.map(log => `
    <div class="record-item">
      <div class="record-top">
        <div>
          <div class="record-title">${formatDate(log.date)}</div>
          <div class="record-meta">
            Weight: ${log.weight} kg<br>
            Blood Pressure: ${log.bp}<br>
            Sugar Level: ${log.sugar} mg/dL<br>
            Water Intake: ${log.water} L<br>
            Sleep: ${log.sleep} hrs
          </div>
        </div>
        <div class="record-actions">
          <button class="delete-btn" onclick="deleteHealthLog('${log.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderContact() {
  if (!emergencyContact) {
    contactDisplay.className = "empty-box";
    contactDisplay.innerHTML = "No emergency contact saved yet.";
    return;
  }

  contactDisplay.className = "empty-box";
  contactDisplay.innerHTML = `
    <strong>Name:</strong> ${emergencyContact.name}<br>
    <strong>Relation:</strong> ${emergencyContact.relation}<br>
    <strong>Phone:</strong> ${emergencyContact.phone}
  `;
}

function updateNotificationUI() {
  if (!("Notification" in window)) {
    notificationStatus.textContent = "Browser notifications not supported";
    reminderDescription.textContent = "Your browser does not support notifications. You can still use the reminder schedule manually.";
    return;
  }

  if (Notification.permission === "granted") {
    notificationStatus.textContent = "Notifications enabled";
    reminderDescription.textContent = "Medicine reminders are active. Keep the page open to receive browser alerts.";
  } else if (Notification.permission === "denied") {
    notificationStatus.textContent = "Notifications blocked";
    reminderDescription.textContent = "Browser notifications were blocked. You can enable them in browser settings.";
  } else {
    notificationStatus.textContent = "Notifications not enabled";
    reminderDescription.textContent = "Enable notifications to receive reminder alerts on scheduled medicine times.";
  }
}

function showBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function updateUpcomingReminderText() {
  if (!medicines.length) {
    upcomingReminder.textContent = "No reminder scheduled yet";
    return;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...medicines].sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time));
  let nextMed = sorted.find(med => minutesFromTime(med.time) >= currentMinutes);
  if (!nextMed) nextMed = sorted[0];

  upcomingReminder.textContent = `${nextMed.name} at ${formatTime(nextMed.time)}`;
}

function checkMedicineReminders() {
  if (!medicines.length) {
    updateUpcomingReminderText();
    return;
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = todayString();

  let reminded = null;

  medicines.forEach(med => {
    if (med.time === currentTime && med.lastNotified !== today) {
      med.lastNotified = today;
      reminded = med;
      showBrowserNotification("Medicine Reminder", `Time to take ${med.name} (${med.dosage})`);
    }
  });

  if (reminded) {
    saveData();
    upcomingReminder.textContent = `Take ${reminded.name} now`;
    showToast(`Reminder triggered for ${reminded.name}`, "warn");
  } else {
    updateUpcomingReminderText();
  }
}

function downloadReport() {
  const latest = getLatestLog();
  const scoreData = calculateHealthScore(latest);

  const medicineText = medicines.length
    ? [...medicines]
        .sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time))
        .map((med, index) => `${index + 1}. ${med.name} | ${med.dosage} | ${med.time} | ${med.frequency} | ${med.notes || "No notes"}`)
        .join("\n")
    : "No medicines saved.";

  const logsText = healthLogs.length
    ? getSortedLogs()
        .map((log, index) => `${index + 1}. ${log.date} | Weight: ${log.weight} kg | BP: ${log.bp} | Sugar: ${log.sugar} mg/dL | Water: ${log.water} L | Sleep: ${log.sleep} hrs`)
        .join("\n")
    : "No health logs saved.";

  const contactText = emergencyContact
    ? `Name: ${emergencyContact.name}\nRelation: ${emergencyContact.relation}\nPhone: ${emergencyContact.phone}`
    : "No emergency contact saved.";

  const report = `
MediTrack Health Summary
========================

Dashboard
---------
Total Medicines: ${medicines.length}
Today's Water Intake: ${todayWater.textContent}
Latest Sleep: ${latestSleep.textContent}
Latest BP: ${latestBP.textContent}
Latest Sugar: ${latestSugar.textContent}
Health Score: ${scoreData.score}/100
Risk Status: ${riskBadge.textContent}

Emergency Contact
-----------------
${contactText}

Medicines
---------
${medicineText}

Health Logs
-----------
${logsText}
  `.trim();

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meditrack-summary.txt";
  a.click();
  URL.revokeObjectURL(url);

  showToast("Summary downloaded successfully");
}

function timePlusMinutes(offset) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offset);
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function loadDemoData() {
  const today = todayString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  medicines = [
    {
      id: uid(),
      name: "Paracetamol",
      dosage: "500 mg",
      time: timePlusMinutes(1),
      frequency: "Once Daily",
      notes: "After food",
      lastNotified: ""
    },
    {
      id: uid(),
      name: "Vitamin D",
      dosage: "1 tablet",
      time: "20:00",
      frequency: "Once Daily",
      notes: "Evening dose",
      lastNotified: ""
    }
  ];

  healthLogs = [
    {
      id: uid(),
      date: today,
      weight: "65.5",
      bp: "120/80",
      sugar: "96",
      water: "2.8",
      sleep: "7.6"
    },
    {
      id: uid(),
      date: yesterday,
      weight: "65.8",
      bp: "124/82",
      sugar: "102",
      water: "2.2",
      sleep: "7.1"
    }
  ];

  emergencyContact = {
    name: "Ravi Kumar",
    relation: "Father",
    phone: "+91 9876543210"
  };

  saveData();
  renderAll();
  showToast("Demo data loaded");
}

function renderAll() {
  renderDashboard();
  renderMedicines();
  renderHealthLogs();
  renderContact();
  updateNotificationUI();
  updateUpcomingReminderText();
}

function deleteMedicine(id) {
  medicines = medicines.filter(med => med.id !== id);
  saveData();
  renderAll();
  showToast("Medicine deleted", "warn");
}

function deleteHealthLog(id) {
  healthLogs = healthLogs.filter(log => log.id !== id);
  saveData();
  renderAll();
  showToast("Health log deleted", "warn");
}

medicineForm.addEventListener("submit", e => {
  e.preventDefault();

  const medicine = {
    id: uid(),
    name: document.getElementById("medicineName").value.trim(),
    dosage: document.getElementById("dosage").value.trim(),
    time: document.getElementById("medicineTime").value,
    frequency: document.getElementById("frequency").value,
    notes: document.getElementById("medicineNotes").value.trim(),
    lastNotified: ""
  };

  medicines.push(medicine);
  saveData();
  renderAll();
  medicineForm.reset();
  showToast("Medicine reminder added");
});

healthForm.addEventListener("submit", e => {
  e.preventDefault();

  const log = {
    id: uid(),
    date: document.getElementById("recordDate").value,
    weight: document.getElementById("weight").value,
    bp: document.getElementById("bp").value.trim(),
    sugar: document.getElementById("sugar").value,
    water: document.getElementById("water").value,
    sleep: document.getElementById("sleep").value
  };

  healthLogs.push(log);
  saveData();
  renderAll();
  healthForm.reset();
  recordDateInput.value = todayString();
  showToast("Health log saved");
});

contactForm.addEventListener("submit", e => {
  e.preventDefault();

  emergencyContact = {
    name: document.getElementById("contactName").value.trim(),
    relation: document.getElementById("relation").value.trim(),
    phone: document.getElementById("contactPhone").value.trim()
  };

  saveData();
  renderAll();
  contactForm.reset();
  showToast("Emergency contact saved");
});

enableNotificationsBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast("Notifications are not supported in this browser", "error");
    return;
  }

  const permission = await Notification.requestPermission();
  updateNotificationUI();

  if (permission === "granted") {
    showToast("Notifications enabled");
  } else if (permission === "denied") {
    showToast("Notifications blocked by browser", "error");
  } else {
    showToast("Notification permission dismissed", "warn");
  }
});

loadDemoBtn.addEventListener("click", () => {
  loadDemoData();
});

downloadReportBtn.addEventListener("click", () => {
  downloadReport();
});

clearMedsBtn.addEventListener("click", () => {
  if (!medicines.length) {
    showToast("No medicines to clear", "warn");
    return;
  }

  const confirmed = confirm("Clear all medicine records?");
  if (!confirmed) return;

  medicines = [];
  saveData();
  renderAll();
  showToast("All medicine records cleared", "warn");
});

clearHealthBtn.addEventListener("click", () => {
  if (!healthLogs.length) {
    showToast("No health logs to clear", "warn");
    return;
  }

  const confirmed = confirm("Clear all health records?");
  if (!confirmed) return;

  healthLogs = [];
  saveData();
  renderAll();
  showToast("All health logs cleared", "warn");
});

window.deleteMedicine = deleteMedicine;
window.deleteHealthLog = deleteHealthLog;

renderAll();
checkMedicineReminders();
setInterval(checkMedicineReminders, 30000);