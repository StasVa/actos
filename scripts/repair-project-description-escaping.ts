// Repair script for the project.description double-escape bug.
//
// Background: prior to the fix in src/lib/rowMappers.ts, projectToInsert and
// projectToUpdate ran JSON.stringify on description, while rowToProject did
// not JSON.parse. The supabase-js client already JSON-encodes the request
// body, so JSON.stringify was redundant. Each save round-tripped the value
// through one extra layer of JSON encoding, accumulating literal quote and
// backslash characters in the stored string. This script peels those layers.
//
// Strategy: for each row, repeatedly JSON.parse the description while the
// result is (a) a string and (b) different from the previous value. Stop on
// the first non-string result or when parsing fails. The fully-peeled value
// is the original HTML the user typed. Rows that are already clean (i.e.
// non-JSON-text from the start, or null) are no-ops.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/repair-project-description-escaping.ts
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/repair-project-description-escaping.ts --apply
//
// Defaults to dry-run. Pass --apply to actually write.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.\n" +
      "Run with both set, e.g.:\n" +
      "  SUPABASE_URL=https://xxx.supabase.co \\\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\\n" +
      "  npx tsx scripts/repair-project-description-escaping.ts",
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Peel JSON-encoded string layers. Stops when:
//   - parse fails (value is no longer valid JSON text), OR
//   - parse result is not a string (we don't want to unwrap a structured value), OR
//   - parse result equals the input (idempotent fixed point).
// Returns the fully-peeled string. Safe for already-clean inputs (returns them unchanged).
function peel(value: string): string {
  let current = value;
  // Cap iterations as a defensive guard against pathological inputs.
  for (let i = 0; i < 32; i++) {
    let next: unknown;
    try {
      next = JSON.parse(current);
    } catch {
      return current;
    }
    if (typeof next !== "string") return current;
    if (next === current) return current;
    current = next;
  }
  return current;
}

type ProjectRow = { id: string; description: unknown };

function preview(s: string, max = 80): string {
  const flat = s.replace(/\n/g, "\\n");
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

async function main() {
  console.log(
    `Mode: ${APPLY ? "APPLY (will write)" : "DRY-RUN (no writes; pass --apply to write)"}`,
  );

  const { data, error } = await supabase
    .from("projects")
    .select("id, description");

  if (error) {
    console.error("Failed to read projects:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as ProjectRow[];
  console.log(`Read ${rows.length} projects.`);

  const toUpdate: Array<{ id: string; before: string; after: string }> = [];
  let nullCount = 0;
  let nonStringCount = 0;
  let alreadyCleanCount = 0;

  for (const row of rows) {
    if (row.description === null || row.description === undefined) {
      nullCount++;
      continue;
    }
    if (typeof row.description !== "string") {
      // Defensive: shouldn't happen given the bug pattern, but skip cleanly.
      nonStringCount++;
      continue;
    }
    const before = row.description;
    const after = peel(before);
    if (after === before) {
      alreadyCleanCount++;
      continue;
    }
    toUpdate.push({ id: row.id, before, after });
  }

  console.log("");
  console.log("Summary:");
  console.log(`  null/empty:     ${nullCount}`);
  console.log(`  non-string:     ${nonStringCount}`);
  console.log(`  already clean:  ${alreadyCleanCount}`);
  console.log(`  need repair:    ${toUpdate.length}`);
  console.log("");

  if (toUpdate.length === 0) {
    console.log("Nothing to repair. Done.");
    return;
  }

  const sampleCount = Math.min(3, toUpdate.length);
  console.log(`Samples (first ${sampleCount}):`);
  for (let i = 0; i < sampleCount; i++) {
    const { id, before, after } = toUpdate[i];
    console.log(`  [${id}]`);
    console.log(`    before: ${preview(before)}`);
    console.log(`    after:  ${preview(after)}`);
  }
  console.log("");

  if (!APPLY) {
    console.log(
      `DRY-RUN: would update ${toUpdate.length} rows. Re-run with --apply to write.`,
    );
    return;
  }

  console.log(`Applying ${toUpdate.length} updates…`);
  let updated = 0;
  let failed = 0;
  // Process in small parallel batches to avoid overwhelming the API.
  const BATCH = 10;
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const slice = toUpdate.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      slice.map(({ id, after }) =>
        supabase.from("projects").update({ description: after }).eq("id", id),
      ),
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "rejected") {
        failed++;
        console.error(`  FAIL ${slice[j].id}:`, r.reason);
      } else if (r.value.error) {
        failed++;
        console.error(`  FAIL ${slice[j].id}:`, r.value.error.message);
      } else {
        updated++;
      }
    }
  }
  console.log("");
  console.log(`Updated ${updated} of ${toUpdate.length} projects.`);
  if (failed > 0) {
    console.log(`Failed: ${failed}. Re-run the script — it is idempotent.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
