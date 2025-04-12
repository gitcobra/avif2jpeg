import { reactive } from 'vue';

export const MaxThreads = ref(navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 12) : 0);
const Limits: {
  [key: string]: {
    min?: number
    max?: number
  }
} = {
  threadCount: {
    min: 2,
    max: Math.max(2, MaxThreads.value),
  },
} as const;

const DefaultSettings = {
  imageFormat: 'image/jpeg',
  imageQuality: 90,

  expandExtButtons: false,
  acceptTypeValue: undefined,
  editedAcceptTypes: '',

  expandAdvSettings: false,
  retainExtension: false,
  maxZipSizeMB: 1000,
  useFolderNameForZip: false,

  multithread: true,
  threadCount: MaxThreads.value,

  shrinkImage: false,
  maxWidth: 4096,
  maxHeight: 4096,

  disableNotifyingFolderSelect: false,
} as const;

export type UserSettingsType = Omit<typeof DefaultSettings, "threadCount"> & {
  threadCount?: number
};
export const UserSettings = reactive(reset({}));
export function resetUserSettings() {
  reset(UserSettings);
}




function reset(obj: object): UserSettingsType {
  return Object.assign(obj, DefaultSettings);
}




// load UserSettings
const storeName = 'avif2jpeg';
const dat = JSON.parse(localStorage.getItem(storeName) || '{}');
for( const p in UserSettings ) {
  if( dat.hasOwnProperty(p) ) {
    if( dat[p] !== undefined ) {
      let value = dat[p];
      if( Limits.hasOwnProperty(p) ) {
        if( Limits[p].min! > value )
          value = Limits[p].min;
        if( Limits[p].max! < value )
          value = Limits[p].max;
      }
      (UserSettings as any)[p] = value;
    }
  }
}

// save settings on unload
const saveSettings = () => {
  const dat = {} as any;
  for( const p in UserSettings ) {
    dat[p] = (UserSettings as any)[p];
  }
  localStorage.setItem(storeName, JSON.stringify(dat));
};
window.addEventListener('beforeunload', saveSettings);

// clear and disable saving settings for testing initial value
export function _deleteLocalStorage() {
  localStorage.clear();
  window.removeEventListener('beforeunload', saveSettings);
}
