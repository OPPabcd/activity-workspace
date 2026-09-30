import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageRoot } from "@/lib/storage";
import { optimizeImage } from "@/lib/media-optimizer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const formData = await req.formData();
  const repoId = formData.get("repoId") as string;
  const parentId = (formData.get("parentId") as string) || null;
  const files = formData.getAll("files") as File[];
  const relativePaths = formData.getAll("paths") as string[];

  if (!repoId || files.length === 0) {
    return NextResponse.json({ error: "Data upload tidak lengkap" }, { status: 400 });
  }

  const root = getStorageRoot();
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = relativePaths[i] || file.name;
    const pathParts = relPath.split("/").filter(Boolean);

    // Rekonstruksi struktur folder jika upload folder
    let currentParentId = parentId;
    for (let j = 0; j < pathParts.length - 1; j++) {
      const folderName = pathParts[j];
      let folderNode = await db.fileNode.findFirst({
        where: { repoId, parentId: currentParentId, name: folderName, type: "FOLDER", isDeleted: false }
      });
      if (!folderNode) {
        folderNode = await db.fileNode.create({
          data: { repoId, parentId: currentParentId, name: folderName, type: "FOLDER" }
        });
      }
      currentParentId = folderNode.id;
    }

    const fileName = pathParts[pathParts.length - 1];
    const fileExt = path.extname(fileName);
    const uniqueStorageName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${fileExt}`;
    const storageRelPath = path.join(repoId, uniqueStorageName).replace(/\\/g, "/");
    const absoluteTarget = path.join(root, storageRelPath);

    await fs.mkdir(path.dirname(absoluteTarget), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type.startsWith("image/") && !file.type.includes("svg")) {
      await optimizeImage(buffer, absoluteTarget);
    } else {
      await fs.writeFile(absoluteTarget, buffer);
    }

    const fileNode = await db.fileNode.create({
      data: {
        repoId,
        parentId: currentParentId,
        name: fileName,
        type: "FILE",
        storagePath: storageRelPath,
        mimeType: file.type || "application/octet-stream",
        fileSize: BigInt(file.size),
      }
    });

    results.push(fileNode);
  }

  await db.activityLog.create({
    data: {
      repoId,
      actionType: "FILE_UPLOADED",
      title: `Mengunggah ${files.length} file/folder`,
      weightScore: 1,
    }
  });

  return NextResponse.json({ success: true, count: results.length });
}
