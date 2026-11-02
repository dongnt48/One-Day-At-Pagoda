const names=['An Nhiên','Bình An','Thanh Tâm','Tâm An','Minh An','An Vui','Thiện Tâm','Thanh An','Tâm Bình','An Lạc','Nhẹ Mây','Sen Nhỏ'];

export function generateGuestName(random:()=>number=Math.random):string {
 const name=names[Math.floor(random()*names.length)];
 return `${name} ${100+Math.floor(random()*900)}`;
}
