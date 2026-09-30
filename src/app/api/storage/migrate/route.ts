import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";

// SSE endpoint to subscribe to migration status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: {"status":"connected"}\n\n`));
      
      const interval = setInterval(async () => {
        const job = await db.migrationJob.findUnique({ where: { id: jobId } });
        if (!job) return;
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(job)}\n\n`));
        if (job.status === "COMPLETED" || job.status === "FAILED") {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      req.signal.addEventListener("abort", () => clearInterval(interval));
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}

// Trigger background migration
export async function POST(req: Request) {
  const { destPath } = await req.json();
  if (!destPath) return NextResponse.json({ error: "Tujuan kosong" }, { status: 400 });

  const rootSetting = await db.systemSetting.findUnique({ where: { key: "ACTIVE_STORAGE" } });
  const sourceRoot = rootSetting?.value || process.env.DEFAULT_STORAGE_PATH || "./uploads";

  if (path.resolve(sourceRoot) === path.resolve(destPath)) {
    return NextResponse.json({ error: "Folder asal dan tujuan sama" }, { status: 400 });
  }

  // Pre-flight check & auto-create target directory if not exists
  try {
    await fsp.mkdir(destPath, { recursive: true });
    await fsp.access(destPath, fs.constants.W_OK);
  } catch {
    return NextResponse.json({ error: "Folder tujuan tidak dapat dibuat atau ditulis (Permission Denied)" }, { status: 403 });
  }

  const files = await db.fileNode.findMany({
    where: { storagePath: { not: null }, isDeleted: false }
  });

  const job = await db.migrationJob.create({
    data: {
      sourcePath: sourceRoot,
      destPath,
      totalFiles: files.length,
      status: "RUNNING"
    }
  });

  // Background worker
  (async () => {
    try {
      if (files.length === 0) {
        await db.systemSetting.upsert({
          where: { key: "ACTIVE_STORAGE" },
          update: { value: destPath },
          create: { key: "ACTIVE_STORAGE", value: destPath }
        });
        await db.migrationJob.update({
          where: { id: job.id },
          data: { status: "COMPLETED", movedFiles: 0 }
        });
        return;
      }

      let moved = 0;
      for (const file of files) {
        if (!file.storagePath) continue;
        
        const src = path.join(sourceRoot, file.storagePath);
        const dest = path.join(destPath, file.storagePath);

        await fsp.mkdir(path.dirname(dest), { recursive: true });
        
        await db.migrationJob.update({
          where: { id: job.id },
          data: { currentFile: file.storagePath }
        });

        // Streaming copy (hemat RAM)
        if (fs.existsSync(src)) {
          await pipeline(
            fs.createReadStream(src),
            fs.createWriteStream(dest)
          );
          
          const [srcStat, destStat] = await Promise.all([fsp.stat(src), fsp.stat(dest)]);
          if (srcStat.size === destStat.size) {
            await fsp.unlink(src); // Clean up lama
          } else {
            throw new Error(`Integritas file gagal: ${file.storagePath}`);
          }
        }

        moved++;
        await db.migrationJob.update({
          where: { id: job.id },
          data: { movedFiles: moved }
        });
      }

      await db.systemSetting.upsert({
        where: { key: "ACTIVE_STORAGE" },
        update: { value: destPath },
        create: { key: "ACTIVE_STORAGE", value: destPath }
      });

      await db.migrationJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED" }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await db.migrationJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorLog: msg }
      });
    }
  })();

  return NextResponse.json(job, { status: 202 });
}
