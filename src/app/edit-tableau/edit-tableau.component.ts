import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TableauInterface } from '../Interface/Tableau';

@Component({
  selector: 'app-edit-tableau',
  templateUrl: './edit-tableau.component.html',
  styleUrls: ['./edit-tableau.component.scss']
})
export class EditTableauComponent {

  tableau: TableauInterface = {
    nom: null,
    format: null,
    _id: null
  };

  constructor(@Inject(MAT_DIALOG_DATA) public tableauData: TableauInterface) {
    this.tableau = tableauData;
  }

  isInvalid(): boolean {
    return (this.tableau.nom != null && this.tableau.format !== null);
  }

}
