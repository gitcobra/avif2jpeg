(function(){"use strict";const d=new OffscreenCanvas(100,100),T=d.getContext("bitmaprenderer");let h;const b=new Map;self.onmessage=async n=>{const{ports:e}=n;if(e[0]){h=e[0],h.onmessage=S,self.postMessage({action:"respond-to-first-message"});return}const o=n.data;for(const f of o)await R(f);self.postMessage({action:"list-end"}),d.width=1,d.height=1};async function R(n){const{index:e,file:o,bitmap:f,fileId:i,type:g,quality:m,demandThumbnail:u,isSingleImage:M,webkitRelativePath:z,maxSize:v}=n,c=z||o.webkitRelativePath||o.name,y=o.size;let a,l,t,s,x=!1;try{if(l=f,{width:t,height:s}=l,v){const r=t/s;let{width:k,height:P}=v,p=null;t>k&&(t=k,s=t/r,p={resizeWidth:t}),s>P&&(s=P,t=s*r,p={resizeHeight:s}),x=!!p,l=await createImageBitmap(l,{resizeQuality:"high",...p||{}}),f.close()}}catch{a={action:"file-error",path:c,fileId:i,index:e},self.postMessage(a);return}let I;if(u){const r=t>s?{resizeWidth:110}:{resizeHeight:80};I=await createImageBitmap(l,{...r,resizeQuality:"pixelated"})}T.transferFromImageBitmap(l),a={action:"file-load",fileId:i,path:c,index:e,thumbnail:I,width:t,height:s,shrinked:x},self.postMessage(a);let w;try{w=await d.convertToBlob({type:g,quality:m})}catch{a={action:"file-error",path:c,fileId:i,index:e},self.postMessage(a);return}const B=w.size;h.postMessage({blob:w,path:c,fileId:i}),a={action:"file-converted",path:c,fileId:i,index:e,outputsize:B,inputsize:y,width:t,height:s},self.postMessage(a),b.set(i,{outputsize:B,inputsize:y,path:c,index:e})}const S=n=>{const{fileId:e,renamed:o,outputPath:f,canceled:i}=n.data,{inputsize:g,outputsize:m,path:u,index:M}=b.get(e),z={action:i?"file-canceled":"file-completed",fileId:e,path:u,index:M,inputsize:g,outputsize:m};self.postMessage(z)}})();
