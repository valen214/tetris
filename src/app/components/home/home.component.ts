import { Component, OnInit, ViewChild, ElementRef, QueryList, ContentChildren, AfterContentInit, ViewChildren, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { StageComponent } from '../stage/stage.component';
import { GameService } from 'src/app/services/game.service';
import { ScoreActionEvent, ScoreActionType } from 'src/app/services/ScoreAction';

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
    public game: GameService,
    private changeDetector: ChangeDetectorRef,
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
  messages: string[] = ["", "", "", "", ""]
  newAction(e: ScoreActionEvent){

    if(e.action === ScoreActionType.NO_ACTION) return;
    const arr = this.popupMessageContainer.toArray();
    const i = (++this.lastUsedMessageIndex) % arr.length;
    const elem = arr[i].nativeElement;

    elem.style.setProperty("--pos-x", e.x);
    elem.style.setProperty("--pos-y", e.y);
    this.messages[i] = ScoreActionType[e.action];
    elem.innerText = this.messages[i];

    new Promise(res => {
      elem.classList.add("show", "hide");
      /*
      this would be executed before view update
      */
      setTimeout(res, 8);
    }).then(() => new Promise(res => {
      elem.classList.remove("hide");
      setTimeout(res, 250);
    })).then(() => {
      elem.classList.remove("show");
    })
  }

  tryAction(){
    this.newAction(new ScoreActionEvent(ScoreActionType.SOFT_DROP, 5, 10));
    this.newAction(new ScoreActionEvent(ScoreActionType.HARD_DROP, 5, 18));
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
