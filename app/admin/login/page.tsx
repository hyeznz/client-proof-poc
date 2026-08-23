"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) { setError("비밀번호가 틀렸어요."); return; }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main style={{ maxWidth: 320, margin: "80px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>관리자 로그인</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          style={{ width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #ccc", borderRadius: 8 }}
        />
        {error && <p style={{ color: "#d33", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", marginTop: 12, padding: "10px 12px", fontSize: 15, background: "#111", color: "#fff", border: "none", borderRadius: 8 }}
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
