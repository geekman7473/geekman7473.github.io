(function(){
  var root = document.getElementById('craps-flow');
  if(!root) return;
  root.innerHTML =
    '<div class="craps-flow__bar">Craps decision tree (interactive)</div>'+
    '<div class="craps-flow__panel">'+
      '<div class="craps-flow__controls">'+
        '<button type="button" data-act="fit">Fit</button>'+
        '<button type="button" data-act="in">Zoom in</button>'+
        '<button type="button" data-act="out">Zoom out</button>'+
        '<button type="button" data-act="collapse">Collapse all</button>'+
        '<span class="craps-flow__hint">click a node to expand &middot; drag to pan &middot; scroll to zoom</span>'+
      '</div>'+
      '<svg class="craps-flow__svg" xmlns="http://www.w3.org/2000/svg"><g class="craps-flow__view"></g></svg>'+
    '</div>';
  var NS='http://www.w3.org/2000/svg';
  var svg=root.querySelector('.craps-flow__svg');
  var view=root.querySelector('.craps-flow__view');
  var NODE_W=196, NODE_H=62, X_GAP=234, Y_GAP=80;
  var COL={root:'#000000',point:'#000080',win:'#0a7d28',lose:'#9e1b1b',refund:'#b8860b',neutral:'#5f5f5f'};
  var WAYS={4:3,5:4,6:5,8:5,9:4,10:3};
  var idc=0, byId={};
  function N(o){ o.id='n'+(idc++); if(o.expanded===undefined) o.expanded=false; byId[o.id]=o; return o; }
  function rollKids(p,k){
    var w=WAYS[p], nth=30-w;
    var hit=N({type:'win',title:'Roll '+p,branch:w+'/36 · WIN ×4',p:w/36,mult:4});
    var sev=N({type:'lose',title:'Roll 7',branch:'6/36 · LOSE',p:6/36,mult:0});
    var nei;
    if(k<3){ nei=N({type:'neutral',title:'Roll anything else',branch:nth+'/36 · roll '+(k+1),p:nth/36,children:rollKids(p,k+1)}); }
    else { nei=N({type:'refund',title:'Roll anything else',branch:nth+'/36 · REFUND ×1',p:nth/36,mult:1}); }
    return [hit,sev,nei];
  }
  function pointNode(p){ return N({type:'point',title:'Roll '+p,branch:'comes up '+WAYS[p]+'/36',p:WAYS[p]/24,children:rollKids(p,1)}); }
  var tree=N({type:'root',title:'COME-OUT ROLL',branch:'roll two dice',p:1,expanded:true,children:[
    N({type:'win',title:'Roll 7 or 11',branch:'8/36 · WIN ×2',p:8/36,mult:2}),
    N({type:'lose',title:'Roll 2 / 3 / 12',branch:'4/36 · LOSE',p:4/36,mult:0}),
    N({type:'point',title:'Roll anything else',branch:'24/36 of come-outs',p:24/36,children:[4,5,6,8,9,10].map(pointNode)})
  ]});
  function expandable(n){ return n.children && n.children.length>0; }
  function stats(){ (function rec(n,pr){ n._reach=pr*n.p;
    if(n.children&&n.children.length){ n.children.forEach(function(c){rec(c,n._reach);}); n._ev=n.children.reduce(function(s,c){return s+c._ev;},0); }
    else { n._ev=n._reach*(n.mult||0); } })(tree,1); }

  function layout(){
    var leaf=0;
    (function rec(n,d){
      n._x=d*X_GAP;
      var kids=(n.expanded&&n.children&&n.children.length)?n.children:null;
      if(!kids){ n._y=leaf*Y_GAP; leaf++; }
      else { kids.forEach(function(k){rec(k,d+1);}); n._y=(kids[0]._y+kids[kids.length-1]._y)/2; }
    })(tree,0);
  }
  function eachVisible(cb){
    (function rec(n,parent){ cb(n,parent); if(n.expanded&&n.children) n.children.forEach(function(c){rec(c,n);}); })(tree,null);
  }
  function el(tag,attrs){ var e=document.createElementNS(NS,tag); for(var k in attrs) e.setAttribute(k,attrs[k]); return e; }

  function render(){
    stats();
    layout();
    while(view.firstChild) view.removeChild(view.firstChild);
    eachVisible(function(n,parent){
      if(!parent) return;
      var x1=parent._x+NODE_W, y1=parent._y+NODE_H/2, x2=n._x, y2=n._y+NODE_H/2, mx=(x1+x2)/2;
      view.appendChild(el('path',{'class':'cf-edge',d:'M'+x1+' '+y1+' C '+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2}));
    });
    eachVisible(function(n){
      var g=el('g',{'class':'cf-node'+(expandable(n)?' cf-expandable':''),transform:'translate('+n._x+','+n._y+')','data-id':n.id});
      g.appendChild(el('rect',{width:NODE_W,height:NODE_H,rx:6,ry:6,fill:COL[n.type]||'#444',stroke:'#000','stroke-width':1.5}));
      var t1=el('text',{'class':'cf-title',x:12,y:18}); t1.textContent=n.title; g.appendChild(t1);
      var t2=el('text',{'class':'cf-detail',x:12,y:34}); t2.textContent=n.branch; g.appendChild(t2);
      var t3=el('text',{'class':'cf-cum',x:12,y:50}); t3.textContent='reach '+(n._reach*100).toFixed(2)+'% · EV +'+n._ev.toFixed(4); g.appendChild(t3);
      if(expandable(n)){
        g.appendChild(el('rect',{'class':'cf-toggle',x:NODE_W-18,y:5,width:14,height:14,rx:2,ry:2}));
        var tt=el('text',{'class':'cf-toggle-txt',x:NODE_W-11,y:16}); tt.textContent=n.expanded?'−':'+'; g.appendChild(tt);
      }
      view.appendChild(g);
    });
  }

  var tx=0, ty=0, scale=1;
  function apply(){ view.setAttribute('transform','translate('+tx+','+ty+') scale('+scale+')'); }
  function fit(){
    var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    eachVisible(function(n){ minX=Math.min(minX,n._x); minY=Math.min(minY,n._y);
      maxX=Math.max(maxX,n._x+NODE_W); maxY=Math.max(maxY,n._y+NODE_H); });
    var cw=maxX-minX, ch=maxY-minY, vw=svg.clientWidth||640, vh=svg.clientHeight||520, P=24;
    scale=Math.max(0.3,Math.min((vw-2*P)/cw,(vh-2*P)/ch,1.4));
    tx=P-minX*scale+((vw-2*P)-cw*scale)/2;
    ty=P-minY*scale+((vh-2*P)-ch*scale)/2;
    apply();
  }
  function zoomAt(cx,cy,f){
    var ns=Math.max(0.3,Math.min(scale*f,2.5));
    tx=cx-(cx-tx)*(ns/scale); ty=cy-(cy-ty)*(ns/scale); scale=ns; apply();
  }

  svg.addEventListener('wheel',function(e){ e.preventDefault(); zoomAt(e.offsetX,e.offsetY,e.deltaY<0?1.12:0.89); },{passive:false});
  var down=false,moved=0,lx=0,ly=0,dt=null;
  svg.addEventListener('pointerdown',function(e){ down=true; moved=0; lx=e.clientX; ly=e.clientY;
    dt=e.target; svg.classList.add('grabbing'); svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove',function(e){ if(!down) return; var dx=e.clientX-lx, dy=e.clientY-ly;
    tx+=dx; ty+=dy; moved+=Math.abs(dx)+Math.abs(dy); lx=e.clientX; ly=e.clientY; apply(); });
  svg.addEventListener('pointerup',function(e){ down=false; svg.classList.remove('grabbing');
    if(moved<5 && dt){ var g=dt.closest&&dt.closest('[data-id]'); if(g){ var n=byId[g.getAttribute('data-id')];
      if(n&&expandable(n)){ n.expanded=!n.expanded; render(); } } } });

  root.querySelector('[data-act="fit"]').addEventListener('click',fit);
  root.querySelector('[data-act="in"]').addEventListener('click',function(){ zoomAt(svg.clientWidth/2,svg.clientHeight/2,1.2); });
  root.querySelector('[data-act="out"]').addEventListener('click',function(){ zoomAt(svg.clientWidth/2,svg.clientHeight/2,0.8); });
  root.querySelector('[data-act="collapse"]').addEventListener('click',function(){
    Object.keys(byId).forEach(function(k){ byId[k].expanded=false; }); tree.expanded=true; render(); fit(); });

  render();
  requestAnimationFrame(fit);
})();
