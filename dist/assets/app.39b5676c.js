var Ze=(o,i)=>()=>(i||o((i={exports:{}}).exports,i),i.exports);import{d as Ee,r as f,u as Ye,a as Ke,o as Ne,w as se,b as L,c as H,e as g,f as Xe,n as et,F as K,g as u,h as t,i as Ae,j as e,N as Y,t as y,k as tt,l as ut,m as at,p as Ce,q as De,s as ot,v as xe,x as ke,y as Ie,z as Le,A as E,B as lt,C as O,D as Se,E as R,G,H as Te,I as F,J as Z,K as nt,L as Q,M as it,O as rt,P as st,Q as ct,R as dt,S as ft,T as pt,U as gt,V as vt,W as At,X as mt,Y as ht,Z as yt,_ as Et,$ as Ft,a0 as _t,a1 as Bt}from"./vendor.d9c76061.js";var su=Ze((Ue,ye)=>{(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))m(l);new MutationObserver(l=>{for(const v of l)if(v.type==="childList")for(const I of v.addedNodes)I.tagName==="LINK"&&I.rel==="modulepreload"&&m(I)}).observe(document,{childList:!0,subtree:!0});function c(l){const v={};return l.integrity&&(v.integrity=l.integrity),l.referrerpolicy&&(v.referrerPolicy=l.referrerpolicy),l.crossorigin==="use-credentials"?v.credentials="include":l.crossorigin==="anonymous"?v.credentials="omit":v.credentials="same-origin",v}function m(l){if(l.ep)return;l.ep=!0;const v=c(l);fetch(l.href,v)}})();var wt=function(){typeof ye=="object"&&typeof Ue=="object"&&(ye.exports=C);for(var o=typeof Uint8Array<"u",i=o?Uint8Array:Array,c=new(o?Uint32Array:Array)(256),m=0;m<256;m++){for(var l=m,v=0;v<8;v++)l=1&l?3988292384^l>>>1:l>>>1;c[m]=l}function I(s){var d=[];return encodeURIComponent(s).replace(/%(..)|(.)/g,function(D,B,_){d.push(B?parseInt(B,16):_.charCodeAt(0))}),o?new i(d):d}function A(s){return[255&s,s>>8&255,s>>16&255,s>>24&255]}function C(){this._d={},this._lfh=[],this._curLFHind=0,this._cdh=[],this._cdhLen=0,this._c=0}return C.prototype={add:function(s,d){if(!s)throw new Error("path is empty");if(s=String(s).replace(/\\/g,"/"),/\/{2,}|\\|^\/|^[a-z]+:/i.test(s))throw new Error('invalid path. containing a drive letter, a leading slash, or empty directory name: "'+s+'"');var D=0,B=0;if(d!==void 0){if(!/[^/]+$/.test(s))throw new Error('needs a file name: "'+s+'"');if(!((d=typeof d=="string"?I(d):d)instanceof i))try{if(!(d.buffer||d instanceof Array||d instanceof ArrayBuffer||d instanceof Buffer))throw new Error;d=new Uint8Array(d.buffer||d)}catch{throw new Error("data must be one of type Array, TypedArray, ArrayBuffer, Buffer, or string.")}if(this.has(s))throw new Error("the file already exists: "+s);D=d.length,B=function(P){for(var w=4294967295,M=0,$=P.length;M<$;M++)w=c[255&(w^P[M])]^w>>>8;return(4294967295^w)>>>0}(d)}for(var _=new Date,T=A(_.getFullYear()-1980<<25|_.getMonth()+1<<21|_.getDate()<<16|_.getHours()<<11|_.getMinutes()<<5|_.getSeconds()/2),S=s.replace(/\/+$/,"").split("/"),x="";S.length;){x+=S.shift();var z,N,k,b,U=d&&S.length===0;x+=U?"":"/",this._d[x]||(this._d[x]=!0,this._c++,N=(z=I(x)).length,b=A(k=U?D:0),this._lfh.push([80,75,3,4]),b=[10,0,0,8,0,0].concat(T,A(U?B:0),b,b,[255&N,N>>8&255,0,0]),this._lfh.push(b,z),this._cdh.push([80,75,1,2,10,0].concat(b,[0,0,0,0,0,0,U?0:16,0,0,0],A(this._curLFHind)),z),this._cdhLen+=46+N,this._curLFHind+=30+N+k)}d&&this._lfh.push(d)},has:function(s){return!!this._d[s.replace(/\/+$/,"")]},zip:function(){var s=[80,75,5,6,0,0,0,0,255&this._c,this._c>>8,255&this._c,this._c>>8].concat(A(this._cdhLen),A(this._curLFHind),[0,0]),d=this._lfh.concat(this._cdh,[s]);if(i===Array)B=[].concat.apply([],d);else for(var D=0,B=new i(this._curLFHind+this._cdhLen+s.length),_=0;_<d.length;_++){var T=d[_];B.set(T,D),D+=T.length}return B},url:function(){if(typeof Blob!="function"||typeof URL!="function")return null;var s=this.zip(),s=new Blob([s],{type:"application/zip"});return window.URL.createObjectURL(s)}},C}();let me=!1,ee=!1,re=["image/png"];const bt=Ee({name:"converter",emits:["mounted","start","progress","success","failure","complete","prevent","noimage","avifsupport","imgload"],props:{target:[HTMLElement,HTMLDocument],format:{type:String,default:re[0],validator(o){return re.includes(o)}},quality:{type:Number,default:95,validator(o){return o>=0&&o<=100}},accept:String,processing:Boolean,input:Array,sendmessage:Array,style:Object,retainExtension:Boolean},setup(o,i){const c=f(null);let m,l;if(o.target&&!(o.target instanceof Node))throw new Error("target attribute must be a HTMLElement");const v=f(null),I=f(null);Ye();const A=Ke();return Ne(async()=>{l=c.value.getContext("2d"),I.value=o.style;const C=v.value;m=o.target||C,Ct(m,l,i,o),re=It(),i.emit("mounted",{formats:re}),i.emit("avifsupport",await kt())}),se(()=>o.input,C=>{C.length&&ze(C,l,i,o)}),se(()=>o.sendmessage,([C={},s="info"])=>{if(/destroy/.test(C)){A.destroyAll();return}A[s](C)}),se(()=>o.processing,C=>{C||(ee=!0)}),{container:v,canvas:c}}});function Ct(o,i,c,m){document.ondragstart=l=>l.preventDefault(),document.ondragover=l=>l.preventDefault(),o.ondrop=async l=>{var v;l.preventDefault(),ze((v=l.dataTransfer)==null?void 0:v.files,i,c,m)}}function ze(o,i,c,m){if(me){c.emit("prevent");return}let l=Dt(o);if(m.accept&&(String(m.accept).toLowerCase(),l=l.filter(v=>m.accept.includes(v.name.replace(/^.+(\.[^.]+)$/,"$1").toLowerCase())),!l.length)){c.emit("noimage");return}me=!0,ee=!1,xt(l,i,c,m)}function Dt(o){let i;if(o instanceof Event)i=o.target.files;else if(o instanceof File)i=[o];else if(o instanceof FileList||o instanceof Array)i=o;else return console.log("could not find any file"),[];return[...i]}async function xt(o,i,c,m){const l=i.canvas,v=new wt,I=m.format,A=m.quality/100,C=[...I.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/,"jpg");c.emit("start",{list:o,length:o.length});const s=o.length;let d=0,D=0,B=0,_=null,T="",S="";for(const k of o){if(ee)break;const b=k.name,U=k.size,P=k.relativePath||k.webkitRelativePath,w=document.createElement("img");c.emit("progress",{file:k,name:b,success:D,failure:B,index:d,length:s}),d++,URL.revokeObjectURL(S),S=URL.createObjectURL(k);const M=he(w).then(()=>!0).catch(()=>!1);w.src=S;const $=await M;if(ee)break;if(!w.complete||!$){B++,c.emit("failure",{file:k,name:b,success:D,failure:B,index:d,length:s});continue}l.width=w.width,l.height=w.height,i.drawImage(w,0,0),c.emit("imgload",{width:w.width,height:w.height,img:w});const V=await new Promise(ue=>{const W=j=>{_=j,ue(j==null?void 0:j.arrayBuffer())};l.toBlob(W,I,A)});if(!V){console.log("failed to toBlob",b),B++,c.emit("failure",{name:b});continue}const J=V.byteLength,te=(P||b).replace(m.retainExtension?"":/\.(jpe?g|gif|png|avif|webp|bmp)$/i,"")+"."+C;v.add(te,V),D++,T=te,c.emit("success",{file:k,name:b,success:D,failure:B,index:d,length:s,inputSize:U,outputSize:J})}let x,z;if(_){x=URL.createObjectURL(_);const k=new FileReader;k.readAsDataURL(_),z=await he(k).then(b=>b.target.result)}const N=v.url();c.emit("complete",{aborted:ee,success:D,failure:B,index:d,length:s,zip:N,lastImage:x,lastImageDataURL:z,name:T}),me=!1}function kt(){const o="data:image/avif;base64,AAAAHGZ0eXBtaWYxAAAAAG1pZjFhdmlmbWlhZgAAAPJtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAABEAAAQABAAAAAAEWAAEAAAAgAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUltYWdlAAAAAHFpcHJwAAAAUmlwY28AAAAUaXNwZQAAAAAAAAAIAAAACAAAABBwYXNwAAAAAQAAAAEAAAAWYXYxQ4EgAAAKCDgIv2kBDQAgAAAAEHBpeGkAAAAAAwgICAAAABdpcG1hAAAAAAAAAAEAAQQBAoOEAAAAKG1kYXQKCDgIv2kBDQAgMhQWQAAASAAADAZuZXHwA9LzjNWygA==",i=document.createElement("img"),c=he(i).then(()=>!0,()=>!1);return i.src=o,c}function It(){const o=["image/png","image/jpeg","image/gif","image/bmp","image/avif","image/webp"],i=document.createElement("canvas");i.width=1,i.height=1;const c=[];for(const m of o)i.toDataURL(m).indexOf(m)>=0&&c.push(m);return c}function he(o){if(typeof o.onload>"u")throw new Error(`it doesn't have "onload" property.`);return new Promise((i,c)=>{o.onload=i,o.onerror=c})}const Lt=(o,i)=>{const c=o.__vccOpts||o;for(const[m,l]of i)c[m]=l;return c},St={ref:"canvas",width:"1",height:"1",style:{display:"none"}};function Tt(o,i,c,m,l,v){return L(),H(K,null,[g("div",{ref:"container",class:"droptarget",style:et(o.style)},[Xe(o.$slots,"default",{},void 0,!0)],4),g("canvas",St,null,512)],64)}const Nt=Lt(bt,[["render",Tt],["__scopeId","data-v-fdeaa45b"]]),zt=g("h3",null,"Used Framework and Libraries",-1),Ut=["href"],Pt=Ee({__name:"licenses",setup(o){const i=f(!1),c={Vite:"https://github.com/vitejs/vite/blob/main/LICENSE","Vite SSG":"https://github.com/antfu/vite-ssg/blob/main/LICENSE","Naive UI":"https://github.com/TuSimple/naive-ui/blob/main/LICENSE",Ionicons:"https://github.com/ionic-team/ionicons/blob/main/LICENSE"};return(m,l)=>(L(),H(K,null,[g("a",{href:"#",onClick:l[0]||(l[0]=v=>i.value=!0),style:{color:"black","font-size":"small"}},"Licenses"),u(e(Y),{preset:"dialog",ref:"dialog",show:i.value,"onUpdate:show":l[1]||(l[1]=v=>i.value=v),"positive-text":"OK",title:"Licenses"},{default:t(()=>[zt,g("ul",null,[(L(),H(K,null,Ae(c,(v,I)=>g("li",null,[g("a",{href:v},y(I),9,Ut)])),64))])]),_:1},8,["show"])],64))}}),jt=F(" English "),Ot=F(" Switch to English "),Rt=F(" \u65E5\u672C\u8A9E "),Mt=F(" \u65E5\u672C\u8A9E\u306B\u5207\u308A\u66FF\u3048 "),Ht={style:{"text-decoration":"underline",padding:"0px",margin:"0px","text-decoration-style":"double","text-align":"center"}},$t={style:{color:"black","word-break":"keep-all","overflow-wrap":"break-word"},href:"https://gitcobra.github.io/avif2jpeg/dist/"},Vt=["accept"],Gt=["innerHTML"],Qt=["innerHTML"],Jt=g("span",null,"Drag & Drop",-1),Wt=g("span",null,"AVIF Images",-1),qt=["innerHTML"],Zt={style:{"white-space":"nowrap"}},Yt={style:{color:"gray","padding-left":"20px"}},Kt=["innerHTML"],Xt=F("GitHub"),eu=g("br",null,null,-1),tu=["href"],uu=F("DataURI"),au={style:{"text-align":"right"}},ou={style:{"text-align":"right"}},lu={style:{position:"relative",width:"1px",height:"1px",overflow:"visible"}},nu={style:{position:"absolute",left:"4px",top:"-16px",transform:"rotate(25deg)",overflow:"visible"}},iu=g("span",{style:{position:"absolute",left:"28px",bottom:"4px",transform:"rotate(25deg)","white-space":"nowrap","font-size":"small","font-family":"impact",color:"rgba(0,255,0, 0.5)"}},"ZIP",-1),ce=Ee({__name:"App",setup(o){const i={title:'AVIF to JPEG "Offline" Batch Converter',metaDescription:"It is a free web application to convert AVIF or WebP images to other common image formats such as JPEG or PNG without server communication.",droptarget:"Drag & Drop AVIF Images to Convert",descriptions:["This is a free web application to batch convert AVIF(or WebP, etc) images to common image formats such as JPEG, PNG.","It uses a browser's built-in function for the conversions, so <strong>no data will be sent</strong> to a server and is therefore <strong>fast</strong> and <strong>safe</strong>.","The converted images will be output as <strong>a zip file</strong> when multiple images are loaded.",'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> version of Firefox or Chrome to load AVIF images.'],fileTypeRadioTitle:"Choose Target File Extentions",fileTypeRadioOptions:{avif_only:'Only ".avif" or ".webp"',all_images:"All Image Types",all_files:"All Types"},quality:"Image Quality",qualitytooltip:"Set image quality for output",imageType:"Image Type",imageTypeTooltip:"Choose image format for output",retainOriginalExtension:"Keep Original File Extension",retainExtTooltip:"New extension will be appended to original extension",ignoreFileExtensions:"Load All File Types",ignoreExtTooltip:"Try to load files that don't have image file extension",loadbutton:"Load Images",loadbuttontooltip:"Select your images from a dialog window.<br>*Multiple selection allowed.",loadfolderbutton:"Load A Whole Folder",loadfoldertooltip:`
    Convert all images in the selected folder and its subfolders, and add the converted images to a ZIP archive with relative path.<br>
    *It will show "Upload" button, but it actually doesn't upload anything to a server.
  `,processing:"Converting images",aborted:"Aborted",incomplete:"Some files failed to convert",completed:"Completed",interfered:"Currently Busy",noimage:"No files with the extentions were found.",avifUnsupported:"Your browser does not support AVIF format. Please use latest version of Firefox or Chrome to convert AVIF images.",cancel:"Cancel",inputSize:"Input Size",outputSize:"Output Size",save:"Save",close:"Close",open:"Open",confirmCloseDialog:"You have not saved the converted images yet.",confirmCloseDialogTitle:"Data have not been saved"},c={title:"AVIF\u304B\u3089JPEG\u3078 \u30AA\u30D5\u30E9\u30A4\u30F3\u4E00\u62EC\u753B\u50CF\u5909\u63DB",metaDescription:"AVIF\u30FBWebP\u5F62\u5F0F\u306E\u753B\u50CF\u3092JPEG\u3084PNG\u7B49\u3078\u30AA\u30D5\u30E9\u30A4\u30F3\u3067\u4E00\u62EC\u5909\u63DB\u3059\u308B\u7121\u6599\u30C4\u30FC\u30EB",droptarget:"\u5909\u63DB\u3057\u305F\u3044AVIF\u753B\u50CF\u3092\u30C9\u30E9\u30C3\u30B0&\u30C9\u30ED\u30C3\u30D7\u3057\u3066\u4E0B\u3055\u3044",descriptions:["\u3053\u308C\u306FAVIF\u3001\u53C8\u306FWebP\u5F62\u5F0F\u306E\u753B\u50CF\u3092\u3001JPEG\u3001PNG\u7B49\u306E\u4E00\u822C\u7684\u306A\u5F62\u5F0F\u3078\u4E00\u62EC\u5909\u63DB\u3059\u308B\u305F\u3081\u306E\u7121\u6599Web\u30A2\u30D7\u30EA\u3067\u3059\u3002","\u5909\u63DB\u51E6\u7406\u306F\u30D6\u30E9\u30A6\u30B6\u306E\u7D44\u307F\u8FBC\u307F\u6A5F\u80FD\u3092\u5229\u7528\u3059\u308B\u305F\u3081\u3001\u753B\u50CF\u30C7\u30FC\u30BF\u304C\u30B5\u30FC\u30D0\u30FC\u3078<strong>\u9001\u4FE1\u3055\u308C\u308B\u4E8B\u306F\u306A\u304F</strong>\u3001\u307E\u305F\u305D\u308C\u3086\u3048\u306B<strong>\u9AD8\u901F</strong>\u304B\u3064<strong>\u5B89\u5168</strong>\u3067\u3059\u3002","\u8907\u6570\u679A\u306E\u753B\u50CF\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u305F\u5834\u5408\u3001\u5909\u63DB\u3057\u305F\u753B\u50CF\u306F<strong>ZIP\u30D5\u30A1\u30A4\u30EB</strong>\u306B\u7E8F\u3081\u3066\u51FA\u529B\u3055\u308C\u307E\u3059\u3002",'AVIF\u753B\u50CF\u306E\u30ED\u30FC\u30C9\u306B\u306F<a href="https://caniuse.com/?search=avif" target="_self" style="color:red">\u6700\u65B0</a>\u306EFirefox\u53C8\u306FChrome\u304C\u5FC5\u8981\u3067\u3059\u3002'],fileTypeRadioTitle:"\u5909\u63DB\u5BFE\u8C61\u30D5\u30A1\u30A4\u30EB\u306E\u62E1\u5F35\u5B50\u3092\u6307\u5B9A",fileTypeRadioOptions:{avif_only:'".avif" \u53C8\u306F ".webp" \u306E\u307F',all_images:"\u5168\u3066\u306E\u753B\u50CF\u5F62\u5F0F",all_files:"\u5168\u3066\u306E\u5F62\u5F0F"},quality:"\u753B\u8CEA\u8A2D\u5B9A",qualitytooltip:"\u51FA\u529B\u3059\u308B\u753B\u50CF\u306E\u30AF\u30AA\u30EA\u30C6\u30A3\u3092\u6307\u5B9A\u3057\u307E\u3059",imageType:"\u753B\u50CF\u5F62\u5F0F",imageTypeTooltip:"\u51FA\u529B\u3059\u308B\u753B\u50CF\u306E\u5F62\u5F0F\u3092\u6307\u5B9A\u3057\u307E\u3059",retainOriginalExtension:"\u5143\u306E\u62E1\u5F35\u5B50\u3092\u4FDD\u6301\u3059\u308B",retainExtTooltip:"\u5143\u306E\u62E1\u5F35\u5B50\u306E\u5F8C\u308D\u306B\u65B0\u3057\u3044\u62E1\u5F35\u5B50\u3092\u4ED8\u52A0\u3057\u307E\u3059",ignoreFileExtensions:"\u5168\u3066\u306E\u62E1\u5F35\u5B50\u3092\u8AAD\u307F\u8FBC\u3080",ignoreExtTooltip:"\u753B\u50CF\u62E1\u5F35\u5B50\u4EE5\u5916\u306E\u30D5\u30A1\u30A4\u30EB\u3082\u30ED\u30FC\u30C9\u3067\u304D\u308B\u304B\u8A66\u884C\u3057\u307E\u3059",loadbutton:"\u753B\u50CF\u3092\u30ED\u30FC\u30C9",loadbuttontooltip:"\u30C0\u30A4\u30A2\u30ED\u30B0\u3092\u958B\u3044\u3066\u753B\u50CF\u3092\u9078\u629E\u3057\u307E\u3059<br>\u203B\u8907\u6570\u30D5\u30A1\u30A4\u30EB\u9078\u629E\u53EF",loadfolderbutton:"\u30D5\u30A9\u30EB\u30C0\u3054\u3068\u30ED\u30FC\u30C9",loadfoldertooltip:`
    \u9078\u629E\u3057\u305F\u30D5\u30A9\u30EB\u30C0\u3068\u30B5\u30D6\u30D5\u30A9\u30EB\u30C0\u306E\u5168\u3066\u306E\u753B\u50CF\u306B\u5BFE\u3057\u3066\u5909\u63DB\u51E6\u7406\u3092\u884C\u3044\u3001ZIP\u66F8\u5EAB\u3078\u76F8\u5BFE\u30D1\u30B9\u3067\u683C\u7D0D\u3057\u307E\u3059\u3002<br>
    \u203B\u300C\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u300D\u3068\u3044\u3046\u30DC\u30BF\u30F3\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u304C\u5B9F\u969B\u306B\u306F\u30B5\u30FC\u30D0\u30FC\u3078\u306E\u30D5\u30A1\u30A4\u30EB\u306E\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306F\u884C\u308F\u308C\u307E\u305B\u3093\u3002
  `,processing:"\u753B\u50CF\u5909\u63DB\u4E2D",aborted:"\u4E2D\u65AD",incomplete:"\u5909\u63DB\u306B\u5931\u6557\u3057\u305F\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u3059",completed:"\u5909\u63DB\u7D42\u4E86",interfered:"\u65E2\u306B\u51E6\u7406\u4E2D\u3067\u3059",noimage:"\u3053\u306E\u62E1\u5F35\u5B50\u306E\u30D5\u30A1\u30A4\u30EB\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002",avifUnsupported:"\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306FAVIF\u5F62\u5F0F\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093\u3002AVIF\u753B\u50CF\u3092\u5909\u63DB\u3059\u308B\u5834\u5408\u306F\u6700\u65B0\u7248\u306EFirefox\u53C8\u306FGoogle Chrome\u3092\u4F7F\u7528\u3057\u3066\u4E0B\u3055\u3044\u3002",cancel:"\u30AD\u30E3\u30F3\u30BB\u30EB",inputSize:"\u5165\u529B\u30B5\u30A4\u30BA",outputSize:"\u51FA\u529B\u30B5\u30A4\u30BA",save:"\u4FDD\u5B58",close:"\u9589\u3058\u308B",open:"\u958B\u304F",confirmCloseDialog:"\u307E\u3060\u5909\u63DB\u3057\u305F\u30D5\u30A1\u30A4\u30EB\u3092\u4FDD\u5B58\u3057\u3066\u3044\u307E\u305B\u3093\u3002",confirmCloseDialogTitle:"\u5909\u63DB\u30D5\u30A1\u30A4\u30EB\u304C\u672A\u4FDD\u5B58"},m="0.013",l=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent),v=document,I=f([{label:"image/png",value:"image/png"}]),A=tt({imageFormat:"image/png",imageQuality:90,retainExtension:!1,expandExtButtons:!1});f(!1);const C=["avif_only","all_images","all_files"],s=f(C[0]),d={avif_only:".avif,.webp",all_images:".jpg,.jpeg,.gif,.png,.webp,.avif,.bmp",all_files:""},D=f(0),B=f(0),_=f(0),T=f(0),S=f(!0),x=f(!1),z=f(!1),N=f(!1),k=f(!1),b=f(!1);f(!1);const U=f(!1),P=f(!1),w=f(""),M=f(""),$=f(0),V=f(0),J=f(null),te=ut(()=>{switch(w.value){case r.value.completed:return T.value===B.value?"success":"warning";case r.value.aborted:return"error";case r.value.incomplete:return"warning";default:return"info"}}),ue=f(null),W=f([]),j=f(null),ae=f(""),oe=f(""),le=f(null),ne=f(null),r=f(i),q=f(!1);let de=f(Ie),fe=f(Le),pe=!1;se(q,(p,a)=>{p?(de.value=Ce,fe.value=De,r.value=c):(de.value=Ie,fe.value=Le,r.value=i)});const Fe=at().currentRoute.value.path;(/\/ja\b/.test(Fe)||/^\/?$/.test(Fe)&&/^ja\b/i.test(We()))&&(q.value=!0,de.value=Ce,fe.value=De,r.value=c),ot({title:r.value.title,meta:[{property:"og:title",content:r.value.title},{property:"og:description",content:r.value.metaDescription}]}),Ne(()=>{document.querySelector("head").removeChild(document.getElementById("svgfix")),le.value.oninput=ne.value.oninput=Pe,_e(),window.addEventListener("resize",_e);const p="avif2jpeg",a=JSON.parse(localStorage.getItem(p)||"{}");for(const h in A)a.hasOwnProperty(h)&&(A[h]=a[h]);window.addEventListener("unload",()=>{const h={};for(const n in A)h[n]=A[n];localStorage.setItem(p,JSON.stringify(h))})});function Pe(p){const h=[...p.target.files];ue.value=h,le.value.value="",ne.value.value=""}function je({formats:p}){I.value=p.map(h=>({value:h,label:h}));const a=p.find(h=>/jpeg/i.test(h));a&&(A.imageFormat=a)}function Oe(){x.value=!1}function Re({length:p}){B.value=0,_.value=0,T.value=p,P.value=!0,x.value=!0,b.value=!1,D.value=0,ae.value="",oe.value="",$.value=0,V.value=0,pe=!1,k.value=!1,w.value=r.value.processing,X=null}function Me({length:p,index:a,name:h}){B.value=a,D.value=a/p*100|0,w.value=r.value.processing,M.value=`${h}`}let X=null;function He({img:p,width:a,height:h}){X&&(X.remove(),X.src="");const n=a/h;a>h?(a=120,h=a/n):(h=90,a=h*n),p.style.width=a+"px",p.style.height=h+"px",J.value&&(J.value.innerHTML="",J.value.appendChild(p)),X=p}function $e({name:p,index:a,success:h,inputSize:n,outputSize:ge}){_.value=h,$.value+=n,V.value+=ge}function Ve({name:p}){W.value=[{description:`${p}`,duration:0},"warning"]}function Ge({index:p,zip:a,aborted:h,success:n,length:ge,lastImage:we,lastImageDataURL:be,name:qe}){const ie=j.value;if(n===1){ie.download=qe;let ve=we;ie.href=ve,ae.value=we,be&&(oe.value=be)}else{const ve=new Date;ie.download="avif2jpeg_"+A.imageFormat.replace(/^image\//,"")+"_"+ve.getTime()+".zip",ie.href=a,k.value=!0}h||(D.value=100),B.value=p,n===ge?w.value=r.value.completed:w.value=h?r.value.aborted:r.value.incomplete,x.value=!1}function _e(){const p=document.body.clientWidth,a=document.body.clientHeight;S.value=p*.75>a||p>900}function Qe(){W.value=["destroy"],_.value>1&&!pe?b.value=!0:j.value.href=""}function Be(){j.value.click(),pe=!0}function Je(p){try{navigator.clipboard.writeText(p)}catch{}}function We(){const p=window.navigator;return p.language||p.userLanguage||p.browserLanguage}return(p,a)=>{const h=Ft("router-link");return L(),H(K,null,[u(e(E),{vertical:"",align:"stretch",justify:"space-between",style:{height:"100%",width:"100%"}},{default:t(()=>[u(e(E),{justify:"end",align:"end",style:{"box-sizing":"border-box",padding:"4px",margin:"0px"}},{default:t(()=>[u(e(lt),{size:"tiny",style:{padding:"4px"}},{default:t(()=>[u(e(O),{trigger:"hover","keep-alive-on-hover":!1},{trigger:t(()=>[u(h,{to:{path:"/en"}},{default:t(()=>[u(e(Se),null,{default:t(()=>[u(e(R),{color:q.value?"":"red",onClick:a[0]||(a[0]=n=>q.value=!1)},{default:t(()=>[jt]),_:1},8,["color"])]),_:1})]),_:1})]),default:t(()=>[Ot]),_:1}),u(h,{to:{path:"/ja"}},{default:t(()=>[u(e(O),{trigger:"hover","keep-alive-on-hover":!1},{trigger:t(()=>[u(e(R),{color:q.value?"red":"",onClick:a[1]||(a[1]=n=>q.value=!0)},{default:t(()=>[Rt]),_:1},8,["color"])]),default:t(()=>[Mt]),_:1})]),_:1})]),_:1})]),_:1}),u(e(E),{vertical:"",justify:"center"},{default:t(()=>[g("h1",Ht,[g("a",$t,y(r.value.title),1)])]),_:1}),u(e(E),{vertical:"",align:"center",justify:"center"},{default:t(()=>[u(e(E),{vertical:"",align:"stretch",justify:"center"},{default:t(()=>[g("input",{ref_key:"fileinput",ref:le,type:"file",multiple:"",accept:d[s.value],style:{display:"none"}},null,8,Vt),u(e(O),{trigger:"hover","keep-alive-on-hover":!1,placement:S.value?"left":"top",duration:0,delay:300},{trigger:t(()=>[u(e(R),{round:"",onClick:a[2]||(a[2]=n=>le.value.click()),style:{width:"100%"}},{default:t(()=>[u(e(G),{size:"large",color:"gray"},{default:t(()=>[u(e(Te))]),_:1}),F(" "+y(r.value.loadbutton),1)]),_:1})]),default:t(()=>[g("div",{innerHTML:r.value.loadbuttontooltip},null,8,Gt)]),_:1},8,["placement"]),g("input",{webkitdirectory:"",directory:"",ref_key:"folderinput",ref:ne,type:"file",style:{display:"none"}},null,512),e(l)?Q("",!0):(L(),Z(e(O),{key:0,trigger:"hover",placement:"bottom","keep-alive-on-hover":!1,style:{"max-width":"90vw"},duration:0,delay:300},{trigger:t(()=>[u(e(R),{round:"",onClick:a[3]||(a[3]=n=>ne.value.click()),style:{width:"100%"}},{default:t(()=>[u(e(G),{size:"large",color:"gray"},{default:t(()=>[u(e(nt))]),_:1}),F(" "+y(r.value.loadfolderbutton),1)]),_:1})]),default:t(()=>[g("div",{innerHTML:r.value.loadfoldertooltip},null,8,Qt)]),_:1}))]),_:1}),u(e(it),{"display-directive":"show","expanded-names":A.expandExtButtons?["extItem"]:"","on-update:expanded-names":n=>A.expandExtButtons=!!String(n)},{default:t(()=>[u(e(rt),{title:r.value.fileTypeRadioTitle,name:"extItem"},{default:t(()=>[u(e(st),{value:s.value,"onUpdate:value":a[4]||(a[4]=n=>s.value=n),name:"filetyperadios",size:"small"},{default:t(()=>[u(e(E),{vertical:"",style:{"padding-left":"1em"}},{default:t(()=>[(L(),H(K,null,Ae(C,n=>u(e(O),{key:n,trigger:"hover","keep-alive-on-hover":!1},{trigger:t(()=>[u(e(_t),{value:n},{default:t(()=>[F(y(r.value.fileTypeRadioOptions[n]),1)]),_:2},1032,["value"])]),default:t(()=>[F(" "+y(d[n]||".*"),1)]),_:2},1024)),64))]),_:1})]),_:1},8,["value"])]),_:1},8,["title"])]),_:1},8,["expanded-names","on-update:expanded-names"])]),_:1}),u(e(ct),{placement:"top-right"},{default:t(()=>[u(e(dt),{closable:!0,"container-style":"font-size:xx-small;"},{default:t(()=>[u(Nt,{target:e(v),format:A.imageFormat,quality:A.imageQuality,input:ue.value,sendmessage:W.value,processing:x.value,accept:d[s.value],"retain-extension":A.retainExtension,onMounted:je,onStart:Re,onProgress:Me,onSuccess:$e,onFailure:Ve,onComplete:Ge,onPrevent:a[5]||(a[5]=n=>{z.value=!0}),onNoimage:a[6]||(a[6]=n=>N.value=!0),onAvifsupport:a[7]||(a[7]=n=>U.value=!n),onImgload:He},{default:t(()=>[e(l)?Q("",!0):(L(),Z(e(O),{key:0,trigger:"hover","keep-alive-on-hover":!1,placement:"bottom",duration:0,delay:300},{trigger:t(()=>[u(e(E),{align:"stretch",style:{"text-align":"center",color:"silver",padding:"2em","overflow-wrap":"break-word","word-break":"keep-all",border:"6px dashed #EEE","border-radius":"1em"}},{default:t(()=>[u(e(E),null,{default:t(()=>[u(e(G),{size:"64",color:"silver",class:"test"},{default:t(()=>[u(e(ft))]),_:1})]),_:1}),u(e(E),{vertical:"",style:{"font-weight":"bold","font-size":"x-large"}},{default:t(()=>[Jt,Wt]),_:1})]),_:1})]),default:t(()=>[g("h3",{innerHTML:r.value.droptarget},null,8,qt)]),_:1}))]),_:1},8,["target","format","quality","input","sendmessage","processing","accept","retain-extension"])]),_:1})]),_:1}),u(e(E),{justify:"center"},{default:t(()=>[u(e(E),{vertical:"",align:"start"},{default:t(()=>[u(e(O),{trigger:"hover",placement:S.value?"left":"top-start","keep-alive-on-hover":!1,duration:0,delay:300},{trigger:t(()=>[u(e(E),{align:"center"},{default:t(()=>[u(e(G),null,{default:t(()=>[u(e(Te))]),_:1}),F(y(r.value.imageType)+": ",1),u(e(pt),{size:"small",value:A.imageFormat,"onUpdate:value":a[8]||(a[8]=n=>A.imageFormat=n),options:I.value,"consistent-menu-width":!1},null,8,["value","options"])]),_:1})]),default:t(()=>[F(" "+y(r.value.imageTypeTooltip),1)]),_:1},8,["placement"]),u(e(O),{trigger:"hover",placement:S.value?"left":"top-start","keep-alive-on-hover":!1,duration:0,delay:300},{trigger:t(()=>[u(e(E),{align:"center"},{default:t(()=>[u(e(E),{align:"start",wrap:!1},{default:t(()=>[u(e(G),null,{default:t(()=>[u(e(gt))]),_:1}),g("span",Zt,y(r.value.quality)+":",1),u(e(E),{align:"center",justify:"space-between"},{default:t(()=>[u(e(vt),{tooltip:!1,value:A.imageQuality,"onUpdate:value":a[9]||(a[9]=n=>A.imageQuality=n),step:1,style:{width:"120px"},disabled:/png|bmp/.test(A.imageFormat)},null,8,["value","disabled"]),u(e(At),{style:{width:"90px"},size:"small",value:A.imageQuality,"onUpdate:value":a[10]||(a[10]=n=>A.imageQuality=n),step:"1",min:"0",max:"100",disabled:/png/.test(A.imageFormat)},null,8,["value","disabled"])]),_:1})]),_:1})]),_:1})]),default:t(()=>[F(" "+y(r.value.qualitytooltip),1)]),_:1},8,["placement"]),u(e(O),{trigger:"hover",placement:S.value?"left":"bottom-start","keep-alive-on-hover":!1,duration:0,delay:300},{trigger:t(()=>[u(e(mt),{checked:A.retainExtension,"onUpdate:checked":a[11]||(a[11]=n=>A.retainExtension=n)},{default:t(()=>[F(y(r.value.retainOriginalExtension),1)]),_:1},8,["checked"])]),default:t(()=>[F(" "+y(r.value.retainExtTooltip),1)]),_:1},8,["placement"])]),_:1})]),_:1}),u(e(E),{justify:"center"},{default:t(()=>[g("ul",Yt,[(L(!0),H(K,null,Ae(r.value.descriptions,n=>(L(),H("li",{key:n,style:{"text-align":"left"},innerHTML:n},null,8,Kt))),128))])]),_:1}),u(e(E),{justify:"center",align:"baseline"},{default:t(()=>[g("p",{style:{"font-size":"x-small","text-align":"center",margin:"0px"}}," v"+y(m)),u(e(E),{align:"center"},{default:t(()=>[u(e(E),{align:"center"},{default:t(()=>[u(e(Se),{href:"https://github.com/gitcobra/avif2jpeg",style:{color:"black","font-size":"small"}},{default:t(()=>[u(e(G),null,{default:t(()=>[u(e(ht))]),_:1}),Xt]),_:1})]),_:1}),u(e(E),{align:"center"},{default:t(()=>[u(Pt)]),_:1})]),_:1})]),_:1})]),_:1}),u(e(Y),{show:N.value,"onUpdate:show":a[12]||(a[12]=n=>N.value=n),preset:"dialog",type:"error",title:"Images Not Found","positive-text":"OK"},{default:t(()=>[F(y(r.value.noimage),1),eu,F(y(d[s.value]||"*."),1)]),_:1},8,["show"]),u(e(Y),{show:U.value,"onUpdate:show":a[13]||(a[13]=n=>U.value=n),preset:"dialog",type:"warning",title:"Unsupported","positive-text":"OK"},{default:t(()=>[F(y(r.value.avifUnsupported),1)]),_:1},8,["show"]),u(e(Y),{show:b.value,"onUpdate:show":a[14]||(a[14]=n=>b.value=n),preset:"dialog",type:"warning",title:r.value.confirmCloseDialogTitle,"positive-text":r.value.save,"negative-text":r.value.close,maskClosable:!1,onPositiveClick:Be},{default:t(()=>[F(y(r.value.confirmCloseDialog),1)]),_:1},8,["show","title","positive-text","negative-text"]),u(e(Y),{show:P.value,"onUpdate:show":a[17]||(a[17]=n=>P.value=n),closable:!x.value,"close-on-esc":!x.value,onMaskClick:a[18]||(a[18]=n=>W.value=["destroy"]),preset:"dialog",title:w.value,type:e(te),"mask-closable":!1,"on-after-leave":Qe},{default:t(()=>[u(e(E),{vertical:"",align:"center"},{default:t(()=>[u(e(yt),{type:"circle",percentage:D.value,color:"lime","indicator-text-color":"black","rail-color":"silver"},{default:t(()=>[u(e(E),{vertical:"",align:"center",justify:"center"},{default:t(()=>[u(e(E),{style:{"font-size":"x-large"}},{default:t(()=>[F(y(D.value)+"%",1)]),_:1}),u(e(E),{style:{"font-size":"xx-small"}},{default:t(()=>[F("( "+y(_.value)+" / "+y(T.value)+" )",1)]),_:1})]),_:1})]),_:1},8,["percentage"]),u(e(E),{vertical:"",align:"center","item-style":"overflow:hidden; text-overflow: ellipsis; white-space:nowrap;"},{default:t(()=>[u(e(E),{style:{"font-size":"x-small"}},{default:t(()=>[g("span",null,y(M.value),1)]),_:1}),u(e(E),{vertical:"",style:{height:"90px"},align:"center",justify:"center"},{default:t(()=>[g("div",{ref_key:"thumbnail",ref:J},null,512)]),_:1}),u(e(E),null,{default:t(()=>[ae.value?(L(),H("a",{key:0,href:ae.value,target:"_blank"},[u(e(R),{round:"",size:"tiny"},{default:t(()=>[F(y(r.value.open),1)]),_:1})],8,tu)):Q("",!0),oe.value?(L(),Z(e(R),{key:1,round:"",size:"tiny",onClick:a[15]||(a[15]=n=>Je(oe.value))},{default:t(()=>[uu]),_:1})):Q("",!0)]),_:1})]),_:1}),g("table",null,[g("tr",null,[g("td",null,y(r.value.inputSize)+": ",1),g("td",au,y(($.value/1024|0).toLocaleString())+"KB",1)]),g("tr",null,[g("td",null,y(r.value.outputSize)+": ",1),g("td",ou,y((V.value/1024|0).toLocaleString())+"KB",1)])]),x.value?(L(),Z(e(R),{key:0,size:"large",ref:"cancelbutton",round:"",onClick:Oe},{default:t(()=>[F(y(r.value.cancel),1)]),_:1},512)):Q("",!0),u(e(E),{align:"center",vertical:""},{default:t(()=>[g("div",null,[!x.value&&_.value?(L(),Z(e(R),{key:0,size:"large",round:"",onClick:Be,color:"lime"},{default:t(()=>[F(y(r.value.save),1)]),_:1})):Q("",!0),xe(g("span",lu,[g("span",nu,[u(e(G),{depth:"4",size:"30",color:"lime"},{default:t(()=>[u(e(Et))]),_:1}),iu])],512),[[ke,k.value]])]),x.value?Q("",!0):(L(),Z(e(R),{key:0,onClick:a[16]||(a[16]=n=>P.value=!1),round:"",size:"small",style:{"font-size":"small","margin-top":"1em"}},{default:t(()=>[F(y(r.value.close),1)]),_:1}))]),_:1})]),_:1})]),_:1},8,["show","closable","close-on-esc","title","type"]),xe(g("a",{ref_key:"downloadlink",ref:j,href:""},null,512),[[ke,!1]]),u(e(Y),{show:z.value,"onUpdate:show":a[19]||(a[19]=n=>z.value=n),preset:"dialog",type:"error","positive-text":"OK",title:"Busy"},{default:t(()=>[F(y(r.value.interfered),1)]),_:1},8,["show"])],64)}}}),ru=[{path:"/",name:"Home",component:ce},{path:"/ja",name:"Japanese",component:ce,meta:{title:"jpn"}},{path:"/en",name:"English",component:ce,meta:{title:"eng"}}];Bt(ce,{routes:ru,base:"/avif2jpeg/dist/"},({app:o,router:i,routes:c,isClient:m,initialState:l})=>{})});export default su();
