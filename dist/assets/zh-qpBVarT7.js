const e="Chinese",o="🇨🇳",t='AVIF 转 JPEG "离线" 批量转换器',s="这是一款免费的网络应用程序，可将 AVIF 或 WebP 图像转换为 JPEG 或 PNG 等其他常见图像格式，而无需进行服务器通信",i="拖放 AVIF 图像进行转换",n=["这是一款免费的网络应用程序，可将 AVIF（或 WebP 等）图像批量转换为 JPEG、PNG 等常见图像格式","它使用浏览器的内置功能进行转换，因此<strong>不会向任何服务器发送数据</strong>，既快速又安全","当加载多个图像时，转换后的图像将以 <strong>zip 文件</strong>的形式输出",'需要 <a href="https://caniuse.com/avif" target="_self" style="color:red">最新</a> 版本的 Firefox 或 Chrome 浏览器才能加载 AVIF 图像'],a="选择目标文件扩展名",r={avif_only:'只有 ".avif" 或 ".webp"',all_images:"所有图像类型",all_files:"所有类型",edit_type:"编辑文件扩展名列表"},l="输入要加载的逗号分隔的文件扩展名列表。<br>例如）.jpg、.gif、.png",c="加载图像",d="从对话窗口中选择图像<br>*允许多重选择",p="加载整个文件夹",g='转换所选文件夹及其子文件夹中的所有图像，并将转换后的图像添加到具有相对路径的 ZIP 压缩包中。<br>*它会显示 "Upload（上传）"按钮，但实际上它不会将任何东西上传到任何服务器上',f="转换图像",T="已中止",u="某些文件转换失败",m="已完成",h="当前正忙",v="未找到具有扩展名的文件",b="您的浏览器不支持 AVIF 格式。请使用最新版本的 Firefox 或 Chrome 浏览器转换 AVIF 图像",y="取消",F="保存",x="关闭",D="打开",I="重新转换",S="重新转换之前选定的 {n} @:files",L="文件 | 文件",C="您尚未保存转换后的图像",P="数据尚未保存",R="转换后的图像已作为 DataURL 复制到剪贴板。",z={expandLogTooltip:"显示整个日志可能会严重降低转换速度。",expandLog:"显示整个日志",autoScroll:"自动滚动",showOnlyErrors:"仅显示错误",log:"日志",elapsedTime:"经过时间",multiThreading:"多线程",outputSettings:"输出设置",totalSize:"总尺寸",totalFiles:"文件数量",inputSize:"输入大小",outputSize:"输出大小",filterSuccess:"隐藏已完成的项目",progressErrors:"不合格项目",progressStarted:"开始项目",progressTotal:"文件总数",confirmDownloadMessage:"它将开始下载 {0} 个 zip 文件。",zippingProgress:"压缩进度",zipFailedList:"将失败的文件打包到 Zip 中",openFailedList:"打开失败的文件列表",table:{index:"指数",status:"地位",core:"线",details:"文件"},saveFailedList:"保存失败的文件列表",done:"完毕",progressSuccess:"已完成的文件",downloadConvertedImage:"下载转换后的图像",failureZippingFailedFiles:"压缩失败的文件时失败。",browseConvertedImages:"浏览转换后的图像",index:"指数",Original:"前",Converted:"后",saveAllZipsTooltip:"保存所有 ZIP 文件",Shrinked:"缩小了",Shrinking:"收缩",convertedZips:"成功完成 ZIP",outInRate:"输出/输入比率",zipped:"压缩",saveAll:"保存全部",progressRetries:"重试文件",success:"成功",started:"开始",total:"全部的",files:"文件"},A="残疾人",E="thread | threads",O="下载",U={retainExtTooltip:"新扩展名将附加到原始扩展名上",retainOriginalExtension:"保留原始文件扩展名",qualitytooltip:"设置输出图像质量",quality:"图像质量",ignoreExtTooltip:"尝试加载没有图像文件扩展名的文件",ignoreFileExtensions:"加载所有文件类型",imageTypeTooltip:"选择输出图像格式",imageType:"图像类型",enableMultiThreads:"启用多线程",resetButtonTooltip:"将所有设置恢复为默认值。",multiThreadsTooltip:"在多线程中转换图像",advancedSettings:"高级设置",shrinkImageTooltip:"如果图像尺寸大于指定值，则将图像缩小到该值",shrinkImage:"缩小超过以下尺寸的图像",useFolderNameForZip:"使用 zip 文件的删除文件夹名称",useFolderNameForZipTooltip:"如果删除或选择文件夹，则其名称将用作输出 ZIP 文件的名称",maxZipFileSize:"最大 zip 文件大小",maxZipFileSizeTooltip:"如果出现内存问题，请设置较小的值。"},M="开源",N="已复制到剪贴板",Z="打开转换后的图像",w="将转换后的图像复制为 DataURL",k="再次转换",V="重置",G="选择您的语言",_="后退",W="失败的",J="成功",q="以前的版本",K="高度",j="宽度",B="不再显示此消息",H="关于选择文件夹时的警告",Q="好的",X="继续",Y="取消",$="您必须按此处的“上传”按钮才能加载文件夹中的所有图像，但此应用程序加载的数据实际上从未“上传”到服务器。",ee="当您在网站上选择文件夹而不是文件作为输入时，主要网络浏览器将显示如下图所示的警告。",oe=`此页面可能是过时的版本。
请重新加载页面。`,te="重新加载",se="如果转换过程经常失败，并且出现“不含内存”消息，请尝试减少或禁用“高级设置”中的“多线程”的数量。",ie="下一个",ne="以前的",ae="或者",re="目标文件扩展",le={lang:e,flags:o,title:t,metaDescription:s,droptarget:i,descriptions:n,fileTypeRadioTitle:a,fileTypeRadioOptions:r,editAcceptTypes:l,loadbutton:c,loadbuttontooltip:d,loadfolderbutton:p,loadfoldertooltip:g,processing:f,aborted:T,incomplete:u,completed:m,interfered:h,noimage:v,avifUnsupported:b,cancel:y,save:F,close:x,open:D,reconvert:I,reconvertTip:S,files:L,confirmCloseDialog:C,confirmCloseDialogTitle:P,copiedDataURLMessage:R,status:z,disabled:A,threads:E,Download:O,settings:U,githubOpenSource:M,copiedDataURLDialogTitle:N,convertedImageUrlTooltip:Z,convertedImageDataUrlTooltip:w,convertAgain:k,reset:V,selectLanguage:G,back:_,failed:W,success:J,previousVersion:q,height:K,width:j,checkboxTextDontShowThis:B,loadfolderNotifyingTitle:H,OK:Q,Continue:X,Cancel:Y,loadfolderNotifyingMessageTerm2:$,loadfolderNotifyingMessageTerm1:ee,errMsgWorkerLoadError:oe,Reload:te,annotationOutOfMemory:se,Next:ie,Prev:ne,or:ae,TargetFileTypeExt:re};export{Y as Cancel,X as Continue,O as Download,ie as Next,Q as OK,ne as Prev,te as Reload,re as TargetFileTypeExt,T as aborted,se as annotationOutOfMemory,b as avifUnsupported,_ as back,y as cancel,B as checkboxTextDontShowThis,x as close,m as completed,C as confirmCloseDialog,P as confirmCloseDialogTitle,k as convertAgain,w as convertedImageDataUrlTooltip,Z as convertedImageUrlTooltip,N as copiedDataURLDialogTitle,R as copiedDataURLMessage,le as default,n as descriptions,A as disabled,i as droptarget,l as editAcceptTypes,oe as errMsgWorkerLoadError,W as failed,r as fileTypeRadioOptions,a as fileTypeRadioTitle,L as files,o as flags,M as githubOpenSource,K as height,u as incomplete,h as interfered,e as lang,c as loadbutton,d as loadbuttontooltip,ee as loadfolderNotifyingMessageTerm1,$ as loadfolderNotifyingMessageTerm2,H as loadfolderNotifyingTitle,p as loadfolderbutton,g as loadfoldertooltip,s as metaDescription,v as noimage,D as open,ae as or,q as previousVersion,f as processing,I as reconvert,S as reconvertTip,V as reset,F as save,G as selectLanguage,U as settings,z as status,J as success,E as threads,t as title,j as width};
