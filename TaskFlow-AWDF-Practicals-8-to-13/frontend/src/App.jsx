import { useEffect, useMemo, useState } from 'react';

const API = '/api';
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');
  const [filter, setFilter] = useState('All');
  const [aiFallback, setAiFallback] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  async function loadTasks() {
    try { setTasks(await request(`${API}/tasks`)); }
    catch { setNotice('Could not connect to the backend. Start the backend server and refresh.'); setNoticeType('error'); }
  }
  useEffect(() => {
    loadTasks();
    request(`${API}/ai/status`).then(status => setAiConfigured(Boolean(status.configured))).catch(() => setAiConfigured(false));
  }, []);

  const counts = useMemo(() => ({ total: tasks.length, pending: tasks.filter(t => t.status !== 'Completed').length, completed: tasks.filter(t => t.status === 'Completed').length }), [tasks]);
  const visibleTasks = tasks.filter(t => filter === 'All' || t.status === filter);

  async function generateDescription() {
    if (!title.trim()) { setNotice('Enter a task title before asking the AI assistant.'); setNoticeType('error'); return; }
    setLoading(true); setNotice(''); setAiFallback(false);
    try {
      const data = await request(`${API}/ai/generate-description`, { method: 'POST', body: JSON.stringify({ title }) });
      setDescription(data.description || ''); setAiFallback(Boolean(data.fallback));
      setNotice(data.message || 'Description generated. Review and edit it before saving.');
      setNoticeType(data.fallback ? 'warning' : 'success');
    } catch (error) { setNotice(error.message); setNoticeType('error'); }
    finally { setLoading(false); }
  }

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const task = await request(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ title, description, priority }) });
      setTasks(current => [task, ...current]); setTitle(''); setDescription(''); setPriority('Medium'); setAiFallback(false);
      setNotice('Task added successfully.'); setNoticeType('success');
    } catch (error) { setNotice(error.message); setNoticeType('error'); }
    finally { setSaving(false); }
  }
  async function toggleTask(task) {
    const status = task.status === 'Completed' ? 'Pending' : 'Completed';
    try { const updated = await request(`${API}/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setTasks(current => current.map(t => t.id === task.id ? updated : t)); }
    catch (error) { setNotice(error.message); setNoticeType('error'); }
  }
  async function deleteTask(id) {
    try { await request(`${API}/tasks/${id}`, { method: 'DELETE' }); setTasks(current => current.filter(t => t.id !== id)); }
    catch (error) { setNotice(error.message); setNoticeType('error'); }
  }

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">T</div><span>TaskFlow<span className="brand-ai"> AI</span></span></div><div className="side-label">WORKSPACE</div><button className="nav-item active">▦ <span>My Tasks</span></button><div className="side-note"><div className="sparkle">✦</div><strong>AI assistant</strong><p>Turn a task title into a clear, actionable description with Groq AI.</p><div className={aiConfigured ? 'ai-connection connected' : 'ai-connection disconnected'}><span/> {aiConfigured ? 'Groq API connected' : 'Groq API not configured'}</div></div><div className="sidebar-bottom"><span className="online-dot"/> Local workspace</div></aside>
    <main className="main-content"><header className="topbar"><div><div className="eyebrow">WORKSPACE / TASKS</div><h1>My Tasks</h1></div><div className="profile"><div className="avatar">U</div><div><strong>Student</strong><small>Personal workspace</small></div></div></header>
      <section className="welcome"><div><div className="eyebrow light">YOUR PRODUCTIVITY SPACE</div><h2>Make progress, one task at a time.</h2><p>Organize your work and use AI to get started faster.</p></div><div className="welcome-icon">✧</div></section>
      <section className="stats"><div className="stat-card"><span className="stat-icon purple">▤</span><div><small>Total tasks</small><strong>{counts.total}</strong></div></div><div className="stat-card"><span className="stat-icon orange">◷</span><div><small>Remaining</small><strong>{counts.pending}</strong></div></div><div className="stat-card"><span className="stat-icon green">✓</span><div><small>Completed</small><strong>{counts.completed}</strong></div></div></section>
      <div className="content-grid"><section className="panel create-panel"><div className="panel-heading"><div><span className="section-kicker">GET STARTED</span><h3>Create a task</h3></div><span className="heading-icon">＋</span></div>
        <form onSubmit={addTask}><label htmlFor="title">Task title</label><input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete web development practical" maxLength={100} required />
          <div className="label-row"><label htmlFor="description">Description</label><span className="optional">Optional</span></div><textarea id="description" rows="4" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what needs to be done..." />
          <div className="ai-disclaimer">✦ AI suggestions are generated by Groq AI. Review and edit them before saving.</div>
          <div className="field-bottom"><div className="priority-field"><label htmlFor="priority">Priority</label><select id="priority" value={priority} onChange={e => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></div><button type="button" className="ai-button" onClick={generateDescription} disabled={loading || !title.trim()}>{loading ? <><span className="spinner"/> Generating...</> : <>✦ Generate with AI</>}</button></div>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Adding task...' : '＋ Add task'}</button>
        </form>
        {notice && <div className={`notice ${noticeType}`} role="status">{notice}</div>}
        {aiFallback && <div className="fallback-note">Fallback text is provided so task creation can continue without the AI service.</div>}
      </section>
      <section className="panel tasks-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR WORKLOAD</span><h3>Task list <span className="count-pill">{tasks.length}</span></h3></div></div><div className="filters">{['All','Pending','Completed'].map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'filter active-filter' : 'filter'}>{item}</button>)}</div>
        {visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon">☷</div><strong>{filter === 'All' ? 'Nothing on your list yet' : `No ${filter.toLowerCase()} tasks`}</strong><p>Create your first task using the form.</p></div> : <div className="task-list">{visibleTasks.map(task => <article className={`task-item ${task.status === 'Completed' ? 'is-complete' : ''}`} key={task.id}><button className="check-button" aria-label="Toggle completion" onClick={() => toggleTask(task)}>{task.status === 'Completed' ? '✓' : ''}</button><div className="task-copy"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`priority-dot ${task.priority.toLowerCase()}`}/>{task.priority} priority <span>·</span>{task.status}</div></div><button className="delete-button" aria-label="Delete task" onClick={() => deleteTask(task.id)}>×</button></article>)}</div>}
      </section></div><footer>TaskFlow AI <span>•</span> Practical 13 — AI API Integration <span>•</span> Powered by Groq AI</footer>
    </main>
  </div>;
}
