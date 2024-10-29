import CanvasWorker from './worker.canvas?worker';


let WorkerId = 0;
export class WorkerWithId extends CanvasWorker {
  readonly id: number = WorkerId++;
  release() {
    releaseWorker(this);
  }
}
type WorkerResolver = (worker: WorkerWithId) => void;

const workers: WorkerWithId[] = [];
const workingWorkerPromises = new Set<Promise<WorkerWithId>>;
const promiseFromWorker = new Map<WorkerWithId, Promise<WorkerWithId>>;
const resolverFromWorker = new Map<WorkerWithId, WorkerResolver>;
const busyWorkerList = new Set<WorkerWithId>;

export function createWorker(url: string, hook?: boolean) {
  const worker = new WorkerWithId(); //new WorkerWithId(wurl, {type: 'module'});
  workers.push(worker);
  
  if( hook ) {
    hookWorker(worker);
  }
  else {
    // create and add a resolved promise to WorkingWorkerPromises
    const promise = Promise.resolve(worker);
    workingWorkerPromises.add( promise );
    promiseFromWorker.set(worker, promise);
  }
  
  return worker;
}

export function hookWorker(worker: WorkerWithId) {
  /*
    NOTE: [2024/9] Promise.withResolvers is too new to use
  */
  const promise = new Promise<WorkerWithId>(resolve => {
    resolverFromWorker.set(worker, resolve);
  });

  workingWorkerPromises.add(promise);
  promiseFromWorker.set(worker, promise);
  busyWorkerList.add(worker);
}

export async function getWorker() {
  let worker: WorkerWithId;
  let promise: Promise<WorkerWithId>;
  do {
    worker = await Promise.any(workingWorkerPromises);
  } while( busyWorkerList.has(worker) )
  
  // remove the old promise
  promise = promiseFromWorker.get(worker);
  promiseFromWorker.delete(worker);
  workingWorkerPromises.delete(promise);

  // set a new promise
  hookWorker(worker);

  return worker;
}

export function releaseWorker(worker: WorkerWithId) {
  /*
    NOTE: removal of the promise is done in getWorker()
  //const promise = promiseFromWorker.get(worker);
  //workingWorkerPromises.delete(promise);
  */

  const resolve = resolverFromWorker.get(worker);
  if( !resolve ) {
    // console.warn(`the worker was already released.`, worker.id);
    return;
  }

  //console.log(resolverFromWorker.has(worker), busyWorkerList.has(worker));
  resolverFromWorker.delete(worker);
  busyWorkerList.delete(worker);
  
  resolve(worker);
}

export function releaseAllWorkers() {
  for( const worker of resolverFromWorker.keys() )
    releaseWorker(worker);
}

export async function waitAllWorkers() {
  return await Promise.all(workingWorkerPromises);
}

export function init() {
  releaseAllWorkers();
  for( const worker of workers ) {
    worker.terminate();
  }
  workers.length = 0;
  workingWorkerPromises.clear();
  promiseFromWorker.clear();
  resolverFromWorker.clear();
  busyWorkerList.clear();

  WorkerId = 0;
}


