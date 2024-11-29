const e="Russian",o="🇷🇺",t='AVIF в JPEG "Оффлайн" пакетный конвертер',s="Это бесплатное веб-приложение для преобразования изображений AVIF или WebP в другие распространенные форматы изображений, такие как JPEG или PNG, без связи с сервером",i="Перетаскивание AVIF-изображений для конвертирования",n=["Это бесплатное веб-приложение для пакетного преобразования изображений AVIF (или WebP, и т.д.) в распространенные форматы изображений, такие как JPEG, PNG.","Для конвертации используется встроенная функция браузера, поэтому <strong>данные не отправляются на сервер</strong>, а значит, это быстро и безопасно","При загрузке нескольких изображений преобразованные изображения будут выведены в виде <strong> zip-файла</strong>",'Требуется <a href="https://caniuse.com/avif" target="_self" style="color:red">последней</a> версии Firefox или Chrome для загрузки изображений AVIF.'],a="Выбор расширений целевых файлов",l={avif_only:'Только ".avif" или ".webp"',all_images:"Все типы изображений",all_files:"Все типы",edit_type:"Редактировать список расширений файлов"},r="Введите список расширений файлов, разделенных запятыми, для загрузки.<br>например) .jpg,.gif,.png",c="Загрузить изображения",p="Выберите изображения из диалогового окна.<br>* Допускается множественный выбор.",d="Загрузить целую папку",g='Преобразуйте все изображения в выбранной папке и ее подпапках и добавьте преобразованные изображения в ZIP-архив с относительным путем.<br>*Вы увидите кнопку "Загрузить", но на самом деле она ничего не загружает ни на какой сервер.',u="Преобразование изображений",f="Прервано",m="Некоторые файлы не удалось конвертировать",T="Завершено",b="В настоящее время занят",v="Файлы с расширениями не найдены",h="Ваш браузер не поддерживает формат AVIF. Пожалуйста, используйте последнюю версию Firefox или Chrome для конвертирования изображений в формате AVIF.",F="Отменить",D="Сохранить",I="Закрыть",y="Открыть",L="Переконвертировать",U="Повторное преобразование предыдущих выбранных {n} @:files",x="файл | файла",A="Вы еще не сохранили преобразованные изображения",P="Данные не были сохранены",R="Конвертированное изображение было скопировано в буфер обмена как DataURL.",S={expandLogTooltip:"Отображение всего журнала может серьезно снизить скорость конвертации.",expandLog:"Показать весь журнал",autoScroll:"Автоматическая прокрутка",showOnlyErrors:"Показать только ошибки",log:"Бревно",elapsedTime:"Прошедшее время",multiThreading:"Многопоточность",outputSettings:"Настройки вывода",totalSize:"Общий размер",totalFiles:"Количество файлов",inputSize:"Входной размер",outputSize:"Выходной размер",filterSuccess:"Скрыть завершенный элемент",progressErrors:"Неудачные элементы",progressStarted:"Начатые элементы",progressTotal:"Общее количество файлов",confirmDownloadMessage:"Начнется загрузка {0} zip-файлов.",zippingProgress:"Сжатие прогресса",zipFailedList:"Упаковать неудавшиеся файлы в ZIP-архивы",openFailedList:"Открыть список неудачных файлов",table:{index:"индекс",status:"статус",core:"нить",details:"файл"},saveFailedList:"Сохранить список неудачных файлов",done:"сделанный",progressSuccess:"Завершенные файлы",downloadConvertedImage:"Загрузить конвертированное изображение",failureZippingFailedFiles:"Сбой при архивировании неудавшихся файлов.",browseConvertedImages:"Просмотр конвертированных изображений",index:"Индекс"},w="Неполноценный",E=`нить | 
нити`,V="Скачать",z={retainExtTooltip:"Новое расширение будет добавлено к исходному расширению",retainOriginalExtension:"Сохранить исходное расширение файла",qualitytooltip:"Установить качество изображения для вывода",quality:"Качество изображения",ignoreExtTooltip:"Попробуйте загрузить файлы, которые не имеют расширения image",ignoreFileExtensions:"Загрузить все типы файлов",imageTypeTooltip:"Выберите формат изображения для вывода",imageType:"Тип изображения",enableMultiThreads:"Включить многопоточность",resetButtonTooltip:"Восстановите все настройки по умолчанию.",multiThreadsTooltip:"Преобразование изображений в многопоточном режиме",advancedSettings:"Расширенные настройки",shrinkImageTooltip:"Если размеры изображения больше указанного значения, уменьшите изображение до этого значения.",shrinkImage:"Сжимайте изображения, размер которых превышает следующие размеры.",useFolderNameForZip:"Использовать имя перенесенной папки для zip-файла",useFolderNameForZipTooltip:"Если папка удалена или выбрана, ее имя используется как имя выходного ZIP-файла."},C="Открытый исходный код",O="Скопировано в буфер обмена",Z="Откройте преобразованное изображение",G="Скопируйте преобразованное изображение как DataURL.",_="Конвертировать снова",k="Перезагрузить",M="Выберите свой язык",N="Назад",J="Неуспешный",q="Успех",W="Предыдущая версия",j="Высота",B="Ширина",H={lang:e,flags:o,title:t,metaDescription:s,droptarget:i,descriptions:n,fileTypeRadioTitle:a,fileTypeRadioOptions:l,editAcceptTypes:r,loadbutton:c,loadbuttontooltip:p,loadfolderbutton:d,loadfoldertooltip:g,processing:u,aborted:f,incomplete:m,completed:T,interfered:b,noimage:v,avifUnsupported:h,cancel:F,save:D,close:I,open:y,reconvert:L,reconvertTip:U,files:x,confirmCloseDialog:A,confirmCloseDialogTitle:P,copiedDataURLMessage:R,status:S,disabled:w,threads:E,Download:V,settings:z,githubOpenSource:C,copiedDataURLDialogTitle:O,convertedImageUrlTooltip:Z,convertedImageDataUrlTooltip:G,convertAgain:_,reset:k,selectLanguage:M,back:N,failed:J,success:q,previousVersion:W,height:j,width:B};export{V as Download,f as aborted,h as avifUnsupported,N as back,F as cancel,I as close,T as completed,A as confirmCloseDialog,P as confirmCloseDialogTitle,_ as convertAgain,G as convertedImageDataUrlTooltip,Z as convertedImageUrlTooltip,O as copiedDataURLDialogTitle,R as copiedDataURLMessage,H as default,n as descriptions,w as disabled,i as droptarget,r as editAcceptTypes,J as failed,l as fileTypeRadioOptions,a as fileTypeRadioTitle,x as files,o as flags,C as githubOpenSource,j as height,m as incomplete,b as interfered,e as lang,c as loadbutton,p as loadbuttontooltip,d as loadfolderbutton,g as loadfoldertooltip,s as metaDescription,v as noimage,y as open,W as previousVersion,u as processing,L as reconvert,U as reconvertTip,k as reset,D as save,M as selectLanguage,z as settings,S as status,q as success,E as threads,t as title,B as width};
