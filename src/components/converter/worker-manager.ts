import CanvasWorker from './worker.canvas?worker';



let WorkerId = 0;
export class WorkerWithId extends CanvasWorker {
  readonly id: number = WorkerId++;
  readonly priority: boolean;
  constructor(priority?: boolean) {
    super();
    this.priority = priority || false;
  }
  release() {
    releaseWorker(this);
  }
}

class PromiseWithWorkerId extends Promise<[WorkerWithId, PromiseListItem, boolean/*priority*/]> {
  wid: WorkerWithId['id'] = -1;
}

type WorkerResolver = () => void;
type PromiseListItem = PromiseWithWorkerId;
type PromiseList = Set<PromiseListItem>;

const workers: Set<WorkerWithId> = new Set;
const workerPromises: PromiseList = new Set;
const priorWorkerPromises: PromiseList = new Set;
const resolverFromWorker = new Map<WorkerWithId, WorkerResolver>;
const priorWorkerIds: number[] = [];

export function createWorker(priority?: boolean) {
  const worker = new WorkerWithId(); //new WorkerWithId(wurl, {type: 'module'});
  workers.add(worker);
  
  // create and add a resolved promise to WorkingWorkerPromises
  addNewPromiseToList(worker, priority);
  releaseWorker(worker);

  if( priority )
    priorWorkerIds.push(worker.id);

  return worker;
}

function addNewPromiseToList(worker: WorkerWithId, priority?: boolean) {
  const promiseList = ( priority ? priorWorkerPromises : workerPromises );
  
  // create a new Promise
  const promise = new PromiseWithWorkerId(resolve => {
    resolverFromWorker.set(worker, () => resolve([worker, promise, !!priority]));
  });
  promise.wid = worker.id;

  // renew the worker promise
  promiseList.add(promise);
}


export async function getWorker(priority?: boolean | number) {
  let promises: PromiseList;
  /*
  do {
    if( typeof priority !== 'undefined' ) {
      promises = priority ? priorWorkerPromises : workerPromises;
    }
    else 
      promises = new Set([...workerPromises, ...priorWorkerPromises]);

    [worker, promise] = await Promise.any(promises);
  } while( !promises.has(promise) ) // check if the promise was already picked out
  */

  if( !priority /*|| typeof priority === 'undefined'*/ ) {
    //promises = new Set([...workerPromises, ...priorWorkerPromises]);
    promises = new Set([...priorWorkerPromises, ...workerPromises]);
  }
  else if( typeof priority === 'number' ) {
    const wids = priorWorkerIds.slice(0, priority);
    promises = new Set( [...priorWorkerPromises].filter((p) => wids.includes(p.wid)) );
  }
  else {
    promises = priority ? priorWorkerPromises : workerPromises;
  }
  
  // pick one of fulfilled Promise
  const [worker, promise, pickedWorkerPriority] = await Promise.any(promises);
  
  // remove the old promise
  ( pickedWorkerPriority ? priorWorkerPromises : workerPromises ).delete( promise );

  // set a new promise
  addNewPromiseToList( worker, pickedWorkerPriority );

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
    console.warn(`the worker was already released.`, worker.id);
    return;
  }

  //console.log(resolverFromWorker.has(worker), busyWorkerList.has(worker));
  resolverFromWorker.delete(worker);
  //busyWorkerList.delete(worker);
  
  resolve();
}

export function releaseAllWorkers() {
  for( const worker of resolverFromWorker.keys() )
    releaseWorker(worker);
}


export async function waitAllWorkers() {
  return await Promise.all([...workerPromises, ...priorWorkerPromises]);
}

export function getBusyWorkers() {
  return [];//[...busyWorkerList];
}

export function init() {
  releaseAllWorkers();
  for( const worker of workers ) {
    worker.onmessage = null;
    worker.terminate();
  }
  workers.clear();
  workerPromises.clear();
  priorWorkerPromises.clear();
  //promiseFromWorker.clear();
  resolverFromWorker.clear();
  //busyWorkerList.clear();

  WorkerId = 0;
}


