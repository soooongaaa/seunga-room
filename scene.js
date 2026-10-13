import * as THREE from './assets/three.module.js';
import { createNpochamu } from './npochamu.js?v=4';

export function createRoom({canvas,shell,onSelect,onDoor,onProject,experiences,collected}) {
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  const camera=new THREE.OrthographicCamera(-8,8,6,-6,.1,100);
  const look=new THREE.Vector3(0,1.1,0), baseCamera=new THREE.Vector3(11,12,17), alternateCamera=new THREE.Vector3(14,11,12);
  camera.position.copy(baseCamera);camera.lookAt(look);
  const palette={cream:0xc1eafa,white:0xffffff,wood:0x88c7e6,blue:0x27b6e0,dark:0x17385f,yellow:0xffcf3d,pink:0xff91ad,green:0x91d69e,lilac:0xb5a0eb};
  const mats=new Map();
  function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.68}));return mats.get(color);}
  function addMesh(geometry,color,x,y,z,parent=scene){const mesh=new THREE.Mesh(geometry,typeof color==='object'?color:material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function roundedGeometry(w,h,d,r=.05){
    const s=new THREE.Shape(),x=-w/2,y=-h/2;const radius=Math.min(r,w/3,h/3,d/3);
    s.moveTo(x+radius,y);s.lineTo(x+w-radius,y);s.quadraticCurveTo(x+w,y,x+w,y+radius);s.lineTo(x+w,y+h-radius);s.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);s.lineTo(x+radius,y+h);s.quadraticCurveTo(x,y+h,x,y+h-radius);s.lineTo(x,y+radius);s.quadraticCurveTo(x,y,x+radius,y);
    const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*radius),bevelEnabled:true,bevelThickness:radius,bevelSize:radius,bevelSegments:3,steps:1,curveSegments:4});g.translate(0,0,-d/2+radius);return g;
  }
  function box(w,h,d,color,x,y,z,parent=scene,r=.04){return addMesh(roundedGeometry(w,h,d,r),color,x,y,z,parent);}
  const sphereGeo=new THREE.SphereGeometry(1,24,18);
  function ball(x,y,z,sx,sy,sz,color,parent=scene){const mesh=addMesh(sphereGeo,color,x,y,z,parent);mesh.scale.set(sx,sy,sz);return mesh;}
  function cylinder(radius,h,color,x,y,z,parent=scene){return addMesh(new THREE.CylinderGeometry(radius,radius,h,32),color,x,y,z,parent);}
  function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
  function plane(w,h,map,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function line(points,color,parent=scene){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));parent.add(l);return l;}
  function textMap(text,color='#5b735c',bg='#fff9e8',size=42){return texture((ctx,w,h)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${size}px sans-serif`;text.split('\n').forEach((t,i,a)=>ctx.fillText(t,w/2,h/2+(i-(a.length-1)/2)*size*1.4));});}
  function flower(x,y,z,r=.15,parent=scene,color=palette.blue){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(Math.sin(a)*r*.6,Math.cos(a)*r*.6,0,r*.5,r*.5,r*.28,color,g);}ball(0,0,r*.18,r*.37,r*.37,r*.28,palette.yellow,g);return g;}
  const ambient=new THREE.HemisphereLight(0xffffff,0x99bbda,1.6);scene.add(ambient);
  const sunlight=new THREE.DirectionalLight(0xffffff,2.6);sunlight.position.set(1,10,6);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);Object.assign(sunlight.shadow.camera,{left:-9,right:9,top:8,bottom:-8,near:1,far:30});sunlight.shadow.normalBias=.035;sunlight.shadow.bias=-.00015;sunlight.shadow.radius=4;scene.add(sunlight);
  const fill=new THREE.DirectionalLight(0xd5eefa,.8);fill.position.set(-6,6,-3);scene.add(fill);

  // An open dollhouse, with a warm wooden platform and two cutaway walls.
  box(10,.4,8,palette.wood,0,-.25,0,scene,.14);
  box(9.8,.1,7.8,0xe5f1fc,0,-.01,0,scene,.04);
  for(let i=-4;i<5;i++){box(.013,.012,7.7,0xbdd7ef,i+.05,.05,0,scene,.003);}
  for(let z=-3;z<4;z+=1.9){for(let x=-4;x<5;x+=2){box(.016,.01,.17,0xbdd7ef,x+.4,.056,z,scene,.003);}}
  box(10,4.25,.2,palette.cream,0,2.08,-3.91,scene,.07);
  box(.2,4.25,8,palette.cream,-4.91,2.08,0,scene,.07);
  box(9.8,.15,.1,0x7dbde0,0,.13,-3.75);
  box(.1,.15,7.8,0x7dbde0,-4.75,.13,0);
  box(10,.1,.3,0xffffff,0,4.23,-3.9);
  box(.3,.1,8,0xffffff,-4.9,4.23,0);

  // Window and soft yellow curtains.
  box(2.1,1.55,.1,0xffffff,-3.1,2.75,-3.72);
  const sky=texture((ctx,w,h)=>{const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#53c6f0');grad.addColorStop(1,'#d2f2ff');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fffbeb';[[100,130,90],[350,250,110]].forEach(([x,y,r])=>{ctx.beginPath();ctx.ellipse(x,y,r,r*.3,0,0,Math.PI*2);ctx.fill();});});
  plane(1.9,1.35,sky,-3.1,2.75,-3.65);
  box(.075,1.5,.12,palette.white,-3.1,2.75,-3.57);box(2,.075,.12,palette.white,-3.1,2.75,-3.57);
  box(2.25,.13,.35,palette.white,-3.1,1.96,-3.53);
  for(const side of [-1,1])for(let i=0;i<3;i++){const curtain=cylinder(.105,1.72,0xffdb55,-3.1+side*(1.04+i*.075),2.77,-3.42);curtain.scale.z=.8;}
  box(2.5,.06,.06,palette.wood,-3.1,3.68,-3.4);

  // The left shelf: notebooks, books and a tiny plant.
  box(.55,2.9,1.9,0x8acbea,-4.5,1.45,-2.15);
  box(.08,2.7,1.7,palette.cream,-4.16,1.5,-2.15);
  for(const y of [.25,1.05,1.87,2.85])box(.66,.11,1.95,palette.wood,-4.45,y,-2.15);
  const bookColors=[palette.lilac,palette.blue,palette.yellow,palette.pink,palette.green];
  for(let i=0;i<6;i++)box(.39,.52+i%2*.11,.16,bookColors[i%5],-4.03,.58,-2.8+i*.21);
  for(let i=0;i<4;i++)box(.39,.58-i%2*.1,.18,bookColors[(i+2)%5],-4.03,2.18,-2.75+i*.25);
  const researchGroup=new THREE.Group();researchGroup.position.set(-3.96,1.45,-1.6);researchGroup.rotation.y=Math.PI/2;scene.add(researchGroup);
  const notebook=box(.58,.7,.16,palette.lilac,0,0,0,researchGroup);
  plane(.32,.35,textMap('PROOF\nWEAVE','#746287','#f3eadf',65),0,.02,.1,researchGroup);
  for(let y=-.25;y<.3;y+=.13)box(.11,.025,.06,0x8e7c95,-.28,y,.1,researchGroup);

  // Bed and side table, with the phone full of little stories.
  box(1.8,.42,2.8,palette.wood,-3.44,.35,1.25,scene,.08);
  box(1.76,.3,2.65,palette.white,-3.44,.7,1.25,scene,.14);
  box(1.83,.18,2.08,palette.blue,-3.44,.91,1.54,scene,.12);
  box(1.84,.92,.14,palette.wood,-3.44,.82,-.18,scene,.12);
  box(1.26,.22,.57,0xffffff,-3.44,.98,.15,scene,.13);
  for(let x=-4.15;x<-2.7;x+=.35)box(.018,.017,1.83,0xc2efff,x,1.016,1.6,scene,.005);
  for(let z=.75;z<2.5;z+=.34)box(1.74,.017,.018,0xc2efff,-3.44,1.016,z,scene,.005);
  box(.75,.12,.75,palette.wood,-1.96,.83,2.13,scene,.07);
  box(.6,.76,.6,0xffe46b,-1.96,.4,2.13,scene,.04);
  box(.46,.38,.06,palette.cream,-1.96,.49,2.46);ball(-1.96,.5,2.51,.035,.035,.02,palette.yellow);
  const phoneGroup=new THREE.Group();phoneGroup.position.set(-1.96,.96,2.13);phoneGroup.rotation.x=-Math.PI/2+.14;phoneGroup.rotation.z=-.3;scene.add(phoneGroup);
  box(.3,.53,.055,0x29addc,0,0,0,phoneGroup,.03);
  const phoneMap=texture((ctx,w,h)=>{ctx.fillStyle='#fff6dd';ctx.fillRect(0,0,w,h);ctx.fillStyle='#b1d4d5';ctx.fillRect(45,90,420,140);ctx.fillStyle='#ecc576';ctx.beginPath();ctx.arc(250,160,50,0,Math.PI*2);ctx.fill();ctx.fillStyle='#94b7ae';for(let i=0;i<3;i++)ctx.fillRect(50,290+i*50,350-i*50,17);});
  plane(.25,.43,phoneMap,0,.01,.034,phoneGroup);

  // A generous back desk where both years of work live.
  box(5.1,.19,1.13,0xffffff,-.94,1.29,-2.51,scene,.07);
  for(const x of [-3.25,1.35])for(const z of [-2.94,-2.08])box(.12,1.25,.12,palette.wood,x,.61,z);
  box(1.08,.81,.06,0x43bbe3,-2.7,1.94,-2.67,scene,.07);
  const focusMap=texture((ctx,w,h)=>{ctx.fillStyle='#f8f9e9';ctx.fillRect(0,0,w,h);ctx.fillStyle='#526d61';ctx.font='bold 37px sans-serif';ctx.fillText('FocusAI',36,66);ctx.fillStyle='#d6e2d9';ctx.fillRect(32,100,448,1);const heights=[90,140,115,190,165,210];heights.forEach((v,i)=>{ctx.fillStyle=i===5?'#ecc269':'#9bbfae';ctx.fillRect(40+i*73,370-v,45,v);});ctx.fillStyle='#9eaa90';ctx.font='24px sans-serif';ctx.fillText('FOCUS / GROW / CONNECT',35,440);});
  plane(.94,.66,focusMap,-2.7,1.94,-2.629);box(.13,.3,.13,0x44b8df,-2.7,1.5,-2.64);box(.55,.04,.3,0x44b8df,-2.7,1.39,-2.58);
  box(.86,.035,.27,palette.white,-2.7,1.41,-2.13,scene,.02);
  for(let x=-3.03;x<-2.4;x+=.105)for(let z=-2.2;z<-2.02;z+=.075)box(.07,.008,.04,0x96cdea,x,1.432,z,scene,.005);
  const laptopGroup=new THREE.Group();laptopGroup.position.set(-.95,1.42,-2.27);laptopGroup.rotation.y=.13;scene.add(laptopGroup);
  box(.83,.05,.55,palette.green,0,0,0,laptopGroup);box(.83,.55,.05,0x76c698,0,.29,-.26,laptopGroup,.035);
  const codeMap=texture((ctx,w,h)=>{ctx.fillStyle='#536b5d';ctx.fillRect(0,0,w,h);const colors=['#dfc988','#afcfd4','#c1b5d5'];for(let i=0;i<9;i++){ctx.fillStyle=colors[i%3];ctx.fillRect(38+(i%3)*28,40+i*47,130+(i%4)*50,12);} });
  plane(.71,.43,codeMap,0,.3,-.227,laptopGroup);box(.26,.008,.13,0xc5eeda,0,.032,.1,laptopGroup);
  // A chair and a stack of notes give the room signs of life.
  box(.83,.14,.7,palette.blue,-.9,.71,-.93,scene,.09);box(.85,.66,.12,palette.blue,-.9,1.14,-.57,scene,.13);
  for(const x of [-1.2,-.6])for(const z of [-1.16,-.7])box(.07,.65,.07,palette.wood,x,.33,z);
  box(.5,.055,.44,palette.pink,.34,1.43,-2.5);box(.51,.05,.43,palette.white,.33,1.49,-2.5);box(.5,.06,.43,palette.yellow,.31,1.55,-2.5);
  const mug=cylinder(.14,.23,palette.blue,.93,1.5,-2.51);const handle=addMesh(new THREE.TorusGeometry(.095,.026,8,20),palette.blue,1.1,1.5,-2.51);handle.rotation.y=Math.PI/2;

  // Pinboard, with the festival pass and IR memories.
  box(1.95,1.14,.12,palette.wood,.2,2.96,-3.7,scene,.05);box(1.79,.99,.08,0xffe394,.2,2.96,-3.61);
  const passGroup=new THREE.Group();passGroup.position.set(-.22,2.84,-3.51);passGroup.rotation.z=.1;scene.add(passGroup);
  box(.57,.64,.025,palette.white,0,0,0,passGroup);
  plane(.49,.54,textMap('GAMA\nRACE','#738a70','#e6b5a6',72),0,0,.018,passGroup);ball(0,.3,.04,.04,.04,.015,palette.pink,passGroup);
  plane(.56,.44,textMap('IR\nNEXT DREAM','#7b8763','#fff4c9',52),.61,3.15,-3.51).rotation.z=-.12;
  plane(.4,.33,textMap('2026','#809785','#e8efdd',70),.64,2.72,-3.51).rotation.z=.1;

  // CARELINK corner, a tablet, interview notebook and a backpack.
  box(1.65,.14,1.1,palette.wood,3.25,1.19,-.93,scene,.07);
  for(const x of [2.59,3.91])for(const z of [-1.33,-.54])box(.095,1.14,.095,palette.wood,x,.6,z);
  const tabletGroup=new THREE.Group();tabletGroup.position.set(3.05,1.57,-1.05);tabletGroup.rotation.y=-.2;scene.add(tabletGroup);
  box(.68,.82,.07,palette.blue,0,0,0,tabletGroup,.06);
  const careMap=texture((ctx,w,h)=>{ctx.fillStyle='#fff9e9';ctx.fillRect(0,0,w,h);ctx.fillStyle='#648c84';ctx.font='bold 44px sans-serif';ctx.fillText('CARELINK',37,78);ctx.fillStyle='#bad5cf';ctx.fillRect(35,105,442,142);ctx.fillStyle='#f0c56d';ctx.beginPath();ctx.arc(253,170,44,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a7bda7';for(let i=0;i<3;i++){ctx.fillRect(45,290+i*58,36,36);ctx.fillRect(110,295+i*58,315-i*30,13);ctx.fillStyle='#a7bda7';}});
  plane(.57,.68,careMap,0,.02,.044,tabletGroup);
  box(.49,.055,.63,palette.lilac,3.65,1.31,-.66);plane(.35,.42,textMap('INTERVIEW','#82708b','#f6eee1',50),3.65,1.35,-.66).rotation.x=-Math.PI/2;
  box(.56,.06,.18,0xffffff,2.8,1.28,-.43);
  const bag=makeBag(2.75,.5,.15,scene);bag.rotation.y=-.2;
  function makeBag(x,y,z,parent){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);box(.67,.73,.36,palette.yellow,0,0,0,g,.11);box(.42,.28,.12,0xe5b85d,0,-.1,.2,g,.07);const loop=addMesh(new THREE.TorusGeometry(.15,.028,8,20,Math.PI),0xccad66,0,.4,0,g);box(.18,.13,.04,palette.blue,0,.07,.23,g);flower(.19,-.18,.275,.07,g);return g;}
  function trophy(x,y,z,year){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);box(.43,.14,.3,0x9f8261,0,.07,0,g);box(.33,.04,.04,0xe9cf8b,0,.08,.17,g);plane(.29,.12,textMap(year,'#7b6c49','#e9cf8b',95),0,.085,.2,g);cylinder(.07,.2,0xddb253,0,.23,0,g);const bowl=addMesh(new THREE.CylinderGeometry(.21,.075,.3,24),0xf4cc6c,0,.45,0,g);for(const s of [-1,1]){const h=addMesh(new THREE.TorusGeometry(.12,.03,8,20),0xe7bd5c,s*.19,.44,0,g);h.scale.y=1.15;}ball(0,.625,0,.065,.065,.065,0xf9d67e,g);return g;}
  const focusTrophy=trophy(-1.78,1.37,-2.84,'2025');
  box(1.6,.82,.77,palette.cream,3.29,.52,-2.83,scene,.07);
  box(.73,.62,.06,0x64c6e9,2.88,.51,-2.405);box(.73,.62,.06,0x64c6e9,3.69,.51,-2.405);
  ball(3.15,.54,-2.36,.035,.035,.02,palette.yellow);ball(3.43,.54,-2.36,.035,.035,.02,palette.yellow);
  const careTrophy=trophy(3.35,.95,-2.85,'2026');
  plane(.53,.27,textMap('KGU','#7d987a','#eef1d8',100),2.82,1.15,-2.44);

  // A flower rug, plants, a wall clock, and the line between the two years.
  const rug=cylinder(1.65,.025,0xffcf3d,.3,.071,1.15);rug.scale.z=.73;
  for(let i=0;i<10;i++){const a=i*Math.PI/5;const r=cylinder(.38,.025,0xffcf3d,.3+Math.cos(a)*1.44,.072,1.15+Math.sin(a)*1.0);r.scale.z=.75;}
  const rugCenter=cylinder(1.12,.029,0xffe883,.3,.077,1.15);rugCenter.scale.z=.75;
  function plant(x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);scene.add(g);addMesh(new THREE.CylinderGeometry(.2,.14,.32,24),0xff9fbc,0,.16,0,g);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=ball(Math.sin(a)*.18,.52+i%2*.08,Math.cos(a)*.18,.08,.24,.1,0x68c28b,g);leaf.rotation.z=-Math.sin(a)*.45;}return g;}
  plant(-4.08,2.91,-2.27,.8);plant(4.1,.02,1.8,1.25);
  const clock=addMesh(new THREE.CylinderGeometry(.29,.29,.08,32),palette.white,1.65,3.43,-3.72);clock.rotation.x=Math.PI/2;
  plane(.44,.44,texture((ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.strokeStyle='#93a68b';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(256,115);ctx.lineTo(256,256);ctx.lineTo(340,300);ctx.stroke();ctx.fillStyle='#ecc579';ctx.beginPath();ctx.arc(256,256,17,0,Math.PI*2);ctx.fill();}),1.65,3.43,-3.65);
  const pathDots=[],pathLines=[];
  const pathPositions=[[-1.7,3.61,-3.65],[-1.25,3.39,-3.65],[-.72,3.66,-3.65],[.0,3.69,-3.65],[.7,3.72,-3.65],[1.38,3.86,-3.65]];
  pathPositions.forEach((p,i)=>{pathDots.push(ball(...p,.055,.055,.045,0xd7d2b9));if(i)pathLines.push(line([pathPositions[i-1],p],0xd9d0af));});
  plane(.78,.21,textMap('CONNECT THE DOTS','#99a38a','#f6efdf',44),-.12,4,-3.65);

  // Front-right door. It opens only when every experience has been collected.
  const door=new THREE.Group();door.position.set(4.91,0,1.0);door.rotation.y=Math.PI/2;scene.add(door);
  const doorGlow=new THREE.PointLight(0xffdc88,0,5);doorGlow.position.set(4.9,1.4,1.0);scene.add(doorGlow);
  // A free-standing door on the cutaway edge keeps the ending visible.
  box(1.25,2.7,.2,palette.wood,0,1.35,0,door,.07);
  box(1.02,2.42,.22,0xffeb9c,0,1.26,.015,door,.04);
  const hinge=new THREE.Group();hinge.position.set(-.51,.07,.16);door.add(hinge);
  const doorPanel=box(1.02,2.42,.14,palette.blue,.51,1.2,0,hinge,.045);doorPanel.userData.door=true;
  box(.74,1.74,.025,0x88dcf6,.51,1.26,.085,hinge,.03);
  ball(.85,1.11,.12,.052,.052,.052,0xe3be63,hinge);
  flower(.51,1.84,.13,.16,hinge);
  const doorLabel=plane(.71,.19,textMap('NEXT DREAM','#688680','#b8d6dd',54),.51,.44,.113,hinge);
  const welcome=cylinder(.75,.018,0xffd747,4.02,.065,1.05);welcome.scale.x=.75;

  const {character,leftFoot,rightFoot,leftArm,rightArm,backpack,carryNotebook,pins}=createNpochamu({scene,makeBag,flower,experiences,collected});
  const futureDots=[];for(let i=0;i<7;i++){const dot=cylinder(.045,.016,0xe1bf68,4.5+i*.23,.068,1);dot.visible=false;futureDots.push(dot);}
  const confetti=[];for(let i=0;i<16;i++){const p=ball(0,0,0,.035,.035,.035,[palette.blue,palette.yellow,palette.pink][i%3]);p.visible=false;confetti.push(p);}

  const markerPositions={content:new THREE.Vector3(-1.96,1.51,2.13),focus:new THREE.Vector3(-2.7,2.57,-2.67),build:new THREE.Vector3(-.95,2.16,-2.27),research:new THREE.Vector3(-3.85,2.03,-1.6),festival:new THREE.Vector3(-.22,3.15,-3.38),care:new THREE.Vector3(3.05,2.19,-1.05)};
  const interactives=[{id:'content',group:phoneGroup},{id:'focus',group:scene.children.find(o=>o.position.equals(new THREE.Vector3(-2.7,1.94,-2.67)))},{id:'focus',group:focusTrophy},{id:'care',group:careTrophy},{id:'build',group:laptopGroup},{id:'research',group:researchGroup},{id:'festival',group:passGroup},{id:'care',group:tabletGroup},{id:'care',group:bag}];
  interactives.forEach(({id,group})=>group?.traverse(o=>{if(o.isMesh)o.userData.experience=id;}));
  door.traverse(o=>{if(o.isMesh)o.userData.door=true;});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
  function getHit(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(scene.children,true).find(hit=>hit.object.userData.experience || hit.object.userData.door);}
  canvas.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
  canvas.addEventListener('pointerup',e=>{if(!pointerStart || Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;const hit=getHit(e);if(hit?.object.userData.experience)onSelect(hit.object.userData.experience);else if(hit?.object.userData.door)onDoor();pointerStart=null;});
  canvas.addEventListener('pointermove',e=>{canvas.style.cursor=getHit(e)?'pointer':'default';});

  let width=1,height=1,angleAlt=false,walking=false,ending=false,celebration=0,move=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){width=shell.clientWidth;height=shell.clientHeight;renderer.setSize(width,height,false);const aspect=width/height;const frustum=width<620?11.9:12.0;camera.top=frustum/2;camera.bottom=-frustum/2;camera.left=-frustum*aspect/2;camera.right=frustum*aspect/2;camera.zoom=aspect<1?Math.max(.62,aspect*1.02):1;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(shell);resize();
  const screenPoint=new THREE.Vector3();
  function project(v){screenPoint.copy(v).project(camera);return{x:(screenPoint.x*.5+.5)*width,y:(-.5*screenPoint.y+.5)*height,visible:screenPoint.x>-1 && screenPoint.x<1 && screenPoint.y>-1 && screenPoint.y<1};}
  function updateCollection(values){backpack.visible=values.size>=3;carryNotebook.visible=values.has('research');experiences.forEach((e,i)=>{pins[i].visible=values.has(e.id);pathDots[i].material=material(values.has(e.id)?0xe3b654:0xd7d2b9);if(i){pathLines[i-1].material.color.set(values.has(e.id)&&values.has(experiences[i-1].id)?0xd7ad57:0xd9d0af);pathLines[i-1].material.opacity=values.has(e.id)&&values.has(experiences[i-1].id)?1:.4;}});doorGlow.intensity=values.size===6?2.5:0;futureDots.forEach(d=>d.visible=values.size===6);}
  updateCollection(collected);
  let last=performance.now(),elapsed=0;
  function animate(now){
    requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
    camera.position.lerp(angleAlt?alternateCamera:baseCamera,reduced?1:dt*3);camera.lookAt(look);
    if(celebration>0)celebration-=dt;
    confetti.forEach((p,i)=>{p.visible=!reduced&&celebration>0;if(p.visible){const a=i*Math.PI*2/16+elapsed;const rise=(2-celebration)*.45;p.position.set(character.position.x+Math.cos(a)*(.45+rise*.4),.55+rise+i%4*.24,character.position.z+Math.sin(a)*(.45+rise*.4));}});
    if(move){move.progress=Math.min(1,move.progress+dt/(move.duration||1.4));const p=move.progress,pEase=p*p*(3-2*p);character.position.lerpVectors(move.from,move.to,pEase);walking=true;if(p>=1){move=null;walking=false;}}
    else walking=false;
    if(!reduced){
      const bounce=walking?Math.abs(Math.sin(elapsed*11))*.055:celebration>0?Math.abs(Math.sin(elapsed*9))*.13:Math.sin(elapsed*2)*.01;
      character.position.y=.09+bounce;
      leftArm.rotation.z=celebration>0?-.55+Math.sin(elapsed*9)*.2:Math.sin(elapsed*(walking?10:2))*(walking?.23:.055);
      rightArm.rotation.z=celebration>0?.55-Math.sin(elapsed*9)*.2:-Math.sin(elapsed*(walking?10:2))*(walking?.23:.055);
      leftFoot.rotation.x=walking?Math.sin(elapsed*11)*.25:0;rightFoot.rotation.x=walking?-Math.sin(elapsed*11)*.25:0;
    }
    if(ending){hinge.rotation.y=THREE.MathUtils.lerp(hinge.rotation.y,-1.8,dt*2);doorGlow.intensity=THREE.MathUtils.lerp(doorGlow.intensity,5,dt*2);}
    const speechPoint=character.localToWorld(new THREE.Vector3(0,2.46,0));
    onProject(Object.entries(markerPositions).map(([id,v])=>({id,...project(v)})),project(speechPoint));
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  return {
    updateCollection,
    toggleView(){angleAlt=!angleAlt;},
    celebrate(id){celebration=2;const v=markerPositions[id];const target=new THREE.Vector3(THREE.MathUtils.clamp(v.x,-2,2.5),.09,THREE.MathUtils.clamp(v.z+.8,-.45,2.5));if(!reduced)move={from:character.position.clone(),to:target,progress:0,duration:1.3};},
    depart(){ending=true;celebration=1;character.rotation.y=1.1;move={from:character.position.clone(),to:new THREE.Vector3(5.3,.09,1),progress:0,duration:3.6};},
    reset(){ending=false;move=null;celebration=0;character.position.set(.2,.09,1.27);character.rotation.y=.56;hinge.rotation.y=0;}
  };
}
