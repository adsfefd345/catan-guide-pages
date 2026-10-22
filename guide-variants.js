(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CatanVariants=api;})(typeof window==='object'?window:globalThis,()=>{
  function select(slides, beginner=false){
    const groups=new Map();
    for(const slide of slides){if(!groups.has(slide.pageNumber))groups.set(slide.pageNumber,[]);groups.get(slide.pageNumber).push(slide);}
    return [...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([,group])=>group.find(s=>s.variant===(beginner?2:1))||group.find(s=>!s.variant)||group.find(s=>s.variant===1)||group[0]);
  }
  return {select};
});
