import * as THREE from './assets/three.module.js';

// The provided standing and reclining toy photos define the silhouette,
// five-petal flower, mitten cuffs, and very short feet. The actual print
// from the high-resolution standing photo is projected onto the head.
export function createNpochamu({scene,makeBag,flower,experiences,collected}) {
  const character=new THREE.Group();
  character.position.set(.2,.09,1.27);character.rotation.y=.56;
  character.scale.setScalar(1.22);scene.add(character);
  const plastic=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.47,metalness:0});
  const cyan=new THREE.MeshStandardMaterial({color:0x0cb5d4,roughness:.43});
  const yellow=new THREE.MeshStandardMaterial({color:0xffca22,roughness:.49});
  const sphere=new THREE.SphereGeometry(1,40,28);
  function ellipsoid(parent,x,y,z,sx,sy,sz,mat=plastic){
    const mesh=new THREE.Mesh(sphere,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function smoothProfile(points){
    return new THREE.CatmullRomCurve3(points.map(([r,y])=>new THREE.Vector3(r,y,0)),false,'centripetal').getPoints(100).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));
  }
  function lathe(parent,profile,depth,mat=plastic){
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile,80),mat);mesh.scale.z=depth;
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const torso=smoothProfile([[0,.035],[.30,.04],[.40,.08],[.45,.19],[.51,.34],[.55,.59],[.53,.78],[.47,.94],[.34,1.075],[0,1.13]]);
  lathe(character,torso,.74);
  const leftFoot=ellipsoid(character,-.22,.08,.012,.215,.085,.24);
  const rightFoot=ellipsoid(character,.22,.08,.012,.215,.085,.24);

  const headProfile=smoothProfile([[0,.89],[.28,.905],[.45,.945],[.57,1.005],[.64,1.09],[.67,1.20],[.65,1.30],[.515,1.465],[.475,1.635],[.42,1.77],[.31,1.895],[0,1.97]]);
  lathe(character,headProfile,.70);
  ellipsoid(character,-.15,1.925,-.028,.25,.26,.225);
  ellipsoid(character,.29,1.905,-.028,.25,.25,.225);

  // Both blue gloves are caps over white arms, with a scalloped yellow rim.
  function arm(sign){
    const joint=new THREE.Group();joint.position.set(sign*.49,.87,0);character.add(joint);
    const hand=new THREE.Group();hand.position.set(sign*.08,.12,.01);hand.rotation.z=-sign*.53;joint.add(hand);
    ellipsoid(hand,0,-.13,0,.128,.245,.145);
    const mitten=smoothProfile([[0,0],[.115,0],[.143,.035],[.144,.16],[.115,.27],[.06,.325],[0,.34]]);
    lathe(hand,mitten,.94,cyan);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.123,.018,10,40),yellow);
    rim.rotation.x=Math.PI/2;rim.position.y=.013;rim.castShadow=true;hand.add(rim);
    for(let i=0;i<12;i++){
      const a=i*Math.PI*2/12;
      ellipsoid(hand,Math.cos(a)*.124,-.006,Math.sin(a)*.124,.025,.023,.025,yellow);
    }
    return joint;
  }
  const leftArm=arm(-1),rightArm=arm(1);

  // Five soft petals, as in the supplied figure, instead of a generic flower.
  const bloom=new THREE.Group();bloom.position.set(.0725,1.905,.23);bloom.rotation.x=-.75;character.add(bloom);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const petal=ellipsoid(bloom,Math.sin(a)*.167,Math.cos(a)*.167,0,.158,.158,.085,cyan);
    petal.rotation.z=-a;
  }
  ellipsoid(bloom,0,0,.079,.118,.106,.048,yellow);

  const photo=new THREE.TextureLoader().load('./assets/npochamu-standing.png');
  photo.minFilter=THREE.LinearFilter;photo.magFilter=THREE.LinearFilter;
  photo.anisotropy=8;
  const faceMaterial=new THREE.ShaderMaterial({
    uniforms:{reference:{value:photo},region:{value:new THREE.Vector4(485/1200,1-637/1200,230/1200,255/1200)}},
    vertexShader:`varying vec2 faceUv;void main(){faceUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      uniform sampler2D reference;uniform vec4 region;varying vec2 faceUv;
      void main(){
        vec3 print=texture2D(reference,region.xy+faceUv*region.zw).rgb;
        float alpha=1.0-smoothstep(0.38,0.73,min(print.r,min(print.g,print.b)));
        if(alpha<0.025)discard;
        gl_FragColor=vec4(pow(print,vec3(2.2)),alpha);
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,toneMapped:false
  });
  // A curved patch follows the real head surface. No flat rectangular face plate.
  function radiusAt(y){
    for(let i=1;i<headProfile.length;i++){
      const a=headProfile[i-1],b=headProfile[i];
      if(y>=a.y&&y<=b.y)return THREE.MathUtils.lerp(a.x,b.x,(y-a.y)/(b.y-a.y));
    }
    return .4;
  }
  const positions=[],uvs=[],indices=[],segments=40;
  for(let iy=0;iy<=segments;iy++)for(let ix=0;ix<=segments;ix++){
    const u=ix/segments,v=iy/segments,x=(u-.5)*.575,y=.995+v*.638;
    const r=radiusAt(y),z=.70*Math.sqrt(Math.max(.005,r*r-x*x))+.004;
    positions.push(x,y,z);uvs.push(u,v);
    if(ix<segments&&iy<segments){const a=iy*(segments+1)+ix,b=a+1,c=a+segments+1,d=c+1;indices.push(a,b,c,b,d,c);}
  }
  const faceGeometry=new THREE.BufferGeometry();
  faceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  faceGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));faceGeometry.setIndex(indices);faceGeometry.computeVertexNormals();
  character.add(new THREE.Mesh(faceGeometry,faceMaterial));

  const backpack=makeBag(0,.53,-.405,character);backpack.scale.setScalar(.65);backpack.rotation.y=Math.PI;
  const carryNotebook=new THREE.Mesh(new THREE.BoxGeometry(.25,.33,.065),new THREE.MeshStandardMaterial({color:0xb5a0eb,roughness:.75}));
  carryNotebook.position.set(-.59,.5,.15);carryNotebook.rotation.z=-.18;carryNotebook.castShadow=true;character.add(carryNotebook);
  // Experience badges belong on the bag; the character stays white like the references.
  const pins=experiences.map((e,i)=>{
    const pin=flower(-.20+i%3*.20,.015+Math.floor(i/3)*.145,.28,.046,backpack,new THREE.Color(e.color).getHex());
    pin.visible=collected.has(e.id);return pin;
  });
  return {character,leftFoot,rightFoot,leftArm,rightArm,backpack,carryNotebook,pins};
}
