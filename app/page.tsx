"use client";
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";

const TODAY = "2026-03-25";
const APP_NAME = "Probatus - egenkontroll för lokalvård";
const APP_SHORT_NAME = "Probatus";
const APP_VERSION = 5;
const STORAGE_KEY = "probatus-egenkontroll-lokalvard-v5";
const AUDIT_LIMIT = 300;

const ROLE = {
  ADMIN: "admin",
  EXECUTOR: "executor",
};

const TASK_TYPE_LABELS = {
  manadsinsats: "Månadsinsats",
  storstädning: "Storstädning",
};

const LOCAL_TYPE_LABELS = {
  sal: "Sal",
  toalett: "Toalett",
  korridor: "Korridor",
  personalutrymme: "Personalutrymme",
  ovrigt: "Övrigt",
};

const defaultUsers = [
  {
    id: "u1",
    username: "admin",
    password: "admin",
    role: ROLE.ADMIN,
    name: "Administratör",
    isActive: true,
    createdAt: "2026-03-01 08:00",
    lastLoginAt: null,
  },
  {
    id: "u2",
    username: "utforare",
    password: "1234",
    role: ROLE.EXECUTOR,
    name: "Utförare 1",
    isActive: true,
    createdAt: "2026-03-01 08:05",
    lastLoginAt: null,
  },
];

const defaultBuildings = [
  {
    id: "b1",
    name: "Hus A",
    isActive: true,
    floors: [
      {
        id: "f1",
        name: "Våning 1",
        isActive: true,
        rooms: [
          { id: "r1", name: "Sal 101", type: "sal", isActive: true },
          { id: "r2", name: "Toalett 1", type: "toalett", isActive: true },
        ],
      },
      {
        id: "f2",
        name: "Våning 2",
        isActive: true,
        rooms: [{ id: "r3", name: "Korridor 2A", type: "korridor", isActive: true }],
      },
    ],
  },
  {
    id: "b2",
    name: "Hus B",
    isActive: true,
    floors: [
      {
        id: "f3",
        name: "Entréplan",
        isActive: true,
        rooms: [{ id: "r4", name: "Personalrum", type: "personalutrymme", isActive: true }],
      },
    ],
  },
];

const defaultTemplates = [
  {
    id: "t1",
    localType: "sal",
    taskType: "manadsinsats",
    name: "Månadsinsats - Sal",
    tasks: ["Torka av bord", "Rengör whiteboard", "Dammsug hörn", "Kontrollera papperskorgar"],
    isActive: true,
    createdAt: "2026-03-01 09:00",
  },
  {
    id: "t2",
    localType: "toalett",
    taskType: "manadsinsats",
    name: "Månadsinsats - Toalett",
    tasks: ["Rengör toalettstol", "Torka kakel", "Fyll på förbrukningsmaterial", "Rengör handfat"],
    isActive: true,
    createdAt: "2026-03-01 09:10",
  },
  {
    id: "t3",
    localType: "sal",
    taskType: "storstädning",
    name: "Storstädning - Sal",
    tasks: ["Maskinskura golv", "Torka väggar", "Rengör ventiler", "Rengör armaturer"],
    isActive: true,
    createdAt: "2026-03-01 09:20",
  },
  {
    id: "t4",
    localType: "korridor",
    taskType: "storstädning",
    name: "Storstädning - Korridor",
    tasks: ["Maskinskura golv", "Rengör lister", "Torka dörrpartier", "Rengör glasytor"],
    isActive: true,
    createdAt: "2026-03-01 09:30",
  },
  {
    id: "t5",
    localType: "personalutrymme",
    taskType: "manadsinsats",
    name: "Månadsinsats - Personalutrymme",
    tasks: ["Torka köksytor", "Rengör kylskåpsfront", "Töm papperskorgar"],
    isActive: true,
    createdAt: "2026-03-01 09:40",
  },
];

const defaultSchedules = [
  { id: "s1", roomId: "r1", taskType: "manadsinsats", dueDate: "2026-03-10", isActive: true },
  { id: "s2", roomId: "r2", taskType: "manadsinsats", dueDate: "2026-03-12", isActive: true },
  { id: "s3", roomId: "r3", taskType: "storstädning", dueDate: "2026-03-18", isActive: true },
  { id: "s4", roomId: "r4", taskType: "manadsinsats", dueDate: "2026-03-15", isActive: true },
];

const defaultEntries = [
  {
    id: "e1",
    date: "2026-03-09",
    buildingId: "b1",
    floorId: "f1",
    roomId: "r1",
    localType: "sal",
    taskType: "manadsinsats",
    templateId: "t1",
    checkedTasks: ["Torka av bord", "Rengör whiteboard", "Dammsug hörn"],
    comment: "Klart, saknade byte av säck i en papperskorg.",
    images: ["foto-sal-101.jpg"],
    performedBy: "Utförare 1",
    performedByUserId: "u2",
    createdAt: "2026-03-09 09:12",
    updatedAt: "2026-03-09 09:12",
  },
];

const defaultAuditLog = [
  {
    id: "a1",
    createdAt: "2026-03-09 09:12",
    actorName: "Utförare 1",
    action: "entry.created",
    targetType: "entry",
    targetId: "e1",
    message: "Registrerade månadsinsats för Sal 101",
  },
];

function nowStamp() {
  return new Date()
    .toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

function createId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function canManage(user) {
  return user?.role === ROLE.ADMIN;
}

function monthRange(dateStr) {
  const month = dateStr.slice(0, 7);
  return { start: `${month}-01`, end: `${month}-31` };
}

function getActiveBuildings(buildings) {
  return (buildings || []).filter((building) => building.isActive !== false);
}

function getRoomMeta(buildings, roomId) {
  for (const building of buildings) {
    if (building.isActive === false) continue;
    for (const floor of building.floors || []) {
      if (floor.isActive === false) continue;
      const room = (floor.rooms || []).find((r) => r.id === roomId && r.isActive !== false);
      if (room) return { building, floor, room };
    }
  }
  return null;
}

function getMatchedTemplate(templates, room, taskType) {
  if (!room) return null;
  return (
    (templates || []).find(
      (template) =>
        template.isActive !== false && template.localType === room.type && template.taskType === taskType
    ) || null
  );
}

function calculatePendingAlerts(schedules, entries, buildings, today = TODAY) {
  return (schedules || [])
    .filter((schedule) => schedule.isActive !== false)
    .map((schedule) => {
      const meta = getRoomMeta(buildings, schedule.roomId);
      const range = monthRange(schedule.dueDate);
      const isCompleted = (entries || []).some(
        (entry) =>
          entry.roomId === schedule.roomId &&
          entry.taskType === schedule.taskType &&
          entry.date >= range.start &&
          entry.date <= range.end
      );
      return {
        ...schedule,
        ...meta,
        status: isCompleted ? "genomförd" : schedule.dueDate < today ? "missad" : "planerad",
      };
    })
    .filter((item) => item.room);
}

function filterEntries(entries, historyFilter) {
  const search = (historyFilter.search || "").trim().toLowerCase();
  return (entries || []).filter((entry) => {
    if (historyFilter.fromDate && entry.date < historyFilter.fromDate) return false;
    if (historyFilter.toDate && entry.date > historyFilter.toDate) return false;
    if (historyFilter.buildingId !== "all" && entry.buildingId !== historyFilter.buildingId) return false;
    if (historyFilter.roomId !== "all" && entry.roomId !== historyFilter.roomId) return false;
    if (historyFilter.taskType !== "all" && entry.taskType !== historyFilter.taskType) return false;
    if (historyFilter.performedBy !== "all" && entry.performedBy !== historyFilter.performedBy) return false;
    if (search) {
      const haystack = [
        entry.comment,
        entry.performedBy,
        entry.date,
        entry.taskType,
        ...(entry.checkedTasks || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function entriesToCsv(entries, buildings) {
  const header = [
    "Datum",
    "Hus",
    "Våning",
    "Lokal",
    "Lokaltyp",
    "Insatstyp",
    "Utförare",
    "Antal moment",
    "Moment",
    "Kommentar",
    "Bilder",
    "Registrerad",
    "Uppdaterad",
  ];

  const rows = (entries || []).map((entry) => {
    const meta = getRoomMeta(buildings, entry.roomId);
    return [
      entry.date,
      meta?.building?.name || "",
      meta?.floor?.name || "",
      meta?.room?.name || "",
      LOCAL_TYPE_LABELS[entry.localType] || entry.localType || "",
      TASK_TYPE_LABELS[entry.taskType] || entry.taskType,
      entry.performedBy,
      entry.checkedTasks.length,
      entry.checkedTasks.join(" | "),
      entry.comment || "",
      entry.images.join(" | "),
      entry.createdAt,
      entry.updatedAt,
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [header.map(escapeCsv).join(","), ...rows].join("\n");
}

function downloadCsv(filename, content) {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

function downloadJson(filename, data) {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

function safeParseStorage(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createDefaultState() {
  return {
    version: APP_VERSION,
    users: defaultUsers,
    buildings: defaultBuildings,
    templates: defaultTemplates,
    schedules: defaultSchedules,
    entries: defaultEntries,
    auditLog: defaultAuditLog,
  };
}

function migrateState(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  return {
    version: APP_VERSION,
    users: Array.isArray(state.users)
      ? state.users.map((user) => ({ isActive: true, lastLoginAt: null, createdAt: nowStamp(), ...user }))
      : defaultUsers,
    buildings: Array.isArray(state.buildings)
      ? state.buildings.map((building) => ({
          isActive: true,
          ...building,
          floors: (building.floors || []).map((floor) => ({
            isActive: true,
            ...floor,
            rooms: (floor.rooms || []).map((room) => ({ isActive: true, ...room })),
          })),
        }))
      : defaultBuildings,
    templates: Array.isArray(state.templates)
      ? state.templates.map((template) => ({ isActive: true, createdAt: nowStamp(), ...template }))
      : defaultTemplates,
    schedules: Array.isArray(state.schedules)
      ? state.schedules.map((schedule) => ({ isActive: true, ...schedule }))
      : defaultSchedules,
    entries: Array.isArray(state.entries)
      ? state.entries.map((entry) => ({
          updatedAt: entry.updatedAt || entry.createdAt || nowStamp(),
          performedByUserId: entry.performedByUserId || null,
          ...entry,
        }))
      : defaultEntries,
    auditLog: Array.isArray(state.auditLog) ? state.auditLog : defaultAuditLog,
  };
}

function loadInitialState() {
  if (typeof window === "undefined") return createDefaultState();
  const saved = safeParseStorage(window.localStorage.getItem(STORAGE_KEY));
  if (!saved) return createDefaultState();
  return migrateState(saved);
}

function validateUserForm(users, form) {
  if (!form.name.trim()) return "Namn måste anges.";
  if (!form.username.trim()) return "Användarnamn måste anges.";
  if (!form.password.trim()) return "Lösenord måste anges.";
  if ((users || []).some((user) => user.username === form.username.trim())) return "Användarnamnet finns redan.";
  return "";
}

function validateRoomForm(form) {
  if (!form.buildingName.trim()) return "Hus måste anges.";
  if (!form.floorName.trim()) return "Våning måste anges.";
  if (!form.roomName.trim()) return "Lokal måste anges.";
  return "";
}

function validateTemplateForm(form) {
  if (!form.name.trim()) return "Mallnamn måste anges.";
  return "";
}

function validateScheduleForm(form) {
  if (!form.roomId) return "Lokal måste väljas.";
  if (!form.dueDate) return "Datum måste anges.";
  return "";
}

function validateEntry(selection) {
  if (!selection.selectedBuildingId || !selection.selectedFloorId || !selection.selectedRoomId || !selection.selectedTaskType) {
    return "Välj hus, våning, lokal och insatstyp.";
  }
  if (!selection.matchedTemplate) return "Det saknas en checklista för vald kombination.";
  return "";
}

function addAuditLog(log, actorName, action, targetType, targetId, message) {
  const next = [
    {
      id: createId("a"),
      createdAt: nowStamp(),
      actorName: actorName || "System",
      action,
      targetType,
      targetId,
      message,
    },
    ...(log || []),
  ];
  return next.slice(0, AUDIT_LIMIT);
}

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maybeFail(probability = 0) {
  if (Math.random() < probability) {
    throw new Error("Tillfälligt fel. Försök igen.");
  }
}

const appRepository = {
  saveLocal(state) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  loadLocal() {
    return loadInitialState();
  },
  exportBackup(state) {
    return downloadJson("egenkontroll-backup.json", state);
  },
  importBackupText(text) {
    const parsed = safeParseStorage(text);
    if (!parsed) return { ok: false, error: "Filen kunde inte läsas som giltig JSON." };
    return { ok: true, data: migrateState(parsed) };
  },
};

const appService = {
  async saveEntry() {
    await delay(350);
    maybeFail(0.02);
    return { ok: true };
  },
  async updateEntry() {
    await delay(350);
    maybeFail(0.02);
    return { ok: true };
  },
  async archiveItem() {
    await delay(250);
    maybeFail(0.01);
    return { ok: true };
  },
  async createItem() {
    await delay(250);
    maybeFail(0.01);
    return { ok: true };
  },
  async importBackup() {
    await delay(400);
    maybeFail(0.01);
    return { ok: true };
  },
};

function runSelfTests() {
  const results = [];
  const assert = (name, condition) => results.push({ name, passed: Boolean(condition) });

  const meta = getRoomMeta(defaultBuildings, "r2");
  assert("getRoomMeta hittar rätt lokal", meta && meta.room.name === "Toalett 1" && meta.building.name === "Hus A");

  const matched = getMatchedTemplate(defaultTemplates, { id: "r1", type: "sal" }, "manadsinsats");
  assert("getMatchedTemplate hittar rätt mall", matched && matched.id === "t1");

  const alerts = calculatePendingAlerts(defaultSchedules, defaultEntries, defaultBuildings, TODAY);
  const completedAlert = alerts.find((a) => a.roomId === "r1" && a.taskType === "manadsinsats");
  assert("calculatePendingAlerts markerar genomförd insats", completedAlert && completedAlert.status === "genomförd");

  const missedAlert = alerts.find((a) => a.roomId === "r2" && a.taskType === "manadsinsats");
  assert("calculatePendingAlerts markerar missad insats", missedAlert && missedAlert.status === "missad");

  const filtered = filterEntries(defaultEntries, {
    fromDate: "2026-03-01",
    toDate: "2026-03-31",
    buildingId: "b1",
    roomId: "r1",
    taskType: "manadsinsats",
    performedBy: "Utförare 1",
    search: "whiteboard",
  });
  assert("filterEntries filtrerar korrekt", filtered.length === 1 && filtered[0].id === "e1");

  const csv = entriesToCsv(defaultEntries, defaultBuildings);
  assert("entriesToCsv skapar CSV-rader", csv.includes("Datum,Hus,Våning") && csv.includes("Sal 101"));

  const parsed = safeParseStorage('{"users":[]}');
  assert("safeParseStorage läser giltig JSON", parsed && Array.isArray(parsed.users));

  const invalid = safeParseStorage("not-json");
  assert("safeParseStorage hanterar ogiltig JSON", invalid === null);

  const validation = validateUserForm(defaultUsers, { name: "", username: "a", password: "b" });
  assert("validateUserForm stoppar tomt namn", validation.length > 0);

  const migrated = migrateState({ users: [], buildings: [], templates: [], schedules: [], entries: [] });
  assert("migrateState sätter version", migrated.version === APP_VERSION);

  const imported = appRepository.importBackupText(JSON.stringify(createDefaultState()));
  assert("importBackupText läser backup", imported.ok === true && imported.data.version === APP_VERSION);

  const escaped = escapeCsv('a,"b"');
  assert("escapeCsv maskerar citattecken", escaped === '"a,""b"""');

  return results;
}

function useResponsiveColumns() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => setIsCompact(window.innerWidth < 980);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isCompact;
}

function Icon({ children }) {
  return <span style={{ fontSize: 18, lineHeight: 1 }}>{children}</span>;
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, description, actions }) {
  return (
    <div
      style={{
        padding: 20,
        paddingBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
        {description ? <div style={{ color: "#6b7280", marginTop: 6 }}>{description}</div> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

function Button({ children, onClick, type = "button", variant = "primary", style, disabled }) {
  const palettes = {
    primary: { border: "#111827", background: "#111827", color: "#fff" },
    secondary: { border: "#d1d5db", background: "#fff", color: "#111827" },
    danger: { border: "#fecaca", background: "#fff1f2", color: "#991b1b" },
  };
  const palette = palettes[variant] || palettes.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 12,
        padding: "10px 14px",
        border: `1px solid ${palette.border}`,
        background: disabled ? "#e5e7eb" : palette.background,
        color: disabled ? "#6b7280" : palette.color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{label}</div> : null}
      <input
        {...props}
        style={{
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "10px 12px",
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{label}</div> : null}
      <textarea
        {...props}
        style={{
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "10px 12px",
          minHeight: 90,
          fontSize: 14,
          boxSizing: "border-box",
          resize: "vertical",
        }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{label}</div> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "10px 12px",
          fontSize: 14,
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { background: "#f3f4f6", color: "#111827", border: "#e5e7eb" },
    success: { background: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
    danger: { background: "#fef2f2", color: "#991b1b", border: "#fecaca" },
    info: { background: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 600,
        background: t.background,
        color: t.color,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <Panel>
      <div style={{ padding: 18, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{value}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{description}</div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon>{icon}</Icon>
        </div>
      </div>
    </Panel>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const selected = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              borderRadius: 14,
              padding: "10px 14px",
              border: `1px solid ${selected ? "#111827" : "#d1d5db"}`,
              background: selected ? "#111827" : "#fff",
              color: selected ? "#fff" : "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DataTable({ columns, rows, emptyText = "Inga rader att visa.", onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: "left",
                  fontSize: 13,
                  color: "#6b7280",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "10px 8px",
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 16, color: "#6b7280" }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  background: row.isSelected ? "#f8fafc" : "transparent",
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} style={{ borderBottom: "1px solid #f3f4f6", padding: "10px 8px", fontSize: 14 }}>
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function getStatusTone(status) {
  if (status === "genomförd") return "success";
  if (status === "missad") return "danger";
  return "info";
}

export default function LokalvardEgenkontrollApp() {
  const initialState = useMemo(() => appRepository.loadLocal(), []);
  const [users, setUsers] = useState(initialState.users);
  const [buildings, setBuildings] = useState(initialState.buildings);
  const [templates, setTemplates] = useState(initialState.templates);
  const [schedules, setSchedules] = useState(initialState.schedules);
  const [entries, setEntries] = useState(initialState.entries);
  const [auditLog, setAuditLog] = useState(initialState.auditLog || []);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "admin" });
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEntryId, setSelectedEntryId] = useState(initialState.entries[0]?.id || null);
  const [toast, setToast] = useState("");
  const [adminError, setAdminError] = useState("");
  const [importError, setImportError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [operationError, setOperationError] = useState("");

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("manadsinsats");
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [comment, setComment] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingEntryId, setEditingEntryId] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  const [historyFilter, setHistoryFilter] = useState({
    fromDate: "",
    toDate: "",
    buildingId: "all",
    roomId: "all",
    taskType: "all",
    performedBy: "all",
    search: "",
  });

  const [newTask, setNewTask] = useState("");
  const [templateForm, setTemplateForm] = useState({ localType: "sal", taskType: "manadsinsats", name: "" });
  const [roomForm, setRoomForm] = useState({ buildingName: "", floorName: "", roomName: "", localType: "sal" });
  const [userForm, setUserForm] = useState({ username: "", password: "", role: ROLE.EXECUTOR, name: "" });
  const [scheduleForm, setScheduleForm] = useState({ roomId: "", taskType: "manadsinsats", dueDate: TODAY });

  const importInputRef = useRef(null);
  const isCompact = useResponsiveColumns();

  useEffect(() => {
    appRepository.saveLocal({ version: APP_VERSION, users, buildings, templates, schedules, entries, auditLog });
  }, [users, buildings, templates, schedules, entries, auditLog]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeBuildings = useMemo(() => getActiveBuildings(buildings), [buildings]);
  const activeTemplates = useMemo(() => (templates || []).filter((template) => template.isActive !== false), [templates]);
  const activeUsers = useMemo(() => (users || []).filter((user) => user.isActive !== false), [users]);

  const selectedBuilding = activeBuildings.find((building) => building.id === selectedBuildingId) || null;
  const selectedFloor = selectedBuilding?.floors.find((floor) => floor.id === selectedFloorId && floor.isActive !== false) || null;
  const selectedRoom = selectedFloor?.rooms.find((room) => room.id === selectedRoomId && room.isActive !== false) || null;

  const matchedTemplate = useMemo(
    () => getMatchedTemplate(activeTemplates, selectedRoom, selectedTaskType),
    [activeTemplates, selectedRoom, selectedTaskType]
  );
  const pendingAlerts = useMemo(() => calculatePendingAlerts(schedules, entries, buildings, TODAY), [schedules, entries, buildings]);
  const filteredEntries = useMemo(() => filterEntries(entries, historyFilter), [entries, historyFilter]);
  const selectedEntry = useMemo(
    () => filteredEntries.find((entry) => entry.id === selectedEntryId) || filteredEntries[0] || null,
    [filteredEntries, selectedEntryId]
  );

  const reportSummary = useMemo(() => {
    const total = filteredEntries.length;
    const withImages = filteredEntries.filter((entry) => (entry.images || []).length > 0).length;
    const totalChecked = filteredEntries.reduce((sum, entry) => sum + (entry.checkedTasks || []).length, 0);
    return { total, withImages, totalChecked };
  }, [filteredEntries]);

  const allRooms = useMemo(
    () =>
      activeBuildings.flatMap((building) =>
        (building.floors || [])
          .filter((floor) => floor.isActive !== false)
          .flatMap((floor) =>
            (floor.rooms || [])
              .filter((room) => room.isActive !== false)
              .map((room) => ({
                ...room,
                buildingId: building.id,
                floorId: floor.id,
                buildingName: building.name,
                floorName: floor.name,
              }))
          )
      ),
    [activeBuildings]
  );

  const filteredUsers = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return users.filter((user) => [user.name, user.username, user.role].join(" ").toLowerCase().includes(q));
  }, [users, adminSearch]);

  const filteredRooms = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return allRooms.filter((room) =>
      [room.name, room.buildingName, room.floorName, LOCAL_TYPE_LABELS[room.type]].join(" ").toLowerCase().includes(q)
    );
  }, [allRooms, adminSearch]);

  const filteredTemplates = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return activeTemplates.filter((template) =>
      [template.name, template.localType, template.taskType, ...(template.tasks || [])].join(" ").toLowerCase().includes(q)
    );
  }, [activeTemplates, adminSearch]);

  const filteredAuditLog = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return auditLog.filter((item) =>
      [item.actorName, item.action, item.message, item.targetType].join(" ").toLowerCase().includes(q)
    );
  }, [auditLog, adminSearch]);

  const testResults = useMemo(() => runSelfTests(), []);
  const passedTests = testResults.filter((result) => result.passed).length;

  function showToast(message) {
    setToast(message);
  }

  function withBusy(label, fn) {
    return async (...args) => {
      try {
        setIsBusy(true);
        setBusyLabel(label);
        setOperationError("");
        return await fn(...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ett oväntat fel uppstod.";
        setOperationError(message);
        showToast("Åtgärden kunde inte genomföras");
        return null;
      } finally {
        setIsBusy(false);
        setBusyLabel("");
      }
    };
  }

  function pushAudit(action, targetType, targetId, message) {
    setAuditLog((prev) => addAuditLog(prev, currentUser?.name || "System", action, targetType, targetId, message));
  }

  function confirmAction(message) {
    if (typeof window === "undefined") return true;
    return window.confirm(message);
  }

  function requireAdmin() {
    if (!canManage(currentUser)) {
      setAdminError("Endast administratör kan utföra denna åtgärd.");
      return false;
    }
    setAdminError("");
    return true;
  }

  function resetEntryForm() {
    setSelectedTasks([]);
    setComment("");
    setUploadedImages([]);
    setSaveMessage("");
    setEditingEntryId("");
  }

  function startEditingEntry(entry) {
    const meta = getRoomMeta(buildings, entry.roomId);
    setSelectedBuildingId(entry.buildingId || meta?.building?.id || "");
    setSelectedFloorId(entry.floorId || meta?.floor?.id || "");
    setSelectedRoomId(entry.roomId);
    setSelectedTaskType(entry.taskType);
    setSelectedDate(entry.date);
    setSelectedTasks(entry.checkedTasks || []);
    setComment(entry.comment || "");
    setUploadedImages(entry.images || []);
    setEditingEntryId(entry.id);
    setSaveMessage("Redigeringsläge aktivt.");
    setActiveTab("registrera");
  }

  function handleLogin(event) {
    if (event) event.preventDefault();
    const found = activeUsers.find((user) => user.username === loginForm.username && user.password === loginForm.password);
    if (!found) {
      setLoginError("Fel användarnamn eller lösenord.");
      return;
    }
    const stampedUser = { ...found, lastLoginAt: nowStamp() };
    setUsers((prev) => prev.map((user) => (user.id === found.id ? stampedUser : user)));
    setCurrentUser(stampedUser);
    setActiveTab(stampedUser.role === ROLE.ADMIN ? "dashboard" : "registrera");
    setLoginError("");
    setAuditLog((prev) =>
      addAuditLog(prev, stampedUser.name, "auth.login", "user", stampedUser.id, "Användaren loggade in")
    );
  }

  function toggleTask(task) {
    setSelectedTasks((prev) => (prev.includes(task) ? prev.filter((item) => item !== task) : [...prev, task]));
  }

  function handleImageUpload(event) {
    const files = Array.from((event.target && event.target.files) || []);
    setUploadedImages((prev) => [...prev, ...files.map((file) => file.name)]);
  }

  function removeUploadedImage(imageName) {
    setUploadedImages((prev) => prev.filter((image) => image !== imageName));
  }

  async function saveEntry() {
    const validationError = validateEntry({
      selectedBuildingId,
      selectedFloorId,
      selectedRoomId,
      selectedTaskType,
      matchedTemplate,
    });
    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    if (editingEntryId) {
      await appService.updateEntry();
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntryId
            ? {
                ...entry,
                date: selectedDate,
                buildingId: selectedBuildingId,
                floorId: selectedFloorId,
                roomId: selectedRoomId,
                localType: selectedRoom.type,
                taskType: selectedTaskType,
                templateId: matchedTemplate.id,
                checkedTasks: selectedTasks,
                comment,
                images: uploadedImages,
                updatedAt: nowStamp(),
              }
            : entry
        )
      );
      setSelectedEntryId(editingEntryId);
      setSaveMessage("Insatsen har uppdaterats.");
      showToast("Insats uppdaterad");
      pushAudit("entry.updated", "entry", editingEntryId, "Uppdaterade registrerad insats");
      setEditingEntryId("");
      setSelectedTasks([]);
      setComment("");
      setUploadedImages([]);
      return;
    }

    await appService.saveEntry();
    const newEntry = {
      id: createId("e"),
      date: selectedDate,
      buildingId: selectedBuildingId,
      floorId: selectedFloorId,
      roomId: selectedRoomId,
      localType: selectedRoom.type,
      taskType: selectedTaskType,
      templateId: matchedTemplate.id,
      checkedTasks: selectedTasks,
      comment,
      images: uploadedImages,
      performedBy: currentUser?.name || "Okänd",
      performedByUserId: currentUser?.id || null,
      createdAt: nowStamp(),
      updatedAt: nowStamp(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);
    setSaveMessage("Insatsen har sparats.");
    showToast("Insats sparad");
    pushAudit(
      "entry.created",
      "entry",
      newEntry.id,
      `Registrerade ${TASK_TYPE_LABELS[newEntry.taskType].toLowerCase()} för vald lokal`
    );
    setSelectedTasks([]);
    setComment("");
    setUploadedImages([]);
  }

  async function deleteEntry(entryId) {
    if (!confirmAction("Vill du verkligen ta bort den här registreringen?")) return;
    await appService.archiveItem();
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setSelectedEntryId(null);
    showToast("Post borttagen");
    pushAudit("entry.deleted", "entry", entryId, "Tog bort registrerad insats");
  }

  async function createTemplate() {
    if (!requireAdmin()) return;
    const validationError = validateTemplateForm(templateForm);
    if (validationError) {
      setAdminError(validationError);
      return;
    }
    await appService.createItem();
    const newTemplate = {
      id: createId("t"),
      localType: templateForm.localType,
      taskType: templateForm.taskType,
      name: templateForm.name.trim(),
      tasks: [],
      isActive: true,
      createdAt: nowStamp(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setTemplateForm((prev) => ({ ...prev, name: "" }));
    showToast("Mall skapad");
    pushAudit("template.created", "template", newTemplate.id, `Skapade mall ${newTemplate.name}`);
  }

  async function addTaskToTemplate() {
    if (!requireAdmin()) return;
    if (!newTask.trim()) return;

    const targetTemplate =
      activeTemplates.find((template) => template.id === editingTemplateId) ||
      activeTemplates.find(
        (template) => template.localType === templateForm.localType && template.taskType === templateForm.taskType
      );

    if (!targetTemplate) {
      await appService.createItem();
      const created = {
        id: createId("t"),
        localType: templateForm.localType,
        taskType: templateForm.taskType,
        name: `${TASK_TYPE_LABELS[templateForm.taskType]} - ${LOCAL_TYPE_LABELS[templateForm.localType]}`,
        tasks: [newTask.trim()],
        isActive: true,
        createdAt: nowStamp(),
      };
      setTemplates((prev) => [...prev, created]);
      setEditingTemplateId(created.id);
      showToast("Mall och moment skapade");
      pushAudit("template.created", "template", created.id, `Skapade mall ${created.name}`);
      setNewTask("");
      return;
    }

    await appService.createItem();
    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id !== targetTemplate.id) return template;
        if (template.tasks.includes(newTask.trim())) return template;
        return { ...template, tasks: [...template.tasks, newTask.trim()] };
      })
    );
    setNewTask("");
    showToast("Moment tillagt");
    pushAudit("template.task_added", "template", targetTemplate.id, `La till moment i ${targetTemplate.name}`);
  }

  async function removeTaskFromTemplate(templateId, task) {
    if (!requireAdmin()) return;
    if (!confirmAction(`Ta bort momentet "${task}"?`)) return;
    await appService.archiveItem();
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId ? { ...template, tasks: template.tasks.filter((item) => item !== task) } : template
      )
    );
    showToast("Moment borttaget");
    pushAudit("template.task_removed", "template", templateId, `Tog bort moment ${task}`);
  }

  function updateTemplateName(templateId, name) {
    if (!requireAdmin()) return;
    setTemplates((prev) => prev.map((template) => (template.id === templateId ? { ...template, name } : template)));
  }

  function saveTemplateName(templateId) {
    const target = templates.find((template) => template.id === templateId);
    showToast("Mall uppdaterad");
    pushAudit("template.updated", "template", templateId, `Uppdaterade mallnamn för ${target?.name || "mall"}`);
  }

  async function deactivateTemplate(templateId) {
    if (!requireAdmin()) return;
    if (!confirmAction("Vill du arkivera den här mallen?")) return;
    await appService.archiveItem();
    setTemplates((prev) => prev.map((template) => (template.id === templateId ? { ...template, isActive: false } : template)));
    if (editingTemplateId === templateId) setEditingTemplateId("");
    showToast("Mall arkiverad");
    pushAudit("template.archived", "template", templateId, "Arkiverade mall");
  }

  async function addRoomStructure() {
    if (!requireAdmin()) return;
    const validationError = validateRoomForm(roomForm);
    if (validationError) {
      setAdminError(validationError);
      return;
    }
    const buildingName = roomForm.buildingName.trim();
    const floorName = roomForm.floorName.trim();
    const roomName = roomForm.roomName.trim();

    await appService.createItem();
    let createdRoomId = "";
    setBuildings((prev) => {
      const existingBuilding = prev.find((building) => building.name === buildingName && building.isActive !== false);
      if (!existingBuilding) {
        createdRoomId = createId("r");
        return [
          ...prev,
          {
            id: createId("b"),
            name: buildingName,
            isActive: true,
            floors: [
              {
                id: createId("f"),
                name: floorName,
                isActive: true,
                rooms: [{ id: createdRoomId, name: roomName, type: roomForm.localType, isActive: true }],
              },
            ],
          },
        ];
      }
      return prev.map((building) => {
        if (building.name !== buildingName || building.isActive === false) return building;
        const existingFloor = building.floors.find((floor) => floor.name === floorName && floor.isActive !== false);
        if (!existingFloor) {
          createdRoomId = createId("r");
          return {
            ...building,
            floors: [
              ...building.floors,
              {
                id: createId("f"),
                name: floorName,
                isActive: true,
                rooms: [{ id: createdRoomId, name: roomName, type: roomForm.localType, isActive: true }],
              },
            ],
          };
        }
        const alreadyExists = existingFloor.rooms.some((room) => room.name === roomName && room.isActive !== false);
        if (alreadyExists) return building;
        createdRoomId = createId("r");
        return {
          ...building,
          floors: building.floors.map((floor) =>
            floor.name === floorName
              ? {
                  ...floor,
                  rooms: [...floor.rooms, { id: createdRoomId, name: roomName, type: roomForm.localType, isActive: true }],
                }
              : floor
          ),
        };
      });
    });
    setRoomForm({ buildingName: "", floorName: "", roomName: "", localType: "sal" });
    showToast("Lokal tillagd");
    pushAudit("room.created", "room", createdRoomId || "unknown", `La till lokal ${roomName}`);
  }

  async function deactivateRoom(roomId) {
    if (!requireAdmin()) return;
    if (!confirmAction("Vill du arkivera den här lokalen?")) return;
    await appService.archiveItem();
    setBuildings((prev) =>
      prev.map((building) => ({
        ...building,
        floors: (building.floors || []).map((floor) => ({
          ...floor,
          rooms: (floor.rooms || []).map((room) => (room.id === roomId ? { ...room, isActive: false } : room)),
        })),
      }))
    );
    showToast("Lokal arkiverad");
    pushAudit("room.archived", "room", roomId, "Arkiverade lokal");
  }

  async function createUser() {
    if (!requireAdmin()) return;
    const validationError = validateUserForm(users, userForm);
    if (validationError) {
      setAdminError(validationError);
      return;
    }
    await appService.createItem();
    const newUser = {
      id: createId("u"),
      username: userForm.username.trim(),
      password: userForm.password.trim(),
      role: userForm.role,
      name: userForm.name.trim(),
      isActive: true,
      createdAt: nowStamp(),
      lastLoginAt: null,
    };
    setUsers((prev) => [...prev, newUser]);
    setUserForm({ username: "", password: "", role: ROLE.EXECUTOR, name: "" });
    showToast("Användare skapad");
    pushAudit("user.created", "user", newUser.id, `Skapade användare ${newUser.name}`);
  }

  async function toggleUserActive(userId) {
    if (!requireAdmin()) return;
    if (currentUser?.id === userId) {
      setAdminError("Du kan inte inaktivera dig själv.");
      return;
    }
    const target = users.find((user) => user.id === userId);
    if (!confirmAction(`Vill du ${target?.isActive ? "inaktivera" : "aktivera"} ${target?.name}?`)) return;
    await appService.archiveItem();
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user)));
    showToast(target?.isActive ? "Användare inaktiverad" : "Användare aktiverad");
    pushAudit("user.status_toggled", "user", userId, `Ändrade status för ${target?.name || "användare"}`);
  }

  async function updateUserRole(userId, role) {
    if (!requireAdmin()) return;
    await appService.createItem();
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    showToast("Roll uppdaterad");
    pushAudit("user.role_updated", "user", userId, "Uppdaterade användarroll");
  }

  async function addSchedule() {
    if (!requireAdmin()) return;
    const validationError = validateScheduleForm(scheduleForm);
    if (validationError) {
      setAdminError(validationError);
      return;
    }
    await appService.createItem();
    const newSchedule = {
      id: createId("s"),
      roomId: scheduleForm.roomId,
      taskType: scheduleForm.taskType,
      dueDate: scheduleForm.dueDate,
      isActive: true,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    setScheduleForm({ roomId: "", taskType: "manadsinsats", dueDate: TODAY });
    showToast("Planerad insats tillagd");
    pushAudit("schedule.created", "schedule", newSchedule.id, "Skapade planerad insats");
  }

  async function deleteSchedule(scheduleId) {
    if (!requireAdmin()) return;
    if (!confirmAction("Vill du arkivera den här planeringen?")) return;
    await appService.archiveItem();
    setSchedules((prev) => prev.map((schedule) => (schedule.id === scheduleId ? { ...schedule, isActive: false } : schedule)));
    showToast("Planering arkiverad");
    pushAudit("schedule.archived", "schedule", scheduleId, "Arkiverade planering");
  }

  function exportBackup() {
    const ok = appRepository.exportBackup({ version: APP_VERSION, users, buildings, templates, schedules, entries, auditLog });
    if (ok) showToast("Backup exporterad");
  }

  function triggerImport() {
    if (importInputRef.current) importInputRef.current.click();
  }

  function handleImportBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = appRepository.importBackupText(String(reader.result || ""));
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      if (!confirmAction("Vill du importera backupen och ersätta nuvarande data?")) return;
      try {
        setIsBusy(true);
        setBusyLabel("Importerar backup...");
        setOperationError("");
        await appService.importBackup();
        setImportError("");
        setUsers(result.data.users);
        setBuildings(result.data.buildings);
        setTemplates(result.data.templates);
        setSchedules(result.data.schedules);
        setEntries(result.data.entries);
        setAuditLog(
          addAuditLog(
            result.data.auditLog || [],
            currentUser?.name || "System",
            "backup.imported",
            "system",
            "backup",
            "Importerade JSON-backup"
          )
        );
        setSelectedEntryId(result.data.entries?.[0]?.id || null);
        showToast("Backup importerad");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Importen misslyckades.";
        setOperationError(message);
      } finally {
        setIsBusy(false);
        setBusyLabel("");
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  async function resetDemoData() {
    if (!confirmAction("Vill du återställa all demo-data?")) return;
    await appService.archiveItem();
    const fresh = createDefaultState();
    setUsers(fresh.users);
    setBuildings(fresh.buildings);
    setTemplates(fresh.templates);
    setSchedules(fresh.schedules);
    setEntries(fresh.entries);
    setAuditLog(fresh.auditLog);
    setSelectedEntryId(fresh.entries[0]?.id || null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    showToast("Demo-data återställd");
  }

  function exportFilteredCsv() {
    const csv = entriesToCsv(filteredEntries, buildings);
    const ok = downloadCsv("egenkontroll-rapport.csv", csv);
    if (ok) showToast("CSV exporterad");
  }

  const tabOptions =
    currentUser?.role === ROLE.ADMIN
      ? [
          { value: "dashboard", label: "Översikt" },
          { value: "registrera", label: "Registrera" },
          { value: "historik", label: "Historik" },
          { value: "paminnelser", label: "Påminnelser" },
          { value: "rapporter", label: "Rapporter" },
          { value: "admin", label: "Admin" },
        ]
      : [
          { value: "dashboard", label: "Översikt" },
          { value: "registrera", label: "Registrera" },
          { value: "historik", label: "Historik" },
          { value: "paminnelser", label: "Påminnelser" },
          { value: "rapporter", label: "Rapporter" },
          { value: "konto", label: "Konto" },
        ];

  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Panel style={{ width: "100%", maxWidth: 520 }}>
          <SectionTitle
            title={APP_NAME}
            description="Produktionsnära frontendstruktur med versionerad lagring, rollstyrning, import/export och revisionslogg."
          />
          <form onSubmit={handleLogin} style={{ padding: 20, display: "grid", gap: 14 }}>
            <Input
              label="Användarnamn"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <Input
              label="Lösenord"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            {loginError ? <div style={{ color: "#b91c1c", fontSize: 14 }}>{loginError}</div> : null}
            <Button type="submit">Logga in</Button>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Demo-konton: admin/admin eller utforare/1234</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {testResults.map((result) => (
                <Badge key={result.name} tone={result.passed ? "success" : "danger"}>
                  {result.passed ? "✓" : "✕"} {result.name}
                </Badge>
              ))}
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{APP_NAME}</div>
            <div style={{ color: "#6b7280", marginTop: 6 }}>
              Registrering, uppföljning och administration av månadsinsatser och storstädning i {APP_SHORT_NAME}.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Badge tone="info">{currentUser.role === ROLE.ADMIN ? "Administratör" : "Utförare"}</Badge>
            <Badge>{currentUser.name}</Badge>
            {currentUser.lastLoginAt ? <Badge>Senast inloggad {currentUser.lastLoginAt}</Badge> : null}
            <Button variant="secondary" onClick={() => setCurrentUser(null)}>
              Logga ut
            </Button>
          </div>
        </div>

        {isBusy ? (
          <div style={{ position: "sticky", top: 10, zIndex: 25, marginBottom: 12 }}>
            <div
              style={{
                display: "inline-block",
                background: "#1d4ed8",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow: "0 12px 30px rgba(29,0,216,0.2)",
              }}
            >
              {busyLabel || "Arbetar..."}
            </div>
          </div>
        ) : null}

        {operationError ? (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "inline-block",
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "10px 14px",
              }}
            >
              {operationError}
            </div>
          </div>
        ) : null}

        {toast ? (
          <div style={{ position: "sticky", top: 10, zIndex: 20, marginBottom: 12 }}>
            <div
              style={{
                display: "inline-block",
                background: "#111827",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
              }}
            >
              {toast}
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 18 }}>
          <StatCard title="Registrerade insatser" value={entries.length} description="Totalt sparade poster" icon="🧾" />
          <StatCard
            title="Missade insatser"
            value={pendingAlerts.filter((item) => item.status === "missad").length}
            description="Behöver följas upp"
            icon="🔔"
          />
          <StatCard title="Aktiva lokaler" value={allRooms.length} description="Tillgängliga för registrering" icon="🏢" />
          <StatCard title="Revisionslogg" value={auditLog.length} description="Senaste händelser sparade" icon="🕒" />
          <StatCard
            title="Genomförandegrad"
            value={`${pendingAlerts.length ? Math.round((pendingAlerts.filter((item) => item.status === "genomförd").length / pendingAlerts.length) * 100) : 0}%`}
            description="Planerade insatser slutförda"
            icon="📈"
          />
        </div>

        <Panel style={{ padding: 12, marginBottom: 18 }}>
          <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />
        </Panel>

        {activeTab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "2fr 1fr", gap: 16 }}>
            <Panel>
              <SectionTitle
                title="Senaste registreringar"
                description="De senaste insatserna som sparats i systemet."
                actions={<Badge tone="info">Version {APP_VERSION}</Badge>}
              />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                {entries.slice(0, 5).map((entry) => {
                  const meta = getRoomMeta(buildings, entry.roomId);
                  return (
                    <div
                      key={entry.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {meta?.room?.name} · {TASK_TYPE_LABELS[entry.taskType]}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
                          {meta?.building?.name}, {meta?.floor?.name} · {entry.date} · {entry.performedBy}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge>{entry.checkedTasks.length} moment</Badge>
                        {(entry.images || []).length > 0 ? <Badge tone="info">📷 {entry.images.length} bild</Badge> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Att följa upp" description="Missade eller kommande insatser." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                {pendingAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
                    <div style={{ fontWeight: 700 }}>{alert.room?.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
                      {alert.building?.name} · {alert.floor?.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{TASK_TYPE_LABELS[alert.taskType]}</span>
                      <Badge tone={getStatusTone(alert.status)}>{alert.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "registrera" && (
          <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 2fr", gap: 16 }}>
            <Panel>
              <SectionTitle title="Välj insats" description="Välj plats och typ av insats." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 14 }}>
                <Input label="Datum" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                <Select
                  label="Hus"
                  value={selectedBuildingId}
                  onChange={(value) => {
                    setSelectedBuildingId(value);
                    setSelectedFloorId("");
                    setSelectedRoomId("");
                    resetEntryForm();
                  }}
                  placeholder="Välj hus"
                  options={activeBuildings.map((building) => ({ value: building.id, label: building.name }))}
                />
                <Select
                  label="Våning"
                  value={selectedFloorId}
                  onChange={(value) => {
                    setSelectedFloorId(value);
                    setSelectedRoomId("");
                    resetEntryForm();
                  }}
                  placeholder="Välj våning"
                  options={(selectedBuilding?.floors || [])
                    .filter((floor) => floor.isActive !== false)
                    .map((floor) => ({ value: floor.id, label: floor.name }))}
                />
                <Select
                  label="Lokal"
                  value={selectedRoomId}
                  onChange={(value) => {
                    setSelectedRoomId(value);
                    resetEntryForm();
                  }}
                  placeholder="Välj lokal"
                  options={(selectedFloor?.rooms || [])
                    .filter((room) => room.isActive !== false)
                    .map((room) => ({ value: room.id, label: room.name }))}
                />
                <Select
                  label="Insatstyp"
                  value={selectedTaskType}
                  onChange={(value) => {
                    setSelectedTaskType(value);
                    resetEntryForm();
                  }}
                  options={[
                    { value: "manadsinsats", label: TASK_TYPE_LABELS.manadsinsats },
                    { value: "storstädning", label: TASK_TYPE_LABELS.storstädning },
                  ]}
                />
                {selectedRoom ? (
                  <div style={{ background: "#f3f4f6", borderRadius: 16, padding: 12, fontSize: 14 }}>
                    <div>
                      <strong>Lokaltyp:</strong> {LOCAL_TYPE_LABELS[selectedRoom.type]}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <strong>Checklista:</strong> {matchedTemplate?.name || "Saknas"}
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                title={editingEntryId ? "Redigera insats" : "Checklista"}
                description={editingEntryId ? "Du uppdaterar en tidigare registrering." : "Bocka i de moment som har utförts."}
                actions={editingEntryId ? <Button variant="secondary" onClick={resetEntryForm}>Avbryt redigering</Button> : null}
              />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 16 }}>
                {!matchedTemplate ? (
                  <div style={{ border: "1px dashed #d1d5db", color: "#6b7280", borderRadius: 16, padding: 20 }}>
                    Välj en lokal och insatstyp som har en tillhörande checklista.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gap: 10 }}>
                      {matchedTemplate.tasks.map((task) => (
                        <label
                          key={task}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            padding: 12,
                            background: selectedTasks.includes(task) ? "#f8fafc" : "#fff",
                          }}
                        >
                          <input type="checkbox" checked={selectedTasks.includes(task)} onChange={() => toggleTask(task)} />
                          <span>{task}</span>
                        </label>
                      ))}
                    </div>
                    <Textarea label="Kommentar" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Skriv kommentar eller avvikelse" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Ladda upp bilder</div>
                      <input type="file" multiple onChange={handleImageUpload} />
                      {uploadedImages.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          {uploadedImages.map((image) => (
                            <span key={image} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Badge tone="info">📷 {image}</Badge>
                              <button
                                onClick={() => removeUploadedImage(image)}
                                style={{ border: "none", background: "transparent", color: "#991b1b", cursor: "pointer" }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {saveMessage ? (
                      <div style={{ color: saveMessage.includes("sparats") || saveMessage.includes("uppdaterats") ? "#047857" : "#b91c1c", fontSize: 14 }}>
                        {saveMessage}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button
                        onClick={() => withBusy(editingEntryId ? "Uppdaterar insats..." : "Sparar insats...", saveEntry)()}
                        disabled={isBusy}
                      >
                        {editingEntryId ? "Uppdatera insats" : "Spara insats"}
                      </Button>
                      <Button variant="secondary" onClick={resetEntryForm}>
                        Rensa
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "historik" && (
          <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1.7fr 1fr", gap: 16 }}>
            <Panel>
              <SectionTitle
                title="Historik och filtrering"
                description="Filtrera tidigare insatser på datum, hus, lokal, insatstyp, utförare och fritext."
                actions={<Button variant="secondary" onClick={exportFilteredCsv}>Exportera CSV</Button>}
              />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <Input type="date" label="Från" value={historyFilter.fromDate} onChange={(e) => setHistoryFilter({ ...historyFilter, fromDate: e.target.value })} />
                  <Input type="date" label="Till" value={historyFilter.toDate} onChange={(e) => setHistoryFilter({ ...historyFilter, toDate: e.target.value })} />
                  <Select
                    label="Hus"
                    value={historyFilter.buildingId}
                    onChange={(value) => setHistoryFilter({ ...historyFilter, buildingId: value })}
                    options={[{ value: "all", label: "Alla hus" }, ...activeBuildings.map((building) => ({ value: building.id, label: building.name }))]}
                  />
                  <Select
                    label="Lokal"
                    value={historyFilter.roomId}
                    onChange={(value) => setHistoryFilter({ ...historyFilter, roomId: value })}
                    options={[{ value: "all", label: "Alla lokaler" }, ...allRooms.map((room) => ({ value: room.id, label: room.name }))]}
                  />
                  <Select
                    label="Insatstyp"
                    value={historyFilter.taskType}
                    onChange={(value) => setHistoryFilter({ ...historyFilter, taskType: value })}
                    options={[
                      { value: "all", label: "Alla insatstyper" },
                      { value: "manadsinsats", label: TASK_TYPE_LABELS.manadsinsats },
                      { value: "storstädning", label: TASK_TYPE_LABELS.storstädning },
                    ]}
                  />
                  <Select
                    label="Utförare"
                    value={historyFilter.performedBy}
                    onChange={(value) => setHistoryFilter({ ...historyFilter, performedBy: value })}
                    options={[{ value: "all", label: "Alla utförare" }, ...[...new Set(entries.map((entry) => entry.performedBy))].map((name) => ({ value: name, label: name }))]}
                  />
                  <Input label="Sök" placeholder="Kommentar, moment, datum..." value={historyFilter.search} onChange={(e) => setHistoryFilter({ ...historyFilter, search: e.target.value })} />
                </div>
                <DataTable
                  columns={[
                    { key: "date", title: "Datum" },
                    { key: "building", title: "Hus" },
                    { key: "room", title: "Lokal" },
                    { key: "taskType", title: "Insats" },
                    { key: "performedBy", title: "Utförare" },
                    { key: "checked", title: "Moment" },
                  ]}
                  rows={filteredEntries.map((entry) => {
                    const meta = getRoomMeta(buildings, entry.roomId);
                    return {
                      id: entry.id,
                      isSelected: entry.id === selectedEntry?.id,
                      date: entry.date,
                      building: meta?.building?.name || "-",
                      room: meta?.room?.name || "-",
                      taskType: TASK_TYPE_LABELS[entry.taskType],
                      performedBy: entry.performedBy,
                      checked: entry.checkedTasks.length,
                    };
                  })}
                  onRowClick={(row) => setSelectedEntryId(row.id)}
                />
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                title="Detaljer"
                description="Vald registrering"
                actions={selectedEntry ? [
                  <Button key="edit" variant="secondary" onClick={() => startEditingEntry(selectedEntry)} disabled={isBusy}>Redigera</Button>,
                  <Button key="delete" variant="danger" onClick={() => withBusy("Tar bort registrering...", deleteEntry)(selectedEntry.id)} disabled={isBusy}>Ta bort</Button>,
                ] : null}
              />
              <div style={{ padding: 20, paddingTop: 4 }}>
                {!selectedEntry ? (
                  <div style={{ color: "#6b7280" }}>Välj en rad i historiken för att se detaljer.</div>
                ) : (() => {
                  const meta = getRoomMeta(buildings, selectedEntry.roomId);
                  return (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div><strong>Datum:</strong> {selectedEntry.date}</div>
                      <div><strong>Hus:</strong> {meta?.building?.name}</div>
                      <div><strong>Våning:</strong> {meta?.floor?.name}</div>
                      <div><strong>Lokal:</strong> {meta?.room?.name}</div>
                      <div><strong>Typ:</strong> {TASK_TYPE_LABELS[selectedEntry.taskType]}</div>
                      <div><strong>Utförare:</strong> {selectedEntry.performedBy}</div>
                      <div><strong>Kommentar:</strong> {selectedEntry.comment || "-"}</div>
                      <div><strong>Skapad:</strong> {selectedEntry.createdAt}</div>
                      <div><strong>Uppdaterad:</strong> {selectedEntry.updatedAt}</div>
                      <div>
                        <strong>Utförda moment:</strong>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          {selectedEntry.checkedTasks.length > 0 ? selectedEntry.checkedTasks.map((task) => <Badge key={task}>{task}</Badge>) : <span>-</span>}
                        </div>
                      </div>
                      <div>
                        <strong>Bilder:</strong>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          {selectedEntry.images.length > 0 ? selectedEntry.images.map((image) => <Badge key={image} tone="info">📷 {image}</Badge>) : <span>-</span>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "paminnelser" && (
          <Panel>
            <SectionTitle title="Påminnelser och missade insatser" description="Överblick över planerade, genomförda och missade insatser per lokal." />
            <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
              {pendingAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{alert.room?.name} · {TASK_TYPE_LABELS[alert.taskType]}</div>
                    <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
                      {alert.building?.name}, {alert.floor?.name} · senast {alert.dueDate}
                    </div>
                  </div>
                  <Badge tone={getStatusTone(alert.status)}>{alert.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "rapporter" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <StatCard title="Filtrerade insatser" value={reportSummary.total} description="Baserat på aktuellt urval i historiken" icon="📚" />
            <StatCard title="Bilder bifogade" value={reportSummary.withImages} description="Antal poster med bilder" icon="📷" />
            <StatCard title="Utförda moment" value={reportSummary.totalChecked} description="Summering av ikryssade moment" icon="✅" />
            <Panel style={{ gridColumn: "1 / -1" }}>
              <SectionTitle
                title="Rapportutkast"
                description="CSV-export fungerar. JSON-backup finns för dataflytt. PDF kan kopplas via backend eller klientbibliotek."
                actions={[
                  <Button key="csv" variant="secondary" onClick={exportFilteredCsv}>Exportera CSV</Button>,
                  <Button key="backup" variant="secondary" onClick={exportBackup}>Exportera JSON-backup</Button>,
                  <Button key="pdf" variant="secondary" onClick={() => window.alert("PDF-export kopplas i nästa steg via backend eller klientbibliotek.")}>Exportera PDF</Button>,
                ]}
              />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 14 }}>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
                  <div style={{ fontWeight: 700 }}>Rapportinnehåll</div>
                  <ul style={{ color: "#6b7280", marginTop: 10, paddingLeft: 20 }}>
                    <li>Period och filterurval</li>
                    <li>Antal registrerade insatser</li>
                    <li>Utförda moment per lokal och insatstyp</li>
                    <li>Bilder och kommentarer</li>
                    <li>Missade insatser och uppföljningsbehov</li>
                  </ul>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "konto" && currentUser.role !== ROLE.ADMIN && (
          <Panel>
            <SectionTitle title="Mitt konto" description="Du är inloggad som utförare." />
            <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 8, fontSize: 14 }}>
              <div><strong>Namn:</strong> {currentUser.name}</div>
              <div><strong>Användarnamn:</strong> {currentUser.username}</div>
              <div><strong>Roll:</strong> Utförare</div>
              <div><strong>Senast inloggad:</strong> {currentUser.lastLoginAt || "-"}</div>
            </div>
          </Panel>
        )}

        {activeTab === "admin" && currentUser.role === ROLE.ADMIN && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            <Panel style={{ gridColumn: "1 / -1" }}>
              <SectionTitle
                title="Admincenter"
                description="Produktionsnära frontend med arkivering, validering, rollstyrning, import/export, sök och revisionslogg."
                actions={[
                  <Button key="import" variant="secondary" onClick={triggerImport} disabled={isBusy}>Importera backup</Button>,
                  <Button key="export" variant="secondary" onClick={exportBackup} disabled={isBusy}>Exportera backup</Button>,
                  <Button key="reset" variant="secondary" onClick={() => withBusy("Återställer demo-data...", resetDemoData)()} disabled={isBusy}>Återställ demo-data</Button>,
                ]}
              />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 10 }}>
                {adminError ? <div style={{ color: "#b91c1c", fontSize: 14 }}>{adminError}</div> : <div style={{ color: "#6b7280", fontSize: 14 }}>Använd adminfunktionerna nedan för att hantera masterdata utan att radera historik.</div>}
                {importError ? <div style={{ color: "#b91c1c", fontSize: 14 }}>{importError}</div> : null}
                <Input label="Sök i admin" placeholder="Användare, lokaler, mallar, logg..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} />
                <input ref={importInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImportBackup} />
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Hantera användare" description="Skapa, ändra roll och aktivera/inaktivera användare." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                <Input label="Namn" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                <Input label="Användarnamn" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                <Input label="Lösenord" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                <Select label="Roll" value={userForm.role} onChange={(value) => setUserForm({ ...userForm, role: value })} options={[{ value: ROLE.EXECUTOR, label: "Utförare" }, { value: ROLE.ADMIN, label: "Administratör" }]} />
                <Button onClick={() => withBusy("Skapar användare...", createUser)()} disabled={isBusy}>Skapa användare</Button>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 12, display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
                  {filteredUsers.map((user) => (
                    <div key={user.id} style={{ border: user.id === editingUserId ? "1px solid #111827" : "1px solid #e5e7eb", borderRadius: 12, padding: 12, fontSize: 14, display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <strong>{user.name}</strong>
                        <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Aktiv" : "Inaktiv"}</Badge>
                      </div>
                      <div style={{ color: "#6b7280" }}>{user.username}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button variant="secondary" onClick={() => { setEditingUserId(user.id); withBusy("Uppdaterar roll...", updateUserRole)(user.id, user.role === ROLE.ADMIN ? ROLE.EXECUTOR : ROLE.ADMIN); }} disabled={isBusy}>{user.role === ROLE.ADMIN ? "Sätt som utförare" : "Sätt som admin"}</Button>
                        <Button variant={user.isActive ? "danger" : "secondary"} onClick={() => withBusy(user.isActive ? "Inaktiverar användare..." : "Aktiverar användare...", toggleUserActive)(user.id)} disabled={isBusy}>{user.isActive ? "Inaktivera" : "Aktivera"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Hantera lokaler" description="Lägg till och arkivera lokaler utan att förlora historik." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                <Input label="Hus" value={roomForm.buildingName} onChange={(e) => setRoomForm({ ...roomForm, buildingName: e.target.value })} />
                <Input label="Våning" value={roomForm.floorName} onChange={(e) => setRoomForm({ ...roomForm, floorName: e.target.value })} />
                <Input label="Lokal" value={roomForm.roomName} onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })} />
                <Select label="Lokaltyp" value={roomForm.localType} onChange={(value) => setRoomForm({ ...roomForm, localType: value })} options={Object.entries(LOCAL_TYPE_LABELS).map(([key, label]) => ({ value: key, label }))} />
                <Button onClick={() => withBusy("Lägger till lokal...", addRoomStructure)()} disabled={isBusy}>Lägg till lokal</Button>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 12, display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
                  {filteredRooms.map((room) => (
                    <div key={room.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{room.name}</div>
                        <div style={{ color: "#6b7280", marginTop: 4 }}>{room.buildingName}, {room.floorName} · {LOCAL_TYPE_LABELS[room.type]}</div>
                      </div>
                      <Button variant="danger" onClick={() => withBusy("Arkiverar lokal...", deactivateRoom)(room.id)} disabled={isBusy}>Arkivera</Button>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Hantera checklistor" description="Skapa mallar, lägg till eller ta bort moment, arkivera mallar." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                <Input label="Mallnamn" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
                <Select label="Lokaltyp" value={templateForm.localType} onChange={(value) => setTemplateForm({ ...templateForm, localType: value, name: templateForm.name })} options={Object.entries(LOCAL_TYPE_LABELS).map(([key, label]) => ({ value: key, label }))} />
                <Select label="Insatstyp" value={templateForm.taskType} onChange={(value) => setTemplateForm({ ...templateForm, taskType: value })} options={[{ value: "manadsinsats", label: TASK_TYPE_LABELS.manadsinsats }, { value: "storstädning", label: TASK_TYPE_LABELS.storstädning }]} />
                <Button onClick={() => withBusy("Skapar mall...", createTemplate)()} disabled={isBusy}>Skapa mall</Button>
                <Select label="Redigera mall" value={editingTemplateId} onChange={setEditingTemplateId} placeholder="Välj mall" options={filteredTemplates.map((template) => ({ value: template.id, label: template.name }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <Input placeholder="Nytt moment" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                  <Button variant="secondary" onClick={() => withBusy("Lägger till moment...", addTaskToTemplate)()} disabled={isBusy}>Lägg till</Button>
                </div>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 12, display: "grid", gap: 8, maxHeight: 340, overflow: "auto" }}>
                  {filteredTemplates.map((template) => (
                    <div key={template.id} style={{ border: template.id === editingTemplateId ? "1px solid #111827" : "1px solid #e5e7eb", borderRadius: 12, padding: 12, fontSize: 14, display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <Input value={template.name} onChange={(e) => updateTemplateName(template.id, e.target.value)} onBlur={() => saveTemplateName(template.id)} />
                        <Button variant="danger" onClick={() => withBusy("Arkiverar mall...", deactivateTemplate)(template.id)} disabled={isBusy}>Arkivera</Button>
                      </div>
                      <div style={{ color: "#6b7280" }}>{LOCAL_TYPE_LABELS[template.localType]} · {TASK_TYPE_LABELS[template.taskType]}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {template.tasks.map((task) => (
                          <span key={task} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Badge>{task}</Badge>
                            <button onClick={() => withBusy("Tar bort moment...", removeTaskFromTemplate)(template.id, task)} style={{ border: "none", background: "transparent", color: "#991b1b", cursor: "pointer" }} disabled={isBusy}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Planerade insatser" description="Skapa underlag för påminnelser och missade insatser." />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 12 }}>
                <Select label="Lokal" value={scheduleForm.roomId} onChange={(value) => setScheduleForm({ ...scheduleForm, roomId: value })} options={allRooms.map((room) => ({ value: room.id, label: `${room.buildingName} · ${room.floorName} · ${room.name}` }))} placeholder="Välj lokal" />
                <Select label="Insatstyp" value={scheduleForm.taskType} onChange={(value) => setScheduleForm({ ...scheduleForm, taskType: value })} options={[{ value: "manadsinsats", label: TASK_TYPE_LABELS.manadsinsats }, { value: "storstädning", label: TASK_TYPE_LABELS.storstädning }]} />
                <Input label="Senast datum" type="date" value={scheduleForm.dueDate} onChange={(e) => setScheduleForm({ ...scheduleForm, dueDate: e.target.value })} />
                <Button onClick={() => withBusy("Lägger till planering...", addSchedule)()} disabled={isBusy}>Lägg till planering</Button>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 12, display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
                  {pendingAlerts.map((schedule) => (
                    <div key={schedule.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{schedule.room?.name}</div>
                        <div style={{ color: "#6b7280", marginTop: 4 }}>{schedule.building?.name}, {schedule.floor?.name} · {TASK_TYPE_LABELS[schedule.taskType]} · {schedule.dueDate}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge tone={getStatusTone(schedule.status)}>{schedule.status}</Badge>
                        <Button variant="danger" onClick={() => withBusy("Arkiverar planering...", deleteSchedule)(schedule.id)} disabled={isBusy}>Arkivera</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel style={{ gridColumn: "1 / -1" }}>
              <SectionTitle title="Revisionslogg och data" description="Senaste händelser i systemet samt import/export av backup." actions={[<Button key="import" variant="secondary" onClick={triggerImport} disabled={isBusy}>Importera backup</Button>, <Button key="backup" variant="secondary" onClick={exportBackup} disabled={isBusy}>Exportera backup</Button>, <Button key="reset" variant="secondary" onClick={() => withBusy("Återställer demo-data...", resetDemoData)()} disabled={isBusy}>Återställ demo-data</Button>]} />
              <div style={{ padding: 20, paddingTop: 4, display: "grid", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge tone={passedTests === testResults.length ? "success" : "danger"}>{passedTests}/{testResults.length} tester godkända</Badge>
                  {testResults.map((result) => <Badge key={result.name} tone={result.passed ? "success" : "danger"}>{result.passed ? "✓" : "✕"} {result.name}</Badge>)}
                </div>
                <DataTable columns={[{ key: "createdAt", title: "Tid" }, { key: "actorName", title: "Användare" }, { key: "action", title: "Händelse" }, { key: "message", title: "Beskrivning" }]} rows={filteredAuditLog.slice(0, 20)} emptyText="Ingen logg ännu." />
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
