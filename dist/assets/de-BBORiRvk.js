const e="German",n="🇩🇪",i='AVIF zu JPEG "Offline" Batch-Konverter',t="Es ist eine kostenlose Webanwendung zur Konvertierung von AVIF- oder WebP-Bildern in andere gängige Bildformate wie JPEG oder PNG ohne Serverkommunikation.",r="AVIF-Bilder per Drag & Drop umwandeln",o=["Dies ist eine kostenlose Webanwendung zur Stapelkonvertierung von AVIF-Bildern (oder WebP-Bildern usw.) in gängige Bildformate wie JPEG und PNG.","It uses a browser's built-in function for the conversions, so no data is sent to any server and therefore it is fast and safe.","Die konvertierten Bilder werden als <strong>eine Zip-Datei</strong> ausgegeben, wenn mehrere Bilder geladen sind.",'Benötigt die <a href="https://caniuse.com/avif" target="_self" style="color:red">neueste</a> Version von Firefox oder Chrome, um AVIF-Bilder zu laden.'],a="Zieldateierweiterungen wählen",s={avif_only:'Nur ".avif" oder ".webp"',all_images:"Alle Bildtypen",all_files:"Alle Typen",edit_type:"Liste der Dateierweiterungen bearbeiten"},l="Geben Sie eine Liste von durch Kommata getrennten Dateierweiterungen ein, die geladen werden sollen.<br>z.B.) .jpg,.gif,.png",d="Bilder laden",g="Wählen Sie Ihre Bilder in einem Dialogfenster aus.<br>*Mehrfachauswahl erlaubt.",c="Einen ganzen Ordner laden",u='Konvertiert alle Bilder im ausgewählten Ordner und seinen Unterordnern und fügt die konvertierten Bilder in ein ZIP-Archiv mit relativem Pfad ein.<br>*Es wird die Schaltfläche "Hochladen" angezeigt, aber es wird nichts auf einen Server hochgeladen.',h="Bilder konvertieren",p="Abgebrochen",f="Einige Dateien konnten nicht konvertiert werden",m="Abgeschlossen",b="Derzeit beschäftigt",v="Es wurden keine Dateien mit den Erweiterungen gefunden",w="Ihr Browser unterstützt das AVIF-Format nicht. Bitte verwenden Sie die neueste Version von Firefox oder Chrome, um AVIF-Bilder zu konvertieren.",D="Abbrechen",S="Speichern",k="Schließen",T="Öffnen",B="Rückwandeln",z="Vorherige ausgewählte Dateien {n} @:files",A="Datei | Dateien",I="Sie haben die konvertierten Bilder noch nicht gespeichert.",E="Die Daten wurden noch nicht gespeichert",F="Das konvertierte Bild wurde als DataURL in Ihre Zwischenablage kopiert.",y={expandLogTooltip:"Die Anzeige des gesamten Protokolls kann die Konvertierungsgeschwindigkeit erheblich verringern.",expandLog:"Gesamtes Protokoll anzeigen",autoScroll:"Automatisches Scrollen",showOnlyErrors:"Nur Fehler anzeigen",log:"Protokoll",elapsedTime:"Verstrichene Zeit",multiThreading:"Multithreading",outputSettings:"Ausgabeeinstellungen",totalSize:"Gesamtgröße",totalFiles:"Anzahl der Dateien",inputSize:"Eingabegröße",outputSize:"Ausgabegröße",filterSuccess:"Fertiggestelltes Element ausblenden",progressErrors:"Fehlgeschlagene Artikel",progressStarted:"Gestartete Artikel",progressTotal:"Gesamtzahl der Dateien",confirmDownloadMessage:"Der Download von {0} ZIP-Dateien beginnt.",zippingProgress:"Zip-Fortschritt",zipFailedList:"Packen Sie fehlerhafte Dateien in Zips",openFailedList:"Liste der fehlgeschlagenen Dateien öffnen",table:{index:"Index",status:"Status",core:"Faden",details:"Datei"},saveFailedList:"Liste der fehlgeschlagenen Dateien speichern",done:"Erledigt",progressSuccess:"Abgeschlossene Dateien",downloadConvertedImage:"Konvertiertes Bild herunterladen",failureZippingFailedFiles:"Fehler beim Komprimieren der fehlgeschlagenen Dateien.",browseConvertedImages:"Durchsuchen Sie konvertierte Bilder",index:"Index",Original:"Vor",Converted:"Nach",saveAllZipsTooltip:"Speichern Sie alle ZIP-Dateien",Shrinked:"Geschrumpft",Shrinking:"Schrumpfung",convertedZips:"ZIP erfolgreich abgeschlossen",outInRate:"Out/In-Verhältnis",zipped:"ZIPPED"},O="Deaktiviert",Z=`Thread | 
Threads`,P="Herunterladen",V={retainExtTooltip:"Die neue Erweiterung wird an die ursprüngliche Erweiterung angehängt",retainOriginalExtension:"Original-Dateierweiterung beibehalten",qualitytooltip:"Bildqualität für die Ausgabe festlegen",quality:"Bildqualität",ignoreExtTooltip:"Versuchen Sie, Dateien zu laden, die keine Bilddateierweiterung haben",ignoreFileExtensions:"Alle Dateitypen laden",imageTypeTooltip:"Wählen Sie das Bildformat für die Ausgabe",imageType:"Bildtyp",enableMultiThreads:"Aktivieren Sie Multithreading",resetButtonTooltip:"Alle Einstellungen auf die Standardeinstellungen zurücksetzen.",multiThreadsTooltip:"Konvertieren Sie Bilder im Multithread-Modus",advancedSettings:"Erweiterte Einstellungen",shrinkImageTooltip:"Wenn die Bildabmessungen größer als der angegebene Wert sind, verkleinern Sie das Bild auf diesen Wert",shrinkImage:"Verkleinern Sie Bilder, die die folgenden Abmessungen überschreiten",useFolderNameForZip:"Verwenden Sie den abgelegten Ordnernamen für die ZIP-Datei",useFolderNameForZipTooltip:"Wenn ein Ordner abgelegt oder ausgewählt wird, wird sein Name als Name der ZIP-Ausgabedatei verwendet",maxZipFileSize:"Maximale Größe der ZIP-Datei",maxZipFileSizeTooltip:"Stellen Sie einen kleineren Wert ein, wenn Speicherprobleme auftreten."},W="Open Source",x="In die Zwischenablage kopiert",M="Öffnen Sie das konvertierte Bild",L="Kopieren Sie das konvertierte Bild als DataURL",N="Erneut konvertieren",R="Zurücksetzen",C="Wählen Sie Ihre Sprache aus",G="Zurück",K="Fehlgeschlagen",U="Erfolg",_="Vorherige Version",q="Höhe",H="Breite",J="Diese Nachricht nicht mehr anzeigen",j="Über die Warnung, wenn ein Ordner ausgewählt wird",Q="OK",X="Weitermachen",Y="Stornieren",$="Sie müssen hier auf die Schaltfläche „Hochladen“ klicken, um alle Bilder im Ordner zu laden, aber die von dieser Anwendung geladenen Daten werden nie wirklich auf den Server „hochgeladen“.",ee="Wenn Sie als Eingabe auf einer Website einen Ordner anstelle einer Datei auswählen, zeigen die gängigen Webbrowser eine Warnung wie im Bild unten an.",ne=`Bei dieser Seite handelt es sich möglicherweise um eine veraltete Version. 
Bitte laden Sie die Seite neu.`,ie="Neu laden",te=`Wenn der Konvertierungsvorgang häufig fehlschlägt und die Meldung „Nicht genügend Speicher“ angezeigt wird, versuchen Sie, die Anzahl der „Multi-Threads“ in den „Erweiterten Einstellungen“ zu reduzieren oder zu deaktivieren.

Dieses Problem kann möglicherweise mit einer neueren Browserversion behoben werden.`,re={lang:e,flags:n,title:i,metaDescription:t,droptarget:r,descriptions:o,fileTypeRadioTitle:a,fileTypeRadioOptions:s,editAcceptTypes:l,loadbutton:d,loadbuttontooltip:g,loadfolderbutton:c,loadfoldertooltip:u,processing:h,aborted:p,incomplete:f,completed:m,interfered:b,noimage:v,avifUnsupported:w,cancel:D,save:S,close:k,open:T,reconvert:B,reconvertTip:z,files:A,confirmCloseDialog:I,confirmCloseDialogTitle:E,copiedDataURLMessage:F,status:y,disabled:O,threads:Z,Download:P,settings:V,githubOpenSource:W,copiedDataURLDialogTitle:x,convertedImageUrlTooltip:M,convertedImageDataUrlTooltip:L,convertAgain:N,reset:R,selectLanguage:C,back:G,failed:K,success:U,previousVersion:_,height:q,width:H,checkboxTextDontShowThis:J,loadfolderNotifyingTitle:j,OK:Q,Continue:X,Cancel:Y,loadfolderNotifyingMessageTerm2:$,loadfolderNotifyingMessageTerm1:ee,errMsgWorkerLoadError:ne,Reload:ie,annotationOutOfMemory:te};export{Y as Cancel,X as Continue,P as Download,Q as OK,ie as Reload,p as aborted,te as annotationOutOfMemory,w as avifUnsupported,G as back,D as cancel,J as checkboxTextDontShowThis,k as close,m as completed,I as confirmCloseDialog,E as confirmCloseDialogTitle,N as convertAgain,L as convertedImageDataUrlTooltip,M as convertedImageUrlTooltip,x as copiedDataURLDialogTitle,F as copiedDataURLMessage,re as default,o as descriptions,O as disabled,r as droptarget,l as editAcceptTypes,ne as errMsgWorkerLoadError,K as failed,s as fileTypeRadioOptions,a as fileTypeRadioTitle,A as files,n as flags,W as githubOpenSource,q as height,f as incomplete,b as interfered,e as lang,d as loadbutton,g as loadbuttontooltip,ee as loadfolderNotifyingMessageTerm1,$ as loadfolderNotifyingMessageTerm2,j as loadfolderNotifyingTitle,c as loadfolderbutton,u as loadfoldertooltip,t as metaDescription,v as noimage,T as open,_ as previousVersion,h as processing,B as reconvert,z as reconvertTip,R as reset,S as save,C as selectLanguage,V as settings,y as status,U as success,Z as threads,i as title,H as width};