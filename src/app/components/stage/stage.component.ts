import { Component, OnInit, HostListener } from '@angular/core';
import { Piece } from 'src/app/services/Piece.service';
import { GameService } from 'src/app/services/game.service';
import { Grid } from 'src/app/services/Grid';


enum UserAction
{
  NO_ACTION,
  ROTATE,
  ROTATE_COUNTER,
  PAUSE,
  CONTINUE,
  MOVE_RIGHT,
  MOVE_LEFT,
  STORE,
  DROP,
  SOFTDROP,
  HARDDROP,
}

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.scss']
})
export class StageComponent implements OnInit {

  currentAction: UserAction[] = [];

  @HostListener("document:keydown", ["$event"])
  @HostListener("document:keyup", ["$event"])
  onKeyEvent(e: KeyboardEvent){
    let k = e.key;
    if(k.length === 1){
      k = k.toLowerCase();
    }

    const action = this.currentAction;
    switch(k){
    case "w":
    case "x":
    case "ArrowUp":
      if(action.includes(UserAction.ROTATE)){
        if(e.type === "keyup"){
          action.splice(action.indexOf(UserAction.ROTATE), 1);
        }
      } else{
        this.gameService.rotate();
        action.push(UserAction.ROTATE);
      }
      break;
    case "Control":
    case "z":
      if(action.includes(UserAction.ROTATE_COUNTER)){
        if(e.type === "keyup"){
          action.splice(action.indexOf(UserAction.ROTATE_COUNTER), 1);
        }
      } else{
        this.gameService.rotate(false);
        action.push(UserAction.ROTATE_COUNTER);
      }
      break;
    case "Escape":
    case "F1":
      this.gameService.pause();
      break;
    case "d":
    case "ArrowRight":
      
      if(e.type === "keydown"){
        this.gameService.moveRight();
      }
      break;
    case "s":
    case "ArrowDown":
      if(action.includes(UserAction.SOFTDROP)){
        if(e.type === "keyup"){
          this.gameService.stopSoftDrop();
          action.splice(action.indexOf(UserAction.SOFTDROP), 1);
        }
      } else{
        this.gameService.startSoftDrop();
        action.push(UserAction.SOFTDROP);
      }
      break;
    case "a":
    case "ArrowLeft":
      if(e.type === "keydown"){
        this.gameService.moveLeft();
      }
      break;
    case "s":
      break;
    case "c":
    case "Shift":
      this.gameService.store();
      break;
    case " ":
      if(action.includes(UserAction.HARDDROP)){
        if(e.type === "keyup"){
          action.splice(action.indexOf(UserAction.HARDDROP), 1);
        }
      } else{
        this.gameService.drop();
        action.push(UserAction.HARDDROP);
      }
      break;
    default:
      console.log("unknown key: e:", e);
    }
  }

  grid: Grid;

  constructor(
    private gameService: GameService
  ){
  }

  ngOnInit(): void {
  }

  newGame(){
    this.gameService.newGame();
    this.grid = this.gameService.getGrid();
  }
}
