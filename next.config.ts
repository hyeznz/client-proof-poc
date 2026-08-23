import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 측정 기반 레이아웃(fitMainTitle) 이중 실행 방지. 안정화 후 켤 것.
  agentRules: false,      // AGENTS.md/CLAUDE.md 자동 생성 끔
};

export default nextConfig;
