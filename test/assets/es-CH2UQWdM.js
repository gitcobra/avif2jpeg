const e="Spanish",o="🇪🇸",a='Conversor por lotes "Sin conexión" de AVIF a JPEG',i="Es una aplicación web gratuita para convertir imágenes AVIF o WebP a otros formatos de imagen habituales, como JPEG o PNG, sin necesidad de comunicación con el servidor",s="Arrastrar y soltar imágenes AVIF para convertir",t=["Esta es una aplicación web gratuita para convertir por lotes imágenes AVIF(o WebP, etc) a formatos de imagen comunes como JPEG, PNG","Utiliza una función integrada en el navegador para las conversiones, por lo que <strong>no se envían datos a ningún servidor</strong> y, por tanto, es rápido y seguro","Las imágenes convertidas saldrán como <strong>un archivo zip</strong> cuando se carguen varias imágenes",'Requiere <a href="https://caniuse.com/avif" target="_self" style="color:red">la última</a> versión de Firefox o Chrome para cargar imágenes AVIF'],r="Elegir extensiones de archivo de destino",n={avif_only:'Sólo ".avif" o ".webp"',all_images:"Todos los tipos de imagen",all_files:"Todos los tipos",edit_type:"Editar lista de extensiones de archivos"},l="Introduzca una lista de extensiones de archivo separadas por comas para cargar.<br>e.g.) .jpg,.gif,.png",c="Cargar imágenes",d="Seleccione sus imágenes desde una ventana de diálogo.<br>*Se permite la selección múltiple",p="Cargar una carpeta entera",g='Convierte todas las imágenes de la carpeta seleccionada y sus subcarpetas, y añade las imágenes convertidas a un archivo ZIP con ruta relativa.<br>*Mostrará el botón "Subir", pero en realidad no sube nada a ningún servidor',m="Convirtiendo imágenes",u="Abortado",v="Falló la conversión de algunos archivos",h="Completado",f="Actualmente ocupado",b="No se encontraron archivos con las extensiones",T="Tu navegador no soporta el formato AVIF. Utiliza la última versión de Firefox o Chrome para convertir imágenes AVIF",C="Cancelar",A="Guardar",D="Cerrar",x="Abrir",F="Reconvertir",S="Reconvertir los {n} seleccionados anteriormente @:files",y="Archivo | Archivos",I="Todavía no se han guardado las imágenes convertidas",E="No se han guardado los datos",R="La imagen convertida se copió a su portapapeles como DataURL.",z={expandLogTooltip:"Mostrar el registro completo puede reducir gravemente la velocidad de conversión.",expandLog:"Mostrar registro completo",autoScroll:"Desplazamiento automático",showOnlyErrors:"Mostrar solo errores",log:"Registro",elapsedTime:"Tiempo transcurrido",multiThreading:"Subprocesos múltiples",outputSettings:"Configuración de salida",totalSize:"Tamaño total",totalFiles:"Número de archivos",inputSize:"Tamaño de entrada",outputSize:"Tamaño de salida",filterSuccess:"Ocultar elemento completado",progressErrors:"Artículos fallidos",progressStarted:"Artículos iniciados",progressTotal:"Número total de archivos",confirmDownloadMessage:"Comenzará a descargar {0} archivos zip.",zippingProgress:"Progreso de compresión",zipFailedList:"Empaquetar archivos fallidos en Zips",openFailedList:"Abrir lista de archivos fallidos",table:{index:"índice",status:"estado",core:"hilo",details:"archivo"},saveFailedList:"Guardar lista de archivos fallidos",done:"hecho",progressSuccess:"Archivos completados",downloadConvertedImage:"Descargar imagen convertida",failureZippingFailedFiles:"Error al comprimir los archivos fallidos.",browseConvertedImages:"Explorar imágenes convertidas",index:"Índice",Original:"Antes",Converted:"Después"},L="Desactivado",U=`hilo | 
trapos`,w="Descargar",P={retainExtTooltip:"La nueva extensión se añadirá a la extensión original",retainOriginalExtension:"Conservar extensión de archivo original",qualitytooltip:"Establecer calidad de imagen para la salida",quality:"Calidad de imagen",ignoreExtTooltip:"Intenta cargar archivos que no tienen extensión de archivo de imagen",ignoreFileExtensions:"Cargar todos los tipos de archivos",imageTypeTooltip:"Elegir formato de imagen para la salida",imageType:"Tipo de imagen",enableMultiThreads:"Habilitar subprocesos múltiples",resetButtonTooltip:"Restaura todas las configuraciones a los valores predeterminados.",multiThreadsTooltip:"Convertir imágenes en multiproceso",advancedSettings:"Configuración avanzada",shrinkImageTooltip:"Si las dimensiones de la imagen son mayores que el valor especificado, reduzca la imagen a ese valor",shrinkImage:"Reducir imágenes que excedan las siguientes dimensiones",useFolderNameForZip:"Utilice el nombre de la carpeta eliminada para el archivo zip",useFolderNameForZipTooltip:"Si se suelta o selecciona una carpeta, su nombre se utiliza como nombre del archivo ZIP de salida."},V="Código abierto",q="Copiado al portapapeles",M="Abra la imagen convertida",N="Copie la imagen convertida como DataURL",O="Convertir de nuevo",G="Reiniciar",Z="Selecciona tu idioma",_="Atrás",k="Fallido",J="Éxito",W="Versión anterior",j="Altura",B="Ancho",H={lang:e,flags:o,title:a,metaDescription:i,droptarget:s,descriptions:t,fileTypeRadioTitle:r,fileTypeRadioOptions:n,editAcceptTypes:l,loadbutton:c,loadbuttontooltip:d,loadfolderbutton:p,loadfoldertooltip:g,processing:m,aborted:u,incomplete:v,completed:h,interfered:f,noimage:b,avifUnsupported:T,cancel:C,save:A,close:D,open:x,reconvert:F,reconvertTip:S,files:y,confirmCloseDialog:I,confirmCloseDialogTitle:E,copiedDataURLMessage:R,status:z,disabled:L,threads:U,Download:w,settings:P,githubOpenSource:V,copiedDataURLDialogTitle:q,convertedImageUrlTooltip:M,convertedImageDataUrlTooltip:N,convertAgain:O,reset:G,selectLanguage:Z,back:_,failed:k,success:J,previousVersion:W,height:j,width:B};export{w as Download,u as aborted,T as avifUnsupported,_ as back,C as cancel,D as close,h as completed,I as confirmCloseDialog,E as confirmCloseDialogTitle,O as convertAgain,N as convertedImageDataUrlTooltip,M as convertedImageUrlTooltip,q as copiedDataURLDialogTitle,R as copiedDataURLMessage,H as default,t as descriptions,L as disabled,s as droptarget,l as editAcceptTypes,k as failed,n as fileTypeRadioOptions,r as fileTypeRadioTitle,y as files,o as flags,V as githubOpenSource,j as height,v as incomplete,f as interfered,e as lang,c as loadbutton,d as loadbuttontooltip,p as loadfolderbutton,g as loadfoldertooltip,i as metaDescription,b as noimage,x as open,W as previousVersion,m as processing,F as reconvert,S as reconvertTip,G as reset,A as save,Z as selectLanguage,P as settings,z as status,J as success,U as threads,a as title,B as width};
