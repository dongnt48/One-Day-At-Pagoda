type ViewportMetrics={innerHeight:number;visualHeight:number;outerHeight:number;screenY:number;availableTop:number;availableHeight:number;touch:boolean};

export function visibleGameHeight(m:ViewportMetrics):number {
 let height=Math.min(m.innerHeight,m.visualHeight>0?m.visualHeight:m.innerHeight);
 // A desktop window may extend below the OS work area even though innerHeight
 // still includes that invisible portion. Keep the bottom controls on screen.
 if(!m.touch&&m.availableHeight>0){
  const chrome=Math.max(0,m.outerHeight-m.innerHeight);
  const available=m.availableTop+m.availableHeight-(m.screenY+chrome);
  if(available>0)height=Math.min(height,available);
 }
 return Math.max(1,Math.floor(height));
}

export function fitGameViewport(element:HTMLElement):()=>void {
 let previous=0;
 const update=()=>{
  const screen=window.screen as Screen&{availTop?:number};
  const height=visibleGameHeight({innerHeight:window.innerHeight,visualHeight:window.visualViewport?.height??window.innerHeight,outerHeight:window.outerHeight,screenY:window.screenY,availableTop:screen.availTop??0,availableHeight:screen.availHeight,touch:window.matchMedia('(pointer:coarse)').matches});
  if(height!==previous){previous=height;element.style.setProperty('--game-view-height',`${height}px`);}
 };
 update();
 window.addEventListener('resize',update);window.addEventListener('focus',update);
 window.visualViewport?.addEventListener('resize',update);
 // Moving a desktop window between monitors does not always emit resize.
 const timer=window.setInterval(update,1000);
 return ()=>{window.clearInterval(timer);window.removeEventListener('resize',update);window.removeEventListener('focus',update);window.visualViewport?.removeEventListener('resize',update);element.style.removeProperty('--game-view-height');};
}
