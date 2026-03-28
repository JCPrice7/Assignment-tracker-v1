import { useState, useEffect } from "react";

const STORAGE_KEY = "studytracker_assignments";

const CATEGORIES = ["Essay", "Project", "Exam", "Homework", "Lab", "Reading", "Other"];

function getDaysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function getUrgency(assignment) {
  const milestones = assignment.milestones || [];
  const allDates = [
    ...milestones.map(m => ({ date: m.date, done: m.done })),
    { date: assignment.dueDate, done: assignment.done }
  ].filter(d => d.date && !d.done);

  if (allDates.length === 0) return "done";

  const soonest = allDates.reduce((min, d) =>
    getDaysUntil(d.date) < getDaysUntil(min.date) ? d : min
  );

  const days = getDaysUntil(soonest.date);
  if (days < 0) return "overdue";
  if (days <= assignment.blockBuffer) return "blocking";
  if (days <= assignment.blockBuffer + 2) return "warning";
  return "ok";
}

function StatusBadge({ urgency }) {
  const map = {
    overdue: { label: "Overdue", color: "#ff4444" },
    blocking: { label: "Block Active", color: "#ff8c00" },
    warning:  { label: "Due Soon", color: "#f5c518" },
    ok:       { label: "On Track", color: "#4caf86" },
    done:     { label: "Complete", color: "#888" },
  };
  const { label, color } = map[urgency] || map.ok;
  return (
    <span style={{
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${color}44`,
      background: `${color}18`,
      borderRadius: 4,
      padding: "2px 8px",
    }}>{label}</span>
  );
}

function DaysChip({ days }) {
  if (days < 0) return <span style={{ color: "#ff4444", fontWeight: 700, fontSize: "0.8rem" }}>{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span style={{ color: "#ff8c00", fontWeight: 700, fontSize: "0.8rem" }}>Due today</span>;
  return <span style={{ color: days <= 2 ? "#f5c518" : "#aaa", fontSize: "0.8rem" }}>{days}d left</span>;
}

function MilestoneRow({ milestone, onToggle }) {
  const days = getDaysUntil(milestone.date);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "5px 0",
      opacity: milestone.done ? 0.45 : 1,
      transition: "opacity 0.2s",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: 16, height: 16, borderRadius: 4, border: `2px solid ${milestone.done ? "#4caf86" : "#555"}`,
          background: milestone.done ? "#4caf86" : "transparent",
          cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {milestone.done && <span style={{ color: "#111", fontSize: 10, fontWeight: 900 }}>✓</span>}
      </button>
      <span style={{
        fontSize: "0.82rem", color: "#ccc", flex: 1,
        textDecoration: milestone.done ? "line-through" : "none",
      }}>{milestone.label}</span>
      <span style={{ fontSize: "0.75rem", color: "#666" }}>
        {milestone.date ? new Date(milestone.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
      </span>
      {!milestone.done && <DaysChip days={days} />}
    </div>
  );
}

function AssignmentCard({ assignment, onToggleDone, onToggleMilestone, onDelete, onExpand, expanded }) {
  const urgency = getUrgency(assignment);
  const days = getDaysUntil(assignment.dueDate);
  const urgencyColor = {
    overdue: "#ff4444", blocking: "#ff8c00", warning: "#f5c518", ok: "#4caf86", done: "#555"
  }[urgency];

  return (
    <div style={{
      background: "#1a1a1a",
      border: `1px solid ${expanded ? urgencyColor + "55" : "#2a2a2a"}`,
      borderLeft: `3px solid ${urgencyColor}`,
      borderRadius: 10,
      padding: "16px 18px",
      cursor: "pointer",
      transition: "all 0.2s",
      marginBottom: 10,
    }}
      onClick={() => onExpand(assignment.id)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(assignment.id); }}
          style={{
            width: 20, height: 20, borderRadius: 6, marginTop: 2,
            border: `2px solid ${assignment.done ? "#4caf86" : "#444"}`,
            background: assignment.done ? "#4caf86" : "transparent",
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {assignment.done && <span style={{ color: "#111", fontSize: 12, fontWeight: 900 }}>✓</span>}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "1.05rem",
              color: assignment.done ? "#555" : "#f0ede8",
              textDecoration: assignment.done ? "line-through" : "none",
              fontWeight: 400,
            }}>{assignment.title}</span>
            <StatusBadge urgency={urgency} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#666", fontFamily: "monospace" }}>{assignment.course}</span>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>·</span>
            <span style={{ fontSize: "0.75rem", color: "#666" }}>{assignment.category}</span>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>·</span>
            <span style={{ fontSize: "0.75rem", color: "#888" }}>
              Due {assignment.dueDate ? new Date(assignment.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
            {!assignment.done && <DaysChip days={days} />}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onDelete(assignment.id); }}
          style={{
            background: "none", border: "none", color: "#444", cursor: "pointer",
            fontSize: "1rem", padding: "0 2px", lineHeight: 1,
            transition: "color 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.color = "#ff4444"}
          onMouseOut={e => e.currentTarget.style.color = "#444"}
          title="Delete"
        >×</button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2a2a2a" }}
          onClick={e => e.stopPropagation()}>
          {assignment.notes && (
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 12, lineHeight: 1.5 }}>
              {assignment.notes}
            </p>
          )}
          {assignment.milestones?.length > 0 && (
            <div>
              <p style={{ fontSize: "0.65rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Milestones</p>
              {assignment.milestones.map((m, i) => (
                <MilestoneRow
                  key={i}
                  milestone={m}
                  onToggle={() => onToggleMilestone(assignment.id, i)}
                />
              ))}
            </div>
          )}
          <div style={{ marginTop: 10, padding: "8px 10px", background: "#111", borderRadius: 6 }}>
            <span style={{ fontSize: "0.7rem", color: "#555" }}>
              🔒 App blocking activates <strong style={{ color: "#888" }}>{assignment.blockBuffer} day{assignment.blockBuffer !== 1 ? "s" : ""}</strong> before each deadline
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  title: "", course: "", category: "Essay", dueDate: "",
  blockBuffer: 2, notes: "",
  milestones: [{ label: "", date: "", done: false }],
};

function AddForm({ onAdd, onClose }) {
  const [form, setForm] = useState(emptyForm);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setMilestone = (i, k, v) => setForm(f => {
    const ms = [...f.milestones];
    ms[i] = { ...ms[i], [k]: v };
    return { ...f, milestones: ms };
  });

  const addMilestone = () => setForm(f => ({
    ...f, milestones: [...f.milestones, { label: "", date: "", done: false }]
  }));

  const removeMilestone = i => setForm(f => ({
    ...f, milestones: f.milestones.filter((_, idx) => idx !== i)
  }));

  const handleSubmit = () => {
    if (!form.title.trim() || !form.dueDate) return;
    onAdd({
      ...form,
      id: Date.now(),
      done: false,
      milestones: form.milestones.filter(m => m.label.trim()),
    });
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "#111", border: "1px solid #333",
    borderRadius: 7, padding: "9px 12px", color: "#f0ede8",
    fontSize: "0.88rem", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block", fontSize: "0.65rem", color: "#666",
    letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 5,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}
      onClick={onClose}
    >
      <div style={{
        background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 14,
        padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh",
        overflowY: "auto", boxShadow: "0 24px 80px #000",
      }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.4rem", color: "#f0ede8", fontWeight: 400, margin: 0,
          }}>New Assignment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: "1.3rem", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} placeholder="e.g. Research Paper"
              value={form.title} onChange={e => setField("title", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Course</label>
              <input style={inputStyle} placeholder="e.g. ENGR 162"
                value={form.course} onChange={e => setField("course", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.category} onChange={e => setField("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Final Due Date *</label>
              <input style={inputStyle} type="date"
                value={form.dueDate} onChange={e => setField("dueDate", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Block apps starting (days before)</label>
              <input style={inputStyle} type="number" min={0} max={30}
                value={form.blockBuffer} onChange={e => setField("blockBuffer", Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
              placeholder="Any details, requirements, resources..."
              value={form.notes} onChange={e => setField("notes", e.target.value)} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Milestones</label>
              <button onClick={addMilestone} style={{
                background: "none", border: "1px solid #333", borderRadius: 5,
                color: "#aaa", fontSize: "0.75rem", padding: "3px 10px", cursor: "pointer",
              }}>+ Add</button>
            </div>
            {form.milestones.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input style={inputStyle} placeholder={`Milestone ${i + 1} (e.g. Outline done)`}
                  value={m.label} onChange={e => setMilestone(i, "label", e.target.value)} />
                <input style={{ ...inputStyle, width: 140 }} type="date"
                  value={m.date} onChange={e => setMilestone(i, "date", e.target.value)} />
                <button onClick={() => removeMilestone(i)} style={{
                  background: "none", border: "none", color: "#555", fontSize: "1.1rem",
                  cursor: "pointer", padding: "0 4px",
                }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px", borderRadius: 8, border: "1px solid #333",
            background: "none", color: "#888", fontSize: "0.88rem", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex: 2, padding: "11px", borderRadius: 8, border: "none",
            background: "#9b72cf", color: "#111", fontSize: "0.88rem",
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
            transition: "background 0.15s",
          }}
            onMouseOver={e => e.currentTarget.style.background = "#b08de0"}
            onMouseOut={e => e.currentTarget.style.background = "#9b72cf"}
          >Add Assignment</button>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = ["Due Date", "Urgency", "Course", "Recently Added"];
const FILTER_OPTIONS = ["All", "Active", "Complete", "Overdue", "Blocking"];

export default function App() {
  const [assignments, setAssignments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState("Urgency");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const addAssignment = (a) => setAssignments(prev => [a, ...prev]);

  const toggleDone = id => setAssignments(prev =>
    prev.map(a => a.id === id ? { ...a, done: !a.done } : a)
  );

  const toggleMilestone = (id, idx) => setAssignments(prev =>
    prev.map(a => a.id === id ? {
      ...a,
      milestones: a.milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m)
    } : a)
  );

  const deleteAssignment = id => setAssignments(prev => prev.filter(a => a.id !== id));

  const handleExpand = id => setExpandedId(prev => prev === id ? null : id);

  const urgencyOrder = { overdue: 0, blocking: 1, warning: 2, ok: 3, done: 4 };

  let filtered = assignments.filter(a => {
    const u = getUrgency(a);
    if (filter === "Active") return !a.done;
    if (filter === "Complete") return a.done;
    if (filter === "Overdue") return u === "overdue";
    if (filter === "Blocking") return u === "blocking";
    return true;
  }).filter(a => {
    if (!search) return true;
    return a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "Due Date") return new Date(a.dueDate) - new Date(b.dueDate);
    if (sortBy === "Urgency") return urgencyOrder[getUrgency(a)] - urgencyOrder[getUrgency(b)];
    if (sortBy === "Course") return a.course.localeCompare(b.course);
    if (sortBy === "Recently Added") return b.id - a.id;
    return 0;
  });

  const stats = {
    total: assignments.length,
    overdue: assignments.filter(a => getUrgency(a) === "overdue").length,
    blocking: assignments.filter(a => getUrgency(a) === "blocking").length,
    done: assignments.filter(a => a.done).length,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#f0ede8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input:focus, select:focus, textarea:focus { border-color: #9b72cf !important; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e1e1e",
        padding: "20px 24px 0",
        background: "#0f0f0f",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#9b72cf", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Assignment Tracker</div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.9rem", fontWeight: 400, color: "#f0ede8", lineHeight: 1 }}>
                My Assignments
              </h1>
            </div>
            <button onClick={() => setShowForm(true)} style={{
              background: "#9b72cf", color: "#111", border: "none",
              borderRadius: 9, padding: "10px 18px", fontWeight: 700,
              fontSize: "0.85rem", cursor: "pointer", letterSpacing: "0.02em",
              transition: "background 0.15s", fontFamily: "inherit",
            }}
              onMouseOver={e => e.currentTarget.style.background = "#b08de0"}
              onMouseOut={e => e.currentTarget.style.background = "#9b72cf"}
            >+ New</button>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
            {[
              { label: "Total", value: stats.total, color: "#888" },
              { label: "Overdue", value: stats.overdue, color: "#ff4444" },
              { label: "Blocking", value: stats.blocking, color: "#ff8c00" },
              { label: "Done", value: stats.done, color: "#4caf86" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: s.value > 0 ? s.color : "#333", lineHeight: 1, fontFamily: "monospace" }}>{s.value}</div>
                <div style={{ fontSize: "0.6rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", gap: 10, paddingBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 140, background: "#161616", border: "1px solid #2a2a2a",
                borderRadius: 7, padding: "8px 12px", color: "#f0ede8",
                fontSize: "0.85rem", fontFamily: "inherit", outline: "none",
              }}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{
              background: "#161616", border: "1px solid #2a2a2a", borderRadius: 7,
              padding: "8px 12px", color: "#aaa", fontSize: "0.82rem",
              fontFamily: "inherit", cursor: "pointer", outline: "none",
            }}>
              {FILTER_OPTIONS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: "#161616", border: "1px solid #2a2a2a", borderRadius: 7,
              padding: "8px 12px", color: "#aaa", fontSize: "0.82rem",
              fontFamily: "inherit", cursor: "pointer", outline: "none",
            }}>
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main list */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 24px 60px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📚</div>
            <p style={{ color: "#555", fontSize: "0.9rem" }}>
              {assignments.length === 0 ? "No assignments yet — add one to get started." : "No assignments match your filters."}
            </p>
          </div>
        ) : (
          filtered.map(a => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onToggleDone={toggleDone}
              onToggleMilestone={toggleMilestone}
              onDelete={deleteAssignment}
              onExpand={handleExpand}
              expanded={expandedId === a.id}
            />
          ))
        )}
      </div>

      {showForm && <AddForm onAdd={addAssignment} onClose={() => setShowForm(false)} />}
    </div>
  );
}
