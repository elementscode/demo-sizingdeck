![Sizingdeck, a planning poker app built with Elements: the Checkout Squad room just after a reveal, with six named cards face up, a 5.7 average, the spread from 3 to 8 and a bar per card.](POSTER_URL)

# Sizingdeck

> A demo app built with [Elements](https://elements.dev).

Join a room by link with just a name, vote face down while everyone sees who has voted, reveal with the average and spread, and export estimated stories as CSV.

**Demo:** [Sizingdeck](TBD)

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
