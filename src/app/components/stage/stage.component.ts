import { Component, OnInit, HostListener } from '@angular/core';

const DEFAULT_BACKGROUND = "#eee";

class Piece
{
  constructor(
    public grid: boolean[][],
    public orientation: 0 | 1 | 2 | 3 = 0,
    public color: string = DEFAULT_BACKGROUND,
    public x: number = 0,
    public y: number = 0,
  ){
    if(!this.grid){
      this.grid = new Array(2).fill("").map(
          () => [false, false, false, false]);
    }
  }

  static I({
    x = 0,
    y = 0,
    orientation = 0,
  }: {
    x?: number,
    y?: number,
    orientation?: 0 | 1 | 2 | 3,
  } = {}): Piece {
    let p = new Piece(null, orientation, "#87CEEB", x, y);
    p.grid[0].fill(true);
    return p;
  }
}


function randomstring(length: number, dict="0123456789abcdef"){
  return crypto.getRandomValues(new Uint8Array(length)).reduce((l, r) => (
  l + dict[ Math.trunc(r * dict.length / 256) ]), "");
  // String.prototype.charAt() works too
};

class Grid
{

  activePiece: Piece


  color = new Array(10).fill("").map(
      () => new Array(20).fill("").map(() => "#eee"));

  getColorAt(col: number, row: number){
    if(this.activePiece){
      let relativeX = col - this.activePiece.x;
      let relativeY = row - this.activePiece.y;
      switch(this.activePiece.orientation){
      case 0: [relativeX, relativeY] = [relativeX, -relativeY]; break;
      case 1: [relativeX, relativeY] = [-relativeY, relativeX]; break;
      case 2: [relativeX, relativeY] = [relativeX, relativeY]; break;
      case 3: [relativeX, relativeY] = [relativeY, -relativeX]; break;
      }
      if(0 <= relativeX && relativeX < 2 && 0 <= relativeY && relativeY < 4){
        if(this.activePiece.grid[relativeX][relativeY]){
          return this.activePiece.color;
        }
      }
    }
    return this.color[col][row];
  }
}


@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.scss']
})
export class StageComponent implements OnInit {

  @HostListener("document:keypress", ["$event"])
  onKeypress(e: KeyboardEvent){
    let activePiece = this.grid.activePiece;
    switch(e.key){
    case "w":
      activePiece.orientation += 1;
      activePiece.orientation %= 4;
      break;
    case "d":
      activePiece.x += 1;
      break;
    case "a":
      activePiece.x -= 1;
      break;
    case "s":
      activePiece.y += 1;
      break;
    default:
    }
  }

  grid = new Grid();

  constructor(){

    this.grid.activePiece = Piece.I();
  }

  ngOnInit(): void {}

  rotatePiece(){

  }
}
