import { Component, OnInit, ViewChild, ElementRef, QueryList, ContentChildren, AfterContentInit, ViewChildren, AfterViewInit } from '@angular/core';
import { StageComponent } from '../stage/stage.component';
import { GameService, ScoreActionEvent, ScoreActionType } from 'src/app/services/game.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  _gameStage: StageComponent;
  @ViewChild("gameStage")
  set gameStage(stage: StageComponent){
    this._gameStage = stage;
  }

  @ViewChildren("popupMessageContainer", { read: ElementRef })
  popupMessageContainer: QueryList<ElementRef>;

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
    console.log(this.popupMessageContainer);
    console.log(this);
  }

  newGame(){
    this._gameStage.newGame();
    this.newGameStarted = false;
    this.game.scoreActionEmitter.subscribe(
        this.newAction.bind(this));
  }

  lastUsedMessageIndex = 0;
  newAction(e: ScoreActionEvent){

    if(e.action === ScoreActionType.NO_ACTION) return;
    console.log(e.action, e.x, e.y, this.popupMessageContainer);
    let arr = this.popupMessageContainer.toArray();
    let i = (this.lastUsedMessageIndex + 1) % arr.length;
    let elem = arr[i].nativeElement;

    elem.style["--pos-x"] = e.x;
    elem.style["--pos-y"] = e.y;
    elem.innerText = ScoreActionType[e.action];

    new Promise(res => {
      elem.classList.add("show", "hide");
      setTimeout(res, 16);
    }).then(() => new Promise(res => {
      elem.classList.remove("hide");
      setTimeout(res, 100);
    })).then(() => {
      elem.classList.remove("show");
    })
  }

  tryAction(){
    this.newAction(new ScoreActionEvent(ScoreActionType.SOFT_DROP));
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
