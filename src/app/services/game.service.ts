import { Injectable } from '@angular/core';
import { Piece } from './Piece.service';
import { Grid } from './Grid';
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

enum LockDownType {
  EXTENDED_PLACEMENT,
  INFINITE_PLACEMENT,
  CLASSIC
}

enum GoalSystemType {
  FIXED_GOAL_SYSTEM,
  VARIABLE_GOAL_SYSTEM,
}

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
    let success = this.grid.rotate(clockwise);
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
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
    this.grid.drop();
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
  async start(){
    this.running = true;
    [0, 1, 2, 3, 4, 5].forEach(() => this.addPieceToQueue());

    const grid = this.grid;

    /*
    main game loop
    */
    while(this.running && grid === this.grid){
      this.movePieceFromQueueToStage();
      if(grid !== this.grid) break;
      this.addPieceToQueue();
      if(grid !== this.grid) break;

      let lastDropTimestamp = performance.now();
      let p = this.grid.activePiece;
      let lowest_reached_row = p.y;
      while(grid === this.grid){
        if(this.harddropped){
          let [collide, ...oob] = this.grid.collide(p, null, p.x, p.y);
          if(collide || oob[0]){
            this.gameOver();
            return;
          }
          this.harddropped = false;
          this.softdropping = false;
          this.grid.mergePiece();
          break;
        }

        let merged = false;
        if(p !== this.grid.activePiece){
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
                this.softdropping = false;
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
          await new Promise(res => setTimeout(res, 16));
        } while(!this.running);
      }
      if(grid !== this.grid) break;
      console.log("last active piece:", p);
      let clearedRows = this.grid.clearFullRows();
      this._rowsCleared += clearedRows.length;
      
      if(clearedRows.length){
        switch(clearedRows.length){
        case 1:
          this.scoreActionEmitter.next(new ScoreActionEvent(
            ScoreActionType.SINGLE, 10, clearedRows[0]
          ));
          this._score += 100 * this.level;
          break;
        case 2:
          this.scoreActionEmitter.next(new ScoreActionEvent(
            ScoreActionType.DOUBLE, 10, clearedRows[0]
          ));
          this._score += 300 * this.level;
          break;
        case 3:
          this.scoreActionEmitter.next(new ScoreActionEvent(
            ScoreActionType.TRIPLE, 10, clearedRows[0]
          ));
          this._score += 500 * this.level;
          break;
        case 4:
          this.scoreActionEmitter.next(new ScoreActionEvent(
            ScoreActionType.TETRIS, 10, clearedRows[0]
          ));
          this._score += 800 * this.level;
          break;
        default:
        }

        
        if(this.goalSystem === GoalSystemType.VARIABLE_GOAL_SYSTEM){
          let level = Math.ceil(0.1 *
              (Math.sqrt(40 * (this._rowsCleared + 1) + 25) - 5));
          if(level != this.level){
            this.level = level;
            this.dropTime = 1000 * Math.pow(0.8 -
                ((level - 1) * 0.007), level - 1);
          }
        }
      }
    }
  }
  gameOver(){
    this.running = false;
    this.isGameOver = true;
  }
}
