"use client";

import React, { useMemo, useState } from "react";

const ROLE = {
  ADMIN: "admin",
  EXECUTOR: "executor",
};

const TASK_TYPE_LABELS = {
  manadsinsats: "Månadsinsats",
  storstädning: "Storstädning",
};

const defaultUsers = [
  { username: "admin", password: "admin", role: ROLE.ADMIN, name: "Administratör" },
  { username: "utforare", password: "1234", role: ROLE.EXECUTOR, name: "Utförare 1" },
];

const defaultTemplates = {
  sal: {
    manadsinsats: ["Torka av bord", "Rengör whiteboard", "Dammsug hörn"],
    storstädning: ["Maskinskura golv", "Torka väggar", "Rengör armaturer"],
  },
  toalett: {
    manadsinsats: ["Rengör toalettstol", "Torka kakel", "Fyll på material"],
    storstädning: ["Storstädning toalett", "Rengör väggar", "Rengör golvbrunn"],
  },
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<null | { username: string; password: string; role: string; name: string }>(null);
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "admin" });
  const [loginError, setLoginError] = useState("");
  const [localType, setLocalType] = useState("sal");
  const [taskType, setTaskType] = useState("manadsinsats");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const tasks = useMemo(() => {
    return defaultTemplates[localType as keyof typeof defaultTemplates]?.[
      taskType as keyof (typeof defaultTemplates)["sal"]
    ] || [];
  }, [localType, taskType]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const found = defaultUsers.find(
      (user) => user.username === loginForm.username && user.password === loginForm.password
    );
    if (!found) {
      setLoginError("Fel användarnamn eller lösenord.");
      return;
    }
    setCurrentUser(found);
    setLoginError("");
  }

  function toggleTask(task: string) {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((item) => item !== task) : [...prev, task]
    );
  }

  function saveEntry() {
    setSavedMessage("Insatsen har sparats i prototypen.");
  }

  if (!currentUser) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            width: "100%",
            maxWidth: 500,
          }}
        >
          <h1 style={{ fontSize: 30, marginBottom: 12 }}>
            Probatus - egenkontroll för lokalvård
          </h1>
          <p style={{ color: "#475569", marginBottom: 20 }}>
            Logga in för att testa appen.
          </p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
            <input
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              placeholder="Användarnamn"
              style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }}
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="Lösenord"
              style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }}
            />
            {loginError ? <div style={{ color: "#b91c1c" }}>{loginError}</div> : null}
            <button
              type="submit"
              style={{
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: "#111827",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logga in
            </button>
          </form>

          <p style={{ marginTop: 16, color: "#64748b" }}>
            Demo: admin/admin eller utforare/1234
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>
            Probatus - egenkontroll för lokalvård
          </h1>
          <p style={{ color: "#475569" }}>
            Inloggad som {currentUser.name} ({currentUser.role === "admin" ? "Administratör" : "Utförare"})
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Registrera insats</h2>

          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            <label>
              <div style={{ marginBottom: 6, fontWeight: 600 }}>Typ av lokal</div>
              <select
                value={localType}
                onChange={(e) => {
                  setLocalType(e.target.value);
                  setSelectedTasks([]);
                }}
                style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", width: "100%" }}
              >
                <option value="sal">Sal</option>
                <option value="toalett">Toalett</option>
              </select>
            </label>

            <label>
              <div style={{ marginBottom: 6, fontWeight: 600 }}>Typ av insats</div>
              <select
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  setSelectedTasks([]);
                }}
                style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", width: "100%" }}
              >
                <option value="manadsinsats">{TASK_TYPE_LABELS.manadsinsats}</option>
                <option value="storstädning">{TASK_TYPE_LABELS.storstädning}</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {tasks.map((task) => (
              <label
                key={task}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task)}
                  onChange={() => toggleTask(task)}
                />
                <span>{task}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Kommentar</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
              }}
            />
          </div>

          <button
            onClick={saveEntry}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Spara insats
          </button>

          {savedMessage ? (
            <div style={{ marginTop: 16, color: "#047857", fontWeight: 600 }}>
              {savedMessage}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}