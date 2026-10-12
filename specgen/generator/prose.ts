// Spec descriptions are written for API-reference readers. A tool argument
// needs what the field is, where valid values come from, and the constraints
// the schema cannot express; the rest is context-window spend on every
// handshake. So: leading sentences up to a cap, output prose dropped, never a
// cut inside a sentence. Hand-written versions live in `propertyDescriptions`.

export const DESCRIPTION_CAP = 240;

export type OperationNameLookup = (
  method: string,
  path: string
) => string | undefined;

const ABBREVIATIONS = ['e.g.', 'i.e.', 'etc.', 'vs.'];
const DOT = '\u0000';

// Sentences that describe the response, the console, or the design rather
// than the argument. Never applied to the first sentence.
const NOISE = [
  /^(Returns?|Responses?)\b/,
  /\b(the|a|each|every) response\b/i,
  /\bresponses (always|return)/i,
  /\bconsole\b/i,
  /forward[- ]compat/i,
  /\bhonest\b/i,
  /read-modify-write/i,
  /documents the full rule/i,
];

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

function flattenMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/:\s*\n\s*[-*]\s+/g, ': ')
    .replace(/\s*\n\s*[-*]\s+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\.(\s|$)/g, '.$1')
    .trim();
}

function dropStatusCodes(text: string): string {
  return text
    .replace(/\s*→\s*[45]\d{2}\b/g, '')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/ with (an? )?[45]\d{2}\b/g, '')
    .replace(/\s*\([45]\d{2} otherwise\)/g, '');
}

// `GET /v2/catalog/gpus` means nothing to an agent; `list-gpu-types` does.
function nameOperations(text: string, lookup: OperationNameLookup): string {
  return text.replace(
    /`?\b(GET|POST|PUT|PATCH|DELETE) (\/v2\/[\w{}/.-]+)`?/g,
    (match, method: string, path: string) => {
      const name = lookup(method, path);
      return name ? `\`${name}\`` : match;
    }
  );
}

export function compactDescription(
  text: string,
  lookup: OperationNameLookup = () => undefined,
  cap = DESCRIPTION_CAP
): string {
  const sentences = splitSentences(
    dropStatusCodes(nameOperations(flattenMarkdown(text), lookup))
  );
  if (sentences.length === 0) return '';
  const kept = [sentences[0]];
  let length = sentences[0].length;
  for (const sentence of sentences.slice(1)) {
    if (NOISE.some((pattern) => pattern.test(sentence))) continue;
    if (length + 1 + sentence.length > cap) break;
    kept.push(sentence);
    length += 1 + sentence.length;
  }
  return kept.join(' ');
}
