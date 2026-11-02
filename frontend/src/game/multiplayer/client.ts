import { Client, type Room } from "@colyseus/sdk";
import {maps,type MapId} from '../world';
export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw Error(data.error || "Không thể kết nối. Vui lòng thử lại.");
  return data;
}
// Matchmaking stays on the same origin; only WebSocket traffic uses /realtime.
class PagodaClient extends Client {
  protected buildEndpoint(room: any, options?: any) {
    return super
      .buildEndpoint(room, options)
      .replace(`${location.host}/`, `${location.host}/realtime/`);
  }
}
export const client = new PagodaClient(
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`,
);
export async function enterRoom(roomId?: string,mapId:MapId='courtyard'): Promise<Room> {
  const { ticket } = await api("ticket", {});
  return roomId
    ? client.joinById(roomId, { ticket })
    : client.joinOrCreate(maps[mapId].roomType, { ticket });
}
