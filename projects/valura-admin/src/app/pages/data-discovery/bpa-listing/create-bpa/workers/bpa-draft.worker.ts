//// <reference lib="webworker" />
import { BPA_WORKER } from "@admin-core/constants/constants";

let intervalId: any | undefined;
addEventListener('message', ({ data }) => {

  if (data === BPA_WORKER.INIT) {
    if (!intervalId) {
      intervalId = setInterval(() => {
        postMessage({ type: BPA_WORKER.SAVE_BPA });
      }, 30000);
    }
  }

  if (data === BPA_WORKER.STOP && intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
});
