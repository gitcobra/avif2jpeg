const e="Portuguese",o="🇵🇹",a='Conversor em lote de AVIF para JPEG "Offline"',s="É uma aplicação Web gratuita para converter imagens AVIF ou WebP noutros formatos de imagem comuns, como JPEG ou PNG, sem comunicação com o servidor.",r="Arrastar e largar imagens AVIF para converter",i=["Esta é uma aplicação Web gratuita para converter em lote imagens AVIF (ou WebP, etc.) para formatos de imagem comuns, como JPEG, PNG.","Utiliza a função incorporada do browser para as conversões, pelo que <strong>nenhum dado é enviado para qualquer servidor</strong> e, por conseguinte, é rápido e seguro","As imagens convertidas serão exportadas como <strong>um ficheiro zip</strong> quando forem carregadas várias imagens.",'Requer a <a href="https://caniuse.com/avif" target="_self" style="color:red">versão mais recente</a> do Firefox ou Chrome para carregar imagens AVIF.'],t="Escolher extensões de ficheiros de destino",n={avif_only:'Apenas ".avif" ou ".webp"',all_images:"Todos os tipos de imagem",all_files:"Todos os tipos",edit_type:"Editar lista de extensões de ficheiros"},d="Introduza uma lista de extensões de ficheiros separadas por vírgulas para carregar.<br>e.g.) .jpg,.gif,.png",c="Carregar imagens",l="Seleccione as suas imagens a partir de uma janela de diálogo.<br>*É permitida a seleção múltipla.",m="Load a Whole Folder",p='Converte todas as imagens da pasta selecionada e das suas subpastas e adiciona as imagens convertidas a um arquivo ZIP com um caminho relativo.<br>*Mostra o botão "Upload", mas na realidade não carrega nada para nenhum servidor.',g="Conversão de imagens",u="Abortado",f="Alguns ficheiros não foram convertidos",v="Completada",h="Atualmente ocupado",T="Não foram encontrados ficheiros com as extensões",b="O seu browser não suporta o formato AVIF. Utilize a versão mais recente do Firefox ou Chrome para converter imagens AVIF.",F="Cancelar",x="Guardar",A="Fechar",q="Abrir",C="Reconverter",D="Reconverter {n} anteriormente seleccionados @:files",I="Ficheiro | Ficheiros",R="Ainda não guardou as imagens convertidas",S="Os dados não foram guardados",U="A imagem convertida foi copiada para sua área de transferência como DataURL.",E={expandLogTooltip:"Exibir o log inteiro pode reduzir drasticamente a velocidade de conversão.",expandLog:"Mostrar registro inteiro",autoScroll:"Rolagem automática",showOnlyErrors:"Mostrar apenas erros",log:"Registro",elapsedTime:"Tempo decorrido",multiThreading:"Multi-threading",outputSettings:"Configurações de saída",totalSize:"Tamanho total",totalFiles:"Número de arquivos",inputSize:"Tamanho de entrada",outputSize:"Tamanho de saída",filterSuccess:"Ocultar item concluído",progressErrors:"Itens com falha",progressStarted:"Itens Iniciados",progressTotal:"Número total de arquivos",confirmDownloadMessage:"Ele começará a baixar {0} arquivos zip.",zippingProgress:"Fechando o progresso",zipFailedList:"Compactar arquivos com falha em Zips",openFailedList:"Abrir lista de arquivos com falha",table:{index:"índice",status:"status",core:"fio",details:"arquivo"},saveFailedList:"Salvar lista de arquivos com falha",done:"feito",progressSuccess:"Arquivos concluídos",downloadConvertedImage:"Baixar imagem convertida",failureZippingFailedFiles:"Falha ao compactar os arquivos com falha.",browseConvertedImages:"Procure imagens convertidas",index:"Índice"},L="Desabilitado",y=`fio | 
tópicos`,z="Download",w={retainExtTooltip:"A nova extensão será anexada à extensão original",retainOriginalExtension:"Manter a extensão original do ficheiro",qualitytooltip:"Definir a qualidade da imagem para a saída",quality:"Qualidade da imagem",ignoreExtTooltip:"Tentar carregar ficheiros que não tenham extensão de ficheiro de imagem",ignoreFileExtensions:"Carregar todos os tipos de ficheiros",imageTypeTooltip:"Escolher formato de imagem para a saída",imageType:"Tipo de imagem",enableMultiThreads:"Habilitar multithreading",resetButtonTooltip:"Restaure todas as configurações para o padrão.",multiThreadsTooltip:"Converta imagens em multithread",advancedSettings:"Configurações avançadas",shrinkImageTooltip:"Se as dimensões da imagem forem maiores que o valor especificado, reduza a imagem para esse valor",shrinkImage:"Reduzir imagens que excedam as seguintes dimensões",useFolderNameForZip:"Use o nome da pasta descartada para o arquivo zip",useFolderNameForZipTooltip:"Se uma pasta for descartada ou selecionada, seu nome será usado como o nome do arquivo ZIP de saída"},P="Código aberto",V="Copiado para a área de transferência",O="Abra a imagem convertida",M="Copie a imagem convertida como DataURL",N="Converter novamente",G="Reiniciar",Z="Selecione seu idioma",W="Voltar",_="Fracassado",k="Sucesso",J="Versão anterior",j="Altura",B="Largura",H={lang:e,flags:o,title:a,metaDescription:s,droptarget:r,descriptions:i,fileTypeRadioTitle:t,fileTypeRadioOptions:n,editAcceptTypes:d,loadbutton:c,loadbuttontooltip:l,loadfolderbutton:m,loadfoldertooltip:p,processing:g,aborted:u,incomplete:f,completed:v,interfered:h,noimage:T,avifUnsupported:b,cancel:F,save:x,close:A,open:q,reconvert:C,reconvertTip:D,files:I,confirmCloseDialog:R,confirmCloseDialogTitle:S,copiedDataURLMessage:U,status:E,disabled:L,threads:y,Download:z,settings:w,githubOpenSource:P,copiedDataURLDialogTitle:V,convertedImageUrlTooltip:O,convertedImageDataUrlTooltip:M,convertAgain:N,reset:G,selectLanguage:Z,back:W,failed:_,success:k,previousVersion:J,height:j,width:B};export{z as Download,u as aborted,b as avifUnsupported,W as back,F as cancel,A as close,v as completed,R as confirmCloseDialog,S as confirmCloseDialogTitle,N as convertAgain,M as convertedImageDataUrlTooltip,O as convertedImageUrlTooltip,V as copiedDataURLDialogTitle,U as copiedDataURLMessage,H as default,i as descriptions,L as disabled,r as droptarget,d as editAcceptTypes,_ as failed,n as fileTypeRadioOptions,t as fileTypeRadioTitle,I as files,o as flags,P as githubOpenSource,j as height,f as incomplete,h as interfered,e as lang,c as loadbutton,l as loadbuttontooltip,m as loadfolderbutton,p as loadfoldertooltip,s as metaDescription,T as noimage,q as open,J as previousVersion,g as processing,C as reconvert,D as reconvertTip,G as reset,x as save,Z as selectLanguage,w as settings,E as status,k as success,y as threads,a as title,B as width};