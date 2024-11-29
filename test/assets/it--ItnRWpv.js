const i="Italian",e="🇮🇹",o='Convertitore batch da AVIF a JPEG "Offline"',t="È un'applicazione web gratuita per convertire le immagini AVIF o WebP in altri formati di immagine comuni come JPEG o PNG senza comunicazione con il server",n="Trascinare e rilasciare le immagini AVIF da convertire",a=["Si tratta di un'applicazione web gratuita per convertire in batch le immagini AVIF (o WebP, ecc.) in formati immagine comuni come JPEG, PNG","Utilizza la funzione integrata del browser per le conversioni, quindi <strong>non vengono inviati dati a nessun server</strong> e quindi è veloce e sicuro","Le immagini convertite verranno emesse come <strong>un file zip</strong> quando vengono caricate più immagini",`Richiede <a href="https://caniuse.com/avif" target="_self" style="color:red">l'ultima versione</a> di Firefox o Chrome per caricare le immagini AVIF`],l="Scegliere le estensioni dei file di destinazione",s={avif_only:'Solo ".avif" o ".webp"',all_images:"Tutti i tipi di immagine",all_files:"Tutti i tipi",edit_type:"Modifica elenco estensioni file"},r="Immettere un elenco di estensioni di file separate da virgole da caricare.<br>ad esempio) .jpg,.gif,.png",c="Carica immagini",d="Seleziona le immagini da una finestra di dialogo.<br>*È consentita la selezione multipla.",p="Carica un'intera cartella",m="Converte tutte le immagini nella cartella selezionata e nelle sue sottocartelle e aggiunge le immagini convertite a un archivio ZIP con percorso relativo.",g="Conversione di immagini",u="Abortito",v="La conversione di alcuni file non è riuscita",f="Completato",z="Attualmente occupato",T="Non sono stati trovati file con le estensioni",b="Il browser non supporta il formato AVIF. Utilizzare l'ultima versione di Firefox o Chrome per convertire le immagini AVIF",h="Annulla",I="Salva",S="Chiudi",F="Apri",D="Riconvertire",C="Riconvertire i precedenti {n} selezionati @:files",A="File | Files",L="Le immagini convertite non sono ancora state salvate",R="I dati non sono stati salvati",U="L'immagine convertita è stata copiata negli appunti come DataURL.",y={expandLogTooltip:"La visualizzazione dell'intero registro può ridurre notevolmente la velocità di conversione.",expandLog:"Mostra l'intero registro",autoScroll:"Scorrimento automatico",showOnlyErrors:"Mostra solo errori",log:"Tronco d'albero",outInRate:"Rapporto uscita/entrata",elapsedTime:"Tempo trascorso",multiThreading:"Multithreading",outputSettings:"Impostazioni di uscita",totalSize:"Dimensione totale",totalFiles:"Numero di file",inputSize:"Dimensione Ingresso",outputSize:"Dimensione uscita",filterSuccess:"Nascondi l'elemento completato",progressErrors:"Articoli falliti",progressStarted:"Elementi iniziati",progressTotal:"Numero totale di file",confirmDownloadMessage:"Inizierà a scaricare {0} file zip.",zippingProgress:"Progressi zippati",zipFailedList:"Comprime i file non riusciti in Zips",openFailedList:"Apri l'elenco dei file non riusciti",table:{index:"indice",status:"stato",core:"filo",details:"file"},saveFailedList:"Salva l'elenco dei file non riusciti",done:"Fatto",progressSuccess:"File completati",downloadConvertedImage:"Scarica l'immagine convertita",failureZippingFailedFiles:"Errore durante la compressione dei file non riusciti.",browseConvertedImages:"Sfoglia le immagini convertite",index:"Indice"},w="Disabilitato",x="discussione | discussioni",E="Scaricamento",P={retainExtTooltip:"La nuova estensione sarà aggiunta all'estensione originale",retainOriginalExtension:"Mantieni l'estensione originale del file",qualitytooltip:"Imposta la qualità dell'immagine per l'output",quality:"Qualità dell'immagine",ignoreExtTooltip:"Cerca di caricare i file che non hanno estensione di file immagine",ignoreFileExtensions:"Carica tutti i tipi di file",imageTypeTooltip:"Scegliere il formato dell'immagine per l'output",imageType:"Tipo di immagine",enableMultiThreads:"Abilita il multithreading",resetButtonTooltip:"Ripristina tutte le impostazioni predefinite.",multiThreadsTooltip:"Converti immagini in multi-thread",advancedSettings:"Impostazioni avanzate",shrinkImageTooltip:"Se le dimensioni dell'immagine sono maggiori del valore specificato, riduci l'immagine a quel valore",shrinkImage:"Riduci le immagini che superano le seguenti dimensioni",useFolderNameForZip:"Utilizza il nome della cartella rilasciata per il file zip",useFolderNameForZipTooltip:"Se una cartella viene rilasciata o selezionata, il suo nome viene utilizzato come nome del file ZIP di output"},V="Open Source",M="Copiato negli appunti",N="Apri l'immagine convertita",O="Copia l'immagine convertita come DataURL",q="Converti di nuovo",Z="Reset",G="Seleziona la tua lingua",_="Indietro",k="Fallito",J="Successo",W="Versione precedente",j="Altezza",B="Larghezza",Q={lang:i,flags:e,title:o,metaDescription:t,droptarget:n,descriptions:a,fileTypeRadioTitle:l,fileTypeRadioOptions:s,editAcceptTypes:r,loadbutton:c,loadbuttontooltip:d,loadfolderbutton:p,loadfoldertooltip:m,processing:g,aborted:u,incomplete:v,completed:f,interfered:z,noimage:T,avifUnsupported:b,cancel:h,save:I,close:S,open:F,reconvert:D,reconvertTip:C,files:A,confirmCloseDialog:L,confirmCloseDialogTitle:R,copiedDataURLMessage:U,status:y,disabled:w,threads:x,Download:E,settings:P,githubOpenSource:V,copiedDataURLDialogTitle:M,convertedImageUrlTooltip:N,convertedImageDataUrlTooltip:O,convertAgain:q,reset:Z,selectLanguage:G,back:_,failed:k,success:J,previousVersion:W,height:j,width:B};export{E as Download,u as aborted,b as avifUnsupported,_ as back,h as cancel,S as close,f as completed,L as confirmCloseDialog,R as confirmCloseDialogTitle,q as convertAgain,O as convertedImageDataUrlTooltip,N as convertedImageUrlTooltip,M as copiedDataURLDialogTitle,U as copiedDataURLMessage,Q as default,a as descriptions,w as disabled,n as droptarget,r as editAcceptTypes,k as failed,s as fileTypeRadioOptions,l as fileTypeRadioTitle,A as files,e as flags,V as githubOpenSource,j as height,v as incomplete,z as interfered,i as lang,c as loadbutton,d as loadbuttontooltip,p as loadfolderbutton,m as loadfoldertooltip,t as metaDescription,T as noimage,F as open,W as previousVersion,g as processing,D as reconvert,C as reconvertTip,Z as reset,I as save,G as selectLanguage,P as settings,y as status,J as success,x as threads,o as title,B as width};
