import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { Piece } from 'src/app/services/Piece.service';
import { Grid } from 'src/app/services/Grid';

@Component({
  selector: 'piece',
  templateUrl: './piece.component.html',
  styleUrls: ['./piece.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PieceComponent implements OnInit {

  /*
  _pieceContainer: HTMLDivElement;
  @ViewChild("pieceContainer")
  set pieceContainer(elem: ElementRef){
    if(elem){
      console.log(elem.nativeElement);
      this._pieceContainer = elem.nativeElement;
    }
  }
  */

  gridTemplate: string;
  dimension: number;
  background: string[];
  styleObject: object

  @Input() size: number | string
  _piece: Piece
  @Input()
  set piece(value: Piece){
    this._piece = value;
    if(!value) return;

    this.dimension = value.grid[0].length;
    this.background = new Array(16).fill(Grid.EMPTY_COLOR);
    this.gridTemplate = "1fr ".repeat(4);
    this.styleObject = {
      gridTemplateRows: this.gridTemplate,
      gridTemplateColumns: this.gridTemplate,
    }

    let grid = value.grid[value.orientation];
    for(let i = 0; i < this.dimension; ++i){
      for(let j = 0; j < this.dimension; ++j){
        if(grid[i][j]){
          this.background[i * 4 + j] = this.piece.color;
        }
      }
    }
  }
  get piece(){ return this._piece; }

  backgroundAt(i: number){
    if(i < this.background.length){
      return this.background[i];
    } else{
      return Grid.EMPTY_COLOR;
    }
  }

  constructor(){}

  ngOnInit(){}
}
