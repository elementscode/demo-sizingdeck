import { test, equal } from "@elements/app";
import { csvField, estimatesCsv } from "#app/routes/estimates";

test("estimates csv", () => {
  test("quotes commas, quotes and newlines", () => {
    equal(csvField(`Say "hi", then\nleave`), `"Say ""hi"", then\nleave"`);
    equal(csvField("plain"), "plain");
    equal(csvField(null), "");
  });

  test("defuses spreadsheet formulas", () => {
    equal(csvField("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`);
    equal(csvField("-1"), "'-1");
  });

  test("writes a header and a row per story", () => {
    let csv = estimatesCsv([
      { title: "Apple Pay", url: "https://t.example.com/1", estimate: "8", average: 8.4, voteCount: 5, estimatedAt: new Date("2026-09-30T12:00:00Z") },
    ]);

    equal(csv, "Story,Link,Estimate,Average vote,Votes,Estimated at\r\nApple Pay,https://t.example.com/1,8,8.4,5,2026-09-30T12:00:00.000Z\r\n");
  });
});
