import { Request, Response, redirect, session, sql } from "@elements/app";
import { findRoomByCode, isParticipant } from "#app/shared/services/poker";

interface Row {
  title: string;
  url: string;
  estimate: string;
  average: number | null;
  voteCount: number;
  estimatedAt: Date;
}

export function csvField(value: string | number | null): string {
  let s = value === null ? "" : String(value);

  // A leading = + - @ makes a spreadsheet evaluate the cell as a formula.
  if (/^[=+\-@]/.test(s)) {
    s = `'${s}`;
  }

  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function estimatesCsv(rows: Row[]): string {
  let lines = [["Story", "Link", "Estimate", "Average vote", "Votes", "Estimated at"].join(",")];

  for (let r of rows) {
    lines.push([
      csvField(r.title),
      csvField(r.url),
      csvField(r.estimate),
      csvField(r.average),
      csvField(r.voteCount),
      csvField(r.estimatedAt.toISOString()),
    ].join(","));
  }

  return lines.join("\r\n") + "\r\n";
}

export default function estimates(req: Request, res: Response) {
  let room = findRoomByCode(req.params.code);

  // The export is for the people at the table; anyone else joins first.
  let me = session.get("userId");
  if (!me || !isParticipant(room.id, me)) {
    redirect(`/r/${room.code}`);
    return;
  }

  let rows = sql<Row>(`
    select title, url, estimate, average, voteCount, estimatedAt
      from stories
     where roomId = ${room.id}
       and status = 'estimated'
     order by estimatedAt, id
  `).all();

  let filename = `${room.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "room"}-estimates.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.end(estimatesCsv(rows));
}
