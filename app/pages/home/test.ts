import { test, assert, equal, session, sql } from "@elements/app";
import { createRoom } from "./template";

test("home", () => {
  test("creating a room seats you as facilitator", () => {
    let code = createRoom({ roomName: "  Payments · Sprint 18 ", yourName: "Sam" });

    let room = sql<{ id: string; name: string; facilitatorId: string }>(`select id, name, facilitatorId from rooms where code = ${code}`).firstOrThrow();
    equal(room.name, "Payments · Sprint 18");
    equal(session.get("userId"), room.facilitatorId);
    assert(!sql(`select 1 from participants where roomId = ${room.id} and userId = ${room.facilitatorId}`).empty(), "creator should be seated");
  });

  test("a room needs a name and yours", () => {
    let fields: string[] = [];

    try {
      createRoom({ roomName: " ", yourName: "" });
    } catch (err: any) {
      fields = Object.keys(err.errors ?? {}).sort();
    }

    equal(fields, ["roomName", "yourName"]);
  });
});
