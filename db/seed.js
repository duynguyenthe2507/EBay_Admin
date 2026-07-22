/**
 * seed.js — Import all shopii.*.json files in ./db into MongoDB.
 *
 * Usage (from project root):
 *   node db/seed.js
 *
 * The script reads MONGO_URI from backend/.env.
 * Each file is inserted into the collection derived from its filename:
 *   shopii.addresses.json  →  collection "addresses"
 *   shopii.users.json      →  collection "users"
 *   ...etc
 *
 * MongoDB Extended JSON fields ($oid, $date, $numberDecimal …) are
 * automatically converted to native BSON types via EJSON.deserialize.
 */

const fs = require("fs");
const path = require("path");
// Resolve mongodb from the backend's node_modules (it ships as mongoose's dep)
const backendModules = require("path").resolve(__dirname, "../backend/node_modules");
const { MongoClient, BSON } = require(require("path").join(backendModules, "mongodb"));

// ── 1. Load MONGO_URI from backend/.env ────────────────────────────────────
const envPath = path.resolve(__dirname, "../backend/.env");
const envContent = fs.readFileSync(envPath, "utf8");

let mongoUri = "mongodb://127.0.0.1:27017/shopii"; // fallback
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("MONGO_URI=")) {
    mongoUri = trimmed.slice("MONGO_URI=".length).trim();
    break;
  }
}

// Extract the DB name from the URI (last path segment, strip query string)
const uriObj = new URL(mongoUri);
const dbName = uriObj.pathname.replace(/^\//, "").split("?")[0] || "shopii";

console.log(`Connecting to : ${mongoUri}`);
console.log(`Database      : ${dbName}\n`);

// ── 2. Collect all shopii.*.json files ─────────────────────────────────────
const dbDir = __dirname; // the ./db directory
const jsonFiles = fs
  .readdirSync(dbDir)
  .filter((f) => f.startsWith("shopii.") && f.endsWith(".json"))
  .map((f) => ({
    file: path.join(dbDir, f),
    // "shopii.addresses.json"  →  "addresses"
    collection: f.replace(/^shopii\./, "").replace(/\.json$/, ""),
  }));

if (jsonFiles.length === 0) {
  console.error("No shopii.*.json files found in", dbDir);
  process.exit(1);
}

// ── 3. Import each file ────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(dbName);

    for (const { file, collection } of jsonFiles) {
      const raw = fs.readFileSync(file, "utf8");

      // Parse as plain JSON, then convert Extended JSON types ($oid, $date …)
      let documents;
      try {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        // EJSON.deserialize converts Extended JSON → native BSON
        documents = arr.map((doc) => BSON.EJSON.deserialize(doc));
      } catch (err) {
        console.warn(`Skipping ${collection}: JSON parse error — ${err.message}`);
        continue;
      }

      if (documents.length === 0) {
        console.log(`Skipping ${collection}: empty file`);
        continue;
      }

      const col = db.collection(collection);

      // Clear existing data so re-runs are idempotent
      await col.deleteMany({});

      const result = await col.insertMany(documents, { ordered: false });
      console.log(
        `Inserted [${collection}] → ${result.insertedCount} document(s)`
      );
    }

    console.log("\nSeeding complete!");
  } catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
