import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetDir = searchParams.get("path") || (process.platform === "win32" ? "C:\\" : "/mnt");

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(targetDir, entry.name),
      }));

    return NextResponse.json({
      current: targetDir,
      parent: path.dirname(targetDir),
      directories,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membaca direktori";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
