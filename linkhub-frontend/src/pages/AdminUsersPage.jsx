import { useEffect, useState } from "react";
import { listUsers, createUser } from "../api/userApi";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: "", password: "", role: "staff" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function refresh() {
        listUsers().then(setUsers).catch(() => { });
    }

    useEffect(refresh, []);

    async function handleCreate(e) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await createUser(form);
            setForm({ username: "", password: "", role: "staff" });
            refresh();
        } catch (err) {
            setError(err.response?.data?.error || "Gagal membuat user");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Kelola User</h1>

            <form onSubmit={handleCreate} className="space-y-3 mb-8 border border-slate-200 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-slate-600">Buat user baru</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 karakter)"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        required
                        minLength={6}
                    />
                    <select
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? "Menyimpan..." : "Buat User"}
                </button>
            </form>

            <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span>{u.username}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
                            {u.role}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
