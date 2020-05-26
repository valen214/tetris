import { Component, OnInit, Input, ViewEncapsulation, ViewChild, ElementRef, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Piece } from 'src/app/services/Piece.service';
import { Grid } from 'src/app/services/game.service';

@Component({
  selector: 'piece',
  templateUrl: './piece.component.html',
  styleUrls: ['./piece.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PieceComponent implements OnInit, OnChanges {

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

  @Input() size: number | string
  _piece: Piece
  @Input()
  set piece(value: Piece){
    this._piece = value;
    if(value){
      this.dimension = value.grid[0].length;
      this.background = new Array(this.dimension * this.dimension).fill(Grid.EMPTY_COLOR);
      this.gridTemplate = "1fr ".repeat(this.dimension);
      let grid = value.grid[value.orientation];
      for(let i = 0; i < this.dimension; ++i){
        for(let j = 0; j < this.dimension; ++j){
          if(grid[i][j]){
            this.background[i * this.dimension + j] = this.piece.color;
          }
        }
        console.log(this.background);
      }
    }
    console.log(value);
  }
  get piece(){ return this._piece; }


  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ){}

  ngOnChanges(changes: SimpleChanges): void {
    
  }

  ngOnInit(){
  }

  ngAfterViewInit(){

  }
}
