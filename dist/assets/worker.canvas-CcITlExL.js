(function(){"use strict";const h=new OffscreenCanvas(100,100),B=h.getContext("bitmaprenderer");let c;const b=new Map;self.onmessage=async n=>{const{ports:e}=n;if(e[0]){c=e[0],c.onmessage=x;return}const i=n.data;for(const t of i)await I(t);self.postMessage({action:"list-end"})};async function I(n){const{index:e,file:i,fileId:t,type:l,quality:r,demandThumbnail:f,demandImage:d,webkitRelativePath:p}=n,a=p||i.webkitRelativePath||i.name,w=i.size;let s;s={action:"file-start",path:a,fileId:t,index:e},self.postMessage(s);let o;try{o=await createImageBitmap(i)}catch{s={action:"file-error",path:a,fileId:t,index:e},self.postMessage(s);return}const{width:m,height:g}=o;let z=null;if(f){const y=m>g?{resizeWidth:110}:{resizeHeight:80};z=await createImageBitmap(o,{...y,resizeQuality:"low"})}B.transferFromImageBitmap(o),s={action:"file-load",fileId:t,path:a,index:e,thumbnail:z,width:m,height:g},self.postMessage(s);const u=await h.convertToBlob({type:l,quality:r}),M=u.size;let v;d?v=u:c.postMessage({blob:u,path:a,fileId:t}),s={action:"file-converted",path:a,fileId:t,index:e,outputsize:M,inputsize:w,image:v,width:m,height:g},self.postMessage(s),b.set(t,{outputsize:M,inputsize:w,path:a,index:e})}const x=n=>{const{fileId:e,renamed:i,outputPath:t,canceled:l}=n.data,{inputsize:r,outputsize:f,path:d,index:p}=b.get(e),a={action:l?"file-canceled":"file-completed",fileId:e,path:d,index:p,inputsize:r,outputsize:f};self.postMessage(a)}})();
