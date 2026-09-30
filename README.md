![Sizingdeck, a planning poker app built with Elements: the Checkout Squad room just after a reveal, with six named cards face up, a 5.7 average, the spread from 3 to 8 and a bar per card.](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509/poster?v=7b0f8e9612e6)

# Sizingdeck

> A demo app built with [Elements](https://elements.dev).

Rooms joined by link with a name, face-down votes, a reveal with the average and spread, and a CSV of estimated stories.

**Demo:** [Sizingdeck](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509)

## Agent specs

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

- **A live table.** Rooms, participants, stories and votes are LiveTables, one view per room. When someone joins, votes or the facilitator moves to the next story, every open copy of the room updates.

- **Face-down cards.** A card reaches the browser only after the reveal, so everyone sees who has voted while the cards stay face down. The reveal shows the average and the spread.

- **Join with a name.** A teammate opens the link, types a name and is signed in with a session, in the room a moment later.

- **Facilitator controls as function calls.** Adding stories, voting, revoting and saving an estimate call server functions straight from the page with `@rpc`. Each call checks the caller's seat, and another participant can take over as facilitator.

- **Estimates as a download.** The room exports each estimated story with its estimate, average and vote count as a CSV that opens cleanly in a spreadsheet.

- **Data from SQL files.** Migrations define the rooms and seed a demo room with five people and seven stories, four already estimated.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 19 tests pass. Every page works on desktop and phone.

## Seed data

There are no accounts: you join a room by typing a name. The demo seed
creates one room, **Checkout Squad · Sprint 42** at `/r/sprint42`, linked from
the home page. It has five people at the table (Priya Raman, Marcus Chen,
Sofia Alvarez, Dev Okafor and Hana Kim), four stories already estimated, one
story mid-vote with all five cards face down, and two stories queued.

Join with any name and your seat is the one still to vote. Click **Take over**
to become the facilitator, then reveal the cards, settle the estimate and
export the estimated stories as CSV.

**Demo:** [Sizingdeck](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509)

## License

MIT. See [LICENSE](LICENSE).
