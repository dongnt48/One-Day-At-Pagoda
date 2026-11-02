import { randomBytes } from "node:crypto";
import type { Guest } from "../db/store.js";
const tickets = new Map<string, { guest: Guest; expires: number }>();
export function issueTicket(guest: Guest) {
  for (const [key, t] of tickets)
    if (t.expires < Date.now()) tickets.delete(key);
  const ticket = randomBytes(24).toString("hex");
  tickets.set(ticket, { guest, expires: Date.now() + 30000 });
  return ticket;
}
export function consumeTicket(value: unknown) {
  if (typeof value !== "string") return;
  const t = tickets.get(value);
  tickets.delete(value);
  return t && t.expires > Date.now() ? t.guest : undefined;
}
