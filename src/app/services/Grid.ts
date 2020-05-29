import { Piece } from './Piece.service';
import { ScoreActionType } from './ScoreAction';

export class Grid
{
  static EMPTY_COLOR = "rgba(0, 0, 0, 0)";
  activePiece: Piece


  color = new Array(10).fill("").map(
      () => new Array(20).fill("").map(() => Grid.EMPTY_COLOR));

  isOccupied(col: number, row: number): boolean | null {
    if(0 <= col && col <= 9 &&
        0 <= row && row <= 19){
      let c = this.color[col][row];
      return c !== Grid.EMPTY_COLOR;
    }
    return null;
  }

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
              this.isOccupied(x + i, y + j)){
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
  drop(): number{
    let i = 0;
    while(this.fallOneStep()){
      ++i;
    }
    return i;
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

  performTSpinCheck(
      p: InstanceType<typeof Piece.T>,
      referencePoint: number,
  ): ScoreActionType {
    let action = null;

    let corners = [
      p.x < 0 || this.color[p.x][p.y] !== Grid.EMPTY_COLOR,
      p.x+2 > 10 || this.color[p.x+2][p.y] !== Grid.EMPTY_COLOR,
      p.x+2 > 10 || p.y+2 > 20 || this.color[p.x+2][p.y+2] !== Grid.EMPTY_COLOR,
      p.y+2 > 20 || this.color[p.x][p.y+2] !== Grid.EMPTY_COLOR,
    ];
    let ori = p.orientation;
    
    if(referencePoint === 4){
      action = ScoreActionType.T_SPIN;
    } else if(corners[(0 + ori) % 4] && corners[(1 + ori) % 4]){
      if(corners[(2 + ori) % 4] || corners[(3 + ori) % 3]){
        
        if(( ori == 0 && ( p.y+2 > 20 ||
              this.color[p.x+1][p.y+2] !== Grid.EMPTY_COLOR )) ||
           ( ori == 1 && ( p.x < 0 ||
              this.color[p.x][p.y+1] !== Grid.EMPTY_COLOR )) ||
           ( ori == 2 && (
              this.color[p.x+1][p.y] !== Grid.EMPTY_COLOR )) ||
           ( ori == 3 && ( p.x+2 > 10 ||
              this.color[p.x+2][p.y+1] !== Grid.EMPTY_COLOR
           ))){
          action = ScoreActionType.T_SPIN;
        } else{
          action = ScoreActionType.MINI_T_SPIN;
        }

      }
    } else if(corners[(2 + ori) % 4] && corners[(3 + ori) % 4]){
      if(corners[(0 + ori) % 4] || corners[(1 + ori) % 4]){
        action = ScoreActionType.MINI_T_SPIN;
      }
    }

    return action;
  }
  rotate(clockwise = true): ScoreActionType {
    if(!this.activePiece) return null;

    const p = this.activePiece;
    let candidates = p.rotate(clockwise);

    let rotatable = false;
    for(let i = 0; i < 5; ++i){
      let c = candidates[i];
      let collide_or_oob = this.collide(c);
      collide_or_oob[1] = false; // don't check top edge
      if(collide_or_oob.every(v => v === false)){
        rotatable = true;

        Object.assign(p, {
          x: c.x,
          y: c.y,
          orientation: c.orientation,
        });
        if(i === 4){
          return ScoreActionType.T_SPIN;
        }
        break;
      }
    }

    if(rotatable){
      return ScoreActionType.NO_ACTION;
    } else{
      return null;
    }
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
    for(let y = 0; y < 20; ++y){
      let full = true;
      for(let x = 0; x < 10; ++x){
        if(!this.isOccupied(x, y)){
          full = false;
          break;
        }
      }
      if(full){
        rows.push(y);
      }
    }
    this.clearRow(...rows);
    return rows;
  }
}