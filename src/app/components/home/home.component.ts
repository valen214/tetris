import { Component, OnInit, ViewChild } from '@angular/core';
import { StageComponent } from '../stage/stage.component';
import { GameService, ScoreActionEvent, ScoreActionType } from 'src/app/services/game.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  _gameStage: StageComponent;
  @ViewChild("gameStage")
  set gameStage(stage: StageComponent){
    this._gameStage = stage;
  }

  newGameStarted = false;

  constructor(
    public game: GameService
  ){}

  ngOnInit(){
  }

  ngAfterViewInit(){
    setTimeout(() => {
      this.newGame();
    });
  }

  newGame(){
    this._gameStage.newGame();
    this.newGameStarted = false;
    this.game.scoreActionEmitter.subscribe((e: ScoreActionEvent) => {
      if(e.action === ScoreActionType.NO_ACTION) return;
      console.log(e.action, e.x, e.y);
    });
  }

  startButtonClick(){
    if(!this.newGameStarted){
      this.game.start();
      this.newGameStarted = true;
    } else if(this.game.running){
      this.game.pause()
    } else{
      this.game.continue()
    }
  }
}
