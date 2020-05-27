import { Component, OnInit, HostListener } from '@angular/core';
import { Piece } from 'src/app/services/Piece.service';
import { GameService } from 'src/app/services/game.service';
import { Grid } from 'src/app/services/Grid';


@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.scss']
})
export class StageComponent implements OnInit {

  @HostListener("document:keypress", ["$event"])
  onKeypress(e: KeyboardEvent){
    switch(e.key){
    case "w":
      this.gameService.rotate();
      break;
    case "d":
      this.gameService.moveRight();
      break;
    case "a":
      this.gameService.moveLeft();
      break;
    case "s":
      this.gameService.drop();
      break;
    case " ":
      this.gameService.store();
      break;
    default:
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
