![Sizingdeck, a planning poker app built with Elements: the Checkout Squad room just after a reveal, with six named cards face up, a 5.7 average, the spread from 3 to 8 and a bar per card.](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509/poster?v=7b0f8e9612e6)

# Sizingdeck

> A demo app built with [Elements](https://elements.dev).

Rooms joined by link with a name, face-down votes, a reveal with the average and spread, and a CSV of estimated stories.

**Demo:** [Sizingdeck](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 18 min
- **Cost:** $5.08 at API rates, September 2026

## Get started

```bash
elements create sizingdeck -scaffold=elementscode/demo-sizingdeck
```

## How it's built

Sizingdeck needed rooms anyone can join from a link, cards that stay face down until the reveal, a table everyone sees change as people vote and a CSV of the results. Each of those is a part of Elements, so the agent spent its 18 minutes on the game itself.

### What Elements gave the app

- **A live table.** `rooms`, `participants`, `stories` and `votes` are LiveTables in `app/shared/services/poker.ts`, each partitioned by room. When someone joins, votes or the facilitator moves to the next story, every open copy of the room updates.
- **Face-down cards.** The `votes` select returns a card only after it is revealed, so a browser sees that someone voted but never what they picked. `reveal` in `app/pages/room/services.ts` turns the cards over, and `summarize` in `app/shared/deck.ts` works out the average and the spread.
- **Join with a name.** `joinRoom` takes just a name, creates a user and signs them in with a session, so a teammate is in the room a moment after opening the link.
- **Facilitator controls as function calls.** The room calls `@rpc` functions such as `addStory`, `castVote`, `revote` and `saveEstimate` straight from the template. `requireParticipant` and `requireFacilitator` check each caller's seat, and `claimFacilitator` lets another participant take over the role.
- **Estimates as a download.** `/r/:code/estimates.csv` in `app/routes/estimates.ts` exports each estimated story with its estimate, average and vote count, and quotes any cell a spreadsheet would read as a formula.
- **Data from SQL files.** Two migrations define the rooms and seed a demo room with five people and seven stories, four already estimated.

### What the agent got from the tooling

The agent ran 23 builds in 18 minutes. By the build's own timer, the median build finished in 11 milliseconds, so it checked its work after each edit and kept going. Along the way the build caught errors such as async callbacks in a test helper that did not await them, with a message that showed the corrected signature, and class bindings that could produce a non-class value. The agent read 37 manual pages as it reached each part, from `recipes/team-partitioned-table` and `realtime` to `recipes/form-validation`, then wrote 19 tests and checked its pages at phone width in a real browser.

Start in `app/pages/room/services.ts`.

## Seed data

There are no accounts: you join a room by typing a name. The development seed
creates one room, **Checkout Squad · Sprint 42** at `/r/sprint42`, linked from
the home page. It has five people at the table (Priya Raman, Marcus Chen,
Sofia Alvarez, Dev Okafor and Hana Kim), four stories already estimated, one
story mid-vote with all five cards face down, and two stories queued.

Join with any name and your seat is the one still to vote. Click **Take over**
to become the facilitator, then reveal the cards, settle the estimate and
export the estimated stories as CSV.

## The prompt

```text
Build a planning poker app named sizingdeck for sprint estimation.

- Create a room and share its link. Join with just a name.
- The facilitator adds stories to estimate (title and a link).
- Everyone picks a card (1, 2, 3, 5, 8, 13, 21, ?, coffee) face down; you see
  who has voted but not what.
- The facilitator reveals: cards flip, with the average and the spread, and
  the room agrees on a final estimate.
- A list of estimated stories, exportable as CSV.

Seed one room with five named participants and a few stories already
estimated.

Joining, voting and reveals happen in real time for everyone in the room.
```

## License

MIT. See [LICENSE](LICENSE).
