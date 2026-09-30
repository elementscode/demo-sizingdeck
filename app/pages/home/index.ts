import { Request, Response, sql, session } from "@elements/app";
import html, { RoomLink } from "./template";

export default function route(req: Request, res: Response) {
  let myRooms: RoomLink[] = [];

  if (session.isLoggedIn()) {
    myRooms = sql<RoomLink>(`
      select r.id, r.code, r.name,
             (select count(*)::int from participants x where x.roomId = r.id) as people,
             (r.facilitatorId = ${session.getOrThrow("userId")}) as facilitating
        from rooms r
        join participants p on p.roomId = r.id
       where p.userId = ${session.getOrThrow("userId")}
       order by p.createdAt desc
    `).all();
  }

  // The seeded room, so a first visit has a table already mid-sprint to try.
  let demo = sql<RoomLink>(`
    select r.id, r.code, r.name,
           (select count(*)::int from participants x where x.roomId = r.id) as people,
           false as facilitating
      from rooms r
     where r.code = 'sprint42'
  `).first() ?? null;

  if (demo && myRooms.some((r) => r.id === demo!.id)) {
    demo = null;
  }

  return new html({ myRooms, demo });
}
