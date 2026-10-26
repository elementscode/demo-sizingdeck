![Planning poker with live reveals, built by Claude Code on Elements: the Checkout Squad room just after a reveal, with six named cards face up, a 5.7 average, the spread from 3 to 8 and a bar per card.](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509/poster?v=7b0f8e9612e6)

# Planning poker with live reveals, built by Claude Code on Elements

> Sizingdeck is a full-stack app built with Claude Code on Elements.

Rooms joined by link with a name, face-down votes, a reveal with the average and spread, and a CSV of estimated stories.

[Run this app on your machine](https://elements.dev/demos/01a0f3db-f5e3-7370-a51d-a7bacb64c509). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Sizingdeck needed rooms anyone can join from a link, cards that stay face down until the reveal, a table everyone sees change as people vote and a CSV of the results. Each of those is a part of Elements, so the agent spent its 18 minutes on the game itself.

- **A live table.** Rooms, participants, stories and votes are LiveTables, one view per room. When someone joins, votes or the facilitator moves to the next story, every open copy of the room updates.

- **Face-down cards.** A card reaches the browser only after the reveal, so everyone sees who has voted while the cards stay face down. The reveal shows the average and the spread.

- **Join with a name.** A teammate opens the link, types a name and is signed in with a session, in the room a moment later.

- **Facilitator controls as function calls.** Adding stories, voting, revoting and saving an estimate call server functions straight from the page with `@rpc`. Each call checks the caller's seat, and another participant can take over as facilitator.

- **Estimates as a download.** The room exports each estimated story with its estimate, average and vote count as a CSV that opens cleanly in a spreadsheet.

- **Data from SQL files.** Migrations define the rooms and seed a demo room with five people and seven stories, four already estimated.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
