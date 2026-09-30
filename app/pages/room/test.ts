import { test, assert, equal, errorf, session, sql } from "@elements/app";
import { addStory, castVote, claimFacilitator, reveal, revote, saveEstimate, startStory } from "./services";

interface Fixture {
  roomId: string;
  priya: string;
  marcus: string;
  outsider: string;
}

function user(name: string): string {
  return sql<{ id: string }>(`insert into users (name) values (${name}) returning id`).firstOrThrow().id;
}

function setup(): Fixture {
  let priya = user("Priya");
  let marcus = user("Marcus");
  let outsider = user("Olive");

  let roomId = sql<{ id: string }>(`insert into rooms (name, facilitatorId) values ('Sprint 1', ${priya}) returning id`).firstOrThrow().id;
  sql(`insert into participants (roomId, userId, name) values (${roomId}, ${priya}, 'Priya'), (${roomId}, ${marcus}, 'Marcus')`);

  return { roomId, priya, marcus, outsider };
}

function as(userId: string) {
  if (session.isLoggedIn()) {
    session.logout();
  }

  session.login({ userId, userName: "someone" });
}

async function throws(fn: () => void | Promise<void>): Promise<string> {
  try {
    await fn();
  } catch (err: any) {
    return err.constructor?.name ?? "Error";
  }

  return "";
}

function room(roomId: string) {
  return sql<{ currentStoryId: string | null; facilitatorId: string }>(`select currentStoryId, facilitatorId from rooms where id = ${roomId}`).firstOrThrow();
}

function story(id: string) {
  return sql<{ status: string; estimate: string | null; average: number | null; voteCount: number; round: number }>(`
    select status, estimate, average, voteCount, round from stories where id = ${id}
  `).firstOrThrow();
}

test("room", async () => {
  test("the first story added starts voting", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "tracker.example.com/CHK-1" });
    addStory(f.roomId, { title: "Refunds", url: "" });

    let first = sql<{ id: string; url: string }>(`select id, url from stories where roomId = ${f.roomId} and title = 'Apple Pay'`).firstOrThrow();
    equal(first.url, "https://tracker.example.com/CHK-1");
    equal(room(f.roomId).currentStoryId, first.id);
    equal(story(first.id).status, "voting");
  });

  test("only the facilitator adds stories, only members vote", async () => {
    let f = setup();
    as(f.marcus);
    equal(await throws(() => addStory(f.roomId, { title: "x", url: "" })), "ForbiddenError");

    as(f.outsider);
    equal(await throws(() => castVote(f.roomId, "00000000-0000-0000-0000-000000000000", "5")), "ForbiddenError");
  });

  test("a card is face down until the reveal", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "" });
    let storyId = room(f.roomId).currentStoryId!;

    castVote(f.roomId, storyId, "8");
    as(f.marcus);
    castVote(f.roomId, storyId, "13");
    castVote(f.roomId, storyId, "5");

    let cards = sql<{ card: string; revealed: boolean }>(`select card, revealed from votes where storyId = ${storyId} order by card`).all();
    equal(cards.map((c) => c.card), ["5", "8"]);
    assert(cards.every((c) => !c.revealed), "cards should start face down");

    equal(await throws(() => reveal(f.roomId)), "ForbiddenError");

    as(f.priya);
    reveal(f.roomId);
    equal(story(storyId).status, "revealed");
    assert(sql(`select 1 from votes where storyId = ${storyId} and not revealed`).empty(), "every card should be up");

    as(f.marcus);
    equal(await throws(() => castVote(f.roomId, storyId, "3")), "ValidationError");
  });

  test("taking a card back removes the vote", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "" });
    let storyId = room(f.roomId).currentStoryId!;

    castVote(f.roomId, storyId, "8");
    castVote(f.roomId, storyId, null);
    assert(sql(`select 1 from votes where storyId = ${storyId}`).empty(), "vote should be gone");
    equal(await throws(() => reveal(f.roomId)), "ValidationError");
  });

  test("settling an estimate records it and moves to the next story", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "" });
    addStory(f.roomId, { title: "Refunds", url: "" });
    let storyId = room(f.roomId).currentStoryId!;

    castVote(f.roomId, storyId, "5");
    as(f.marcus);
    castVote(f.roomId, storyId, "8");
    as(f.priya);

    equal(await throws(() => saveEstimate(f.roomId, "8")), "ValidationError");
    reveal(f.roomId);
    equal(await throws(() => saveEstimate(f.roomId, "coffee")), "ValidationError");
    saveEstimate(f.roomId, "8");

    let done = story(storyId);
    equal(done.status, "estimated");
    equal(done.estimate, "8");
    equal(done.average, 6.5);
    equal(done.voteCount, 2);

    let next = sql<{ id: string }>(`select id from stories where roomId = ${f.roomId} and title = 'Refunds'`).firstOrThrow().id;
    equal(room(f.roomId).currentStoryId, next);
    equal(story(next).status, "voting");
  });

  test("a revote clears the cards and starts a new round", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "" });
    let storyId = room(f.roomId).currentStoryId!;
    let round = story(storyId).round;

    castVote(f.roomId, storyId, "5");
    reveal(f.roomId);
    revote(f.roomId);

    equal(story(storyId).status, "voting");
    equal(story(storyId).round, round + 1);
    assert(sql(`select 1 from votes where storyId = ${storyId}`).empty(), "cards should be cleared");
  });

  test("switching stories puts the old one back in the queue", async () => {
    let f = setup();
    as(f.priya);
    addStory(f.roomId, { title: "Apple Pay", url: "" });
    addStory(f.roomId, { title: "Refunds", url: "" });
    let first = room(f.roomId).currentStoryId!;
    let second = sql<{ id: string }>(`select id from stories where roomId = ${f.roomId} and title = 'Refunds'`).firstOrThrow().id;

    castVote(f.roomId, first, "5");
    startStory(f.roomId, second);

    equal(story(first).status, "pending");
    equal(room(f.roomId).currentStoryId, second);
    assert(sql(`select 1 from votes where storyId = ${first}`).empty(), "the old story's cards should be cleared");
  });

  test("any member can take over facilitating", async () => {
    let f = setup();
    as(f.marcus);
    claimFacilitator(f.roomId);
    equal(room(f.roomId).facilitatorId, f.marcus);

    as(f.outsider);
    if (await throws(() => claimFacilitator(f.roomId)) !== "ForbiddenError") {
      errorf("an outsider should not take over the room");
    }
  });
});
