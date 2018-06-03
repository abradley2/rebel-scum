import { set } from "icepick";
import * as PIXI from "pixi.js";
import { createStore } from "redux";
import { Cmd, install, loop, Loop, LoopReducer } from "redux-loop";
import * as sideEffects from "./sideEffects";

export type Message =
  | {
      readonly type: "TICK";
      readonly app: PIXI.Application;
    }
  | { readonly type: "GAME_READY" }
  | { readonly type: "NOOP" };

enum EffectState  {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

interface IState {
  readonly gameInitialized: EffectState;
  readonly paused: boolean;
}

const initialState: IState = {
  gameInitialized: EffectState.NOT_STARTED,
  paused: false,
};

const gameReducer: LoopReducer<IState, Message> = (
  state: IState = initialState, message: Message,
): Loop<IState, Message> => {

  switch (message.type) {
    case "TICK":
      return state.gameInitialized
        ? loop(
          set(state, "gameInitialized", EffectState.PENDING),
          Cmd.run(sideEffects.initGame(
            message.app,
            (): Message => ({ type: "GAME_READY" }),
          )),
        )
        : loop(state, Cmd.none);

    case "GAME_READY":
      return loop(
        set(state, "gameInitialized", EffectState.FINISHED),
        Cmd.none,
      );

    default:
      return loop(state, Cmd.none);
  }
};

export const gameState = createStore(gameReducer, install());

const dispatch = (message: Message) => gameState.dispatch(message);

export function ticker(app: PIXI.Application): number {
  return setInterval(() => {
    return dispatch({type: "TICK", app});
  }, 16.67);
}
