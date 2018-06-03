import * as Bacon from "baconjs";
import { set, setIn } from "icepick";
import * as PIXI from "pixi.js";
import { createStore } from "redux";
import { Cmd, install, loop, Loop, LoopReducer } from "redux-loop";
import * as sideEffects from "./sideEffects";
import {EffectState, IState, Message} from "./types";

const initialState: IState = {
  entities: [
    {
      active: true,
      id: "player",
      sprite: "assets/xwing.png",
      x: 500,
      y: 500,
    },
  ],
  gameInitialized: EffectState.NOT_STARTED,
  paused: false,
};

const keyHandlers: {readonly [key: string]: (IState) => IState} = {
  " ": (state) => {
    return set(state, "paused", !state.paused);
  },

  "w": (state) => {
    return setIn(state, ["entities", 0, "y"], state.entities[0].y - 6);
  },
};

const gameReducer: LoopReducer<IState, Message> = (
  state: IState = initialState, message: Message,
): Loop<IState, Message> => {
  switch (message.type) {
    case "TICK":
      return state.gameInitialized === EffectState.NOT_STARTED
        ? loop(
          set(state, "gameInitialized", EffectState.PENDING),
          Cmd.run<Message>(
            sideEffects.initGame(message.app),
            {
              successActionCreator: () => ({ type: "GAME_READY" }),
            },
          ),
        )
        : loop(state, Cmd.none);

    case "KEY_PRESS":
      return loop(
        keyHandlers[message.key] ? keyHandlers[message.key](state) : state,
        Cmd.none,
      );

    case "GAME_READY" :
      return loop(
          set(state, "gameInitialized", EffectState.FINISHED),
          Cmd.none,
        );

    default:
      return loop(state, Cmd.none);
  }
};

export function ticker(app: PIXI.Application): any {
  const tickStream = Bacon.interval(16, true)
    .map<Message>({ type: "TICK", app });

  const inputStream = Bacon.fromEvent(document, "keydown")
    .map<Message>((e: KeyboardEvent) => {
      return { type: "KEY_PRESS", key: e.key };
    })
    .log();

  const mergedStreams = Bacon.mergeAll(tickStream, inputStream);

  // wrap the reducer so it always runs the drawing side effect after
  const wrappedReducer: LoopReducer<IState, Message> = (state, message) => {
    const result = gameReducer(state, message);
    const updatedState = result[0];
    const cmd = result[1];

    return loop(
      updatedState,
      Cmd.list([
        cmd,
        updatedState.gameInitialized === EffectState.FINISHED
          ? Cmd.run(sideEffects.draw(
            app, updatedState.entities,
          ))
          : Cmd.none,
      ]),
    );
  };

  const gameState = createStore(wrappedReducer, install());

  // ensure type discipline on any of the messages return from the streams
  const dispatch = (message: Message) => gameState.dispatch(message);

  return mergedStreams.onValue((message) => dispatch(message));
}
