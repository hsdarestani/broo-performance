export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const labels=['BMW REVEAL','VEHICLE DIAGNOSTIC','OPEN THE SYSTEM','ENGINE CORE','HARDWARE FLOW','REASSEMBLE + VALIDATE','PROJECT START'];
export const systemLabels=['VEHICLE LINK // READY','VEHICLE DATA // READING','BODY NODES // OPENING','ENGINE CORE // ACTIVE','AIRFLOW MAP // LIVE','INSORIC DATA // VERIFIED','PROJECT CHANNEL // OPEN'];
export const giantWords=[['BEYOND','STANDARD'],['READ','THE CAR'],['OPEN','THE SYSTEM'],['ENGINE','CORE'],['AIR IN','POWER OUT'],['BUILD','PROVE'],['YOUR','PROJECT']];
export const carUid=matchMedia('(max-width:820px)').matches?'25d5b4f6d13e4217afa09bbf89f8d993':'3fdc4ab04e384ec5bdc26eed6700517f';
export const engineUid='175a64f53ad948229de4ae8b653c45da';
export const cameraKeys=[
 {yaw:-.48,pitch:.98,radius:1.08,fov:38},{yaw:-.10,pitch:.80,radius:.84,fov:30},
 {yaw:.35,pitch:.86,radius:.92,fov:31},{yaw:.76,pitch:.82,radius:.78,fov:28},
 {yaw:1.34,pitch:.90,radius:.88,fov:31},{yaw:2.35,pitch:1.02,radius:1.03,fov:36},
 {yaw:3.15,pitch:.98,radius:1.12,fov:39}
];
