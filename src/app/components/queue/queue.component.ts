import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.scss']
})
export class QueueComponent implements OnInit {

  get game(){
    return this.gameService.game;
  }

  constructor(
    public gameService: GameService,
  ){}

  ngOnInit() {
  }

}
