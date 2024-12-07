const o="Ukrainian",e="🇺🇦",t='Пакетний конвертер AVIF у JPEG "Офлайн"',s="Це безкоштовна веб-програма для перетворення зображень AVIF або WebP в інші поширені формати, такі як JPEG або PNG, без зв'язку з сервером",i="Перетягування зображень AVIF для конвертації",n=["Це безкоштовна веб-програма для пакетного перетворення зображень AVIF (або WebP тощо) у поширені формати зображень, такі як JPEG, PNG","Він використовує вбудовану функцію браузера для перетворень, тому <strong>ніякі дані не надсилаються до жодного сервера</strong>, а отже, є швидким і безпечним","Перетворені зображення буде виведено у вигляді <strong>zip-файлу</strong>, якщо завантажено кілька зображень.",'Потрібна <a href="https://caniuse.com/avif" target="_self" style="color:red">останніша</a> версія Firefox або Chrome для завантаження зображень AVIF.'],a="Виберіть розширення цільового файлу",r={avif_only:'Тільки ".avif" або ".webp"',all_images:"Усі типи зображень",all_files:"Усі типи",edit_type:"Редагувати список розширень файлів"},l="Введіть список розділених комами розширень файлів для завантаження.<br>наприклад) .jpg,.gif,.png",c="Завантажити зображення",d="Виберіть ваші зображення у діалоговому вікні.<br>*Дозволяється багаторазовий вибір.",p="Завантажити цілу папку",g='Перетворити всі зображення у вибраній теці та її підтеках і додати перетворені зображення до ZIP-архіву з відносним шляхом.<br>* Програма покаже кнопку "Завантажити", але насправді нічого не завантажить на жоден сервер.',f="Перетворення зображень",u="Перервано",T="Деякі файли не вдалося перетворити",m="Завершено",h="Наразі зайнято",b="Файлів з такими розширеннями не знайдено.",v="Ваш браузер не підтримує формат AVIF. Будь ласка, використовуйте останню версію Firefox або Chrome для перетворення зображень AVIF.",y="Скасувати",D="Зберегти",F="Закрити",I="Відкрити",x="Переконвертувати",L="Переконвертувати попередньо вибрані {n} @:files",C="файл | файли",O="Ви ще не зберегли перетворені зображення.",S="Дані не збережено",U="Перетворене зображення було скопійовано до буфера обміну як DataURL.",A={expandLogTooltip:"Відображення всього журналу може значно знизити швидкість перетворення.",expandLog:"Показати весь журнал",autoScroll:"Автоматична прокрутка",showOnlyErrors:"Показувати лише помилки",log:"Журнал",elapsedTime:"Час, що минув",multiThreading:"Багатопотоковість",outputSettings:"Параметри виведення",totalSize:"Загальний розмір",totalFiles:"Кількість файлів",inputSize:"Розмір вводу",outputSize:"Вихідний розмір",filterSuccess:"Приховати завершений елемент",progressErrors:"Невдалі елементи",progressStarted:"Початі предмети",progressTotal:"Загальна кількість файлів",confirmDownloadMessage:"Розпочнеться завантаження файлів zip ({0}).",zippingProgress:"Хід архівування",zipFailedList:"Запакуйте невдалі файли в Zip",openFailedList:"Відкрити список невдалих файлів",table:{index:"індекс",status:"статус",core:"нитка",details:"файл"},saveFailedList:"Не вдалося зберегти список файлів",done:"зроблено",progressSuccess:"Завершені файли",downloadConvertedImage:"Завантажте перетворене зображення",failureZippingFailedFiles:"Помилка під час архівування невдалих файлів.",browseConvertedImages:"Перегляньте перетворені зображення",index:"Індекс",Original:"Раніше",Converted:"після",saveAllZipsTooltip:"Збережіть усі ZIP-файли"},M="Вимкнено",w=`нитка | 
нитки`,E="Завантажити",P={retainExtTooltip:"Нове розширення буде додано до оригінального розширення",retainOriginalExtension:"Зберегти оригінальне розширення файлу",qualitytooltip:"Встановити якість зображення для виводу",quality:"Якість зображення",ignoreExtTooltip:"Спробувати завантажити файли, які не мають розширення image",ignoreFileExtensions:"Завантажувати всі типи файлів",imageTypeTooltip:"Виберіть формат зображення для виводу",imageType:"Тип зображення",enableMultiThreads:"Увімкнути багатопотоковість",resetButtonTooltip:"Відновити всі налаштування за замовчуванням.",multiThreadsTooltip:"Перетворення зображень у багатопотокове",advancedSettings:"Розширені налаштування",shrinkImageTooltip:"Якщо розміри зображення більші за вказане значення, зменште зображення до цього значення",shrinkImage:"Зменшити зображення, які перевищують наступні розміри",useFolderNameForZip:"Використовуйте випущену назву папки для файлу zip",useFolderNameForZipTooltip:"Якщо папку скинуто або вибрано, її ім’я використовується як ім’я вихідного файлу ZIP"},k="Відкритий код",N="Скопійовано в буфер обміну",R="Відкрийте перетворене зображення",V="Скопіюйте перетворене зображення як DataURL",z="Перетворити знову",Z="Скинути",G="Виберіть свою мову",_="Назад",W="Не вдалося",J="Успіх",q="Попередня версія",K="Висота",j="Ширина",B="Більше не показувати це повідомлення",H="Про попередження при виборі папки",Q="добре",X="Продовжити",Y="Скасувати",$="Тут потрібно натиснути кнопку «завантажити», щоб завантажити всі зображення в папці, але дані, завантажені цією програмою, насправді ніколи не «завантажуються» на сервер.",oo="Коли ви вибираєте папку замість файлу як вхідні дані на веб-сайті, основні веб-браузери відображатимуть попередження, подібне до зображення нижче.",eo="Якщо під час перетворення відображається повідомлення «Недостатньо пам’яті» і процес переривається, зменшіть або вимкніть кількість багатопотокових потоків у «Додаткових налаштуваннях».",to=`Ця сторінка може бути застарілою версією. 
Перезавантажте сторінку.`,so={lang:o,flags:e,title:t,metaDescription:s,droptarget:i,descriptions:n,fileTypeRadioTitle:a,fileTypeRadioOptions:r,editAcceptTypes:l,loadbutton:c,loadbuttontooltip:d,loadfolderbutton:p,loadfoldertooltip:g,processing:f,aborted:u,incomplete:T,completed:m,interfered:h,noimage:b,avifUnsupported:v,cancel:y,save:D,close:F,open:I,reconvert:x,reconvertTip:L,files:C,confirmCloseDialog:O,confirmCloseDialogTitle:S,copiedDataURLMessage:U,status:A,disabled:M,threads:w,Download:E,settings:P,githubOpenSource:k,copiedDataURLDialogTitle:N,convertedImageUrlTooltip:R,convertedImageDataUrlTooltip:V,convertAgain:z,reset:Z,selectLanguage:G,back:_,failed:W,success:J,previousVersion:q,height:K,width:j,checkboxTextDontShowThis:B,loadfolderNotifyingTitle:H,OK:Q,Continue:X,Cancel:Y,loadfolderNotifyingMessageTerm2:$,loadfolderNotifyingMessageTerm1:oo,annotationOutOfMemory:eo,errMsgWorkerLoadError:to};export{Y as Cancel,X as Continue,E as Download,Q as OK,u as aborted,eo as annotationOutOfMemory,v as avifUnsupported,_ as back,y as cancel,B as checkboxTextDontShowThis,F as close,m as completed,O as confirmCloseDialog,S as confirmCloseDialogTitle,z as convertAgain,V as convertedImageDataUrlTooltip,R as convertedImageUrlTooltip,N as copiedDataURLDialogTitle,U as copiedDataURLMessage,so as default,n as descriptions,M as disabled,i as droptarget,l as editAcceptTypes,to as errMsgWorkerLoadError,W as failed,r as fileTypeRadioOptions,a as fileTypeRadioTitle,C as files,e as flags,k as githubOpenSource,K as height,T as incomplete,h as interfered,o as lang,c as loadbutton,d as loadbuttontooltip,oo as loadfolderNotifyingMessageTerm1,$ as loadfolderNotifyingMessageTerm2,H as loadfolderNotifyingTitle,p as loadfolderbutton,g as loadfoldertooltip,s as metaDescription,b as noimage,I as open,q as previousVersion,f as processing,x as reconvert,L as reconvertTip,Z as reset,D as save,G as selectLanguage,P as settings,A as status,J as success,w as threads,t as title,j as width};
