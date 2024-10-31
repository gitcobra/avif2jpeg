const e="Russian",o="🇷🇺",t='AVIF в JPEG "Оффлайн" пакетный конвертер',s="Это бесплатное веб-приложение для преобразования изображений AVIF или WebP в другие распространенные форматы изображений, такие как JPEG или PNG, без связи с сервером",i="Перетаскивание AVIF-изображений для конвертирования",n=["Это бесплатное веб-приложение для пакетного преобразования изображений AVIF (или WebP, и т.д.) в распространенные форматы изображений, такие как JPEG, PNG.","Для конвертации используется встроенная функция браузера, поэтому <strong>данные не отправляются на сервер</strong>, а значит, это быстро и безопасно","При загрузке нескольких изображений преобразованные изображения будут выведены в виде <strong> zip-файла</strong>",'Требуется <a href="https://caniuse.com/avif" target="_self" style="color:red">последней</a> версии Firefox или Chrome для загрузки изображений AVIF.'],a="Выбор расширений целевых файлов",l={avif_only:'Только ".avif" или ".webp"',all_images:"Все типы изображений",all_files:"Все типы",edit_type:"Редактировать список расширений файлов"},c="Введите список расширений файлов, разделенных запятыми, для загрузки.<br>например) .jpg,.gif,.png",r="Загрузить изображения",p="Выберите изображения из диалогового окна.<br>* Допускается множественный выбор.",d="Загрузить целую папку",g='Преобразуйте все изображения в выбранной папке и ее подпапках и добавьте преобразованные изображения в ZIP-архив с относительным путем.<br>*Вы увидите кнопку "Загрузить", но на самом деле она ничего не загружает ни на какой сервер.',u="Преобразование изображений",f="Прервано",T="Некоторые файлы не удалось конвертировать",m="Завершено",b="В настоящее время занят",v="Файлы с расширениями не найдены",D="Ваш браузер не поддерживает формат AVIF. Пожалуйста, используйте последнюю версию Firefox или Chrome для конвертирования изображений в формате AVIF.",F="Отменить",y="Сохранить",I="Закрыть",L="Открыть",h="Переконвертировать",U="Повторное преобразование предыдущих выбранных {n} @:files",A="файл | файла",R="Вы еще не сохранили преобразованные изображения",S="Данные не были сохранены",x="Конвертированное изображение было скопировано в буфер обмена как DataURL.",P={expandLogTooltip:"Отображение всего журнала может серьезно снизить скорость конвертации.",expandLog:"Показать весь журнал",autoScroll:"Автоматическая прокрутка",showOnlyErrors:"Показать только ошибки",log:"Бревно",elapsedTime:"Прошедшее время",multiThreading:"Многопоточность",outputSettings:"Настройки вывода",totalSize:"Общий размер",totalFiles:"Количество файлов",inputSize:"Входной размер",outputSize:"Выходной размер",filterSuccess:"Скрыть завершенный элемент",progressErrors:"Неудачные элементы",progressStarted:"Начатые элементы",progressTotal:"Общее количество файлов",confirmDownloadMessage:"Начнется загрузка {0} zip-файлов.",zippingProgress:"Сжатие прогресса",zipFailedList:"Упаковать неудавшиеся файлы в ZIP-архивы",openFailedList:"Открыть список неудачных файлов",table:{index:"индекс",status:"статус",core:"нить",details:"файл"},saveFailedList:"Сохранить список неудачных файлов",done:"сделанный",progressSuccess:"Завершенные файлы",downloadConvertedImage:"Загрузить конвертированное изображение",failureZippingFailedFiles:"Сбой при архивировании неудавшихся файлов."},E="Неполноценный",V=`нить | 
нити`,z="Скачать",C={retainExtTooltip:"Новое расширение будет добавлено к исходному расширению",retainOriginalExtension:"Сохранить исходное расширение файла",qualitytooltip:"Установить качество изображения для вывода",quality:"Качество изображения",ignoreExtTooltip:"Попробуйте загрузить файлы, которые не имеют расширения image",ignoreFileExtensions:"Загрузить все типы файлов",imageTypeTooltip:"Выберите формат изображения для вывода",imageType:"Тип изображения",enableMultiThreads:"Включить многопоточность",resetButtonTooltip:"Восстановите все настройки по умолчанию.",multiThreadsTooltip:"Преобразование изображений в многопоточном режиме",advancedSettings:"Расширенные настройки"},w="Открытый исходный код",O="Скопировано в буфер обмена",G="Откройте преобразованное изображение",_="Скопируйте преобразованное изображение как DataURL.",M="Конвертировать снова",J="Перезагрузить",Z="Выберите свой язык",k="Назад",q="Неуспешный",N="Успех",W="Предыдущая версия",j={lang:e,flags:o,title:t,metaDescription:s,droptarget:i,descriptions:n,fileTypeRadioTitle:a,fileTypeRadioOptions:l,editAcceptTypes:c,loadbutton:r,loadbuttontooltip:p,loadfolderbutton:d,loadfoldertooltip:g,processing:u,aborted:f,incomplete:T,completed:m,interfered:b,noimage:v,avifUnsupported:D,cancel:F,save:y,close:I,open:L,reconvert:h,reconvertTip:U,files:A,confirmCloseDialog:R,confirmCloseDialogTitle:S,copiedDataURLMessage:x,status:P,disabled:E,threads:V,Download:z,settings:C,githubOpenSource:w,copiedDataURLDialogTitle:O,convertedImageUrlTooltip:G,convertedImageDataUrlTooltip:_,convertAgain:M,reset:J,selectLanguage:Z,back:k,failed:q,success:N,previousVersion:W};export{z as Download,f as aborted,D as avifUnsupported,k as back,F as cancel,I as close,m as completed,R as confirmCloseDialog,S as confirmCloseDialogTitle,M as convertAgain,_ as convertedImageDataUrlTooltip,G as convertedImageUrlTooltip,O as copiedDataURLDialogTitle,x as copiedDataURLMessage,j as default,n as descriptions,E as disabled,i as droptarget,c as editAcceptTypes,q as failed,l as fileTypeRadioOptions,a as fileTypeRadioTitle,A as files,o as flags,w as githubOpenSource,T as incomplete,b as interfered,e as lang,r as loadbutton,p as loadbuttontooltip,d as loadfolderbutton,g as loadfoldertooltip,s as metaDescription,v as noimage,L as open,W as previousVersion,u as processing,h as reconvert,U as reconvertTip,J as reset,y as save,Z as selectLanguage,C as settings,P as status,N as success,V as threads,t as title};