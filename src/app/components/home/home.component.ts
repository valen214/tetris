import { Component, OnInit, ViewChild, ElementRef, QueryList, ContentChildren, AfterContentInit, ViewChildren, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { StageComponent } from '../stage/stage.component';
import { GameService } from 'src/app/services/game.service';
import { ScoreActionEvent, ScoreActionType } from 'src/app/services/ScoreAction';
import { Game } from 'src/app/services/Game';
import { Grid } from 'src/app/services/Grid';

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
  

  get game(){
    return this.gameService.game;
  }
  newGameStarted = false;

  constructor(
    public gameService: GameService,
    private changeDetector: ChangeDetectorRef,
  ){}

  ngOnInit(){}

  ngAfterViewInit(){
    setTimeout(() => {
      this.newGame();
    });
    console.log(this.popupMessageContainer);
    console.log(this);
  }

  newGame(){
    this.newGameStarted = false;
    this.gameService.newGame();
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
      this.game.scoreActionEmitter.subscribe(
          this.newAction.bind(this));
    } else if(this.game.control.paused){
      this.game.control.continue()
    } else{
      this.game.control.pause()
    }
  }

  copyErrorReport(){
    let i = document.createElement("input");
    let first_color: string;
    i.value = JSON.stringify(this.game, (k, v) => {
      switch(k){
      case "scoreActionEmitter":
      case "grid":
        return undefined;
      case "color":
        if(v.map){
          v = v.map(arr => arr.map((c) => {
            switch(c){
            case Grid.EMPTY_COLOR: return "_";
            case "#87CEEB": return "I";
            case "#0341AE": return "J";
            case "#FF971C": return "L";
            case "#FFD500": return "O";
            case "#72CB3B": return "S";
            case "#FF97FF": return "T";
            case "#FF3213": return "Z";
            }
            return c;
          }).join("")).join("\n");
          if(first_color){
            if(first_color === v){
              return "<same as the other>";
            } else{
              return v;
            }
          } else{
            first_color = v;
            return v;
          }
        }
        break;
      }
      return v;
    });
    document.body.appendChild(i);
    i.focus();
    i.select();
    document.execCommand("copy");
    document.body.removeChild(i);
  }
}
