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

  fallOneStep(): boolean {
    if(!this.activePiece) return false;

    const p = this.activePiece;
    let grid = p.grid[p.orientation];

    for(let i = 0; i < grid.length; ++i){
      for(let j = 0; j < grid.length; ++j){
        if(grid[i][j] && !(p.y + j < 0)){

          if(p.y + j + 1 >= 19 ||
              this.color[p.x + i][p.y + j + 1] !== Grid.EMPTY_COLOR){
            return false;
          }
        }
      }
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

    for(let i = 0; i < grid.length && movable; ++i){
      for(let j = 0; j < grid.length && movable; ++j){
        if(grid[i][j] && !(p.y + j < 0)){
          if(p.x + i == 0 ||
              this.color[p.x + i - 1][p.y + j] !== Grid.EMPTY_COLOR){
            movable = false;
          }
        }
      }
    }

    if(movable){
      p.x -= 1;
    }
    return true;
  }
  moveRight(){
    if(!this.activePiece) return false;

    const p = this.activePiece;
    let grid = p.grid[p.orientation];

    let movable = true;

    for(let i = 0; i < grid.length && movable; ++i){
      for(let j = 0; j < grid.length && movable; ++j){
        if(grid[i][j] && !(p.y + j < 0)){
          if(p.x + i == 9 || this.color[p.x + i + 1][p.y + j] !== Grid.EMPTY_COLOR){
            movable = false;
          }
        }
      }
    }

    if(movable){
      p.x += 1;
    }
    return true;
  }

  rotate(){
    if(!this.activePiece) return false;

    const p = this.activePiece;
    let grid = p.grid[(p.orientation + 1) % 4];

    let rotatable = true;

    for(let i = 0; i < grid.length; ++i){
      for(let j = 0; j < grid.length; ++j){
        if(grid[i][j] && !(p.y + j < 0)){
          // TODO: wall kick, piece kick, T-spin
          if(this.color[p.x + i][p.y + j] !== Grid.EMPTY_COLOR){
            rotatable = false;
          }
        }
      }
    }

    if(rotatable){
      p.orientation += 1;
      p.orientation %= 4;
    }
    return true;
    
  }

  mergePiece(){
    if(!this.activePiece){
      throw new Error("trying to merge piece with no active piece");
    }
    
    const p = this.activePiece;
    let grid = p.grid[p.orientation];

    for(let i = 0; i < grid.length; ++i){
      for(let j = 0; j < grid.length; ++j){
        if(grid[i][j]){
          if(this.color[p.x + i][p.y + j] === Grid.EMPTY_COLOR){
            this.color[p.x + i][p.y + j] = p.color;
          } else{
            throw new Error("piece merge with already occupied block");
          }
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




@Injectable({
  providedIn: 'root'
})
export class GameService {
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
    this.grid.moveLeft();
  }
  moveRight(){
    this.grid.moveRight();
  }
  rotate(){
    this.grid.rotate();
  }
  drop(){
    this.grid.drop();
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
    [0, 1, 2, 3].forEach(() => this.addPieceToQueue());

    const grid = this.grid;

    while(this.running && grid === this.grid){
      this.movePieceFromQueueToStage();
      if(grid !== this.grid) break;
      this.addPieceToQueue();
      if(grid !== this.grid) break;

      while(this.grid.fallOneStep()){
        if(grid !== this.grid) break;
        await new Promise(res => setTimeout(res, 200));
        while(!this.running){
          await new Promise(res => setTimeout(res, 16));
          if(grid !== this.grid) break;
        }
        console.log("falled one step");
      }
      if(grid !== this.grid) break;
      await new Promise(res => setTimeout(res, 200));
      if(grid !== this.grid) break;
      this.grid.mergePiece();
      let clearedRows = this.grid.clearFullRows();
      console.log("piece merged, grid:", this.grid, ", cleared rows:", clearedRows);
    }
  }
}
