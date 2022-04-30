import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PoulesService } from '../../Service/poules.service';
import { JoueurInterface } from '../../Interface/Joueur';
import { PouleInterface } from '../../Interface/Poule';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { TableauInterface } from '../../Interface/Tableau';
import { TableauService } from '../../Service/tableau.service';
import { NotifyService } from '../../Service/notify.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-poule',
  templateUrl: './poule.component.html',
  styleUrls: ['./poule.component.scss']
})
export class PouleComponent implements OnInit {

  @Input() poules: PouleInterface[] = [];
  tableau: TableauInterface = {
    format: null,
    _id: null,
    poules: null,
    nom: null,
    is_launched: null,
    consolante: null,
    age_minimum: null,
    nbPoules: null
  };
  @Output() getAllPoules: EventEmitter<any> = new EventEmitter();
  private tableauxEditionSubscription: Subscription;

  constructor(private pouleService: PoulesService, private router: Router, private route: ActivatedRoute, private snackBar: MatSnackBar,
    private gestionService: TableauService, private notifyService: NotifyService,) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.getTableau();

      this.tableauxEditionSubscription = this.gestionService.tableauxEditSource.subscribe((tableau: TableauInterface) => {
        this.tableau = tableau;
      });
    });
  }

  ngOnDestroy(): void {
    this.tableauxEditionSubscription.unsubscribe();
  }

  getTableau(): void {
    this.gestionService.getTableau(this.router.url.split('/').pop()).subscribe(tableau => {
      this.tableau = tableau;
      this.getAllPoules.emit();
    });
  }

  editPoule(event: CdkDragDrop<[id: JoueurInterface], any>, id_poule: string): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.pouleService.editPoule(id_poule, event.container.data).subscribe(() => {}, err => {
      this.notifyService.notifyUser(err.error, this.snackBar, 'error', 2000, 'OK');
    });
  }

  setStatus(poule: PouleInterface): void {
    this.pouleService.setStatus(poule).subscribe(() => this.getAllPoules.emit(), err => {
      this.notifyService.notifyUser(err.error, this.snackBar, 'error', 2000, 'OK');
    });
  }

  showParticipant(objectRef: string, participant_s): string {
    if (objectRef === 'Joueurs'){
      return participant_s.nom + ' - ' + participant_s.classement + ' points';
    } else if (objectRef === 'Binomes') {
      return (participant_s.joueurs[0] !== undefined ? participant_s.joueurs[0].nom : '') +
        (participant_s.joueurs[1] !== undefined ? ' - ' + participant_s.joueurs[1].nom : '');
    }
  }
}
