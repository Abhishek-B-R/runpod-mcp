// Sentence splitting shared by the generator's description compaction and the
// served tool listing, so both cut at the same places.

const ABBREVIATIONS = ['e.g.', 'i.e.', 'etc.', 'vs.'];
const DOT = '\u0000';

export function splitSentences(text: string): string[] {
  let guarded = text;
  for (const abbreviation of ABBREVIATIONS) {
    guarded = guarded.replaceAll(
      abbreviation,
      abbreviation.replaceAll('.', DOT)
    );
  }
  return guarded
    .split(/(?<=[.!?])\s+(?=[A-Z`"'([])/)
    .map((sentence) => sentence.replaceAll(DOT, '.').trim())
    .filter(Boolean);
}

export function leadSentence(text: string): string {
  return splitSentences(text)[0] ?? text;
}
