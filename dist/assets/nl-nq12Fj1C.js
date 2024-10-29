const e="Dutch",n="🇳🇱",t="AVIF naar JPEG Offline batchconverter",o="Het is een gratis webapplicatie om AVIF- of WebP-afbeeldingen te converteren naar andere gangbare afbeeldingsformaten zoals JPEG of PNG zonder servercommunicatie.",i="AVIF-afbeeldingen slepen en neerzetten om te converteren",a=["Dit is een gratis webapplicatie om AVIF (of WebP, etc) afbeeldingen in batch te converteren naar gangbare afbeeldingsformaten zoals JPEG, PNG.","Het gebruikt de ingebouwde functie van een browser voor de conversies, dus <strong>er worden geen gegevens naar een server gestuurd</strong> en daarom is het snel en veilig.","De geconverteerde afbeeldingen worden uitgevoerd als <strong>een zip-bestand</strong> wanneer meerdere afbeeldingen worden geladen.",'Vereist <a href="https://caniuse.com/avif" target="_self" style="color:red">laatste</a> versie van Firefox of Chrome om AVIF-afbeeldingen te laden.'],s="Kies Doelbestand Extenties",l={avif_only:'Alleen "avif" of "webp"',all_images:"Alle afbeeldingstypen",all_files:"Alle typen",edit_type:"Lijst bestandsextensies bewerken"},r="Voer een lijst in met door komma's gescheiden bestandsuitbreidingen om te laden.<br>bijv.) .jpg,.gif,.png",d="Afbeeldingen laden",g="Selecteer uw afbeeldingen in een dialoogvenster.<br>*Meervoudige selectie toegestaan.",c="Een hele map laden",p='Converteer alle afbeeldingen in de geselecteerde map en de submappen, en voeg de geconverteerde afbeeldingen toe aan een ZIP-archief met relatief pad.<br>*Het zal de knop "Uploaden" tonen, maar het uploadt eigenlijk niets naar een server.',b="Afbeeldingen converteren",u="Afgebroken",v="Sommige bestanden zijn niet geconverteerd",f="Completed",m="Momenteel Bezig",T="Er zijn geen bestanden met de uitbreidingen gevonden.",h="Uw browser ondersteunt de AVIF-indeling niet. Gebruik de nieuwste versie van Firefox of Chrome om AVIF-afbeeldingen te converteren.",w="Cancel",k="Save",D="Close",A="Openen",z="Reconvert",S="Eerder geselecteerde {n} @:files",y="Bestand | Bestanden",F="Je hebt de geconverteerde afbeeldingen nog niet opgeslagen.",x="Gegevens zijn niet opgeslagen",V="De geconverteerde afbeelding is als DataURL naar uw klembord gekopieerd.",U={expandLogTooltip:"Het weergeven van het volledige logboek kan de conversiesnelheid ernstig verminderen.",expandLog:"Toon het volledige logboek",autoScroll:"Automatisch scrollen",showOnlyErrors:"Toon alleen fouten",log:"Logboek",elapsedTime:"Verstreken tijd",multiThreading:"Multi-threading",outputSettings:"Uitvoerinstellingen",totalSize:"Totale grootte",totalFiles:"Aantal bestanden",inputSize:"Input Size",outputSize:"Uitvoergrootte",filterSuccess:"Voltooid item verbergen",progressErrors:"Mislukte artikelen",progressStarted:"Gestarte artikelen",progressTotal:"Totaal aantal bestanden",confirmDownloadMessage:"Er wordt gestart met het downloaden van {0} zip-bestanden.",zippingProgress:"Vooruitgang zippen",zipFailedList:"Verpak mislukte bestanden in Zips",openFailedList:"Open de lijst met mislukte bestanden",table:{index:"index",status:"status",core:"draad",details:"bestand"},saveFailedList:"Sla de lijst met mislukte bestanden op",done:"klaar",progressSuccess:"Voltooide bestanden",downloadConvertedImage:"Geconverteerde afbeelding downloaden",failureZippingFailedFiles:"Fout bij het zippen van de mislukte bestanden."},E="Gehandicapt",L=`draad | 
draden`,I="Downloaden",O={retainExtTooltip:"Nieuwe extensie wordt toegevoegd aan originele extensie",retainOriginalExtension:"Keep Original File Extension",qualitytooltip:"Beeldkwaliteit instellen voor uitvoer",quality:"Beeldkwaliteit",ignoreExtTooltip:"Probeer bestanden te laden die geen afbeeldingsbestandsextensie hebben",ignoreFileExtensions:"Alle bestandstypen laden",imageTypeTooltip:"Kies afbeeldingsformaat voor uitvoer",imageType:"Beeldtype",enableMultiThreads:"Schakel multithreading in",resetButtonTooltip:"Herstel alle instellingen naar de standaardinstellingen.",multiThreadsTooltip:"Converteer afbeeldingen in multi-threaded",advancedSettings:"Geavanceerde instellingen"},j="Open bron",C="Gekopieerd naar klembord",G="Open de geconverteerde afbeelding",R="Kopieer de geconverteerde afbeelding als DataURL",P="Opnieuw converteren",M="Opnieuw instellen",B="Selecteer uw taal",H="Rug",_="Mislukt",J="Succes",K="Vorige versie",N={lang:e,flags:n,title:t,metaDescription:o,droptarget:i,descriptions:a,fileTypeRadioTitle:s,fileTypeRadioOptions:l,editAcceptTypes:r,loadbutton:d,loadbuttontooltip:g,loadfolderbutton:c,loadfoldertooltip:p,processing:b,aborted:u,incomplete:v,completed:f,interfered:m,noimage:T,avifUnsupported:h,cancel:w,save:k,close:D,open:A,reconvert:z,reconvertTip:S,files:y,confirmCloseDialog:F,confirmCloseDialogTitle:x,copiedDataURLMessage:V,status:U,disabled:E,threads:L,Download:I,settings:O,githubOpenSource:j,copiedDataURLDialogTitle:C,convertedImageUrlTooltip:G,convertedImageDataUrlTooltip:R,convertAgain:P,reset:M,selectLanguage:B,back:H,failed:_,success:J,previousVersion:K};export{I as Download,u as aborted,h as avifUnsupported,H as back,w as cancel,D as close,f as completed,F as confirmCloseDialog,x as confirmCloseDialogTitle,P as convertAgain,R as convertedImageDataUrlTooltip,G as convertedImageUrlTooltip,C as copiedDataURLDialogTitle,V as copiedDataURLMessage,N as default,a as descriptions,E as disabled,i as droptarget,r as editAcceptTypes,_ as failed,l as fileTypeRadioOptions,s as fileTypeRadioTitle,y as files,n as flags,j as githubOpenSource,v as incomplete,m as interfered,e as lang,d as loadbutton,g as loadbuttontooltip,c as loadfolderbutton,p as loadfoldertooltip,o as metaDescription,T as noimage,A as open,K as previousVersion,b as processing,z as reconvert,S as reconvertTip,M as reset,k as save,B as selectLanguage,O as settings,U as status,J as success,L as threads,t as title};
