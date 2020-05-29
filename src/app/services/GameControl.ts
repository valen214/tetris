import { Grid } from './Grid';
import { ScoreActionType } from './ScoreAction';


export class GameControl {
    soft_drop: boolean;
    hard_drop: boolean;
    swapping: boolean;
    t_spin: boolean;
    last_action_rotate: boolean;
    actionCount: number;
    lastActionTime: number;
    paused: boolean;
  
    constructor(
      public stage: Grid,
    ){}
    init(
        shiftLeft: boolean = false,
        shiftRight: boolean = false,
    ){
      this.soft_drop = false;
      this.hard_drop = false;
      this.swapping = false;
      this.t_spin = false;
      this.last_action_rotate = false;
      this.actionCount = 0;
      this.lastActionTime = 0;
      this.paused = false;
    }
    actionDone(){
      this.actionCount += 1;
      this.lastActionTime = performance.now();
    }
    swap(){
      this.swapping = true;
      this.last_action_rotate = false;
    }
  
    rotate(clockwise: boolean = true){
      let e = this.stage.rotate(clockwise);
      if(e === ScoreActionType.T_SPIN){
        this.t_spin = true;
      }
      if(e !== null){
        this.actionDone();
      }
      this.last_action_rotate = true;
    }
    shiftLeft(){
      let success = this.stage.moveLeft();
      if(success){
        this.actionDone();
      }
      
      this.last_action_rotate = false;
    }
    shiftRight(){
      let success = this.stage.moveRight();
      if(success){
        this.actionDone();
      }
      this.last_action_rotate = false;
    }
    startSoftDrop(){
      this.soft_drop = true;
    }
    stopSoftDrop(){
      this.soft_drop = false;
    }
    hardDrop(){
      this.hard_drop = true;
      this.last_action_rotate = false;
    }
    pause(){
      this.paused = true;
    }
    continue(){
      this.paused = false;
    }
  }
  
  