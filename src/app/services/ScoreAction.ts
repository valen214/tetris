

export enum ScoreActionType {
    NO_ACTION,
    SINGLE,
    DOUBLE,
    TRIPLE,
    TETRIS,
    MINI_T_SPIN,
    MINI_T_SPIN_SINGLE,
    T_SPIN,
    T_SPIN_SINGLE,
    T_SPIN_DOUBLE,
    T_SPIN_TRIPLE,
    BACK_TO_BACK,
    SOFT_DROP,
    HARD_DROP,
  }
  export class ScoreActionEvent
  {
    constructor(
      public action: ScoreActionType,
      public x?: number,
      public y?: number,
    ){}
  }