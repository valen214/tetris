import { Grid } from './Grid';
import { ScoreActionType } from './ScoreAction';


export class GameControl {
    history: [];

    soft_drop: boolean;
    hard_drop: boolean;

    shift_right: boolean
    shift_left: boolean;
    do_rotate: number;

    swapping: boolean;
    t_spin: boolean;
    last_action_rotate: boolean;
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
      this.paused = false;
    }
    swap(){
      if(this.paused) return;
      this.swapping = true;
      this.last_action_rotate = false;
    }
  
    rotateDown(clockwise: boolean = true){
      if(this.paused) return;
      this.do_rotate = clockwise ? 1 : 3
    }
    rotateUp(){
      // ineffective
      this.do_rotate = 0
    }
    shiftLeftDown(){
      if(this.paused) return;
      this.shift_left = true;
    }
    shiftLeftUp(){
      this.shift_left = false;
    }
    shiftRightDown(){
      if(this.paused) return;
      this.shift_right = true;
    }
    shiftRightUp(){
      this.shift_right = false;
    }
    startSoftDrop(){
      if(this.paused) return;
      this.soft_drop = true;
    }
    stopSoftDrop(){
      if(this.paused) return;  
      this.soft_drop = false;
    }
    hardDrop(){
      if(this.paused) return;
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
  
  