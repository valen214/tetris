import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PieceService {

constructor() { }

}


export class Piece
{
  public grid: boolean[][][];
  constructor(
    grid?: string[][], // row major
    public orientation: 0 | 1 | 2 | 3 = 0,
    public color: string = null,
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

  rotate(clockwise = true): Piece[] {
    let out = new Array(5).fill("").map(() => new Piece());
    let xOffset: number[];
    let yOffset: number[];
    switch(this.orientation){
    case 0:
      if(clockwise){
        xOffset = [0, -1, -1, 0, -1];
        yOffset = [0,  0, -1, 2,  2];
      } else{
        xOffset = [0, 1,  1, 0, 1];
        yOffset = [0, 0, -1, 2, 2];
      }
      break;
    case 1:
      if(clockwise){
        xOffset = [0, 1, 1,  0,  1];
        yOffset = [0, 0, 1, -2, -2];
      } else{
        xOffset = [0, 1, 1,  0,  1];
        yOffset = [0, 0, 1, -2, -2];
      }
      break;
    case 2:
      if(clockwise){
        xOffset = [0, 1,  1, 0, 1];
        yOffset = [0, 0, -1, 2, 2];
      } else{
        xOffset = [0, -1, -1, 0, -1];
        yOffset = [0,  0, -1, 2,  2];
      }
      break;
    case 3:
      if(clockwise){
        xOffset = [0, -1, -1,  0, -1];
        yOffset = [0,  0,  1, -2, -2];
      } else{
        xOffset = [0, -1, -1,  0, -1];
        yOffset = [0,  0,  1, -2, -2];
      }
      break;
    }
    for(let i = 0; i < 5; ++i){
      Object.assign(out[i], {
        grid: this.grid,
        x: this.x + xOffset[i],
        y: this.y + yOffset[i],
        orientation: (
          this.orientation +
          (clockwise ? 1 : 3)
        ) % 4
      })
    }
    return out;
  }

  static I = class I extends Piece {
    constructor(){
      super([
        [ // North
          "0000",
          "1111",
          "0000",
          "0000"
        ], [ // East
          "0010",
          "0010",
          "0010",
          "0010",
        ], [ // South
          "0000",
          "0000",
          "1111",
          "0000"
        ], [ // West
          "0100",
          "0100",
          "0100",
          "0100",
        ],
      ], 0, "#87CEEB", 3, -2);
    }

    rotate(clockwise = true): Piece[] {
      let out = new Array(5).fill("").map(() => new Piece());
      let xOffset: number[];
      let yOffset: number[];
      switch(this.orientation){
      case 0:
        if(clockwise){
          xOffset = [0, -2, 1, -2,  1];
          yOffset = [0,  0, 0,  1, -2];
        } else{
          xOffset = [0, -1, 2, -1, 2];
          yOffset = [0,  0, 0, -2, 1];
        }
        break;
      case 1:
        if(clockwise){
          xOffset = [0, -1, 2, -1, 2];
          yOffset = [0,  0, 0, -2, 1];
        } else{
          xOffset = [0, 2, -1,  2, -1];
          yOffset = [0, 0,  0, -1,  2];
        }
        break;
      case 2:
        if(clockwise){
          xOffset = [0, 2, -1,  2, -1];
          yOffset = [0, 0,  0, -1,  2];
        } else{
          xOffset = [0, 1, -2, 1, -2];
          yOffset = [0, 0,  0, 2, -1];
        }
        break;
      case 3:
        if(clockwise){
          xOffset = [0, 1, -2, 1, -2];
          yOffset = [0, 0,  0, 2, -1];
        } else{
          xOffset = [0, -2, 1, -2,  1];
          yOffset = [0,  0, 0,  1, -2];
        }
        break;
      }
      for(let i = 0; i < 5; ++i){
        Object.assign(out[i], {
          grid: this.grid,
          x: this.x + xOffset[i],
          y: this.y + yOffset[i],
          orientation: (
            this.orientation +
            (clockwise ? 1 : 3)
          ) % 4
        });
      }
      return out;
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

    rotate(clockwise = true): Piece[]{
      let out = new Array(5).fill("").map(() => new Piece());
      for(let i = 0; i < 5; ++i){
        Object.assign(out[i], {
          grid: this.grid,
          x: this.x, y: this.y,
          orientation: this.orientation
        });
      }
      return out;
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

    rotate(clockwise = true): Piece[] {
      /*
      this part is different between the guidelines
      and wiki, guidelines' appendix version is used here
      */
      let out = new Array(5).fill("").map(() => new Piece.T());
      let xOffset: number[];
      let yOffset: number[];
      switch(this.orientation){
      case 0:
        if(clockwise){
          xOffset = [0, -1, -1, 0, -1];
          yOffset = [0,  0, -1, 0,  2];
        } else{
          xOffset = [0, 1,  1, 0, 1];
          yOffset = [0, 0, -1, 0, 2];
        }
        break;
      case 1:
        if(clockwise){
          xOffset = [0, 1, 1,  0,  1];
          yOffset = [0, 0, 1, -2, -2];
        } else{
          xOffset = [0, 1, 1,  0,  1];
          yOffset = [0, 0, 1, -2, -2];
        }
        break;
      case 2:
        if(clockwise){
          xOffset = [0, 1, 0, 0, 1];
          yOffset = [0, 0, 0, 2, 2];
        } else{
          xOffset = [0, -1, 0, 0, -1];
          yOffset = [0,  0, 0, 2,  2];
        }
        break;
      case 3:
        if(clockwise){
          xOffset = [0, -1, -1,  0, -1];
          yOffset = [0,  0,  1, -2, -2];
        } else{
          xOffset = [0, -1, -1,  0, -1];
          yOffset = [0,  0,  1, -2, -2];
        }
        break;
      }
      for(let i = 0; i < 5; ++i){
        Object.assign(out[i], {
          x: this.x + xOffset[i],
          y: this.y + yOffset[i],
          orientation: (
            this.orientation +
            (clockwise ? 1 : 3)
          ) % 4
        })
      }
      return out;
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