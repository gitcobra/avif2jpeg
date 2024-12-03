const e="Korean",o="🇰🇷",t="AVIF에서 JPEG로 '오프라인' 일괄 이미지 변환",s="AVIF, WebP 형식의 이미지를 JPEG, PNG 등으로 오프라인에서 일괄 변환하는 무료 툴",i="변환하고 싶은 AVIF 이미지를 드래그 앤 드롭하세요.",n=["AVIF 또는 WebP 형식의 이미지를 JPEG, PNG 등 일반적인 포맷으로 일괄 변환할 수 있는 무료 웹 앱입니다.","변환 과정은 브라우저에 내장된 기능을 이용하기 때문에 이미지 데이터가 서버로 전송되지 않기 때문에 빠르고 안전합니다.","여러 장의 이미지를 불러온 경우, 변환한 이미지를 <strong>ZIP 파일</strong>로 묶어 출력합니다.",'AVIF 이미지 로딩을 위해서는 <a href="https://caniuse.com/avif" target="_self" style="color:red">최신</a> 버전의 Firefox 또는 Chrome이 필요합니다.'],a="변환할 파일 확장자 지정",l={avif_only:'".avif" 또는 ".webp" 전용',all_images:"모든 이미지 형식",all_files:"모든 형식",edit_type:"확장자를 입력하여 지정"},r="로드할 파일 확장자 목록을 쉼표로 구분하여 지정해 주세요<br>예시) .jpg,.gif,.png",c="이미지 불러오기",p="대화상자를 열고 이미지를 선택합니다<br>※여러 파일 선택 가능",d="폴더별로 불러오기",g="선택한 폴더와 하위 폴더의 모든 이미지에 대해 변환 처리를 하여 ZIP 서고에 상대 경로로 저장합니다.<br>※'업로드' 버튼이 표시되지만 실제로는 서버에 파일을 업로드하지 않습니다.",u="이미지 변환 중",f="중단",T="변환에 실패한 파일이 있습니다.",m="변환 완료",v="이미 처리 중입니다",b="이 확장자를 가진 파일을 찾을 수 없습니다.",h="이 브라우저는 AVIF 형식을 지원하지 않으며, AVIF 이미지를 변환하려면 최신 버전의 Firefox 또는 Google Chrome을 사용하십시오.",F="취소",D="보존",I="닫기",y="열기",L="재변환",U="이전에 선택한 {n}개의 파일을 다시 변환합니다.",x="파일",A="아직 변환한 파일을 저장하지 않았습니다.",P="변환 파일이 저장되지 않음",S="변환된 이미지가 클립보드에 DataURL로 복사되었습니다.",R={expandLogTooltip:"전체 로그를 표시하면 변환 속도가 크게 저하될 수 있습니다.",expandLog:"전체 로그 표시",autoScroll:"자동 스크롤",showOnlyErrors:"오류만 표시",log:"통나무",elapsedTime:"경과 시간",multiThreading:"멀티스레딩",outputSettings:"출력 설정",totalSize:"전체 크기",totalFiles:"파일 수",inputSize:"입력 크기",outputSize:"출력 크기",filterSuccess:"완료된 항목 숨기기",progressErrors:"실패한 항목",progressStarted:"시작된 아이템",progressTotal:"총 파일 수",confirmDownloadMessage:"{0} zip 파일 다운로드가 시작됩니다.",zippingProgress:"압축 진행",zipFailedList:"실패한 파일을 Zip으로 압축",openFailedList:"실패한 파일 목록 열기",table:{index:"색인",status:"상태",core:"실",details:"파일"},saveFailedList:"저장 실패 파일 목록",done:"완료",progressSuccess:"완성된 파일",downloadConvertedImage:"변환된 이미지 다운로드",failureZippingFailedFiles:"실패한 파일을 압축하는 중 오류가 발생했습니다.",browseConvertedImages:"변환된 이미지 찾아보기",index:"색인",Original:"전에",Converted:"후에"},w="장애가 있는",C=`스레드 | 
스레드`,E="다운로드",V={retainExtTooltip:"원래 확장자 뒤에 새로운 확장자를 추가합니다.",retainOriginalExtension:"원래의 확장자 유지",qualitytooltip:"출력할 이미지의 품질을 지정합니다.",quality:"화질 설정",ignoreExtTooltip:"이미지 확장자가 아닌 다른 파일도 로드할 수 있는지 시도합니다.",ignoreFileExtensions:"모든 확장자 불러오기",imageTypeTooltip:"출력할 이미지 형식을 지정합니다.",imageType:"이미지 형식",enableMultiThreads:"멀티스레딩 활성화",resetButtonTooltip:"모든 설정을 기본값으로 복원합니다.",multiThreadsTooltip:"멀티스레드에서 이미지 변환",advancedSettings:"고급 설정",shrinkImageTooltip:"이미지 크기가 지정된 값보다 크면 이미지를 해당 값으로 축소합니다.",shrinkImage:"다음 치수를 초과하는 이미지 축소",useFolderNameForZip:"zip 파일에 삭제된 폴더 이름 사용",useFolderNameForZipTooltip:"폴더를 삭제하거나 선택하면 해당 이름이 출력 ZIP 파일의 이름으로 사용됩니다."},z="오픈 소스",O="클립보드에 복사됨",Z="변환된 이미지 열기",G="변환된 이미지를 DataURL로 복사하세요.",k="다시 변환",_="다시 놓기",M="언어를 선택하세요",N="뒤쪽에",J="실패한",q="성공",W="이전 버전",j="키",B="너비",K={lang:e,flags:o,title:t,metaDescription:s,droptarget:i,descriptions:n,fileTypeRadioTitle:a,fileTypeRadioOptions:l,editAcceptTypes:r,loadbutton:c,loadbuttontooltip:p,loadfolderbutton:d,loadfoldertooltip:g,processing:u,aborted:f,incomplete:T,completed:m,interfered:v,noimage:b,avifUnsupported:h,cancel:F,save:D,close:I,open:y,reconvert:L,reconvertTip:U,files:x,confirmCloseDialog:A,confirmCloseDialogTitle:P,copiedDataURLMessage:S,status:R,disabled:w,threads:C,Download:E,settings:V,githubOpenSource:z,copiedDataURLDialogTitle:O,convertedImageUrlTooltip:Z,convertedImageDataUrlTooltip:G,convertAgain:k,reset:_,selectLanguage:M,back:N,failed:J,success:q,previousVersion:W,height:j,width:B};export{E as Download,f as aborted,h as avifUnsupported,N as back,F as cancel,I as close,m as completed,A as confirmCloseDialog,P as confirmCloseDialogTitle,k as convertAgain,G as convertedImageDataUrlTooltip,Z as convertedImageUrlTooltip,O as copiedDataURLDialogTitle,S as copiedDataURLMessage,K as default,n as descriptions,w as disabled,i as droptarget,r as editAcceptTypes,J as failed,l as fileTypeRadioOptions,a as fileTypeRadioTitle,x as files,o as flags,z as githubOpenSource,j as height,T as incomplete,v as interfered,e as lang,c as loadbutton,p as loadbuttontooltip,d as loadfolderbutton,g as loadfoldertooltip,s as metaDescription,b as noimage,y as open,W as previousVersion,u as processing,L as reconvert,U as reconvertTip,_ as reset,D as save,M as selectLanguage,V as settings,R as status,q as success,C as threads,t as title,B as width};