import { Piece } from './Piece.service';
import { Grid } from './Grid';
import {
  ScoreActionEvent,
  ScoreActionType
} from './ScoreAction';
import { GameControl } from './GameControl';
import { BehaviorSubject } from 'rxjs';



/**
 * From Guidelines:
 * 
 * Key press delay before repeat: ~ 0.3 seconds,
 * hold until next piece cause no initial delay,
 * switch direction in any circumstances will cause delay again
 * hold key will not be canceled but will be overridden
 * 
 * hard drop and locks take 0.0001 second, no auto repeat
 * 
 * soft drop is 20 times faster than normal
 * 
 * lock down timer: 0.5 second (classic lock down)
 * falling will refresh, rotating won't
 * 
 * 
 */



export enum LockDownType {
  EXTENDED_PLACEMENT,
  INFINITE_PLACEMENT,
  CLASSIC
}


export enum GoalSystemType {
  FIXED_GOAL_SYSTEM,
  VARIABLE_GOAL_SYSTEM,
}

export class Game {

  control: GameControl = null;
  destroyed = false;
  scoreActionEmitter: BehaviorSubject<ScoreActionEvent>;

  statistics: {
    actual_lines_cleared: number
    rewarded_lines_cleared: number
    level: number
    score: number
  }
  initStaticstics(){
    let initial = {
      actual_lines_cleared: 0,
      rewarded_lines_cleared: 0,
      level: 1,
      score: 0,
    };
    if(this.statistics){
      Object.assign(this.statistics, initial);
    } else{
      this.statistics = initial;
    }
  }

  config: {
    base_drop_time: number
    lock_down_type: LockDownType
    lock_down_time: number
    extended_placement_max_action: number
    recognise_wall_in_t_spin: boolean
    empty_block_as_t_spin_mini: boolean
    goal_system: GoalSystemType
    queue_length: 5
  } = {
    base_drop_time: 1000,
    lock_down_type: LockDownType.EXTENDED_PLACEMENT,
    lock_down_time: 500,
    extended_placement_max_action: 15,
    recognise_wall_in_t_spin: false,
    empty_block_as_t_spin_mini: true,
    goal_system: GoalSystemType.VARIABLE_GOAL_SYSTEM,
    queue_length: 5,
  }

  actionData: Partial<{
    currentPieceSwapped: boolean;
    currentPieceLowestReach: number;
    currentPieceSoftdrop: number;
    currentPieceHarddrop: number;
    currentPieceTSpin: boolean;

    extendedPlacementActionCount: number;

    lastFallTime: number;
    lastActionTime: number;

    isPaused: boolean;
    clearedOnLastPiece: boolean;
    dropTime: number;
  }>
  initActionData(
      currentPieceSwapped = false,
      isPaused = false,
      clearedOnLastPiece = false,
      dropTime = this.config.base_drop_time,
  ){
    if(!this.actionData){
      this.actionData = {};
    }
    Object.assign(this.actionData, {
      currentPieceLowestReach: false,
      
      currentPieceSoftdrop: 0,
      currentPieceHarddrop: 0,
      currentPieceTSpin: false,

      extendedPlacementActionCount: 0,

      lastFallTime: performance.now(),
      lastActionTime: 0,
    });
    if(currentPieceSwapped !== null){
      this.actionData.currentPieceSwapped = currentPieceSwapped;
    }
    if(isPaused !== null){
      this.actionData.isPaused = isPaused;
    }
    if(clearedOnLastPiece !== null){
      this.actionData.clearedOnLastPiece = clearedOnLastPiece;
    }
    if(dropTime !== null){
      this.actionData.dropTime = dropTime;
    }
  }

  gameData: Partial<{
    tetriminoBag:  Piece[];
    queuedTetrimino: Piece[];
    heldTetrimino: Piece;
    stage: Grid;
    isGameOver: boolean;
    started: boolean;
  }>
  initGameData(){
    if(!this.gameData){
      this.gameData = {};
    }
    Object.assign(this.gameData, {
      tetriminoBag: [],
      queuedTetrimino: [],
      heldTetrimino: null,
      stage: new Grid(),
      isGameOver: false,
      started: false,
    });
  }

  constructor(){
    this.newGame();
  }
  newGame(){
    this.initStaticstics();
    this.initActionData();
    this.initGameData();
    this.control = new GameControl(this.gameData.stage);
    this.control.init();
    if(this.scoreActionEmitter){
      this.scoreActionEmitter.unsubscribe();
    }
    this.scoreActionEmitter = new BehaviorSubject(
        new ScoreActionEvent(ScoreActionType.NO_ACTION));
  }

  async handlePause(){
    while(this.control.paused){
      await new Promise(res => setTimeout(res, 16));
    }
  }

  async beginGenerationPhase(){
    this.initActionData(null, null, null, null);
    this.control.init(null, null);

    let bag = this.gameData.tetriminoBag;
    if(!bag.length){

      let _bag = [
        "I", "J", "L", "O", "S", "T", "Z"
      ];

      let rands = crypto.getRandomValues(
          new Uint8Array(_bag.length));
      while(_bag.length){
        let rand = Math.trunc(
            rands[_bag.length - 1] / 256.0 * _bag.length);
        let P = _bag.splice(rand, 1)[0];
        bag.push(new Piece[P]());
      }
    }
    

    let queue = this.gameData.queuedTetrimino;
    if(queue.length < this.config.queue_length){
      queue.push(bag.shift());
      return "beginGenerationPhase";
    }
    this.gameData.stage.activePiece = queue.shift();
    queue.push(bag.shift());

    return "beginFallingPhase";
  }

  handleSwap(){
    if(!this.actionData.currentPieceSwapped
        && this.control.swapping){
      this.control.swapping = false;
      this.actionData.currentPieceSwapped = true;

      let heldPieceContructor = Object.getPrototypeOf(
          this.gameData.stage.activePiece).constructor;
      if(!this.gameData.heldTetrimino){
        this.gameData.heldTetrimino = new heldPieceContructor();
        return true;
      }

      this.initActionData(null, null, null, null);
      this.control.init(null, null);
      this.gameData.stage.activePiece =
          this.gameData.heldTetrimino;
      this.gameData.heldTetrimino = new heldPieceContructor();
    }
    return false;
  }
  async beginFallingPhase(){
    await this.handlePause();
    let swapped = this.handleSwap();
    if(swapped){
      return "beginGenerationPhase";
    }
    
    const stage = this.gameData.stage;

    if(this.control.hard_drop){
      let lines = stage.drop();
      this.actionData.currentPieceHarddrop = lines;
      return "beginPatternPhase";
    }

    let p = stage.activePiece;
    let [collide, ...oob] = stage.collide(p, null, p.x, p.y+1);
    if(collide || oob[1]){
      return "beginLockPhase";
    }

    if(( performance.now() -
        this.actionData.lastFallTime ) < (
        this.control.soft_drop ?
        this.actionData.dropTime / 20 :
        this.actionData.dropTime )){
      await new Promise(res => setTimeout(res, 8));
      return "beginFallingPhase";
    }

    let success = stage.fallOneStep();
    if(success){
      this.actionData.lastFallTime = performance.now();
      if(p.y > this.actionData.currentPieceLowestReach){
        this.actionData.currentPieceLowestReach = p.y;
        this.actionData.extendedPlacementActionCount = 0;
      }
      if(this.control.soft_drop){
        this.actionData.currentPieceSoftdrop += 1;
      }
      return "beginFallingPhase";
    } else{
      return "beginLockPhase";
    }
  }
  async beginLockPhase(){
    switch(this.config.lock_down_type){
    case LockDownType.EXTENDED_PLACEMENT:
      if((
          performance.now() -
          this.actionData.lastFallTime >
          this.config.lock_down_time ) || (
          this.actionData.extendedPlacementActionCount >=
          this.config.extended_placement_max_action )){
        let p = this.gameData.stage.activePiece;
        let [collide, ...oob] = this.gameData.stage.collide(
            p, null, p.x, p.y + 1);
        if(collide || oob[1]){
          return "beginPatternPhase";
        }
      }

      break;
    default:
      throw new Error("lock down type not implemented");
    }
    await new Promise(res => setTimeout(res, 8));
    return "beginFallingPhase";
  }
  beginPatternPhase(){
    const stage = this.gameData.stage;
    const p = stage.activePiece;
    let [collide, ...oob] = stage.collide(p);
    /*
    still game over even if line clear above skyline
    because for now Grid cannot handle oob merge
    */
    if(collide || oob[0]){
      this.gameData.isGameOver = true;
      return;
    }

    let t_spin = false;
    let t_spin_mini = false;
    if(this.control.t_spin &&
        this.control.last_action_rotate){
      t_spin = true;
    } else if(p instanceof Piece.T &&
        this.control.last_action_rotate){

      let corners = [
        stage.isOccupied(p.x, p.y),
        stage.isOccupied(p.x+2, p.y),
        stage.isOccupied(p.x+2, p.y+2),
        stage.isOccupied(p.x, p.y+2),
      ];
      console.log("corners b4", corners);
      if(this.config.recognise_wall_in_t_spin){
        for(let i = 0; i < 4; ++i){
          corners[i] = corners[i] || corners[i] === null;
        }
      }
      console.log("corners", corners);

      let ori = p.orientation;
      // normalize orientation to north
      for(let i = 0; i < ori; ++i){
        let occup = corners.shift();
        corners.push(occup);
      }

      if(corners[0] && corners[1]){
        if(corners[2] || corners[3]){
          if(this.config.empty_block_as_t_spin_mini){
            let occup = (
              ori == 0 ? stage.isOccupied(p.x+1, p.y+2) :
              ori == 1 ? stage.isOccupied(p.x, p.y+1) :
              ori == 2 ? stage.isOccupied(p.x+1, p.y) :
              stage.isOccupied(p.x+2, p.y+1)
            );
            if(this.config.recognise_wall_in_t_spin){
              if(occup === null){
                occup = true;
              }
            }
            if(occup){
              t_spin = true;
            } else{
              t_spin_mini = true;
            }

          } else{
            t_spin = true;
          }
        }
      } else if(corners[2] && corners[3]){
        if(corners[0] || corners[1]){
          t_spin = true;
        }
      }
    }

    stage.mergePiece();

    let event = ScoreActionType.NO_ACTION;
    let rows = stage.clearFullRows();
    let score = 0;
    switch(rows.length){
    case 0:
      if(t_spin){
        score = 400 * this.statistics.level;
        this.emit(ScoreActionType.T_SPIN, p.x, p.y);
        this.statistics.rewarded_lines_cleared += 4;
      } else if(t_spin_mini){
        score = 100 * this.statistics.level;
        this.emit(ScoreActionType.MINI_T_SPIN, p.x, p.y);
        this.statistics.rewarded_lines_cleared += 1;
      }
      break;
    case 1:
      if(t_spin){
        event = ScoreActionType.T_SPIN_SINGLE;
        score = 800 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 8;
      } else if(t_spin_mini){
        event = ScoreActionType.MINI_T_SPIN_SINGLE;
        score = 200 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 2;
      } else{
        event = ScoreActionType.SINGLE;
        score = 100 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 1;
      }
      this.emit(event, p.x, p.y);
      break;
    case 2:
      if(t_spin){
        event = ScoreActionType.T_SPIN_DOUBLE;
        score = 1200 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 12;
      } else if(t_spin_mini){
        console.error("FATAL: mini T spin is impossible to have double clear")
      } else{
        event = ScoreActionType.DOUBLE;
        score = 300 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 3;
      }
      this.emit(event, p.x, p.y);
      break;
    case 3:
      if(t_spin){
        event = ScoreActionType.T_SPIN_TRIPLE;
        score = 1600 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 16;
      } else if(t_spin_mini){
        console.error("FATAL: mini T spin is impossible to have triple clear")
      } else{
        event = ScoreActionType.TRIPLE;
        score = 500 * this.statistics.level;
        this.statistics.rewarded_lines_cleared += 5;
      }
      this.emit(event, p.x, p.y);
      break;
    case 4:
      this.emit(ScoreActionType.TETRIS, p.x, p.y);
      score = 800 * this.statistics.level;
      
      this.statistics.rewarded_lines_cleared += 8;
      break;
    default:
      throw Error("BRUH");
    }
    
    
    if(rows.length){
      
      if(this.actionData.clearedOnLastPiece){
        score *= 1.5;
        this.statistics.rewarded_lines_cleared +=
            Math.floor(rows.length / 2);
        this.emit(ScoreActionType.BACK_TO_BACK, 5, p.y - 2);
      }
      this.statistics.actual_lines_cleared += rows.length;

      
      if(this.config.goal_system === 
          GoalSystemType.VARIABLE_GOAL_SYSTEM){
        let new_level = Math.ceil(0.1 * (Math.sqrt(40 * (
            this.statistics.rewarded_lines_cleared + 1) + 25) - 5));
        if(this.statistics.level != new_level){
          this.statistics.level = new_level;
          this.actionData.dropTime =
              this.config.base_drop_time *
              Math.pow(
              0.8 - ((new_level - 1) * 0.007),
              new_level - 1
          );
        }
      }

      this.actionData.clearedOnLastPiece = true;
    } else{
      this.actionData.clearedOnLastPiece = false;
    }
    
    if(this.actionData.currentPieceSoftdrop){
      score +=  this.actionData.currentPieceSoftdrop;
    }
    if(this.actionData.currentPieceHarddrop){
      this.emit(ScoreActionType.HARD_DROP, 5, p.y - 4);
      score += this.actionData.currentPieceHarddrop * 2;
    }
    this.statistics.score += score;

    this.actionData.currentPieceSwapped = false;

    return "beginGenerationPhase";
  }

  emit(e: ScoreActionType, x: number = 5, y: number = 18){
    this.scoreActionEmitter.next(new ScoreActionEvent(
      e, x, y
    ));
  }
  gameOver(){

  }

  start(){
    if(!this.gameData.started){
      this.mainLoop();
      this.gameData.started = true;
    }
  }
  destroy(){
    this.destroyed = true;
    
    if(this.scoreActionEmitter){
      this.scoreActionEmitter.unsubscribe();
    }
  }

  async mainLoop(){
    let nextPhase = await this.beginGenerationPhase();
    while(!this.destroyed &&
        nextPhase &&
        !this.gameData.isGameOver){
      nextPhase = await this[nextPhase]();
    }
    this.gameOver();
  }
}
