import { Injectable } from '@angular/core';
import { Piece } from './Piece.service';

export class Grid
{
  static EMPTY_COLOR = "#eee";
  activePiece: Piece


  color = new Array(10).fill("").map(
      () => new Array(20).fill("").map(() => Grid.EMPTY_COLOR));

  getColorAt(col: number, row: number){
    if(this.activePiece){
      const p = this.activePiece;
      let relativeX = col - p.x;
      let relativeY = row - p.y;
      let grid = p.grid[p.orientation];
      if(0 <= relativeX && relativeX < grid.length &&
          0 <= relativeY && relativeY < grid.length){
        if(grid[relativeX][relativeY]){
          return this.activePiece.color;
        }
      }
    }
    return this.color[col][row];
  }

  collide(
      p: Piece,
      orientation: null|0|1|2|3 = null,
      x: number = p.x,
      y: number = p.y){
    if(orientation === null){
      orientation = p.orientation;
    }
    let grid = p.grid[orientation];
    let collide: boolean = false;
    let oob = [ false, false, false, false ];
    for(let i = 0; i < grid.length; ++i){
      for(let j = 0; j < grid.length; ++j){
        if(grid[i][j]){
          let [a, b, c, d] = [
            !(0 <= y + j),
            !(y + j < 19),
            !(0 <= x + i),
            !(x + i < 10)
          ];
          oob[0] = oob[0] || a;
          oob[1] = oob[1] || b;
          oob[2] = oob[2] || c;
          oob[3] = oob[3] || d;

          if(!collide && !a && !b && !c && !d &&
              this.color[x + i][y + j] !== Grid.EMPTY_COLOR){
            collide = true;
          }
        }
      }
    }
    return [collide, ...oob];
  }

  fallOneStep(): boolean {
    if(!this.activePiece) return false;

    const p = this.activePiece;

    let [collide, ...oob] = this.collide(p, null, p.x, p.y + 1);
    console.log(collide, ...oob, "y:", p.y);
    if(collide || oob[1]){
      return false;
    }

    p.y += 1;
    return true;
  }
  drop(){
    while(this.fallOneStep()){}
  }
  moveLeft(){
    if(!this.activePiece) return false;

    const p = this.activePiece;
    let grid = p.grid[p.orientation];

    let movable = true;
    let [collide, ...oob] = this.collide(p, null, p.x - 1, p.y);
    if(collide || oob[2]){
      movable = false
    } else{
      p.x -= 1;
    }

    return movable;
  }
  moveRight(){
    if(!this.activePiece) return false;

    const p = this.activePiece;

    let movable = true;
    let [collide, ...oob] = this.collide(p, null, p.x + 1, p.y);

    if(collide || oob[3]){
      movable = false
    } else{
      p.x += 1;
    }
    return true;
  }

  rotate(clockwise = true){
    if(!this.activePiece) return false;

    const p = this.activePiece;
    let candidates = p.rotate(clockwise);
    let rotatable = false;
    for(let i = 0; i < 5; ++i){
      let c = candidates[i];
      let collide_or_oob = this.collide(c);
      if(!collide_or_oob.includes(true)){
        rotatable = true;

        Object.assign(p, c);
        break;
      }
    }

    return rotatable;
  }

  mergePiece(){
    if(!this.activePiece){
      throw new Error("trying to merge piece with no active piece");
    }
    
    const p = this.activePiece;
    let grid = p.grid[p.orientation];

    
    let [collide, ...oob] = this.collide(p, null, p.x, p.y);

    if(collide){
      throw new Error("piece merge with already occupied block");
    }
    if(oob.some(v => v)){
      throw new Error("piece merge when oob");
    }

    for(let i = 0; i < grid.length; ++i){
      for(let j = 0; j < grid.length; ++j){
        if(grid[i][j]){
          this.color[p.x + i][p.y + j] = p.color;
        }
      }
    }

    this.activePiece = null;
  }
  clearRow(...rows: number[]){
    rows.sort();
    for(let i = 0; i < rows.length; ++i){
      for(let x = 0; x < this.color.length; ++x){
        this.color[x][rows[i]] = Grid.EMPTY_COLOR;
        for(let y = rows[i]; y >= 1; --y){
          this.color[x][y] = this.color[x][y - 1];
        }
        this.color[x][0] = Grid.EMPTY_COLOR;
      }
    }
  }
  clearFullRows(): number[] {
    let rows: number[] = [];
    for(let y = 0; y < this.color[0].length; ++y){
      let full = true;
      for(let x = 0; x < this.color.length; ++x){
        if(this.color[x][y] === Grid.EMPTY_COLOR){
          full = false;
          break;
        }
      }
      if(full){
        rows.push(y);
      }
    }
    console.log("full rows:", rows);
    this.clearRow(...rows);
    return rows;
  }
}


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


@Injectable({
  providedIn: 'root'
})
export class GameService {
  static LOCK_DOWN_TIME = 500;
  static LOCK_DOWN_SETTING = LockDownType.EXTENDED_PLACEMENT
  static EXTENDED_PLACEMENT_MAX_ACTION_BEFORE_LOCK_DOWN = 15;

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

  constructor(){ }

  newGame(){
    this.grid = new Grid();
    this.running = false;
    this.stored = null;
    this.currentPieceSwapped = false;
    this.piecesBag = [];
    this.queue = [];
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
    let success = this.grid.moveLeft();
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
    }
  }
  moveRight(){
    let success = this.grid.moveRight();
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
    }
  }
  rotate(){
    let success = this.grid.rotate();
    if(success){
      this.actionCount += 1;
      this.lastActionTimeStamp = performance.now();
    }
  }
  drop(){
    this.grid.drop();
    this.harddropped = true;
  }
  store(){
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
          this.harddropped = false;
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
          if(performance.now() - lastDropTimestamp >= this.dropTime){
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
              let [collide, ...oob] = this.grid.collide(p, null, p.x, p.y + 1);
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
          await new Promise(res => setTimeout(res, 16));
        } while(!this.running);
      }
      if(grid !== this.grid) break;
      let clearedRows = this.grid.clearFullRows();
      console.log("piece merged, grid:", this.grid, ", cleared rows:", clearedRows);
    }
  }
}
