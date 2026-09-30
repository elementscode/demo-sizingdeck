import { LiveTable, ForbiddenError, NotFoundError, session, sql } from "@elements/app";

export interface Room {
  id: string;
  createdAt: Date;
  code: string;
  name: string;
  facilitatorId: string;
  currentStoryId: string | null;
}

export interface Participant {
  id: string;
  createdAt: Date;
  roomId: string;
  userId: string;
  name: string;
}

export type StoryStatus = "pending" | "voting" | "revealed" | "estimated";

export interface Story {
  id: string;
  createdAt: Date;
  roomId: string;
  title: string;
  url: string;
  status: StoryStatus;
  round: number;
  estimate: string | null;
  average: number | null;
  voteCount: number;
  estimatedAt: Date | null;
}

export interface Vote {
  id: string;
  createdAt: Date;
  roomId: string;
  storyId: string;
  userId: string;
  round: number;
  // Null until the facilitator reveals: the server never sends a face-down card.
  card: string | null;
  revealed: boolean;
}

// Every write goes through an rpc in the room's services, which checks the
// caller's seat, and a trigger broadcasts it. Nothing writes through a view.
function readOnly(): never {
  throw new ForbiddenError("use the room's actions to change it");
}

export let rooms = new LiveTable<Room>({
  insert: readOnly,
  update: readOnly,
  delete: readOnly,
});

export let participants = new LiveTable<Participant>({
  insert: readOnly,
  update: readOnly,
  delete: readOnly,
});

export let stories = new LiveTable<Story>({
  insert: readOnly,
  update: readOnly,
  delete: readOnly,
});

export let votes = new LiveTable<Vote>({
  select: ({ roomId }) => sql<Vote>(`
    select id, createdAt, roomId, storyId, userId, round,
           case when revealed then card end as card,
           revealed
      from votes
     where roomId = ${roomId}
  `),
  insert: readOnly,
  update: readOnly,
  delete: readOnly,
});

export function findRoomByCode(code: string): Room {
  let room = sql<Room>(`
    select id, createdAt, code, name, facilitatorId, currentStoryId
      from rooms
     where code = ${code}
  `).first();

  if (!room) {
    throw new NotFoundError("That room does not exist.");
  }

  return room;
}

export function isParticipant(roomId: string, userId: string): boolean {
  return !sql(`select 1 from participants where roomId = ${roomId} and userId = ${userId}`).empty();
}

/** The caller's user id, once their seat in the room is confirmed. */
export function requireParticipant(roomId: string): string {
  session.isLoggedInOrThrow("Join the room first.");

  let userId = session.getOrThrow("userId");
  if (!isParticipant(roomId, userId)) {
    throw new ForbiddenError("Join the room first.");
  }

  return userId;
}

export function requireFacilitator(roomId: string): string {
  let userId = requireParticipant(roomId);

  let room = sql<{ facilitatorId: string }>(`select facilitatorId from rooms where id = ${roomId}`).firstOrThrow("room not found");
  if (room.facilitatorId !== userId) {
    throw new ForbiddenError("Only the facilitator can do that.");
  }

  return userId;
}
