export type ConfirmOverwrite = boolean |
  ((handle:FileSystemHandle, name: string, parent: string) => Promise<boolean>);

export function isFileSystemAPISupported() {
  // @ts-ignore
  return typeof window.showDirectoryPicker === 'function';
}

export async function openDirectoryPicker(write = true): Promise<FileSystemDirectoryHandle | null> {
  let dirHandle;
  try {
    // @ts-ignore
    dirHandle = await window.showDirectoryPicker();
    if( dirHandle && write ) {
      if( await getFileSystemWritePermission(dirHandle) )
        return dirHandle;
    }
  } catch(e) {
    console.error(e);
  }

  return null;
}

export async function getFileSystemWritePermission(handle: FileSystemHandle) {
  let state;
  
  try {
    // @ts-ignore
    state = await handle.queryPermission({ mode: 'readwrite' });
  } catch(e) {
    console.error(e);
  }

  if( state !== 'granted' ) {
    try {
      // @ts-ignore
      state = await handle.requestPermission({ mode: 'readwrite' });
    }
    catch(e) {
      console.error(e);
    }
  }

  return state === 'granted';
}

export async function getFileHandle<T extends boolean>(
  rootDirHandle: FileSystemDirectoryHandle,
  path: string,
  getAsFile?: T,
): Promise<T extends true ? File : FileSystemFileHandle> {
  const segments = path.split('/');       // Split path into folders and filename
  const fileName = segments.pop()!;       // Extract the filename
  let currentDir = rootDirHandle;

  // Traverse nested directories
  for( const folderName of segments ) {
    currentDir = await currentDir.getDirectoryHandle(folderName);
  }

  // Get the file handle and file
  const fileHandle = await currentDir.getFileHandle(fileName);
  return getAsFile ? fileHandle.getFile() as any : fileHandle as any;
}
export async function getDirHandle<T extends boolean>(
  rootDirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemDirectoryHandle> {
  const segments = path.split('/');       // Split path into folders and filename
  const fileName = segments.pop()!;       // Extract the filename
  let currentDir = rootDirHandle;

  // Traverse nested directories
  for( const folderName of segments ) {
    currentDir = await currentDir.getDirectoryHandle(folderName);
  }

  // Get the file handle and file
  return await currentDir.getDirectoryHandle(fileName);
}

export async function writeFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  blob: Blob,
  allowOverrite?: ConfirmOverwrite,
  parentPath?: string,
) {
  if( allowOverrite !== true ) {
    try {
      // Try to get existing file handle without creating it
      const fileHandle = await dirHandle.getFileHandle(fileName);
      // If we reach here, the file exists
      if(
        !allowOverrite ||
        typeof allowOverrite === 'function' &&
          !(await allowOverrite(fileHandle, fileName, parentPath))
      )
        return false;
        
    } catch (e: any) {
      if( e.name === 'NotFoundError' ) {
        // File does not exist, safe to create
      }
      else
        throw e; // Other errors
    }
  }

  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  return true;
}

export async function createDirectory(
  dirHandle: FileSystemDirectoryHandle,
  dirName: string,
  allowOverwrite?: ConfirmOverwrite,
  parentPath?: string
) {
  const overwriteAllowed = allowOverwrite === true;
  let subDirHandle;
  let rejected = false;
  // Try to get the directory without creating it
  try {
    subDirHandle = await dirHandle.getDirectoryHandle(dirName, {create: overwriteAllowed});
    if( overwriteAllowed )
      return subDirHandle;

    // Directory exists
    if( !allowOverwrite ||
      typeof allowOverwrite === 'function' &&
        !(await allowOverwrite(dirHandle, dirName, parentPath))
    )
      return null;
  } catch (e: any) {
    if( e.name === 'NotFoundError' ) {
      // Directory does not exist, create it
      subDirHandle = await dirHandle.getDirectoryHandle(dirName, {create: true});
    }
    else {
      throw e; // Other errors
    }
  }

  if( rejected )
    throw new Error(`"${parentPath + dirName}" already exists.`);
  
  return subDirHandle;
}


const dirCaches = new Map<
  FileSystemDirectoryHandle, { [path: string]: FileSystemDirectoryHandle }
>();
export async function buildDirectories(
  dirHandle: FileSystemDirectoryHandle,
  path: string | string[],
  allowOverwrite?: ConfirmOverwrite,
  parentPath?: string,
) {
  let cache = dirCaches.get(dirHandle);
  if( !cache ) {
    console.log("create cache");
    cache = {};
    dirCaches.set(dirHandle, cache);
  }
  
  const dirs = [];
  let curDirHandle: FileSystemDirectoryHandle = dirHandle;
  let cachePath: string;

  // seek cached dirHandle
  const cdirs = typeof path === 'string' ? path.split('/') : path;
  cachePath = cdirs.join('/');
  do {
    const cachedDir = cache[cachePath];
    // check if target dir exists in cache
    if( cachedDir ) {
      //console.log('cache found', cachePath);
      curDirHandle = cache[cachePath];
      cachePath += '/';
      break;
    }
    
    // push uncached dir to list
    dirs.unshift( cdirs.pop() );
    cachePath = cdirs.join('/');
  } while( cdirs.length )
  
  // retrieve uncached directories from parent to child
  for( const targetDirName of dirs ) {
    if( !targetDirName )
      throw new Error('folderName is empty');
    
    curDirHandle = await createDirectory(curDirHandle, targetDirName, allowOverwrite, cachePath);
    if( !curDirHandle )
      return null;

    cache[cachePath + targetDirName] = curDirHandle;
    cachePath += targetDirName + '/';
    
  }

  return curDirHandle;
  /*
  const newDirName = dirs.shift();
  if( !newDirName )
    throw new Error('folderName is empty');
  
  const subdir = await createDirectory(dirHandle, newDirName, callback, parentPath);
  if( subdir ) {
    if( dirs.length && dirs[0] )
      return await buildDirectories(subdir, dirs, callback, parentPath + newDirName + '/');
    return subdir;
  }
  return null;
  */
}

export async function buildDirsAndWriteFile(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
  blob?: Blob,
  allowOverwrite?: ConfirmOverwrite
) {
  const dirs = path.split('/');
  const fileName = dirs.pop();
  if( !fileName )
    throw new Error('fileName is empty');
  
  const lastdir = !dirs.length ?
    dirHandle : await buildDirectories(dirHandle, dirs, allowOverwrite, '');
  if( lastdir ) {
    return await writeFile(
      lastdir, fileName, blob, allowOverwrite, !dirs.length ? '' : dirs.join('/') + '/'
    );
  }

  return false;
}

export async function isDirHandleValid(dirHandle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // Try to list entries; if the directory is gone, this will throw
    // @ts-ignore
    for await (const _ of dirHandle.entries()) {
      break; // even one entry is enough
    }
    return true;
  } catch (err: any) {
    if( err.name === 'NotFoundError' )
      return false;
    throw err; // other errors are real failures
  }
}

function createFolderSetFromFiles(flist: File[]): Set<string> {
  const folderSet = new Set<string>;
  
  for( const file of flist ) {
    const path = file.webkitRelativePath;
    const dirs = path.split('/');
    
    do {
      dirs.pop(); // remove last descendant
      const pathName = dirs.join('/');
      if( folderSet.has(pathName) )
        break;
      folderSet.add(pathName);
    } while( dirs.length >= 2 )
  }

  //console.log([...folderSet]);
  return folderSet;
}

export async function createExistingFolderSetWithinFileList(
  baseDirHandle: FileSystemDirectoryHandle, fileList: File[]
): Promise< Set<string> > {
  const folderSet = createFolderSetFromFiles(fileList);
  const sortedFolders = [...folderSet].sort();
  const result = new Set<string>();
  
  let dirHandle: FileSystemDirectoryHandle;
  let prevpath = '';
  for( let folderPath of sortedFolders ) {
    let path = folderPath;
    if( prevpath && folderPath.startsWith(prevpath + '/') ) {
      path = path.slice(prevpath.length + 1);
    }
    else
      dirHandle = baseDirHandle;

    try {
      dirHandle = await getDirHandle(dirHandle, path);
      result.add(folderPath);
      prevpath = folderPath;
    } catch(e: any) {
      prevpath = '';
    }
  }

  return result;
}



// store DirectoryHandle in IndexedDB
const DB_NAME = 'avif2jpeg-db';
const DB_VER = 1;
const DB_STORE = 'output-dirs';
const DB_ENTRY = 'last-used';

export async function initIndexDB() {
  return new Promise<any>(resolve => {
    const db = indexedDB.open(DB_NAME, DB_VER);

    // initialize database
    db.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      db.createObjectStore(DB_STORE, /*{ keyPath: 'type' }*/);
    };
    db.onsuccess = db.onerror = resolve;
  });
}
export async function saveDirHandleToInexDB(dirHandle: FileSystemDirectoryHandle) {
  return new Promise<void>(async (resolve, reject) => {
    const db = indexedDB.open(DB_NAME, DB_VER);
    // put data
    db.onsuccess = (event: any) => {
      const db = event.target.result as IDBDatabase;
      const tx = db.transaction([DB_STORE], 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.put(dirHandle, DB_ENTRY);
      
      resolve();
    };
    db.onerror = reject;
  });
}
export async function restoreDirHandleFromIndexDB() {
  return new Promise<FileSystemDirectoryHandle>(async (resolve, reject) => {
    const db = await indexedDB.open(DB_NAME, DB_VER);
    db.onsuccess = (event: any) => {
      const db = event.target.result as IDBDatabase;

      let tx;
      try {
        tx = db.transaction([DB_STORE], 'readonly');
      } catch(e) {
        reject(e);
        return;
      }

      const store = tx.objectStore(DB_STORE);
      const req = store.get(DB_ENTRY);

      req.onsuccess = (event: any) => {
        const result = event.target.result;
        resolve(result);
      };
      req.onerror = reject;
    };
    db.onerror = reject;
  }).catch(reason => {
    console.error(reason);
    return null;
  });
}
