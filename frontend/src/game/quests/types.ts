export type QuestRequirement={key:string;target:number;unit:string};
export type QuestDefinition={id:string;number:number;category:string;title:string;description:string;reward:number;requirements:QuestRequirement[]};
export type FunTitle={id:string;name:string;merit:number};
export type QuestProfile={counts:Record<string,number>;completed:string[];merit:number;titleId:string|null;revision:number};
export type QuestData={catalog:QuestDefinition[];titles:FunTitle[];profile:QuestProfile};
