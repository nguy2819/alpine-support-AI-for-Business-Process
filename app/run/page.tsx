import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { RunWorkspace, type RunFile } from "@/components/run-workspace";

export const metadata: Metadata = {
  title: "Run eval – Alpine Outdoor Support Copilot",
};

const read = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf-8");

export default function RunPage() {
  const files: RunFile[] = [
    {
      name: "extract_v1.txt",
      description: "Prompt v1: simple instructions",
      content: read("prompts", "extract_v1.txt"),
      mime: "text/plain",
    },
    {
      name: "extract_v2.txt",
      description: "Prompt v2: detailed field rules and a prompt injection warning",
      content: read("prompts", "extract_v2.txt"),
      mime: "text/plain",
    },
    {
      name: "cases_for_ai.txt",
      description: "The 25 customer messages, without answers",
      content: read("manual", "cases_for_ai.txt"),
      mime: "text/plain",
    },
    {
      name: "policy.md",
      description: "Support policy, to upload to the chat",
      content: read("data", "policy.md"),
      mime: "text/markdown",
    },
    {
      name: "orders.json",
      description: "Mock orders, to upload to the chat",
      content: read("data", "orders.json"),
      mime: "application/json",
    },
  ];

  return <RunWorkspace files={files} />;
}
