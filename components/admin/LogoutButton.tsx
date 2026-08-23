"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      style={{ fontSize: 13, color: "#888", background: "none", border: "none", cursor: "pointer" }}
    >
      로그아웃
    </button>
  );
}
