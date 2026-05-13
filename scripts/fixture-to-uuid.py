#!/usr/bin/env python3
"""
One-time transform: rewrite short Lovable-style IDs (g1, p1, a1, ...) in
src/data/sample/sampleDataFixture.{locale}.json to proper UUIDs.

Why:
- Supabase PKs are uuid; inserting "g1" raised 22P02 and broke the sample seed.

Scope (the 13 fields agreed in the audit):
    goals[].id
    projects[].id, projects[].goalId
    actions[].id, actions[].goalId, actions[].projectId
    rituals[].id, rituals[].goalId, rituals[].projectId
    ideas[].id, ideas[].goalId
    sessions[].id, sessions[].actionIds[]

NOT touched:
- goals[].successCriteria[].id  (rowMappers.ts overwrites with crypto.randomUUID)
- projects[].references[].id    (same)
- dayEntries[].id               (sampleSeed strips before insert; DB default fills)
- dayEntries[].mainTaskActionId (all null in fixture)
- All locale string fields (titles, descriptions, etc.) preserved byte-for-byte
  in their parent objects — only the listed keys are reassigned.

Determinism:
- Build the oldId -> uuid map ONCE from en.json's top-level entity IDs, then
  apply the SAME map to all 4 locale files. Same old-ID -> same UUID across
  locales (cleaner review; matches user constraint).
"""

import json
import uuid
from pathlib import Path

FIXTURE_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "sample"
LOCALES = ["en", "ru", "de", "es"]
TOP_LEVEL_ENTITIES = ["goals", "projects", "actions", "rituals", "ideas", "sessions"]


def collect_ids(doc: dict) -> set[str]:
    """Collect every top-level entity .id value. Children (criteria, references,
    completionHistory, dayEntries) are intentionally excluded — their IDs are
    either mapper-overwritten or stripped before insert."""
    ids: set[str] = set()
    for entity in TOP_LEVEL_ENTITIES:
        for row in doc.get(entity, []):
            rid = row.get("id")
            if isinstance(rid, str):
                ids.add(rid)
    # Also collect from session actionIds in case any element is not a goal/etc.
    # (Sanity: should be a subset of actions[].id; merge defensively.)
    for s in doc.get("sessions", []):
        for aid in s.get("actionIds", []) or []:
            if isinstance(aid, str):
                ids.add(aid)
    return ids


def build_map(ids: set[str]) -> dict[str, str]:
    return {old: str(uuid.uuid4()) for old in sorted(ids)}


def remap(doc: dict, m: dict[str, str]) -> None:
    """In-place rewrite of the 13 listed fields. Strict whitelist."""
    for g in doc.get("goals", []):
        if isinstance(g.get("id"), str):
            g["id"] = m[g["id"]]

    for p in doc.get("projects", []):
        if isinstance(p.get("id"), str):
            p["id"] = m[p["id"]]
        if isinstance(p.get("goalId"), str):
            p["goalId"] = m[p["goalId"]]

    for a in doc.get("actions", []):
        if isinstance(a.get("id"), str):
            a["id"] = m[a["id"]]
        if isinstance(a.get("goalId"), str):
            a["goalId"] = m[a["goalId"]]
        if isinstance(a.get("projectId"), str):
            a["projectId"] = m[a["projectId"]]

    for r in doc.get("rituals", []):
        if isinstance(r.get("id"), str):
            r["id"] = m[r["id"]]
        if isinstance(r.get("goalId"), str):
            r["goalId"] = m[r["goalId"]]
        if isinstance(r.get("projectId"), str):
            r["projectId"] = m[r["projectId"]]

    for i in doc.get("ideas", []):
        if isinstance(i.get("id"), str):
            i["id"] = m[i["id"]]
        if isinstance(i.get("goalId"), str):
            i["goalId"] = m[i["goalId"]]

    for s in doc.get("sessions", []):
        if isinstance(s.get("id"), str):
            s["id"] = m[s["id"]]
        if isinstance(s.get("actionIds"), list):
            s["actionIds"] = [
                m[x] if isinstance(x, str) and x in m else x for x in s["actionIds"]
            ]


def load(p: Path) -> dict:
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def dump(p: Path, doc: dict) -> None:
    # Match existing file style: 2-space indent, UTF-8 (non-ASCII preserved),
    # no trailing newline (matches current files).
    text = json.dumps(doc, ensure_ascii=False, indent=2)
    p.write_bytes(text.encode("utf-8"))


def main() -> None:
    en_path = FIXTURE_DIR / "sampleDataFixture.en.json"
    en_doc = load(en_path)
    old_ids = collect_ids(en_doc)
    print(f"Collected {len(old_ids)} unique top-level entity IDs from en.json")

    id_map = build_map(old_ids)
    print(f"Built map of size {len(id_map)}")

    for loc in LOCALES:
        path = FIXTURE_DIR / f"sampleDataFixture.{loc}.json"
        doc = load(path)
        # Sanity: every locale should have the same ID set.
        loc_ids = collect_ids(doc)
        missing = loc_ids - set(id_map.keys())
        if missing:
            raise SystemExit(
                f"FATAL: {loc}.json contains IDs not in en.json map: {sorted(missing)}"
            )
        remap(doc, id_map)
        dump(path, doc)
        print(f"  rewrote {path.name}")


if __name__ == "__main__":
    main()
