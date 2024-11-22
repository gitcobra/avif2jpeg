(function(){"use strict";function k(l,t,e,i){return new(e||(e=Promise))(function(r,o){function a(u){try{h(i.next(u))}catch(n){o(n)}}function s(u){try{h(i.throw(u))}catch(n){o(n)}}function h(u){var n;u.done?r(u.value):(n=u.value,n instanceof e?n:new e(function(c){c(n)})).then(a,s)}h((i=i.apply(l,[])).next())})}typeof SuppressedError=="function"&&SuppressedError;const M=new Blob([Uint8Array.from([80,75,3,4,10,0,0,8,0,0])]),O=new Blob([Uint8Array.from([80,75,1,2,10,0,10,0,0,8,0,0])]),Z=new Blob([Uint8Array.from([0,0,0,0,0,0,0,0,0,0])]),j=new Blob([Uint8Array.from([0,0,0,0,0,0,16,0,0,0])]),P=new TextEncoder;class A{constructor(){this.clear()}clear(){this._dirRecords=new Map,this._dirRecList=[],this._dirRecFileList=[],this._localFileChunks=[],this._curLocalFileHeaderOffset=0,this._centralDirHeaderChunks=[],this._centralDirHeaderLen=0,this._pathCount=0,this._fileCount=0,this._dataSize=0,this._zippedBlob=null,this._isPending=!1,this._resolvingCRCPromise=null}add(t,e,i,r){if(this._zippedBlob)throw new Error("the AnZip object was already zipped. create a new instance or execute clear() before adding a file.");if(!t)throw new Error("path is empty");if(t=String(t).replace(/\\/g,"/").replace(/^\//,""),/\/{2,}|\\|^\/|^[a-z]+:/i.test(t))throw new Error('invalid path. containing a drive letter, a leading slash, or empty directory name: "'+t+'"');let o=0,a=0,s=null;if(e!==void 0){if(!/[^/]+$/.test(t))throw new Error('needs a file name: "'+t+'"');if(this.has(t))throw new Error('the path already exists: "'+t+'"');if(e instanceof Blob)s=e,o=e.size;else{if(e instanceof Uint8Array||typeof Buffer=="function"&&e instanceof Buffer)s=e;else if(typeof e=="string")s=P.encode(e);else{if(!(e instanceof ArrayBuffer||e instanceof Array))throw new Error("data must be one of the following types Array, TypedArray, ArrayBuffer, Buffer, string, or Blob.");s=new Uint8Array(e)}a=x(s),o=s.length}}let h=null;i instanceof Date?h=i:i===void 0||i===-1?h=new Date:i>0&&(h=new Date(i));const u=h?z(h.getFullYear()-1980<<25|h.getMonth()+1<<21|h.getDate()<<16|h.getHours()<<11|h.getMinutes()<<5|h.getSeconds()/2):[0,0,0,0];let n,c,y,m=t.replace(/\/+$/,"").split("/"),w="";for(;m.length;){w+=m.shift();const g=!!(e&&m.length===0);if(w+=g?"":"/",this._dirRecords.has(w))continue;const p=P.encode(w),C=p.length,S=g&&o?z(o):[0,0,0,0],F={offset:this._curLocalFileHeaderOffset,size:o,path:w,pathLength:C,isFile:g};this._dirRecords.set(w,F),this._dirRecList.push(F),g&&this._dirRecFileList.push(F),this._pathCount++,n=Uint8Array.from(u.concat(g?z(a):[0,0,0,0],S,S,[255&C,C>>8&255,0,0])),c=[M,n,p],this._localFileChunks.push(c);const T=g?Z:j,$=Uint8Array.from(z(this._curLocalFileHeaderOffset));this._centralDirHeaderChunks.push([O,n,T,$,p]),this._centralDirHeaderLen+=46+C,this._curLocalFileHeaderOffset+=30+C+(g?o:0)}return s&&(s instanceof Blob?y=this._resolveBlobCRC(s,n,t):r&&(s=new Blob([s])),c.push(s),this._dataSize+=o,this._fileCount++),y}_resolveBlobCRC(t,e,i){var r;return k(this,void 0,void 0,function*(){const o=this._resolvingCRCPromise;let a;const s=new Promise(n=>a=n);this._resolvingCRCPromise=s,this._isPending=!0;const h=((r=t.arrayBuffer)===null||r===void 0?void 0:r.call(t))||new Promise(n=>{const c=new FileReader;c.onload=()=>{n(c.result)},c.readAsArrayBuffer(t)});yield o;let u=!1;return h.then(n=>{const c=x(new Uint8Array(n));new DataView(e.buffer).setUint32(4,c,!0),u=!0}).catch(n=>{throw this.remove(i),new Error(`${n.message}
could not resolve the blob CRC.`)}).finally(()=>{this._resolvingCRCPromise===s&&(this._isPending=!1),a(u)}),s})}_checkPending(){if(this._isPending)throw new Error("the AnZip object is still pending. execute wait() and await the fulfillment of the Promise beforehand.")}_getFileRecord(t){let e;return typeof t=="string"?e=this._dirRecords.get(t):typeof t=="number"&&(e=this._dirRecFileList[t]),e||null}has(t){return!!this._dirRecords.has(t.replace(/\/+$/,""))}size(){return this._dataSize}count(t){return t?this._pathCount:this._fileCount}get(t,e){let i=this._getFileRecord(t);if(i&&i.isFile){if(this._zippedBlob){const{offset:r,size:o,pathLength:a}=i,s=r+a+30;return this._zippedBlob.slice(s,s+o,e)}{const r=this._dirRecList.indexOf(i),o=this._localFileChunks[r][3];return typeof e!="string"||o instanceof Blob&&(!e||o.type===e)?o:new Blob([o],{type:e})}}return null}getPathByIndex(t){var e;return((e=this._dirRecFileList[t])===null||e===void 0?void 0:e.path)||""}remove(t){if(this._zippedBlob)throw new Error(`could not remove the file. the AnZip object is already zipped. ${t}`);const e=this._getFileRecord(t);if(!e||!e.isFile)return!1;const i=this._dirRecList.indexOf(e);this._localFileChunks.splice(i,1)[0],this._centralDirHeaderChunks.splice(i,1)[0];const r=30+e.pathLength+e.size;this._curLocalFileHeaderOffset-=r;const o=46+e.pathLength;this._centralDirHeaderLen-=o;for(let a=i;a<this._centralDirHeaderChunks.length;a++){const s=this._centralDirHeaderChunks[a][3],h=new DataView(s.buffer),u=h.getUint32(0,!0);h.setUint32(0,u-r,!0)}return this._pathCount--,this._fileCount--,this._dataSize-=e.size,this._dirRecords.delete(e.path),this._dirRecFileList.splice(this._dirRecFileList.indexOf(e),1),this._dirRecList.splice(this._dirRecList.indexOf(e),1),!0}list(t){const e=[];for(const[i,r]of this._dirRecords)(t||r.isFile)&&e.push({path:r.path,size:r.size,isFile:r.isFile});return e}buffer(){return this.wait().then(()=>{var t;const e=this._buildZipBlob();return((t=e.arrayBuffer)===null||t===void 0?void 0:t.call(e))||new Promise(i=>{const r=new FileReader;r.onload=()=>{i(r.result)},r.readAsArrayBuffer(e)})})}blob(){return this._checkPending(),this._buildZipBlob()}url(){return this._checkPending(),URL.createObjectURL(this._buildZipBlob())}wait(t){return k(this,void 0,void 0,function*(){const e=this._resolvingCRCPromise;if(!e)return Promise.resolve();yield e})}_buildZipBlob(){if(this._zippedBlob)return this._zippedBlob;const t=new Uint8Array([].concat([80,75,5,6,0,0,0,0,255&this._pathCount,this._pathCount>>8,255&this._pathCount,this._pathCount>>8],z(this._centralDirHeaderLen),z(this._curLocalFileHeaderOffset),[0,0]));let e=[];return e=e.concat(...this._localFileChunks,...this._centralDirHeaderChunks,t),new Blob(e,{type:"application/zip"})}zip(t){if(!this._zippedBlob){if(t)return this.wait().then(()=>this.zip());this._checkPending();const e=this._buildZipBlob();this._zippedBlob=e,this._localFileChunks=[],this._centralDirHeaderChunks=[]}return this._zippedBlob}}const U=new Uint32Array(256);for(let l=0;l<256;l++){let t=l;for(let e=0;e<8;e++)t=1&t?3988292384^t>>>1:t>>>1;U[l]=t}function x(l){let t=4294967295;for(let e=0,i=l.length;e<i;e++)t=U[255&(t^l[e])]^t>>>8;return(4294967295^t)>>>0}function z(l){return[255&l,l>>8&255,l>>16&255,l>>24&255]}const v=[],d=[];let f=new A;v.push(f);let _=0,b=0,D=!1,R=1024*1024*1024,H=!1,L="",E="";self.onmessage=async l=>{const{data:{action:t,zipSize:e,keepExt:i,outputExt:r,file:o,index:a,path:s,imageType:h},ports:u}=l;switch(t){case"set-port":{const n=u[0];n.onmessage=c=>q(c,n);return}case"set-config":R=e,H=!!i,L=r||"",E=h||"";break;case"squeeze":D=!0,setTimeout(()=>B("squeeze-zip"),10);break;case"clear":f.clear(),b=0,_=0;break;case"add-filelist":{_>=R&&B("push-filelist-zip"),await f.add(s,o)&&(_+=o.size,b++);let c={action:"push-filelist",size:_,count:b};self.postMessage(c);break}case"squeeze-filelist":await new Promise(n=>setTimeout(n,10)),B("squeeze-filelist-zip");break;case"request-image":{let n=f,c=a;for(let p=0;p<d.length;p++){if(a<=d[p]-1){c=p>0?a-d[p-1]:a,n=v[p];break}if(p===d.length-1){c=a-d[p];break}}const y=n.get(c,E),m=n.getPathByIndex(c);let g={action:"respond-image",url:URL.createObjectURL(y),index:a,path:m,size:y.size};self.postMessage(g);break}}};const q=async(l,t)=>{let{data:{blob:e,path:i,fileId:r}}=l;if(D){t.postMessage({fileId:r,canceled:!0});return}i=i.replace(/^\//,""),H||(i=i.replace(/\.(jpe?g|jfif|pjpeg|pjp|gif|png|avif|webp|bmp|apng|ico)$/i,""));const o=2147483647;let a=i+"."+L,s=1;for(;s<=o&&f.has(a);s++){if(s===o)throw new Error(`failed to create valid output path. ${a}`);a=i+"_"+s+"."+L}const h=e.size;_+h>R&&B("push-zip"),_+=h,b++,await f.add(a,e);let u={action:"add-zip-completed",fileId:r};self.postMessage(u),t.postMessage({fileId:r,renamed:s>=2,outputPath:a})};function B(l){let t;try{const i=f,r=b,o=_;i.wait().then(()=>i.zip()).then(()=>(t={url:i.url(),action:l,size:o,count:r},new Promise(s=>setTimeout(s,0)))).then(()=>{self.postMessage(t)}).catch(a=>{})}catch{t={action:l==="squeeze-zip"?"zip-squeeze-error":"zip-error",size:_,count:b},self.postMessage(t)}const e=d.length?d[d.length-1]:0;d.push(f.count()+e),f=new A,v.push(f),b=0,_=0}})();
