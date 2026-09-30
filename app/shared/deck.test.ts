import { test, equal } from "@elements/app";
import { nearestCard, spreadLabel, summarize } from "#app/shared/deck";

test("deck", () => {
  test("averages point cards and ignores ? and coffee", () => {
    let s = summarize(["3", "5", "8", "?", "coffee"]);
    equal(s.average, 5.3);
    equal(s.low, "3");
    equal(s.high, "8");
    equal(s.steps, 2);
    equal(s.numericCount, 3);
    equal(s.suggestion, "5");
    equal(s.counts.map((c) => c.card), ["3", "5", "8", "?", "coffee"]);
  });

  test("spots consensus", () => {
    let s = summarize(["5", "5", "5"]);
    equal(s.consensus, true);
    equal(spreadLabel(s), "Consensus");
  });

  test("no point cards gives no average", () => {
    let s = summarize(["?", "coffee"]);
    equal(s.average, null);
    equal(s.suggestion, null);
  });

  test("nearest card rounds a tie up", () => {
    equal(nearestCard(4), "5");
    equal(nearestCard(6.4), "5");
    equal(nearestCard(10.5), "13");
    equal(nearestCard(40), "21");
  });

  test("labels a wide spread", () => {
    equal(spreadLabel(summarize(["2", "13"])), "Wide spread");
    equal(spreadLabel(summarize(["3", "5"])), "Close");
  });
});
