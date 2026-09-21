import type { Incident } from "./types";

// ponytail: word-overlap scoring, not embeddings. Good enough to demo
// "remembers past incidents"; swap for Vectorize + embeddings if this
// needs to scale past a few hundred incidents.
export function findSimilarIncident(symptom: string, incidents: Incident[]): Incident | undefined {
  const words = new Set(symptom.toLowerCase().split(/\W+/).filter(Boolean));
  let best: { incident: Incident; score: number } | undefined;

  for (const inc of incidents) {
    const incWords = new Set(inc.symptom.toLowerCase().split(/\W+/).filter(Boolean));
    const overlap = [...words].filter((w) => incWords.has(w)).length;
    const score = overlap / Math.max(words.size, incWords.size, 1);
    if (score > 0.3 && (!best || score > best.score)) {
      best = { incident: inc, score };
    }
  }

  return best?.incident;
}
