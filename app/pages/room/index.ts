import { Request, Response, session, sql } from "@elements/app";
import { findRoomByCode, isParticipant, participants, rooms, stories, votes } from "#app/shared/services/poker";
import join from "#app/pages/join";
import html from "./template";

export default function route(req: Request, res: Response) {
  let room = findRoomByCode(req.params.code);

  let me = session.get("userId");
  if (!me || !isParticipant(room.id, me)) {
    return join(room);
  }

  // Your own card for the story on the table, the one face-down card you may see.
  let mine = sql<{ storyId: string; round: number; card: string }>(`
    select v.storyId, v.round, v.card
      from votes v
      join stories s on s.id = v.storyId and s.round = v.round
     where v.roomId = ${room.id}
       and v.storyId = ${room.currentStoryId}
       and v.userId = ${me}
  `).first() ?? { storyId: "", round: 0, card: "" };

  let host = req.headers.host ?? "localhost";
  let proto = req.headers["x-forwarded-proto"] ?? "http";

  return new html({
    roomRows: rooms.view({ id: room.id }),
    people: participants.view({ roomId: room.id }),
    stories: stories.view({ roomId: room.id }),
    votes: votes.view({ roomId: room.id }),
    me,
    mine,
    shareUrl: `${proto}://${host}/r/${room.code}`,
  });
}
