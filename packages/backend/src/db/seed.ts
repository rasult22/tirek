import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { users, inviteCodes, studentPsychologist } from "./schema.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  seedDiagnosticTests,
  seedExercises,
  seedQuotes,
  seedAchievements,
} from "./seed-data.js";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── 1. Demo psychologist ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo123456", 10);

  // Check if psychologist already exists
  const [existingPsych] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "psychologist@tirek.kz"))
    .limit(1);

  let psychologistId: string;
  if (existingPsych) {
    psychologistId = existingPsych.id;
  } else {
    psychologistId = uuidv4();
    await db.insert(users).values({
      id: psychologistId,
      email: "psychologist@tirek.kz",
      passwordHash,
      name: "Айгуль Нурланова",
      role: "psychologist",
      language: "ru",
    });
  }

  console.log("  ✓ Demo psychologist: psychologist@tirek.kz / demo123456");

  // ── 1b. Demo student + invite code ─────────────────────────────────
  await db
    .insert(inviteCodes)
    .values({
      id: uuidv4(),
      code: "TEST-0001",
      psychologistId,
      studentRealName: "Демо Ученик",
      grade: 9,
      classLetter: "А",
    })
    .onConflictDoNothing();

  const [existingStudent] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "student@tirek.kz"))
    .limit(1);

  let studentId: string;
  if (existingStudent) {
    studentId = existingStudent.id;
  } else {
    studentId = uuidv4();
    await db.insert(users).values({
      id: studentId,
      email: "student@tirek.kz",
      passwordHash,
      name: "Алия Сериков",
      role: "student",
      language: "ru",
      avatarId: "avatar-1",
      grade: 9,
      classLetter: "А",
    });
  }

  // Link student to psychologist
  await db
    .insert(studentPsychologist)
    .values({ studentId, psychologistId })
    .onConflictDoNothing();

  console.log("  ✓ Demo student: student@tirek.kz / demo123456");

  // ── 2-5. Reference data (shared with seed-reference.ts) ────────────
  await seedDiagnosticTests();
  await seedExercises();
  await seedQuotes();
  await seedAchievements();

  console.log("\n✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
