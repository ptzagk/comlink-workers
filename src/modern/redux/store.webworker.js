/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

/**
 * Web worker to power redux state management.
 * Inspired article from https://dassur.ma/things/react-redux-comlink/
 */

import {
  expose,
  proxy
} from "https://unpkg.com/comlink@4.2.0/dist/esm/comlink.mjs";
import { createStore } from "https://unpkg.com/redux@4.0.4/es/redux.mjs";
import { Analyzer } from "../../analyzer.js";
import Actions from "./actions.js";

const initialState = {
  stats: {
    text: "",
    chars: 0,
    words: 0,
    lines: 0,
    mostUsed: []
  }
};

const handleAnalyzeAction = (state, text) => {
  const { stats } = Analyzer.analyzeText(text);
  return { ...state, ...{ stats } };
};

const reducer = (state = initialState, { type, text }) => {
  switch (type) {
    case Actions.ANALYZETEXT:
      return handleAnalyzeAction(state, text);
    default:
      return state;
  }
};

const subscribers = new Map();
const store = createStore(reducer);

const broadcastChanges = async () => {
  await store.getState();
  subscribers.forEach(fn => fn());
};
store.subscribe(proxy(broadcastChanges));

// state management interface to expose
// the main thread will call functions in
// this object and state management will
// happen in this worker
const StateMngr = {
  getState() {
    return store.getState();
  },

  dispatch(action) {
    store.dispatch(action);
  },

  subscribe(fn) {
    subscribers.set(subscribers.size, fn);
  }
};

expose(StateMngr);
