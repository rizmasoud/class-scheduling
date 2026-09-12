'use client';

import React, { useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  username: string;
  role: 'Supervisor' | 'Teacher';
}

export default function Home() {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [customUser, setCustomUser] = useState<string>('');
  const [customPass, setCustomPass] = useState<string>('password123');

  // Workflows state
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [eligibleTeachers, setEligibleTeachers] = useState<any[]>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');
  const [subReason, setSubReason] = useState<string>('Personal appointment');
  const [emergencyReason, setEmergencyReason] = useState<string>('Emergency sudden illness');

  // Lists
  const [substitutionRequests, setSubstitutionRequests] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);

  // Logs & status
  const [actionLog, setActionLog] = useState<{ time: string; status: number | string; text: string; ok: boolean }[]>([]);

  const addLog = (status: number | string, text: string, ok = true) => {
    const time = new Date().toLocaleTimeString();
    setActionLog((prev) => [{ time, status, text, ok }, ...prev.slice(0, 19)]);
  };

  const login = async (username: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: customPass || 'password123' }),
      });
      const data = await res.json();
      if (res.ok) {
        const tok = data.access_token || data.token;
        setToken(tok);
        setUser(data.user || { username, role: username.includes('sup') ? 'Supervisor' : 'Teacher' });
        addLog(res.status, `Logged in successfully as ${username} (${data.user?.role || 'User'})`);
      } else {
        addLog(res.status, data.message || 'Login failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setEligibleTeachers([]);
    setSubstitutionRequests([]);
    setAttendances([]);
    addLog('OK', 'Logged out');
  };

  // Refresh data when token or user changes
  const refreshData = async () => {
    if (!token) return;

    // 1. Fetch sessions
    try {
      const res = await fetch('/api/class-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch (e) {}

    // 2. Fetch substitutions
    try {
      const res = await fetch('/api/substitution-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubstitutionRequests(Array.isArray(data) ? data : []);
      }
    } catch (e) {}

    // 3. Fetch attendances
    try {
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAttendances(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [token]);

  // When selectedSessionId changes, fetch eligible teachers
  useEffect(() => {
    if (!token || !selectedSessionId) return;

    fetch(`/api/substitution-requests/sessions/${selectedSessionId}/eligible-teachers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setEligibleTeachers(data);
        if (data.length > 0) {
          setSelectedSubstituteId(data[0].id);
        } else {
          setSelectedSubstituteId('');
        }
      })
      .catch(() => setEligibleTeachers([]));
  }, [selectedSessionId, token]);

  // Action: Submit Teacher Attendance
  const submitAttendance = async (status: 'Present' | 'Absent') => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/attendance/sessions/${selectedSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Attendance submitted (${status}) for session ${selectedSessionId.slice(0, 8)}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Attendance submission failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  // Action: Create Direct Substitution Request
  const createDirectRequest = async () => {
    if (!selectedSessionId || !selectedSubstituteId) return;
    try {
      const res = await fetch(`/api/substitution-requests/sessions/${selectedSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isBroadcast: false,
          requestedSubstituteId: selectedSubstituteId,
          reason: subReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Direct substitution requested for teacher ${selectedSubstituteId.slice(0, 8)}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Direct request failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  // Action: Create Broadcast Substitution Request
  const createBroadcastRequest = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/substitution-requests/sessions/${selectedSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isBroadcast: true,
          reason: subReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Broadcast substitution requested for session ${selectedSessionId.slice(0, 8)}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Broadcast request failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  // Action: Claim Broadcast Request (Teacher)
  const claimRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/substitution-requests/${requestId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Successfully claimed substitution ${requestId.slice(0, 8)}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Claim failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  // Action: Approve or Reject Substitution Request (Supervisor)
  const decideRequest = async (requestId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/substitution-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Substitution request ${requestId.slice(0, 8)}: ${approved ? 'Approved' : 'Rejected'}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Decision failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  // Action: Emergency Manual Substitution (Supervisor)
  const assignEmergency = async () => {
    if (!selectedSessionId || !selectedSubstituteId) return;
    try {
      const res = await fetch(`/api/substitution-requests/sessions/${selectedSessionId}/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          substituteTeacherId: selectedSubstituteId,
          reason: emergencyReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(res.status, `Emergency substitution assigned to teacher ${selectedSubstituteId.slice(0, 8)}`);
        refreshData();
      } else {
        addLog(res.status, data.message || 'Emergency assignment failed', false);
      }
    } catch (err: any) {
      addLog('ERR', err.message, false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Teacher Attendance &amp; Substitution Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phase 4.6 Implementation — Concurrency-safe, RBAC-guarded operational workflow.
            </p>
          </div>
          {token && user && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Logged in</span>
                <span className="text-sm font-medium text-slate-800">
                  {user.username} <span className="text-slate-400">({user.role})</span>
                </span>
              </div>
              <button
                onClick={logout}
                className="ml-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Authentication Card if not logged in */}
        {!token ? (
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Authentication Portal</h2>
            <p className="text-sm text-slate-500">Select a preset role or input credentials to test workflows:</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => login('teacher1')}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition"
              >
                Sign in as Teacher 1
              </button>
              <button
                onClick={() => login('teacher2')}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition"
              >
                Sign in as Teacher 2 (Sub)
              </button>
              <button
                onClick={() => login('supervisor1')}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 transition"
              >
                Sign in as Supervisor
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Username"
                value={customUser}
                onChange={(e) => setCustomUser(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={customPass}
                onChange={(e) => setCustomPass(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                onClick={() => customUser && login(customUser)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition"
              >
                Login
              </button>
            </div>
          </section>
        ) : (
          /* Operational Console */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Target Session & Workflows */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Target Selector */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">1. Target Class Session</h2>
                  <button
                    onClick={refreshData}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Select Active Session</label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sessions.length === 0 ? (
                        <option value="">No sessions loaded</option>
                      ) : (
                        sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.date} ({s.startTime}-{s.endTime}) — {s.status}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Manual Session UUID</label>
                    <input
                      type="text"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      placeholder="Paste session UUID..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {/* Attendance Operations */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-semibold text-slate-900">2. Teacher Attendance Workflow</h2>
                <p className="text-xs text-slate-500">
                  Immutable attendance submission. Submitting &apos;Present&apos; completes the session and links actual teacher.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => submitAttendance('Present')}
                    disabled={!selectedSessionId}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    Submit Attendance: Present (Taught)
                  </button>
                  <button
                    onClick={() => submitAttendance('Absent')}
                    disabled={!selectedSessionId}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    Submit Attendance: Absent
                  </button>
                </div>
              </section>

              {/* Substitution Operations */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-semibold text-slate-900">3. Substitution Workflows</h2>
                
                {/* Eligible Teacher Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Eligible Substitute Teachers for Selected Session
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={selectedSubstituteId}
                      onChange={(e) => setSelectedSubstituteId(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                    >
                      {eligibleTeachers.length === 0 ? (
                        <option value="">No eligible substitutes found for this book/level</option>
                      ) : (
                        eligibleTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.id.slice(0, 8)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Teacher Substitution Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teacher Actions</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Reason for absence..."
                      value={subReason}
                      onChange={(e) => setSubReason(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-md flex-1 min-w-[200px]"
                    />
                    <button
                      onClick={createDirectRequest}
                      disabled={!selectedSessionId || !selectedSubstituteId}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition"
                    >
                      Direct Request
                    </button>
                    <button
                      onClick={createBroadcastRequest}
                      disabled={!selectedSessionId}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition"
                    >
                      Broadcast Request (First-to-Claim)
                    </button>
                  </div>
                </div>

                {/* Supervisor Substitution Actions */}
                {user.role === 'Supervisor' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisor Emergency / Manual Assignment</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        placeholder="Emergency reason..."
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-md flex-1 min-w-[200px]"
                      />
                      <button
                        onClick={assignEmergency}
                        disabled={!selectedSessionId || !selectedSubstituteId}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition"
                      >
                        Assign Emergency Substitute (Direct)
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Substitution Requests List */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Active &amp; Historic Substitution Requests</h2>
                {substitutionRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No substitution requests found.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {substitutionRequests.map((req) => (
                      <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-medium text-slate-800">
                            Req: {req.id.slice(0, 8)} | Session: {req.sessionId.slice(0, 8)}
                          </div>
                          <div className="text-slate-500">
                            Status: <span className="font-semibold text-indigo-600">{req.status}</span>
                            {req.reason && ` — Reason: ${req.reason}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'Broadcast' && user.role === 'Teacher' && (
                            <button
                              onClick={() => claimRequest(req.id)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded transition"
                            >
                              Claim (Race-Safe)
                            </button>
                          )}

                          {user.role === 'Supervisor' && ['Pending', 'Accepted'].includes(req.status) && (
                            <>
                              <button
                                onClick={() => decideRequest(req.id, true)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => decideRequest(req.id, false)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Submitted Attendances & Live Activity Log */}
            <div className="space-y-6">
              {/* Recorded Attendances */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Recorded Attendances</h2>
                {attendances.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No attendance records logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {attendances.map((att) => (
                      <div key={att.id} className="py-2 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700">Teacher: {att.teacherId.slice(0, 8)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              att.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Session: {att.sessionId.slice(0, 8)} | {new Date(att.submittedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Live Activity & Concurrency Feedback */}
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Live Transaction / Audit Log</h2>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs max-h-80 overflow-y-auto space-y-1.5">
                  {actionLog.length === 0 ? (
                    <div className="text-slate-500 italic">Ready for operations...</div>
                  ) : (
                    actionLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-slate-500 select-none">[{log.time}]</span>
                        <span
                          className={`font-bold select-none ${
                            log.ok ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-slate-300 break-all">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
