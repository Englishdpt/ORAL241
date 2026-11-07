// Plain-text formats used by the teacher editor (one item per line, fields separated by "|").
const cut = (l) => l.split("|").map((x) => x.trim());
const rows = (t) => String(t || "").split("\n").map((l) => l.trim()).filter(Boolean).map(cut);

export const vocabToText = (v = []) => v.map((x) => [x.word, x.meaning, x.example || ""].join(" | ")).join("\n");
export const vocabFromText = (t) => rows(t).filter((p) => p[0] && p[1]).map(([word, meaning, example = ""]) => ({ word, meaning, example }));

export const tipsToText = (v = []) => v.map((x) => `${x.title} | ${x.content}`).join("\n");
export const tipsFromText = (t) => rows(t).filter((p) => p[0] && p[1]).map(([title, content]) => ({ title, content }));

// question | choice A ; choice B ; choice C | number of the right choice (1, 2, 3) | explanation
export const quizToText = (items = []) =>
  items.map((q) => [q.q, q.choices.join(" ; "), q.answer + 1, q.explain || ""].join(" | ")).join("\n");
export const quizFromText = (t) =>
  rows(t).filter((p) => p.length >= 3 && p[0])
    .map(([q, ch, ans, explain = ""]) => ({ q, choices: ch.split(";").map((c) => c.trim()).filter(Boolean), answer: Number(ans) - 1, explain }))
    .filter((x) => x.choices.length >= 2 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.choices.length);
