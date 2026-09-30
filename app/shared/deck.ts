export const DECK = ["1", "2", "3", "5", "8", "13", "21", "?", "coffee"];

export const POINTS = ["1", "2", "3", "5", "8", "13", "21"];

export interface Summary {
  average: number | null;
  low: string | null;
  high: string | null;
  // How many steps of the deck lie between the lowest and highest card.
  steps: number;
  consensus: boolean;
  suggestion: string | null;
  counts: { card: string; count: number }[];
  numericCount: number;
}

export function cardLabel(card: string): string {
  return card === "coffee" ? "☕" : card;
}

export function summarize(cards: string[]): Summary {
  let numeric = cards.filter((c) => POINTS.includes(c)).map(Number).sort((a, b) => a - b);

  let counts = DECK
    .map((card) => ({ card, count: cards.filter((c) => c === card).length }))
    .filter((c) => c.count > 0);

  if (numeric.length === 0) {
    return { average: null, low: null, high: null, steps: 0, consensus: false, suggestion: null, counts, numericCount: 0 };
  }

  let average = numeric.reduce((sum, n) => sum + n, 0) / numeric.length;
  let low = String(numeric[0]);
  let high = String(numeric[numeric.length - 1]);

  return {
    average: Math.round(average * 10) / 10,
    low,
    high,
    steps: POINTS.indexOf(high) - POINTS.indexOf(low),
    consensus: low === high,
    suggestion: nearestCard(average),
    counts,
    numericCount: numeric.length,
  };
}

/** The deck card closest to a value, rounding a tie up: estimates err large. */
export function nearestCard(value: number): string {
  let best = POINTS[0];

  for (let card of POINTS) {
    if (Math.abs(Number(card) - value) <= Math.abs(Number(best) - value)) {
      best = card;
    }
  }

  return best;
}

export function spreadLabel(s: Summary): string {
  if (s.consensus) {
    return "Consensus";
  }

  if (s.steps <= 1) {
    return "Close";
  }

  if (s.steps === 2) {
    return "Some spread";
  }

  return "Wide spread";
}
