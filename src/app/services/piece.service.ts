import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PieceService {

constructor() { }

}

export const DEFAULT_BACKGROUND = "#eee";

export class Piece
{
  public grid: boolean[][][];
  constructor(
    grid?: string[][], // row major
    public orientation: 0 | 1 | 2 | 3 = 0,
    public color: string = DEFAULT_BACKGROUND,
    public x: number = 0,
    public y: number = 0,
  ){
    /*
https://medium.com/ovrsea/checking-the-type-of-an-
object-in-typescript-the-type-guards-24d98d9119b0
    */
    
    if(grid){
      const length = grid[0].length;

      this.grid = new Array(4).fill("");
      
      [0, 1, 2, 3].forEach(ori => {
        this.grid[ori] = new Array(length).fill("");
        for(let i = 0; i < length; ++i){
          this.grid[ori][i] = new Array(length).fill("");
          for(let j = 0; j < length; ++j){
            this.grid[ori][i][j] = grid[ori][j][i] == "1"
          }
        }
      })
    }
  }
  static I = class I extends Piece {
    constructor(){
      super([
        [
          "0000",
          "1111",
          "0000",
          "0000"
        ], [
          "0010",
          "0010",
          "0010",
          "0010",
        ], [
          "0000",
          "0000",
          "1111",
          "0000"
        ], [
          "0100",
          "0100",
          "0100",
          "0100",
        ],
      ], 0, "#87CEEB", 3, -2);
    }
  };

  static J = class J extends Piece {
    constructor(){
      super([
        [
          "100",
          "111",
          "000",
        ], [
          "011",
          "010",
          "010",
        ], [
          "000",
          "111",
          "001",
        ], [
          "010",
          "010",
          "110",
        ],
      ], 0, "#0341AE", 3, -2);
    }
  }
  
  static L = class L extends Piece {
    constructor(){
      super([
        [
          "001",
          "111",
          "000",
        ], [
          "010",
          "010",
          "011",
        ], [
          "000",
          "111",
          "100",
        ], [
          "110",
          "010",
          "010",
        ],
      ], 0, "#FF971C", 3, -2);
    }
  }

  static O = class O extends Piece {
    constructor(){
      super([
        [
          "11",
          "11",
        ], [
          "11",
          "11",
        ], [
          "11",
          "11",
        ], [
          "11",
          "11",
        ],
      ], 0, "#FFD500", 4, -2);
    }
  }

  
  static S = class S extends Piece {
    constructor(){
      super([
        [
          "011",
          "110",
          "000",
        ], [
          "010",
          "011",
          "001",
        ], [
          "000",
          "011",
          "110",
        ], [
          "100",
          "110",
          "010",
        ],
      ], 0, "#72CB3B", 3, -2);
    }
  }
  
  static T = class T extends Piece {
    constructor(){
      super([
        [
          "010",
          "111",
          "000",
        ], [
          "010",
          "011",
          "010",
        ], [
          "000",
          "111",
          "010",
        ], [
          "010",
          "110",
          "010",
        ],
      ], 0, "#FF97FF", 3, -2);
    }
  }

  static Z = class Z extends Piece {
    constructor(){
      super([
        [
          "110",
          "011",
          "000",
        ], [
          "001",
          "011",
          "010",
        ], [
          "000",
          "110",
          "011",
        ], [
          "010",
          "110",
          "100",
        ],
      ], 0, "#FF3213", 3, -2);
    }
  }
}