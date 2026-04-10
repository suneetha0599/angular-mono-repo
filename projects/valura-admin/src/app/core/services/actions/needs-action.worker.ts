/// <reference lib="webworker" />

import Dexie from 'dexie';

let intervalId: any | undefined;
let apiUrl = '';
let queryUrl = '';
let token = '';
let isPaused = false;
let interval = 120000;

enum state {
  INIT = "INIT",
  STOP = "STOP",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UPDATE_TOKEN = "UPDATE_TOKEN",
}

//authorization headers
const authHeaders = () => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

addEventListener('message', async ({ data }) => {
  switch (data.type) {
    case state.INIT:
      queryUrl = data.queryUrl;
      apiUrl = data.apiUrl;
      token = data.token;

      if (!intervalId) {
        fetchAndStore();
        intervalId = setInterval(fetchAndStore, interval);
      }
      break;

    case state.STOP:
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      break;

    case state.UPDATE_TOKEN:
      token = data.token;
      if (isPaused) {
        isPaused = false;
      }
      break;
  }
});

async function fetchAndStore() {
  if (isPaused) return;
  try {
    const url = `${apiUrl}${queryUrl}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    postMessage({ type: state.SUCCESS, data: data });
  }
  catch (err: any) {
    console.error(err)
    if (err.status === 401) {
      isPaused = true;
      postMessage({ type: state.TOKEN_EXPIRED });
      return;
    }
    postMessage({ type: state.FAILURE, error: err.message });
  }
}

// Retry with exponential backoff
async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401) throw { status: 401 };
    if (res.ok) return res;

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error(`Failed after ${retries} attempts for ${url}`);
}
