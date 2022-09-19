import { createI18n as _createI18n } from 'vue-i18n'
//import en from './locales/en.json'
//import ja from './locales/ja.json'

// const messageImports = import.meta.glob('./locales/*.json')
// console.log(messageImports)

export const SUPPORT_LOCALES = ['en', 'ja'];

const en = {
  title: 'AVIF to JPEG "Offline" Batch Converter',
  metaDescription: "It is a free web application to convert AVIF or WebP images to other common image formats such as JPEG or PNG without server communication.",
  droptarget: 'Drag & Drop AVIF Images to Convert',
  descriptions: [
    'This is a free web application to batch convert AVIF(or WebP, etc) images to common image formats such as JPEG, PNG.',
    `It uses a browser's built-in function for the conversions, so <strong>no data will be sent</strong> to a server and is therefore <strong>fast</strong> and <strong>safe</strong>.`,
    'The converted images will be output as <strong>a zip file</strong> when multiple images are loaded.',
    'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> version of Firefox or Chrome to load AVIF images.',
  ],
  fileTypeRadioTitle: 'Choose Target File Extentions',
  fileTypeRadioOptions: {
    avif_only: 'Only ".avif" or ".webp"',
    all_images: 'All Image Types',
    all_files: 'All Types',
    edit_type: 'Edit File Extension List',
  },
  editAcceptTypes: 'Input a list of comma separated file extentions to load.<br>e.g.) .jpg,.gif,.png',

  quality: 'Image Quality',
  qualitytooltip: 'Set image quality for output',
  imageType: 'Image Type',
  imageTypeTooltip: 'Choose image format for output',
  retainOriginalExtension: 'Keep Original File Extension',
  retainExtTooltip: 'New extension will be appended to original extension',

  ignoreFileExtensions: 'Load All File Types',
  ignoreExtTooltip: 'Try to load files that don\'t have image file extension',
  loadbutton: 'Load Images',
  loadbuttontooltip: 'Select your images from a dialog window.<br>*Multiple selection allowed.',
  loadfolderbutton: 'Load A Whole Folder',
  loadfoldertooltip: `
    Convert all images in the selected folder and its subfolders, and add the converted images to a ZIP archive with relative path.<br>
    *It will show "Upload" button, but it actually doesn't upload anything to a server.
  `,
  processing: 'Converting images',
  aborted: 'Aborted',
  incomplete: 'Some files failed to convert',
  completed: 'Completed',
  interfered: 'Currently Busy',
  noimage: 'No files with the extentions were found.',
  avifUnsupported: 'Your browser does not support AVIF format. Please use latest version of Firefox or Chrome to convert AVIF images.',
  cancel: 'Cancel',
  inputSize: 'Input Size',
  outputSize: 'Output Size',
  save: 'Save',
  close: 'Close',
  open: 'Open',
  reconvert: 'Reconvert',
  reconvertTip: 'Reconvert previous selected {n} @:files',
  files: 'File | Files',

  confirmCloseDialog: `You have not saved the converted images yet.`,
  confirmCloseDialogTitle:'Data have not been saved',
};

const ja = {
  title: 'AVIFからJPEGへ "オフライン"一括画像変換',
  metaDescription: 'AVIF・WebP形式の画像をJPEGやPNG等へオフラインで一括変換する無料ツール',
  droptarget: '変換したいAVIF画像をドラッグ&ドロップして下さい',
  descriptions: [
    'これはAVIF、又はWebP形式の画像を、JPEG、PNG等の一般的な形式へ一括変換するための無料Webアプリです。',
    `変換処理はブラウザの組み込み機能を利用するため、画像データがサーバーへ<strong>送信される事はなく</strong>、またそれゆえに<strong>高速</strong>かつ<strong>安全</strong>です。`,
    '複数枚の画像が読み込まれた場合、変換した画像は<strong>ZIPファイル</strong>に纏めて出力されます。',
    'AVIF画像のロードには<a href="https://caniuse.com/?search=avif" target="_self" style="color:red">最新</a>のFirefox又はChromeが必要です。',
  ],
  fileTypeRadioTitle: '変換対象ファイルの拡張子を指定',
  fileTypeRadioOptions: {
    avif_only: '".avif" 又は ".webp" のみ',
    all_images: '全ての画像形式',
    all_files: '全ての形式',
    edit_type: '拡張子を入力して指定',
  },
  editAcceptTypes: 'ロードするファイルの拡張子のリストをカンマ区切りで指定して下さい。<br>例) .jpg,.gif,.png',

  quality: '画質設定',
  qualitytooltip: '出力する画像のクオリティを指定します',
  imageType: '画像形式',
  imageTypeTooltip: '出力する画像の形式を指定します',
  retainOriginalExtension: '元の拡張子を保持する',
  retainExtTooltip: '元の拡張子の後ろに新しい拡張子を付加します',

  ignoreFileExtensions: '全ての拡張子を読み込む',
  ignoreExtTooltip: '画像拡張子以外のファイルもロードできるか試行します',
  loadbutton: '画像をロード',
  loadbuttontooltip: 'ダイアログを開いて画像を選択します<br>※複数ファイル選択可',
  loadfolderbutton: 'フォルダごとロード',
  loadfoldertooltip: `
    選択したフォルダとサブフォルダの全ての画像に対して変換処理を行い、ZIP書庫へ相対パスで格納します。<br>
    ※「アップロード」というボタンが表示されますが実際にはサーバーへのファイルのアップロードは行われません。
  `,
  processing: '画像変換中',
  aborted: '中断',
  incomplete: '変換に失敗したファイルがあります',
  completed: '変換終了',
  interfered: '既に処理中です',
  noimage: 'この拡張子のファイルは見つかりませんでした。',
  avifUnsupported: 'このブラウザはAVIF形式に対応していません。AVIF画像を変換する場合は最新版のFirefox又はGoogle Chromeを使用して下さい。',
  cancel: 'キャンセル',
  inputSize: '入力サイズ',
  outputSize: '出力サイズ',
  save: '保存',
  close: '閉じる',
  open: '開く',
  reconvert: '再変換',
  reconvertTip: '前回選択した{n}個のファイルを再変換します。',
  files: 'ファイル',

  confirmCloseDialog: `まだ変換したファイルを保存していません。`,
  confirmCloseDialogTitle: '変換ファイルが未保存',
};


export function createI18n() {
  return _createI18n({
    legacy: false,
    globalInjection: true,
    
    locale: 'en',
    fallbackLocale: 'en',
    
    messages: {
      en,
      ja
    },
  });
}
