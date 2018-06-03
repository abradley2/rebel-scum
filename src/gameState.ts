import * as Bacon from "baconjs";
import { set, setIn } from "icepick";
import * as PIXI from "pixi.js";
import { createStore } from "redux";
import { Cmd, install, loop, Loop, LoopReducer } from "redux-loop";
import {firePlayerMissile, updateMissiles} from "./missiles";
import * as sideEffects from "./sideEffects";
import {EffectState, IEntity, IState, KeyState, Message} from "./types";

const initialState: IState = {
  entities: [
    {
      active: true,
      id: "player",
      sprite: "assets/tie-smol.png",
      x: 500,
      y: 500,
      width: 70,
      height: 80,
      subType: { type: "PLAYER" },
    },
  ],
  gameInitialized: EffectState.NOT_STARTED,
  keyMap: {
    a: KeyState.UP,
    d: KeyState.UP,
    s: KeyState.UP,
    w: KeyState.UP,
  },
  paused: false,
};

const keyHandlers: {readonly [key: string]: (IState) => IState} = {
  "p": (state) => {
    return set(state, "paused", !state.paused);
  },

  " ": (state) => {
    return firePlayerMissile(state);
  },
};

const updatePlayer = (state: IState): IState => {
  const player = state.entities[0];
  const keyMap = state.keyMap;

  const setter =
    (predicate: KeyState, coord: string, value: number) =>
    (p: IEntity) => predicate === KeyState.DOWN ? set(p, coord, p[coord] + value) : p;

  const updatedPlayer = [
    setter(keyMap.w, "y", -5),
    setter(keyMap.a, "x", -5),
    setter(keyMap.s, "y", 5),
    setter(keyMap.d, "x", 5),
  ].reduce((p, cur) => cur(p), player);

  return setIn(state, ["entities", 0], updatedPlayer);
};

const setKeyMapState = (state: IState, key: string, isDown: boolean): IState => {
  return Object.keys(state.keyMap).indexOf(key) !== -1 ?
     setIn(state, ["keyMap", key], isDown ? KeyState.DOWN : KeyState.UP)
     : state;
};

const gameReducer: LoopReducer<IState, Message> = (
  state: IState = initialState, message: Message,
): Loop<IState, Message> => {
  switch (message.type) {
    case "TICK":
      // const categorized = state.entities.reduce((acc, cur) => {
      //   const [key, val] = {
      //     missile: ["missiles", acc.missiles.concat([cur])],
      //   }[cur.subType.type];
      //
      //   return assign(acc, {
      //     player: acc.player,
      //     [key]: val,
      //   });
      // }, {
      //   player: state.entities[0],
      //   missiles: [],
      // });
      return state.gameInitialized === EffectState.NOT_STARTED
        // if still loading call the init game effect
        ? loop(
          set(state, "gameInitialized", EffectState.PENDING),
          Cmd.run<Message>(
            sideEffects.initGame(message.app),
            {
              successActionCreator: () => ({ type: "GAME_READY" }),
            },
          ),
        )
        // otherwise run the reducers for players and other entities
        : loop(
            [
              updateMissiles,
              updatePlayer,
            ].reduce((currentState, reducer) => reducer(currentState), state),
            Cmd.none,
        );

    case "KEY_UP":
      return loop(
        setKeyMapState(state, message.key, false),
        Cmd.none,
      );

    case "KEY_DOWN":
      const handler = keyHandlers[message.key];
      return loop(
        setKeyMapState(handler ? handler(state) : state, message.key, true),
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

export function createGameStream(app: PIXI.Application): any {
  const tickStream = Bacon.interval(15, true)
    .map<Message>({ type: "TICK", app });

  const keyDownStream = Bacon.fromEvent(document, "keydown")
    .filter((e: KeyboardEvent) => {
      return e.repeat === false;
    })
    .map<Message>((e: KeyboardEvent) => {
      return { type: "KEY_DOWN", key: e.key };
    });

  const keyUpStream = Bacon.fromEvent(document, "keyup")
    .map<Message>((e: KeyboardEvent) => {
      return { type: "KEY_UP", key: e.key };
    });

  const keyStream = keyDownStream.merge(keyUpStream);

  const mergedStreams = Bacon.mergeAll(
    tickStream,
    keyStream,
  );

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

  return mergedStreams
    .onValue((message) => {
      return dispatch(message);
    });
}
