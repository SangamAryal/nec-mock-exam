#!/usr/bin/env python3
"""Extract the NEC Computer Engineering question bank from the two source PDFs.

Usage: python3 scripts/extract.py [questions.pdf] [answers.pdf]
Writes src/data/questions.json, src/data/notes.json and src/data/syllabus.json.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")
Q_PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/NEC_Computer_Engineering_Model_Sets.pdf")
A_PDF = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser("~/Downloads/NEC_Computer_Engineering_Answer_Book.pdf")

NOISE = (
    "NEC Registration Examination ·",
    "Original practice questions written",
    "NEC Computer Engineering (ACtE) ·",
    "Companion to \"NEC Computer Engineering",
)
LETTERS = "abcd"


def pdf_lines(path):
    out = subprocess.run(["pdftotext", "-raw", path, "-"], capture_output=True, text=True, check=True).stdout
    return [l.strip() for l in out.splitlines() if l.strip() and not l.strip().startswith(NOISE)]


def join(a, b):
    return (a + " " + b).strip() if a else b


def parse_syllabus(lines):
    chapters, subs = {}, {}
    start = lines.index("Sub-chapter index")
    for l in lines[start + 1:]:
        if l.startswith("Model Set"):
            break
        m = re.match(r"^(\d+)\.(\d+) (.+)$", l)
        if m:
            subs[f"{m[1]}.{m[2]}"] = m[3]
            continue
        m = re.match(r"^(\d+) (.+)$", l)
        if m:
            chapters[int(m[1])] = m[2]
    return chapters, subs


def parse_questions(lines):
    """Return {(set, n): {chapter, stem, options}} and the answer key {(set, n): (letter, sub)}."""
    qs, key = {}, {}
    cur_set, chapter, q, i = None, None, None, 0
    end = lines.index("Answer keys")
    for l in lines[:end]:
        m = re.match(r"^Model Set (\d+)$", l)
        if m:
            cur_set, q = int(m[1]), None
            continue
        if cur_set is None or l.startswith(("Full Marks:", "100 questions ×", "Instructions:")):
            continue
        m = re.match(r"^Chapter (\d+) · ", l)
        if m:
            chapter, q = int(m[1]), None
            continue
        m = re.match(r"^(\d+)\. (.*)$", l)
        expected = (q["n"] + 1) if q else (chapter - 1) * 10 + 1 if chapter else None
        if m and int(m[1]) == expected:
            q = {"n": int(m[1]), "chapter": chapter, "stem": m[2], "options": []}
            qs[(cur_set, q["n"])] = q
            continue
        if q is None:
            continue
        if re.match(r"^\([a-d]\) ", l):
            parts = re.split(r"(?:^|\s)\(([a-d])\) ", l)
            for letter, text in zip(parts[1::2], parts[2::2]):
                assert LETTERS.index(letter) == len(q["options"]), (cur_set, q["n"], l)
                q["options"].append(text.strip())
        elif q["options"]:
            q["options"][-1] = join(q["options"][-1], l)
        else:
            q["stem"] = join(q["stem"], l)

    # Answer key: "Set N ..." header then pairs "k. x" / "c.s"
    cur_set, pending = None, None
    for l in lines[end:]:
        m = re.match(r"^Set (\d+)\b", l)
        if m:
            cur_set = int(m[1])
            continue
        m = re.match(r"^(\d+)\. ([a-d])$", l)
        if m and cur_set:
            pending = (int(m[1]), m[2])
            continue
        m = re.match(r"^(\d+\.\d+)$", l)
        if m and pending:
            key[(cur_set, pending[0])] = (pending[1], m[1])
            pending = None
    return qs, key


def parse_solutions(lines):
    sols = {}
    start = lines.index("Model Set 1 — Solutions")
    end = next(i for i, l in enumerate(lines) if l.startswith("Part B · Probable questions"))
    cur_set, s, field = None, None, None
    for l in lines[start:end]:
        m = re.match(r"^Model Set (\d+) — Solutions$", l)
        if m:
            cur_set, s = int(m[1]), None
            continue
        if re.match(r"^Chapter \d+ · ", l):
            continue
        m = re.match(r"^(\d+)\. \[(\d+\.\d+)\] (.*)$", l)
        if m and int(m[1]) == (s["n"] + 1 if s else 1):
            s = {"n": int(m[1]), "sub": m[2], "stem": m[3], "letter": None, "answerText": "", "explanation": "", "steps": []}
            sols[(cur_set, s["n"])] = s
            field = "stem"
            continue
        if s is None:
            continue
        m = re.match(r"^Answer: \(([a-d])\) (.*)$", l)
        if m and s["letter"] is None:
            s["letter"], s["answerText"], field = m[1], m[2], "answerText"
            continue
        m = re.match(r"^Step \d+: (.*)$", l)
        if m:
            s["steps"].append(m[1])
            field = "steps"
            continue
        if field == "stem":
            s["stem"] = join(s["stem"], l)
        elif field == "steps":
            # After steps, a line that starts a new sentence is a trailing note.
            s["steps"][-1] = join(s["steps"][-1], l)
        else:
            s["explanation"] = join(s["explanation"], l)
            field = "explanation"
    return sols


def parse_notes(lines, subs):
    start = next(i for i, l in enumerate(lines) if l.startswith("Part B · Probable questions"))
    notes, cur, item, field = {}, None, None, None
    for l in lines[start + 1:]:
        if re.match(r"^Chapter \d+ · ", l):
            continue
        m = re.match(r"^(\d+\.\d+) (.+)$", l)
        if m and subs.get(m[1]) == m[2]:
            cur = {"sub": m[1], "title": m[2], "qa": [], "keyPoints": ""}
            notes[m[1]] = cur
            field = None
            continue
        if cur is None:
            continue
        m = re.match(r"^(\d)\. (.*)$", l)
        if m and int(m[1]) == len(cur["qa"]) + 1 and field != "kp":
            item = {"q": m[2], "a": ""}
            cur["qa"].append(item)
            field = "q"
            continue
        if l.startswith("Ans: ") and item is not None:
            item["a"], field = l[5:], "a"
            continue
        if l.startswith("Key points:"):
            cur["keyPoints"], field = l[len("Key points:"):].strip(), "kp"
            continue
        if field == "q":
            item["q"] = join(item["q"], l)
        elif field == "a":
            item["a"] = join(item["a"], l)
        elif field == "kp":
            cur["keyPoints"] = join(cur["keyPoints"], l)
    return notes


def norm(t):
    return re.sub(r"\s+", "", t).lower()


def main():
    ql, al = pdf_lines(Q_PDF), pdf_lines(A_PDF)
    chapters, subs = parse_syllabus(ql)
    qs, key = parse_questions(ql)
    sols = parse_solutions(al)
    notes = parse_notes(al, subs)

    with open(os.path.join(ROOT, "scripts", "formulas.json")) as f:
        formulas = json.load(f)
    out, problems = [], []
    for (st, n), q in sorted(qs.items()):
        s = sols.get((st, n))
        k = key.get((st, n))
        tag = f"set {st} q{n}"
        if len(q["options"]) != 4:
            problems.append(f"{tag}: {len(q['options'])} options")
            continue
        if not s or not s["letter"]:
            problems.append(f"{tag}: no solution")
            continue
        idx = LETTERS.index(s["letter"])
        opt = q["options"][idx]
        # A long answer line wraps; its tail lands at the start of the explanation.
        if norm(opt) != norm(s["answerText"]) and norm(opt).startswith(norm(s["answerText"])):
            rest = opt[len(s["answerText"]):].strip()
            if s["explanation"].startswith(rest):
                s["answerText"], s["explanation"] = opt, s["explanation"][len(rest):].strip()
        if k and k[0] != s["letter"]:
            problems.append(f"{tag}: key {k[0]} != solution {s['letter']}")
        if norm(q["options"][idx]) != norm(s["answerText"]):
            problems.append(f"{tag}: option text mismatch: {q['options'][idx]!r} vs {s['answerText']!r}")
        if k and k[1] != s["sub"]:
            problems.append(f"{tag}: sub {k[1]} != {s['sub']}")
        out.append({
            "id": f"s{st}-q{n}",
            "set": st,
            "chapter": q["chapter"],
            "sub": s["sub"],
            "stem": q["stem"],
            "options": q["options"],
            "answer": idx,
            "explanation": s["explanation"],
            "steps": s["steps"],
            "numerical": bool(s["steps"]),
            **({"formula": formulas[f"s{st}-q{n}"]} if f"s{st}-q{n}" in formulas else {}),
        })

    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "questions.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(DATA, "notes.json"), "w") as f:
        json.dump(notes, f, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, "syllabus.json"), "w") as f:
        json.dump({"chapters": chapters, "subs": subs}, f, ensure_ascii=False, indent=1)

    print(f"chapters={len(chapters)} subs={len(subs)} questions={len(qs)} solutions={len(sols)} key={len(key)}")
    print(f"written={len(out)} numerical={sum(q['numerical'] for q in out)} notes={len(notes)} "
          f"noteQAs={sum(len(n['qa']) for n in notes.values())}")
    print(f"problems={len(problems)}")
    for p in problems[:40]:
        print("  ", p)


if __name__ == "__main__":
    main()
