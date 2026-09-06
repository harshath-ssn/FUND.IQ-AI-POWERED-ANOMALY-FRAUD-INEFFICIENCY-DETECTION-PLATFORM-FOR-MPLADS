"""
Session A0.7 -- seeded prototype workflow layer.

eSAKSHI (Layer 1: works, MPs, amounts, dates, statuses, agencies, vendors,
payments, images -- written by sync_data.py) has no concept of case-workflow
state: nobody's eSAKSHI export contains "Verification tasks", "Decisions",
"Clarification requests" or "Follow-ups", because that is the audit workflow
this prototype layers ON TOP of the real records, not something MoSPI
publishes. Those records are therefore GENERATED here, deterministically
(fixed seed below, so the same run always produces the same demo data), and
every single record carries "source": "prototype_workflow" so no screen can
present this as a real eSAKSHI record.

Run this AFTER sync_data.py (it reads the real per-district work files that
script writes to public/data/works/by-district/).
"""

import json
import os
import random
from datetime import datetime, timedelta, timezone

SEED = 20260906  # fixed -> reproducible demo runs
rng = random.Random(SEED)

WORKS_DIR = os.path.join("public", "data", "works", "by-district")
OUTPUT_PATH = os.path.join("public", "data", "workflow_seed.json")

REFERENCE_DATE = datetime(2026, 9, 1)  # matches sync_data.py's eval_date

ROLES = [
    "District Verification Officer",
    "State Nodal Auditor",
    "Ministry Desk Officer (MoSPI)",
]

VERIFICATION_STATUSES = ["Pending", "In Review", "Cleared", "Escalated"]
DECISION_OUTCOMES = ["Approved", "Sent Back for Clarification", "Escalated to Vigilance"]

CLARIFICATION_TEMPLATES = [
    "Please confirm the vendor invoice matching {vendor} for work {work_id}.",
    "Site inspection report for {work_id} ({category}) has not been uploaded -- please provide an update.",
    "Sanctioned amount for {work_id} exceeds the regional median; please justify the cost estimate.",
    "Photo evidence missing for a work marked complete ({work_id}) -- please upload or explain.",
    "Please clarify the {days}-day gap between recommendation and sanction for {work_id}.",
]

FOLLOWUP_NOTES = [
    "Awaiting updated geotagged photo evidence from the field office.",
    "Reminder sent to implementing agency for pending utilization certificate.",
    "Field visit scheduled to physically verify work progress.",
    "Awaiting vendor's response on invoice discrepancy.",
    "Escalation pending State Nodal Authority review.",
]

ACTION_VERBS = [
    ("Verification task opened", "District Verification Officer"),
    ("Documents requested from implementing agency", "District Verification Officer"),
    ("Field inspection logged", "District Verification Officer"),
    ("Case reviewed", "State Nodal Auditor"),
    ("Decision recorded", "State Nodal Auditor"),
    ("Escalated for Ministry review", "Ministry Desk Officer (MoSPI)"),
]


def load_all_works():
    works = []
    if not os.path.isdir(WORKS_DIR):
        raise FileNotFoundError(
            f"{WORKS_DIR} not found -- run sync_data.py first to generate the real "
            f"per-district work files this seed script samples from."
        )
    for fname in sorted(os.listdir(WORKS_DIR)):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(WORKS_DIR, fname), encoding="utf-8") as f:
            works.extend(json.load(f))
    return works


def pick_sample(works, n):
    # Bias toward HIGH/MEDIUM risk works (that's what a real verification
    # queue would actually contain), but keep a few LOW-risk clean cases too
    # so "Cleared" outcomes have real examples.
    high_med = [w for w in works if w.get("riskLevel") in ("HIGH", "MEDIUM")]
    low = [w for w in works if w.get("riskLevel") == "LOW"]
    rng.shuffle(high_med)
    rng.shuffle(low)
    n_high_med = min(len(high_med), int(n * 0.8))
    n_low = min(len(low), n - n_high_med)
    sample = high_med[:n_high_med] + low[:n_low]
    sample.sort(key=lambda w: w["id"])  # deterministic ordering regardless of dict/dir order
    return sample


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def build_workflow(works, sample_size=400):
    sample = pick_sample(works, sample_size)

    verification_tasks = []
    decisions = []
    clarification_requests = []
    follow_ups = []
    action_history = []

    for i, w in enumerate(sample, start=1):
        work_id = w["id"]
        opened_at = REFERENCE_DATE - timedelta(days=rng.randint(1, 120))
        status = rng.choice(VERIFICATION_STATUSES)
        assigned_role = rng.choice(ROLES)

        task_id = f"VT{i:05d}"
        verification_tasks.append({
            "id": task_id,
            "workId": work_id,
            "district": w.get("district"),
            "constituency": w.get("constituency"),
            "state": w.get("state"),
            "status": status,
            "assignedRole": assigned_role,
            "createdAt": iso(opened_at),
            "source": "prototype_workflow",
        })
        action_history.append({
            "id": f"ACT{len(action_history) + 1:05d}",
            "workId": work_id,
            "taskId": task_id,
            "action": "Verification task opened",
            "actor": assigned_role,
            "timestamp": iso(opened_at),
            "source": "prototype_workflow",
        })

        # Roughly 1 in 3 open tasks also gets a clarification request.
        if rng.random() < 0.33:
            template = rng.choice(CLARIFICATION_TEMPLATES)
            req_at = opened_at + timedelta(days=rng.randint(1, 10))
            clarification_requests.append({
                "id": f"CLR{len(clarification_requests) + 1:05d}",
                "workId": work_id,
                "taskId": task_id,
                "question": template.format(
                    work_id=work_id,
                    vendor=w.get("vendorName", "the listed vendor"),
                    category=w.get("category", "this category"),
                    days=w.get("daysToSanction") or rng.randint(46, 200),
                ),
                "requestedBy": assigned_role,
                "requestedAt": iso(req_at),
                "status": rng.choice(["Open", "Answered", "Open"]),
                "source": "prototype_workflow",
            })
            action_history.append({
                "id": f"ACT{len(action_history) + 1:05d}",
                "workId": work_id,
                "taskId": task_id,
                "action": "Clarification requested from implementing agency",
                "actor": assigned_role,
                "timestamp": iso(req_at),
                "source": "prototype_workflow",
            })

        # Cleared/Escalated tasks get a recorded decision.
        if status in ("Cleared", "Escalated"):
            decided_at = opened_at + timedelta(days=rng.randint(2, 20))
            outcome = "Approved" if status == "Cleared" else rng.choice(DECISION_OUTCOMES[1:])
            decider_role = "State Nodal Auditor" if status == "Cleared" else "Ministry Desk Officer (MoSPI)"
            decisions.append({
                "id": f"DEC{len(decisions) + 1:05d}",
                "workId": work_id,
                "taskId": task_id,
                "decision": outcome,
                "decidedBy": decider_role,
                "decidedAt": iso(decided_at),
                "source": "prototype_workflow",
            })
            action_history.append({
                "id": f"ACT{len(action_history) + 1:05d}",
                "workId": work_id,
                "taskId": task_id,
                "action": f"Decision recorded: {outcome}",
                "actor": decider_role,
                "timestamp": iso(decided_at),
                "source": "prototype_workflow",
            })

        # Pending/In Review tasks get an open follow-up.
        if status in ("Pending", "In Review"):
            due_at = REFERENCE_DATE + timedelta(days=rng.randint(3, 30))
            follow_ups.append({
                "id": f"FU{len(follow_ups) + 1:05d}",
                "workId": work_id,
                "taskId": task_id,
                "note": rng.choice(FOLLOWUP_NOTES),
                "dueDate": due_at.strftime("%Y-%m-%d"),
                "status": "Open",
                "source": "prototype_workflow",
            })

    return {
        "meta": {
            "seed": SEED,
            "generatedAt": iso(datetime.now(timezone.utc)),
            "note": (
                "SEEDED PROTOTYPE WORKFLOW DATA -- generated deterministically "
                "from the fixed seed above for reproducible demos. Not eSAKSHI "
                "records. Every record in this file carries "
                "\"source\": \"prototype_workflow\"."
            ),
            "sampleSize": len(sample),
        },
        "verificationTasks": verification_tasks,
        "decisions": decisions,
        "clarificationRequests": clarification_requests,
        "followUps": follow_ups,
        "actionHistory": action_history,
    }


def main():
    works = load_all_works()
    print(f"[*] Loaded {len(works)} real works from {WORKS_DIR}/ to seed the prototype workflow layer.")
    workflow = build_workflow(works)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(workflow, f, indent=2)
    print(
        f"[+] Wrote {OUTPUT_PATH}: {len(workflow['verificationTasks'])} verification tasks, "
        f"{len(workflow['decisions'])} decisions, {len(workflow['clarificationRequests'])} clarification "
        f"requests, {len(workflow['followUps'])} follow-ups, {len(workflow['actionHistory'])} action-history "
        f"entries (seed={SEED}, all tagged source=prototype_workflow)."
    )


if __name__ == "__main__":
    main()
