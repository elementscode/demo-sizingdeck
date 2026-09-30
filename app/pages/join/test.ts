import { test, equal, session, sql } from "@elements/app";
import { joinRoom } from "./template";

test("join", () => {
  test("joining with a name seats you once", () => {
    let host = sql<{ id: string }>(`insert into users (name) values ('Priya') returning id`).firstOrThrow().id;
    let room = sql<{ id: string; code: string }>(`insert into rooms (name, facilitatorId) values ('Sprint 1', ${host}) returning id, code`).firstOrThrow();

    joinRoom(room.code, { name: " Jordan " });
    joinRoom(room.code, { name: "Jordan" });

    let seats = sql<{ name: string; userId: string }>(`select name, userId from participants where roomId = ${room.id}`).all();
    equal(seats.length, 1);
    equal(seats[0].name, "Jordan");
    equal(seats[0].userId, session.get("userId"));
  });
});
