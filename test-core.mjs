import { PrismaClient } from "@prisma/client";
import assert from "node:assert";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@192.168.0.216:5433/activity_db",
    },
  },
});

async function runCheck() {
  console.log("Running self-check on PostgreSQL database...");

  // 1. Create test repo
  const repo = await prisma.repository.create({
    data: {
      name: "smoke-test-repo",
      description: "Automated smoke test verification",
      status: "IN_PROGRESS",
    },
  });
  assert.ok(repo.id, "Repository must have an ID");
  console.log("✓ Repository created:", repo.id);

  // 2. Add Activity Log with weight score
  const log = await prisma.activityLog.create({
    data: {
      repoId: repo.id,
      actionType: "TEST_RUN",
      title: "Automated Verification Test",
      weightScore: 3,
    },
  });
  assert.strictEqual(log.weightScore, 3, "Weight score must match");
  console.log("✓ Activity log created with weight score 3");

  // 3. Create FileNode
  const file = await prisma.fileNode.create({
    data: {
      repoId: repo.id,
      name: "test.txt",
      type: "FILE",
      storagePath: `${repo.id}/test.txt`,
      isDeleted: false,
    },
  });
  assert.ok(file.id, "FileNode must exist");
  console.log("✓ FileNode created");

  // 4. Soft Delete FileNode
  const softDeleted = await prisma.fileNode.update({
    where: { id: file.id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  assert.strictEqual(softDeleted.isDeleted, true, "File must be marked as deleted");
  console.log("✓ Soft delete verified");

  // 5. Cleanup
  await prisma.repository.delete({ where: { id: repo.id } });
  console.log("✓ Test cleanup completed successfully");
  await prisma.$disconnect();
}

runCheck().catch((err) => {
  console.error("Self check failed:", err);
  process.exit(1);
});
