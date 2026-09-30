import { sql, tx, ValidationError, FieldErrors } from "@elements/app";
import { DECK, POINTS, summarize } from "#app/shared/deck";
import { requireFacilitator, requireParticipant, Story } from "#app/shared/services/poker";

export interface StoryForm {
  title: string;
  url: string;
}

interface Current {
  id: string;
  status: Story["status"];
  round: number;
}

function currentStory(roomId: string): Current | undefined {
  return sql<Current>(`
    select s.id, s.status, s.round
      from rooms r
      join stories s on s.id = r.currentStoryId
     where r.id = ${roomId}
  `).first();
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (url.length === 0) {
    return "";
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    return new URL(url).toString();
  } catch {
    throw new ValidationError<StoryForm>({ url: ["That link doesn't look right."] });
  }
}

/** @rpc */
export function addStory(roomId: string, form: StoryForm) {
  requireFacilitator(roomId);

  let title = form.title.trim();
  if (title.length === 0) {
    throw new ValidationError<StoryForm>({ title: ["Give the story a title."] });
  }

  let url = normalizeUrl(form.url);

  tx(() => {
    let story = sql<{ id: string }>(`
      insert into stories (roomId, title, url)
           values (${roomId}, ${title}, ${url})
        returning id
    `).firstOrThrow();

    // An idle table starts on the first story it is given.
    if (!currentStory(roomId)) {
      startVoting(roomId, story.id);
    }
  });
}

function startVoting(roomId: string, storyId: string) {
  sql(`
    update stories
       set status = 'voting',
           round = round + 1,
           estimate = null,
           average = null,
           voteCount = 0,
           estimatedAt = null
     where id = ${storyId}
       and roomId = ${roomId}
  `);

  sql(`update rooms set currentStoryId = ${storyId} where id = ${roomId}`);
}

/** @rpc */
export function startStory(roomId: string, storyId: string) {
  requireFacilitator(roomId);

  tx(() => {
    sql(`select id from stories where id = ${storyId} and roomId = ${roomId}`).firstOrThrow("That story is not in this room.");

    let current = currentStory(roomId);
    if (current?.id === storyId) {
      return;
    }

    // A story left mid-vote goes back in the queue with its cards cleared.
    if (current && current.status !== "estimated") {
      sql(`delete from votes where storyId = ${current.id} and round = ${current.round}`);
      sql(`update stories set status = 'pending' where id = ${current.id}`);
    }

    startVoting(roomId, storyId);
  });
}

/** @rpc */
export function removeStory(roomId: string, storyId: string) {
  requireFacilitator(roomId);

  if (currentStory(roomId)?.id === storyId) {
    throw new ValidationError("Move to another story before removing this one.");
  }

  sql(`delete from stories where id = ${storyId} and roomId = ${roomId}`);
}

/** Pick a card, or pass null to take yours back. @rpc */
export function castVote(roomId: string, storyId: string, card: string | null) {
  let userId = requireParticipant(roomId);

  if (card !== null && !DECK.includes(card)) {
    throw new ValidationError("That card is not in the deck.");
  }

  let current = currentStory(roomId);
  if (!current || current.id !== storyId || current.status !== "voting") {
    throw new ValidationError("Voting on this story is closed.");
  }

  if (card === null) {
    sql(`delete from votes where storyId = ${storyId} and userId = ${userId} and round = ${current.round}`);
    return;
  }

  sql(`
    insert into votes (roomId, storyId, userId, round, card)
         values (${roomId}, ${storyId}, ${userId}, ${current.round}, ${card})
    on conflict (storyId, userId, round) do update set card = excluded.card
  `);
}

/** @rpc */
export function reveal(roomId: string) {
  requireFacilitator(roomId);

  tx(() => {
    let current = currentStory(roomId);
    if (!current || current.status !== "voting") {
      throw new ValidationError("There is nothing to reveal.");
    }

    let cast = sql(`select 1 from votes where storyId = ${current.id} and round = ${current.round}`).empty();
    if (cast) {
      throw new ValidationError("Wait for at least one card.");
    }

    sql(`update votes set revealed = true where storyId = ${current.id} and round = ${current.round}`);
    sql(`update stories set status = 'revealed' where id = ${current.id}`);
  });
}

/** @rpc */
export function revote(roomId: string) {
  requireFacilitator(roomId);

  tx(() => {
    let current = currentStory(roomId);
    if (!current || current.status === "estimated") {
      throw new ValidationError("There is no vote to restart.");
    }

    sql(`delete from votes where storyId = ${current.id} and round = ${current.round}`);
    sql(`update stories set status = 'voting', round = round + 1 where id = ${current.id}`);
  });
}

/** Settle the current story and move the table to the next one. @rpc */
export function saveEstimate(roomId: string, estimate: string) {
  requireFacilitator(roomId);

  if (!POINTS.includes(estimate)) {
    throw new ValidationError("Pick a point value for the estimate.");
  }

  tx(() => {
    let current = currentStory(roomId);
    if (!current || current.status !== "revealed") {
      throw new ValidationError("Reveal the cards before settling on an estimate.");
    }

    let cards = sql<{ card: string }>(`
      select card from votes where storyId = ${current.id} and round = ${current.round}
    `).all().map((v) => v.card);

    let summary = summarize(cards);

    sql(`
      update stories
         set status = 'estimated',
             estimate = ${estimate},
             average = ${summary.average},
             voteCount = ${cards.length},
             estimatedAt = now()
       where id = ${current.id}
    `);

    let next = sql<{ id: string }>(`
      select id from stories
       where roomId = ${roomId}
         and status = 'pending'
       order by createdAt, id
       limit 1
    `).first();

    if (next) {
      startVoting(roomId, next.id);
    } else {
      sql(`update rooms set currentStoryId = null where id = ${roomId}`);
    }
  });
}

/** @rpc */
export function claimFacilitator(roomId: string) {
  let userId = requireParticipant(roomId);

  sql(`update rooms set facilitatorId = ${userId} where id = ${roomId}`);
}

export type StoryErrors = FieldErrors<StoryForm>;
