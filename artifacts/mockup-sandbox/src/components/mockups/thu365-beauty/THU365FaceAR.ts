async function resolveCachedModel(url:string,label:string):Promise<{url:string;revoke:()=>void}>{
 if(!("caches" in window))throw new Error("Trình duyệt không hỗ trợ Cache Storage. Không thể cài model AI.");
 const cache=await caches.open("anhthu-ai-models-v1");
 const response=await cache.match(url);
 if(!response)throw new Error(label+" chưa được tải về thiết bị. Mở Tải AI Models và cài đặt model trước.");
 const blob=await response.blob();
 if(blob.size<1024)throw new Error(label+" bị lỗi hoặc tệp rỗng. Hãy xóa và tải lại model.");
 const signature=new Uint8Array(await blob.slice(0,12).arrayBuffer());
 const valid=label==="Face Landmarker"?(signature[0]===0x50&&signature[1]===0x4b):(signature.length>=8&&signature[4]===0x54&&signature[5]===0x46&&signature[6]===0x4c&&signature[7]===0x33);
 if(!valid)throw new Error(label+" sai định dạng hoặc tải chưa hoàn tất. Hãy xóa và tải lại model.");
 const objectUrl=URL.createObjectURL(blob);
 return {url:objectUrl,revoke:()=>URL.revokeObjectURL(objectUrl)};
}
export type FaceARSettings = { smooth:number; lipstick:string; blush:string; lipstickStrength?:number; blushStrength?:number; faceSlim?:number; eyeEnlarge?:number; eyelinerStrength?:number; eyelashStrength?:number; highlightStrength?:number; eyeliner:boolean; hairTint:string; sticker:"none"|"hearts"|"sunglasses"|"sparkles"|"bunny"|"cat"|"crown"|"butterfly"; light:"none"|"soft"|"golden"|"studio"; highlight?:boolean; eyelash?:boolean };
type Landmark={x:number;y:number;z:number};
type Mask={width:number;height:number;data:Uint8Array};
type FaceResult={faceLandmarks?:Landmark[][];skinMask?:Mask;hairMask?:Mask};
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const FACE="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SKIN="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";
export async function createTHU365FaceTracker(){
 // @ts-expect-error pinned MediaPipe ESM CDN
 const vision=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
 const files=await vision.FilesetResolver.forVisionTasks(WASM);
 const faceAsset=await resolveCachedModel(FACE,"Face Landmarker");
 let skinAsset:{url:string;revoke:()=>void}|null=null;
 try{skinAsset=await resolveCachedModel(SKIN,"Skin Segmentation");}
 catch(error){console.warn("THU365 Skin Segmentation unavailable; continuing with Face Landmarker.",error);}
 const faceOptions={baseOptions:{modelAssetPath:faceAsset.url},runningMode:"VIDEO",numFaces:1,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55};
 let face:any=null;
 let segmenter:any=null;
 let disposed=false;
 const segmentationOptions=skinAsset?{baseOptions:{modelAssetPath:skinAsset.url},runningMode:"VIDEO",outputCategoryMask:true,outputConfidenceMasks:false}:null;
 try{
  try{face=await vision.FaceLandmarker.createFromOptions(files,{...faceOptions,baseOptions:{...faceOptions.baseOptions,delegate:"GPU"}});}
  catch{face=await vision.FaceLandmarker.createFromOptions(files,{...faceOptions,baseOptions:{...faceOptions.baseOptions,delegate:"CPU"}});}
  if(skinAsset&&segmentationOptions){
   try{segmenter=await vision.ImageSegmenter.createFromOptions(files,{...segmentationOptions,baseOptions:{...segmentationOptions.baseOptions,delegate:"GPU"}});}
   catch{
    try{segmenter=await vision.ImageSegmenter.createFromOptions(files,{...segmentationOptions,baseOptions:{...segmentationOptions.baseOptions,delegate:"CPU"}});}
    catch(error){console.warn("THU365 Skin Segmentation could not initialize; Face Landmarker remains active.",error);segmenter?.close?.();segmenter=null;skinAsset.revoke();skinAsset=null;}
   }
  }
 }catch(error){
  face?.close?.();segmenter?.close?.();faceAsset.revoke();skinAsset?.revoke();
  throw error;
 }
 return {
  detectForVideo(video:HTMLVideoElement,timestamp:number):FaceResult{
   const result=face.detectForVideo(video,timestamp);
   if(segmenter)try{const out=segmenter.segmentForVideo(video,timestamp);const mask=out.categoryMask?.[0]??out.categoryMask;if(mask){const labels=mask.getAsUint8Array();const skin=new Uint8Array(labels.length);const hair=new Uint8Array(labels.length);for(let i=0;i<labels.length;i++){skin[i]=labels[i]===3?255:0;hair[i]=labels[i]===1?255:0;}result.skinMask={width:mask.width,height:mask.height,data:skin};result.hairMask={width:mask.width,height:mask.height,data:hair};}}catch{/* keep face landmarks and previous-frame style */}
   return result;
  },
  close(){if(disposed)return;disposed=true;face?.close?.();segmenter?.close?.();segmenter=null;faceAsset.revoke();skinAsset?.revoke();},
  get segmentationEnabled(){return Boolean(segmenter);}
 };
}
const LIPS=[61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95,78];
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
function path(ctx:CanvasRenderingContext2D,face:Landmark[],ids:number[],w:number,h:number){ctx.beginPath();ids.forEach((id,i)=>{const p=face[id];if(!p)return;i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h);});ctx.closePath();}
export function renderFaceAR(canvas:HTMLCanvasElement,video:HTMLVideoElement,result:FaceResult,s:FaceARSettings,filter="none"){
 const w=video.videoWidth,h=video.videoHeight;if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext("2d");if(!ctx)return;ctx.save();ctx.filter=filter;ctx.drawImage(video,0,0,w,h);ctx.restore();const face=result.faceLandmarks?.[0];if(!face)return;
 if(s.smooth>0){ctx.save();if(result.skinMask){const m=document.createElement("canvas");m.width=result.skinMask.width;m.height=result.skinMask.height;const mc=m.getContext("2d");if(mc){const px=mc.createImageData(m.width,m.height);for(let i=0;i<result.skinMask.data.length;i++){const p=i*4;px.data[p]=px.data[p+1]=px.data[p+2]=255;px.data[p+3]=result.skinMask.data[i];}mc.putImageData(px,0,0);const b=document.createElement("canvas");b.width=w;b.height=h;const bc=b.getContext("2d");if(bc){bc.filter=`blur(${2+s.smooth/13}px)`;bc.drawImage(video,0,0,w,h);bc.globalCompositeOperation="destination-in";bc.filter="blur(2px)";bc.drawImage(m,0,0,w,h);ctx.globalAlpha=Math.min(.72,s.smooth/105);ctx.drawImage(b,0,0);}}}else{path(ctx,face,OVAL,w,h);ctx.clip();ctx.globalAlpha=s.smooth/260;ctx.filter=`blur(${2+s.smooth/14}px)`;ctx.drawImage(video,0,0,w,h);}ctx.restore();}
 if((s.faceSlim??0)>0){const strength=Math.min(100,s.faceSlim??0)/100;for(const id of [123,352]){const p=face[id];if(!p)continue;const x=p.x*w,y=p.y*h,rx=w*(.075+strength*.025),ry=h*(.105+strength*.025),g=ctx.createRadialGradient(x,y,1,x,y,rx);g.addColorStop(0,"rgba(82,43,42,"+(strength*.22)+")");g.addColorStop(.58,"rgba(82,43,42,"+(strength*.10)+")");g.addColorStop(1,"transparent");ctx.save();ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,id===123?-.18:.18,0,Math.PI*2);ctx.fill();ctx.restore();}}
 if(s.lipstick!=="none"){ctx.save();path(ctx,face,LIPS,w,h);ctx.fillStyle=s.lipstick;ctx.globalAlpha=.38*Math.min(1,(s.lipstickStrength??100)/100);ctx.fill();ctx.restore();}
 if(s.blush!=="none")for(const id of [205,425]){const p=face[id];if(!p)continue;const x=p.x*w,y=p.y*h,r=w*.055,g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,s.blush);g.addColorStop(1,"transparent");ctx.save();ctx.globalAlpha=.32*Math.min(1,(s.blushStrength??100)/100);ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 if((s.eyeEnlarge??0)>0){const snapshot=document.createElement("canvas");snapshot.width=w;snapshot.height=h;const sc=snapshot.getContext("2d");if(sc){sc.drawImage(canvas,0,0);const scale=1+Math.min(55,s.eyeEnlarge??0)/100;for(const ids of [[33,133,159,145],[362,263,386,374]]){const pts=ids.map(id=>face[id]).filter(Boolean);if(pts.length!==4)continue;const xs=pts.map(p=>p.x*w),ys=pts.map(p=>p.y*h),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,rx=(Math.max(...xs)-Math.min(...xs))*.95,ry=(Math.max(...ys)-Math.min(...ys))*1.5;ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.clip();ctx.drawImage(snapshot,cx-rx,cy-ry,rx*2,ry*2,cx-rx*scale,cy-ry*scale,rx*2*scale,ry*2*scale);ctx.restore();}}}
 if(s.eyeliner){ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(s.eyelinerStrength??100)/100));ctx.strokeStyle="#21151b";ctx.lineWidth=Math.max(2,w*.0035);ctx.lineCap="round";for(const ids of [[33,133,159,158,157],[362,263,386,385,384]]){ctx.beginPath();ids.forEach((id,i)=>{const p=face[id];if(p)i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h);});ctx.stroke();}ctx.restore();}
 if(s.sticker!=="none"){const n=face[1],l=face[234],r=face[454];if(n&&l&&r){const x=n.x*w,y=n.y*h,span=Math.abs(r.x-l.x)*w;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`${Math.round(span*(s.sticker==="sunglasses"?.29:.16))}px sans-serif`;const stickerGlyph:Record<string,string>={sunglasses:"🕶️",hearts:"💗  💗",sparkles:"✨  ✨",bunny:"🐰",cat:"🐱",crown:"👑",butterfly:"🦋"};ctx.fillText(stickerGlyph[s.sticker]||"✨",x,y-span*(s.sticker==="sunglasses"?.12:.62));ctx.restore();}}
 if(s.eyelash){ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(s.eyelashStrength??100)/100));ctx.strokeStyle="#24151c";ctx.lineWidth=Math.max(1.5,w*.0022);ctx.lineCap="round";for(const ids of [[33,133,159,158,157],[362,263,386,385,384]]){for(let i=0;i<ids.length;i++){const p=face[ids[i]];if(!p)continue;const q=face[ids[Math.min(i+1,ids.length-1)]];if(!q)continue;const dx=(q.x-p.x)*w,dy=(q.y-p.y)*h,len=Math.hypot(dx,dy)||1;ctx.beginPath();ctx.moveTo(p.x*w,p.y*h);ctx.lineTo(p.x*w+(-dy/len)*w*.012,p.y*h+(dx/len)*w*.012);ctx.stroke();}}ctx.restore();}
 if(s.highlight){ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(s.highlightStrength??100)/100));for(const id of [50,280]){const p=face[id];if(!p)continue;const x=p.x*w,y=p.y*h,r=w*.045,g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,"rgba(255,235,220,.32)");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,r*.55,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(s.hairTint!=="none"&&result.hairMask){const m=document.createElement("canvas");m.width=result.hairMask.width;m.height=result.hairMask.height;const mc=m.getContext("2d");if(mc){const px=mc.createImageData(m.width,m.height);for(let i=0;i<result.hairMask.data.length;i++){const p=i*4;px.data[p]=px.data[p+1]=px.data[p+2]=255;px.data[p+3]=result.hairMask.data[i];}mc.putImageData(px,0,0);const tint=document.createElement("canvas");tint.width=w;tint.height=h;const tc=tint.getContext("2d");if(tc){tc.fillStyle=s.hairTint;tc.fillRect(0,0,w,h);tc.globalCompositeOperation="destination-in";tc.drawImage(m,0,0,w,h);ctx.save();ctx.globalAlpha=.48;ctx.globalCompositeOperation="color";ctx.drawImage(tint,0,0);ctx.restore();}}}
 if(s.light!=="none"){const g=ctx.createRadialGradient(w*.5,h*.24,1,w*.5,h*.24,w*.7);g.addColorStop(0,s.light==="golden"?"rgba(255,205,130,.15)":"rgba(255,240,225,.12)");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
}
