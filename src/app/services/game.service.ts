import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScoreActionEvent, ScoreActionType } from './ScoreAction';
import { Game } from './Game';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  _game: Game;

  constructor(){
    this._game = new Game();
  }
  get game(){
    return this._game;
  }

  newGame(){
    this._game.destroy()
    this._game = new Game();
  }
}
