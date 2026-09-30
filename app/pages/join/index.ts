import { Request, Response, sql } from "@elements/app";
import { Room } from "#app/shared/services/poker";
import html from "./template";

export default function join(room: Room) {
  let people = sql<{ name: string }>(`
    select name from participants where roomId = ${room.id} order by createdAt
  `).all().map((p) => p.name);

  return new html({ room: { code: room.code, name: room.name }, people });
}
