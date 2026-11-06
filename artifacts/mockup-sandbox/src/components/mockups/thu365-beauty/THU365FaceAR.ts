export type FaceARSettings = { smooth:number; lipstick:string; blush:string; eyeliner:boolean; hairTint:string; sticker:"none"|"hearts"|"sunglasses"|"sparkles"; light:"none"|"soft"|"golden"|"studio" };
type Landmark={x:number;y:number;z:number};
type Mask={width:number;height:number;data:Uint8Array};
type FaceResult={faceLandmarks?:Landmark[][];skinMask?:Mask};
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const FACE="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SKIN="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";
export async function createTHU365FaceTracker(){
 // @ts-expect-error pinned MediaPipe ESM CDN
 const vision=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
 const files=await vision.FilesetResolver.forVisionTasks(WASM);
 const faceOptions={baseOptions:{modelAssetPath:FACE},runningMode:"VIDEO",numFaces:1,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55};
 let face:any;
 try{face=await vision.FaceLandmarker.createFromOptions(files,{...faceOptions,baseOptions:{...faceOptions.baseOptions,delegate:"GPU"}});}
 catch{face=await vision.FaceLandmarker.createFromOptions(files,{...faceOptions,baseOptions:{...faceOptions.baseOptions,delegate:"CPU"}});}
 let segmenter:any=null;
 const segmentationOptions={baseOptions:{modelAssetPath:SKIN},runningMode:"VIDEO",outputCategoryMask:true,outputConfidenceMasks:false};
 try{segmenter=await vision.ImageSegmenter.createFromOptions(files,{...segmentationOptions,baseOptions:{...segmentationOptions.baseOptions,delegate:"GPU"}});}
 catch{try{segmenter=await vision.ImageSegmenter.createFromOptions(files,{...segmentationOptions,baseOptions:{...segmentationOptions.baseOptions,delegate:"CPU"}});}catch{/* keep landmark-only fallback */}}
 return {detectForVideo(video:HTMLVideoElement,timestamp:number):FaceResult{
  const result=face.detectForVideo(video,timestamp);
  if(segmenter)try{const out=segmenter.segmentForVideo(video,timestamp);const mask=out.categoryMask?.[0]??out.categoryMask;if(mask){const labels=mask.getAsUint8Array();const data=new Uint8Array(labels.length);for(let i=0;i<labels.length;i++)data[i]=labels[i]===3?255:0;result.skinMask={width:mask.width,height:mask.height,data};}}catch{/* retain face tracking */}
  return result;
 },close(){face.close();segmenter?.close?.();},segmentationEnabled:Boolean(segmenter)};
}
const LIPS=[61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95,78];
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
function path(ctx:CanvasRenderingContext2D,face:Landmark[],ids:number[],w:number,h:number){ctx.beginPath();ids.forEach((id,i)=>{const p=face[id];if(!p)return;i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h);});ctx.closePath();}
export function renderFaceAR(canvas:HTMLCanvasElement,video:HTMLVideoElement,result:FaceResult,s:FaceARSettings,filter="none"){
 const w=video.videoWidth,h=video.videoHeight;if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext("2d");if(!ctx)return;ctx.save();ctx.filter=filter;ctx.drawImage(video,0,0,w,h);ctx.restore();const face=result.faceLandmarks?.[0];if(!face)return;
 if(s.smooth>0){ctx.save();if(result.skinMask){const m=document.createElement("canvas");m.width=result.skinMask.width;m.height=result.skinMask.height;const mc=m.getContext("2d");if(mc){const px=mc.createImageData(m.width,m.height);for(let i=0;i<result.skinMask.data.length;i++){const p=i*4;px.data[p]=px.data[p+1]=px.data[p+2]=255;px.data[p+3]=result.skinMask.data[i];}mc.putImageData(px,0,0);const b=document.createElement("canvas");b.width=w;b.height=h;const bc=b.getContext("2d");if(bc){bc.filter=`blur(${2+s.smooth/13}px)`;bc.drawImage(video,0,0,w,h);bc.globalCompositeOperation="destination-in";bc.filter="blur(2px)";bc.drawImage(m,0,0,w,h);ctx.globalAlpha=Math.min(.72,s.smooth/105);ctx.drawImage(b,0,0);}}}else{path(ctx,face,OVAL,w,h);ctx.clip();ctx.globalAlpha=s.smooth/260;ctx.filter=`blur(${2+s.smooth/14}px)`;ctx.drawImage(video,0,0,w,h);}ctx.restore();}
 if(s.lipstick!=="none"){ctx.save();path(ctx,face,LIPS,w,h);ctx.fillStyle=s.lipstick;ctx.globalAlpha=.38;ctx.fill();ctx.restore();}
 if(s.blush!=="none")for(const id of [205,425]){const p=face[id];if(!p)continue;const x=p.x*w,y=p.y*h,r=w*.055,g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,s.blush);g.addColorStop(1,"transparent");ctx.save();ctx.globalAlpha=.32;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 if(s.eyeliner){ctx.save();ctx.strokeStyle="#21151b";ctx.lineWidth=Math.max(2,w*.0035);ctx.lineCap="round";for(const ids of [[33,133,159,158,157],[362,263,386,385,384]]){ctx.beginPath();ids.forEach((id,i)=>{const p=face[id];if(p)i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h);});ctx.stroke();}ctx.restore();}
 if(s.sticker!=="none"){const n=face[1],l=face[234],r=face[454];if(n&&l&&r){const x=n.x*w,y=n.y*h,span=Math.abs(r.x-l.x)*w;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`${Math.round(span*(s.sticker==="sunglasses"?.29:.16))}px sans-serif`;ctx.fillText(s.sticker==="sunglasses"?"🕶️":s.sticker==="hearts"?"💗  💗":"✨  ✨",x,y-span*(s.sticker==="sunglasses"?.12:.62));ctx.restore();}}
 if(s.hairTint!=="none"){ctx.save();ctx.globalCompositeOperation="color";ctx.globalAlpha=.12;ctx.fillStyle=s.hairTint;ctx.beginPath();ctx.ellipse(face[10].x*w,Math.max(0,face[10].y*h-h*.06),w*.18,h*.13,0,Math.PI,0);ctx.fill();ctx.restore();}
 if(s.light!=="none"){const g=ctx.createRadialGradient(w*.5,h*.24,1,w*.5,h*.24,w*.7);g.addColorStop(0,s.light==="golden"?"rgba(255,205,130,.15)":"rgba(255,240,225,.12)");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
}
