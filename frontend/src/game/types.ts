export type Action =
  "idle" | "walk" | "wave" | "bow" | "sit" | "incense" | "sweep" | "water" | "meditate" | "listen" | "eat" | "cook" | "wash" | "bell" | "seated" | "pray" | "prostrate";
export type Gathering = {active:boolean;upcoming:boolean;startsAt:number;endsAt:number;title:string;paragraph:string;sample:boolean};
export type Player = {
  id: string;
  displayName: string;
  avatar: "male" | "female";
  x: number;
  y: number;
  z: number;
  rotationY: number;
  action: Action;
  tray?: boolean;
  seat?: string;
  title?: string;
};
export type Guest = {
  id: string;
  display_name: string;
  avatar: "male" | "female";
};
export type ChatMessage = {
  id: string;
  playerId: string;
  name: string;
  text: string;
  at: number;
};
export type Social = {
  friends: { id: string; display_name: string; roomId: string | null }[];
  requests: { id: string; sender_id: string; display_name: string }[];
  sent: { receiver_id: string }[];
  blocks: { id: string; display_name: string }[];
};
