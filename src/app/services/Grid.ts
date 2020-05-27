import { Piece } from './Piece.service';

export class Grid
{
  static EMPTY_COLOR = null;
  activePiece: Piece


  color = new Array(10).fill("").map(
      () => new Array(20).fill("").map(() => Grid.EMPTY_COLOR));

  getColorAt(col: number, row: number){
    let out: string;
    if(this.activePiece){
      const p = this.activePiece;
      let relativeX = col - p.x;
      let relativeY = row - p.y;
      let grid = p.grid[p.orientation];
      if(0 <= relativeX && relativeX < grid.length &&
          0 <= relativeY && relativeY < grid.length){
        if(grid[relativeX][relativeY]){
          out = this.activePiece.color;
        }
      }
    }
    if(!out){
      out = this.color[col][row];
    }
    if(!out){
      out = "rgba(0, 0, 0, 0)";
    }
    return out;
  }

  collideExecutionMaxTime = 0;
  collide(
      p: Piece,
      orientation: null|0|1|2|3 = null,
      x: number = p.x,
      y: number = p.y){

    let begin = performance.now();
    
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
            !(y + j < 20),
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

    let elapsed = performance.now() - begin;
    if(elapsed > this.collideExecutionMaxTime){
      console.log("collide executed max time:", elapsed, "ms");
      this.collideExecutionMaxTime = elapsed;
    }
    return [collide, ...oob];
  }

  fallOneStep(): boolean {
    if(!this.activePiece) return false;

    const p = this.activePiece;

    let [collide, ...oob] = this.collide(p, null, p.x, p.y + 1);
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
      collide_or_oob[1] = false; // don't check top edge
      if(!collide_or_oob.includes(true)){
        rotatable = true;

        Object.assign(p, {
          x: c.x,
          y: c.y,
          orientation: c.orientation,
        });
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