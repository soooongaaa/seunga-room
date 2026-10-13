import * as THREE from './assets/three.module.js';

// Original photographs, unchanged, displayed as camera-facing characters in the
// 3D room. This deliberately preserves the supplied figure's exact appearance;
// it is a photographic avatar, not a reconstructed volumetric character model.
export function createNpochamu({scene,experiences=[]}) {
  const character=new THREE.Group();character.position.set(.2,.09,1.27);character.scale.setScalar(1.22);scene.add(character);
  const billboard=new THREE.Group();character.add(billboard);
  const loader=new THREE.TextureLoader();
  function photograph(file,outline,baseline){
    const map=loader.load(file);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
    const path=new THREE.Shape();
    const xy=(x,y)=>[(x-600)/400,(baseline-y)/400];
    outline.forEach((p,i)=>{
      if(i===0)path.moveTo(...xy(p[0],p[1]));
      else if(p.length===2)path.lineTo(...xy(...p));
      else path.bezierCurveTo(...xy(p[0],p[1]),...xy(p[2],p[3]),...xy(p[4],p[5]));
    });path.closePath();
    const geometry=new THREE.ShapeGeometry(path,48);
    const positions=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<positions.count;i++)uv.setXY(i,(positions.getX(i)*400+600)/1200,(1200-baseline+positions.getY(i)*400)/1200);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide,toneMapped:false}));
    mesh.castShadow=true;billboard.add(mesh);return mesh;
  }
  const standing=photograph('./assets/npochamu-standing.png',[
    [560,167],
    [506,166,454,206,451,255],
    [449,277,452,291,459,305],
    [428,336,417,369,405,411],
    [369,442,349,482,348,523],
    [348,530,348,536,350,541],
    [318,532,288,545,276,574],
    [263,603,268,631,282,661],
    [286,688,325,743,375,771],
    [368,826,383,908,403,969],
    [410,994,416,1011,429,1024],
    [488,1034,548,1035,601,1031],
    [665,1034,724,1031,771,1024],
    [797,984,820,874,822,777],
    [865,753,904,707,922,668],
    [939,634,934,601,915,576],
    [904,563,883,552,860,551],
    [861,514,850,474,826,443],
    [824,399,811,361,794,328],
    [820,297,815,252,788,220],
    [765,190,709,174,666,184],
    [649,187,641,189,635,191],
    [613,175,587,166,560,167]
  ],1034);
  const resting=photograph('./assets/npochamu-resting.png',[
    [468,286],
    [418,287,374,318,371,368],
    [370,387,373,405,379,421],
    [349,449,335,478,320,514],
    [279,544,254,588,258,633],
    [257,668,270,705,301,725],
    [269,748,275,783,304,811],
    [325,846,339,876,368,893],
    [425,918,474,917,529,911],
    [613,922,708,914,770,900],
    [850,884,913,858,934,812],
    [949,783,938,746,916,726],
    [894,702,878,694,873,684],
    [854,639,817,615,769,587],
    [776,552,768,518,745,505],
    [732,497,717,497,708,499],
    [701,477,689,452,681,434],
    [724,404,727,365,705,338],
    [675,304,609,295,556,314],
    [532,294,500,286,468,286]
  ],916);
  resting.visible=false;
  let active=standing,lastActive=performance.now();
  const worldQuaternion=new THREE.Quaternion();
  const dummy=()=>new THREE.Group();
  const leftArm=dummy(),rightArm=dummy(),leftFoot=dummy(),rightFoot=dummy(),backpack=dummy(),carryNotebook=dummy();
  const pins=experiences.map(dummy);
  character.userData.speechHeight=2.42;
  return {
    character,leftArm,rightArm,leftFoot,rightFoot,backpack,carryNotebook,pins,
    updateAppearance(camera,{walking=false,celebrating=false,ending=false}={}){
      if(walking||celebrating||ending)lastActive=performance.now();
      const next=(!ending&&performance.now()-lastActive>25000)?resting:standing;
      if(next!==active){standing.visible=next===standing;resting.visible=next===resting;active=next;}
      character.userData.speechHeight=active===standing?2.42:1.79;
      character.updateWorldMatrix(true,false);character.getWorldQuaternion(worldQuaternion);
      billboard.quaternion.copy(worldQuaternion.invert().multiply(camera.quaternion));
    }
  };
}
