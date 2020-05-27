import { Injectable } from '@angular/core';
import { Piece } from './Piece.service';
import { Grid } from './Grid';
import { BehaviorSubject } from 'rxjs';
import { ScoreActionEvent, ScoreActionType } from './ScoreAction';




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

enum LockDownType {
  EXTENDED_PLACEMENT,
  INFINITE_PLACEMENT,
  CLASSIC
}

enum GoalSystemType {
  FIXED_GOAL_SYSTEM,
  VARIABLE_GOAL_SYSTEM,
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  static LOCK_DOWN_TIME = 500;
  static LOCK_DOWN_SETTING = LockDownType.EXTENDED_PLACEMENT
  static EXTENDED_PLACEMENT_MAX_ACTION_BEFORE_LOCK_DOWN = 15;


  scoreActionEmitter: BehaviorSubject<ScoreActionEvent>;

  /**
https://www.dropbox.com/s/g55gwls0h2muqzn/
tetris%20guideline%20docs%202009.zip?
dl=0&file_subpath=%2F2009+Tetris+Design+Guideline.pdf
   */
  grid: Grid;
  running: boolean;
  timestampSincePieceFallOneStep: number;

  stored: Piece = null;
  currentPieceSwapped: boolean;
  piecesBag: Piece[];
  queue: Piece[];
  actionCount: number;
  lastActionTimeStamp: number;
  dropTime: number = 200;
  harddropped: boolean;
  softdropping: boolean;
  level = 1;
  goalSystem = GoalSystemType.VARIABLE_GOAL_SYSTEM;
  candidateTSpin: ScoreActionType
  clearedOnLastMerge: boolean;


  private _rowsCleared: number;
  get rowsCleared(){ return this._rowsCleared }
  private _score: number;
  get score(){ return this._score }
  isGameOver: boolean;

  constructor(){ }

  newGame(){
    this.grid = new Grid();
    this.running = false;
    this.stored = null;
    this.currentPieceSwapped = false;
    this.piecesBag = [];
    this.queue = [];
    this.dropTime = 1000;
    this._rowsCleared = 0;
    this._score = 0;
    this.isGameOver = false;
    this.harddropped = false;
    this.softdropping = false;
    this.level = 1;
    if(this.scoreActionEmitter){
      this.scoreActionEmitter.unsubscribe();
    }
    this.scoreActionEmitter = new BehaviorSubject(
        new ScoreActionEvent(ScoreActionType.NO_ACTION));
    this.candidateTSpin = null;
    this.clearedOnLastMerge = false;
    this.lastActionTimeStamp = performance.now();
  }

  getGrid(){
    return this.grid;
  }

  /**
   * Game Logic
   */
  private addPieceToQueue(){
    // "bag system", see guidelines
    if(!this.piecesBag.length){
      let bag = [
        Piece.I, Piece.J, Piece.L, Piece.O,
        Piece.S, Piece.T, Piece.Z
      ];
      while(bag.length){
        let rand = crypto.getRandomValues(new Uint8Array(1))[0];
        rand = Math.trunc(rand * bag.length / 256);
        let P = bag.splice(rand, 1)[0];
        this.piecesBag.push(new P());
      }
    }
    
    this.queue.push(this.piecesBag.shift());
  }
  private movePieceFromQueueToStage(){
    this.currentPieceSwapped = false;
    this.harddropped = false;
    this.softdropping = false;
    this.candidateTSpin = null;
    this.timestampSincePieceFallOneStep = performance.now();
    this.grid.activePiece = this.queue.shift();
  }

  /**
   * ACTIONS
   */
  moveLeft(){
    if(!this.running) return;
    let success = this.grid.moveLeft();
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
    }
  }
  moveRight(){
    if(!this.running) return;
    let success = this.grid.moveRight();
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
    }
  }
  rotate(clockwise = true){
    if(!this.running) return;
    let score_event = this.grid.rotate(clockwise);
    if(score_event){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();

      if(score_event === ScoreActionType.T_SPIN){
        this.candidateTSpin = ScoreActionType.T_SPIN
      } else if(score_event === ScoreActionType.MINI_T_SPIN &&
        this.candidateTSpin !== ScoreActionType.T_SPIN
      ){
        this.candidateTSpin = ScoreActionType.MINI_T_SPIN;
      }
    }
  }

  startSoftDrop(){
    if(!this.running) return;
    this.softdropping = true;
  }
  stopSoftDrop(){
    this.softdropping = false;
  }
  drop(){
    if(!this.running) return;
    this.harddropped = true;
  }
  store(){
    if(!this.running) return;
    if(!this.grid.activePiece) return;
    if(!this.currentPieceSwapped){
      let toBeStored = new (Object.getPrototypeOf(this.grid.activePiece).constructor)();
      if(this.stored){
        this.grid.activePiece = this.stored;
      } else{
        this.movePieceFromQueueToStage();
        this.addPieceToQueue();
      }
      this.stored = toBeStored;
      this.currentPieceSwapped = true;
    }
  }
  pause(){
    this.running = false;
  }
  continue(){
    this.running = true;
  }

  emit(e: ScoreActionType, x: number = 5, y: number = 18){
    this.scoreActionEmitter.next(new ScoreActionEvent( e, x, y ));
  }

  async start(){
    this.running = true;
    [0, 1, 2, 3, 4, 5].forEach(() => this.addPieceToQueue());

    const grid = this.grid;



    /*
    main game loop
    */
    while(!this.isGameOver && grid === this.grid){
      this.movePieceFromQueueToStage();
      if(grid !== this.grid) break;
      this.addPieceToQueue();
      if(grid !== this.grid) break;

      let lastDropTimestamp = performance.now();
      let p = this.grid.activePiece;
      let lowest_reached_row = p.y;

      // piece drop state
      while(grid === this.grid){
        if(this.harddropped){
          let lines = this.grid.drop();
          let [collide, ...oob] = this.grid.collide(p, null, p.x, p.y);
          

          if(collide || oob[0]){
            this.gameOver();
            return;
          }
          this.emit(ScoreActionType.HARD_DROP);
          this._score += lines * 2;
          this.grid.mergePiece();
          this.harddropped = false;
          break;
        }

        let merged = false;
        if(p !== this.grid.activePiece){
          throw new Error("active piece changed duration old piece dropping");
          p = this.grid.activePiece;
          lastDropTimestamp = performance.now();
          lowest_reached_row = p.y;
          this.actionCount = 0;
        }

        switch(GameService.LOCK_DOWN_SETTING){
        case LockDownType.EXTENDED_PLACEMENT:
          let droptime = this.softdropping ?
              this.dropTime / 20 : this.dropTime;
          if(performance.now() - lastDropTimestamp >= droptime){
            let dropped = this.grid.fallOneStep();
            if(dropped){
              lastDropTimestamp = performance.now();
              // this.emit(ScoreActionType.SOFT_DROP);
              this._score += 1;
            }

            if(p.y > lowest_reached_row){
              this.actionCount = 0;
              lowest_reached_row = p.y;
            } else if(this.actionCount >= 15
              || ((
                performance.now() - this.lastActionTimeStamp
              ) >= GameService.LOCK_DOWN_TIME )){
              let [collide, ...oob] = this.grid.collide(p, null, p.x, p.y);
              if(collide){
                this.gameOver();
                return;
              }
              [collide, ...oob] = this.grid.collide(p, null, p.x, p.y + 1);
              if(oob[0]){
                this.gameOver();
                return;
              }
              if(collide || oob[1]){
                this.grid.mergePiece();
                merged = true;
              }
            }
          }
          break;
        case LockDownType.CLASSIC:
          GameService.LOCK_DOWN_TIME
          break;
        case LockDownType.INFINITE_PLACEMENT:
          break;
        }
        if(merged){
          break;
        }
        do{
          await new Promise(res => setTimeout(res, 8));
          if(grid !== this.grid) break;
        } while(!this.running && !this.isGameOver);
      }
      
      if(grid !== this.grid) break;
      // post merge
      let clearedRows = this.grid.clearFullRows();
      this._rowsCleared += clearedRows.length;
      
      let event = null;
      let score = 0;
      switch(clearedRows.length){
      case 0:
        if(this.candidateTSpin === ScoreActionType.T_SPIN){
          score = 400 * this.level;
          this.emit(ScoreActionType.T_SPIN_SINGLE, p.x, p.y);
        } else if(this.candidateTSpin === ScoreActionType.MINI_T_SPIN){
          score = 100 * this.level;
          this.emit(ScoreActionType.MINI_T_SPIN_SINGLE, p.x, p.y);
        }
        break;
      case 1:
        if(this.candidateTSpin === ScoreActionType.T_SPIN){
          event = ScoreActionType.T_SPIN_SINGLE;
          score = 800 * this.level;
        } else if(this.candidateTSpin === ScoreActionType.MINI_T_SPIN){
          event = ScoreActionType.MINI_T_SPIN_SINGLE;
          score = 200 * this.level;
        } else{
          event = ScoreActionType.SINGLE;
          score = 100 * this.level;
        }
        this.emit(event, p.x, p.y);
        break;
      case 2:
        if(this.candidateTSpin === ScoreActionType.T_SPIN){
          event = ScoreActionType.T_SPIN_DOUBLE;
          score = 1200 * this.level;
        } else if(this.candidateTSpin === ScoreActionType.MINI_T_SPIN){
          console.error("FATAL: mini T spin is impossible to have double clear")
        } else{
          event = ScoreActionType.DOUBLE;
          score = 300 * this.level;
        }
        this.emit(event, 5, clearedRows[0]);
        break;
      case 3:
        if(this.candidateTSpin === ScoreActionType.T_SPIN){
          event = ScoreActionType.T_SPIN_TRIPLE;
          score = 1600 * this.level;
        } else if(this.candidateTSpin === ScoreActionType.MINI_T_SPIN){
          console.error("FATAL: mini T spin is impossible to have triple clear")
        } else{
          event = ScoreActionType.TRIPLE;
          score = 500 * this.level;
        }
        this.emit(event, 5, clearedRows[0]);
        break;
      case 4:
        this.emit(ScoreActionType.TETRIS, 5, clearedRows[0]);
        score = 800 * this.level;
        break;
      default:
      }

        
      if(clearedRows.length){
        if(this.goalSystem === GoalSystemType.VARIABLE_GOAL_SYSTEM){
          let level = Math.ceil(0.1 *
              (Math.sqrt(40 * (this._rowsCleared + 1) + 25) - 5));
          if(level != this.level){
            this.level = level;
            this.dropTime = 1000 * Math.pow(0.8 -
                ((level - 1) * 0.007), level - 1);
          }
        }
        if(this.clearedOnLastMerge){
          score *= 1.5;
          this.emit(ScoreActionType.BACK_TO_BACK, 5, clearedRows[0]);
        }
        this.clearedOnLastMerge = true;
      } else{
        this.clearedOnLastMerge = false;
      }

      this._score += score;
    }
    
    this.gameOver();
  }
  gameOver(){
    this.running = false;
    this.isGameOver = true;
    console.log("game over");
  }
}
