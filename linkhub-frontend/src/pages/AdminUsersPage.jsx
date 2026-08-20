import { useEffect, useState } from "react";
import { listUsers, createUser } from "../api/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PageContainer from "@/components/PageContainer";

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
        <PageContainer size="md">
            <h1 className="mb-6 text-2xl font-bold text-foreground">Kelola User</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                        Buat user baru
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="new-username" className="sr-only">Username</Label>
                                <Input
                                    id="new-username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="new-password" className="sr-only">Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Password (min 6 karakter)"
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                                <SelectTrigger className="sm:w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" disabled={saving}>
                            {saving ? "Menyimpan..." : "Buat User"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <ul className="divide-y rounded-lg border">
                {users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span>{u.username}</span>
                        <Badge variant="outline" className="uppercase tracking-wide">
                            {u.role}
                        </Badge>
                    </li>
                ))}
            </ul>
        </PageContainer>
    );
}