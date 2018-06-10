import * as Bacon from "baconjs";
import { assign, set, setIn } from "icepick";
import * as PIXI from "pixi.js";
import { createStore } from "redux";
import { Cmd, CmdType, install, loop, Loop, LoopReducer } from "redux-loop";
import {firePlayerMissile, getXwing} from "./missiles";
import * as sideEffects from "./sideEffects";
import {EffectState, IEntity, IReducerBatchResult, IState, KeyState, Message} from "./types";

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
      rotation: 0,
      subType: {
        type: "PLAYER",
        params: {
          name: "player1",
        },
      },
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
  director: {
    xwingSpawn: EffectState.NOT_STARTED,
  },
};

const reducerBatch = (
  state: IState,
  reducers: Array<(state: IState) => [IState, CmdType<any>]>,
): IReducerBatchResult =>
  reducers.reduce((acc, reducer) => {
    const [newState, cmd] = reducer(acc.state);

    return {
      state: newState,
      cmds: acc.cmds.concat([cmd]),
    };
  }, {state, cmds: []});

const keyHandlers: {readonly [key: string]: (IState) => IState} = {
  "p": (state) => {
    return set(state, "paused", !state.paused);
  },

  " ": (state) => {
    return firePlayerMissile(state);
  },
};

const updatePlayer = (state: IState): [IState, CmdType<any>] => {
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

  const newState = setIn(state, ["entities", 0], updatedPlayer);

  return [newState, Cmd.none];
};

const updateDirector = (state: IState): [IState, CmdType<Message>] => {
  const result = reducerBatch(state, [
    (curState) => {
      switch ( curState.director.xwingSpawn) {
        case EffectState.NOT_STARTED:
          return [
            setIn(curState, ["director", "xwingSpawn"], EffectState.PENDING),
            Cmd.run(
              sideEffects.scheduleSpawn(1),
              {
                successActionCreator: ([random1]) => {
                  return {type: "SPAWN_XWING", xwing: getXwing(curState, random1)};
                },
              },
            ),
          ];
        default:
          return [curState, Cmd.none];
      }
    },
  ]);

  return [
    result.state,
    Cmd.list(result.cmds),
  ];
};

const setKeyMapState = (state: IState, key: string, isDown: boolean): IState => {
  return Object.keys(state.keyMap).indexOf(key) !== -1 ?
     setIn(state, ["keyMap", key], isDown ? KeyState.DOWN : KeyState.UP)
     : state;
};

const updateXWing = (entity: IEntity) => {
  return [
    set(entity, "y", entity.y + 5),
    Cmd.none,
  ];
};

const updateMissile = (entity: IEntity) => {
  switch (entity.subType.type) {
    case "MISSILE":
      const missile = set(
        entity,
        "y",
        entity.y - (entity.subType.params.speed * entity.subType.params.velocity),
      );
      return [
        missile,
        Cmd.none,
      ];
    default:
      throw new Error("NOT A MISSILE");
  }
};

const updateMob = (entity: IEntity) => {
  const subType = entity.subType;

  switch (subType.type) {
    case "XWING":
      return updateXWing(entity);
    case "MISSILE":
      return updateMissile(entity);
    default:
      return [entity, Cmd.none];
  }
};

const updateMobs = (state: IState): [IState, CmdType<Message>] => {
  const result = state.entities.reduce((acc, cur) => {
    const [entity, cmd] = updateMob(cur);

    return {
      entities: acc.entities.concat([entity]),
      cmds: acc.cmds.concat([cmd]),
    };
  }, {
    entities: [],
    cmds: [],
  });

  return [
    set(state, "entities", result.entities),
    Cmd.list(result.cmds),
  ];
};

const composeUpdaters = (state: IState) => {
  const result = reducerBatch(state, [
    updateDirector,
    updateMobs,
    updatePlayer,
  ]);

  return loop(
    result.state,
    Cmd.list(result.cmds),
  );
};

const gameReducer: LoopReducer<IState, Message> = (
  state: IState = initialState, message: Message,
): Loop<IState, Message> => {
  switch (message.type) {
    case "TICK":
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
        : composeUpdaters(state);

    case "SPAWN_XWING":
      return loop(
        assign(state, {
          director: set(state.director, "xwingSpawn", EffectState.NOT_STARTED),
          entities: state.entities.concat([message.xwing]),
        }),
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
  const tickStream = Bacon.interval(10, true)
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
