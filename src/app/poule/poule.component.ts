import { Component, OnInit } from '@angular/core';
import { PoulesService } from '../Service/poules.service';
import { JoueurInterface } from '../Interface/Joueur';
import { PouleInterface } from '../Interface/Poule';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { TableauInterface } from '../Interface/Tableau';
import { JoueurService } from '../Service/joueur.service';
import { TableauService } from '../Service/tableau.service';
import { NotifyService } from '../Service/notify.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-poule',
  templateUrl: './poule.component.html',
  styleUrls: ['./poule.component.scss']
})
export class PouleComponent implements OnInit {

  public poules: PouleInterface[] = [];
  public subscribedUnassignedPlayers: JoueurInterface[] = [];
  tableau: TableauInterface = {
    format: null,
    _id: null,
    poules: null,
    nom: null,
    consolante: null,
    age_minimum: null
  };

  constructor(private pouleService: PoulesService, private router: Router, private route: ActivatedRoute,
              private joueurService: JoueurService, private gestionService: TableauService, private notifyService: NotifyService,
              private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.getTableau();
    });
  }

  getTableau(): void {
    this.gestionService.getTableau(this.router.url.split('/').pop()).subscribe(tableau => {
      this.tableau = tableau;
      this.getAllPoules();
    });
  }

  getAllPoules(): void {
    this.pouleService.getAll(this.tableau._id, this.tableau.format).subscribe(poules => this.poules = poules, err => {
      this.notifyService.notifyUser(err, this.snackBar, 'error', 2000, 'OK');
    });
  }

  generatePoules(): void {
    this.pouleService.generatePoules(this.tableau).subscribe(() => {}, err => {
      this.notifyService.notifyUser(err, this.snackBar, 'error', 2000, 'OK');
    });
  }

  editPoule(event: CdkDragDrop<[id: JoueurInterface], any>, id_poule: string): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.pouleService.editPoule(id_poule, event.container.data).subscribe(() => {}, err => {
      this.notifyService.notifyUser(err, this.snackBar, 'error', 2000, 'OK');
    });
  }

  setStatus(poule: PouleInterface): void {
    this.pouleService.setStatus(poule).subscribe(() => this.getAllPoules(), err => {
      this.notifyService.notifyUser(err, this.snackBar, 'error', 2000, 'OK');
    });
  }

  showParticipant(objectRef: string, participant_s): string {
    return (objectRef === 'Joueurs' ? participant_s.nom + ' - ' + participant_s.classement + ' points'
      : participant_s.joueurs[0].nom + ' - ' + participant_s.joueurs[1].nom);
  }
}
