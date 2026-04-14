import {
  seedDiagnosticTests,
  seedExercises,
  seedQuotes,
  seedAchievements,
} from "./seed-data.js";

async function seedReference() {
  console.log("🌱 Seeding reference data...");
  await seedDiagnosticTests();
  await seedExercises();
  await seedQuotes();
  await seedAchievements();
  console.log("\n✅ Reference seed completed!");
  process.exit(0);
}

seedReference().catch((err) => {
  console.error("❌ Reference seed failed:", err);
  process.exit(1);
});
