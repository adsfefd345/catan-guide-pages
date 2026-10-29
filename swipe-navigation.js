window.CatanSwipe={mount(surface,go){
 let start=null;
 const interactive='a,button,input,textarea,select,[contenteditable=true],.board-rotation-control';
 function down(e){if(!e.isPrimary||e.button!==0||e.target.closest?.(interactive)){start=null;return;}start={id:e.pointerId,x:e.clientX,y:e.clientY,vertical:false};surface.setPointerCapture(e.pointerId);}
 function move(e){if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dy)>16&&Math.abs(dy)>Math.abs(dx))start.vertical=true;}
 function up(e){if(!start||e.pointerId!==start.id)return;const gesture=start;start=null;if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(!gesture.vertical&&Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.5){document.dispatchEvent(new Event('catan-page-swipe'));go(dx<0?1:-1);}}
 function cancel(){start=null;}
 function drag(e){if(!e.target.closest?.(interactive))e.preventDefault();}
 const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel,dragstart:drag};
 for(const [type,handler] of Object.entries(handlers))surface.addEventListener(type,handler);
 surface.classList.add('swipe-navigation');
 return()=>{for(const [type,handler] of Object.entries(handlers))surface.removeEventListener(type,handler);surface.classList.remove('swipe-navigation');start=null;};
}};
