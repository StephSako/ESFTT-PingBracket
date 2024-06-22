import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { AppService } from 'src/app/app.service';
import { DetailsParisComponent } from 'src/app/GestionModule/gestion-paris/details-paris/details-paris.component';
import {
  PariInterface,
  InfosParisJoueurInterface,
  ResultatPariJoueur,
} from 'src/app/Interface/Pari';
import {
  PariableTableauInterface,
  TableauInterface,
} from 'src/app/Interface/Tableau';
import { AccountService } from 'src/app/Service/account.service';
import { NotifyService } from 'src/app/Service/notify.service';
import { PariService } from 'src/app/Service/pari.service';
import { TableauService } from 'src/app/Service/tableau.service';

@Component({
  selector: 'app-parier',
  templateUrl: './parier.component.html',
  styleUrls: ['./parier.component.scss'],
})
export class ParierComponent implements OnInit, OnDestroy {
  public tableauxPariables: PariableTableauInterface[] = [];
  public infosParisJoueur: InfosParisJoueurInterface = {
    _id: null,
    id_prono_vainqueur: null,
    id_pronostiqueur: null,
    paris: [],
  };
  public tableauxGet = false;
  public listeJoueursParTableaux = [];
  public resultatParisJoueur: ResultatPariJoueur = {
    score: 0,
    details: [],
  };

  constructor(
    private readonly pariService: PariService,
    private readonly tableauService: TableauService,
    private titleService: Title,
    private notifyService: NotifyService,
    private readonly accountService: AccountService,
    private snackBar: MatSnackBar,
    public appService: AppService,
    public dialog: MatDialog
  ) {}

  ngOnDestroy(): void {
    this.pariService.scoresParTableauPhase = [];
  }

  ngOnInit(): void {
    this.titleService.setTitle('Tournoi ESFTT - Parier');

    if (this.isParieurLoggedIn()) {
      this.getParisAndBracket();
    }

    this.tableauService.getPariables().subscribe(
      (tableauxPariables: PariableTableauInterface[]) => {
        this.tableauxPariables = tableauxPariables;
        this.tableauxGet = true;

        this.pariService.initScoreParTableau(this.tableauxPariables);
      },
      () => {
        this.tableauxGet = true;
      }
    );

    // Observables permettant la mise à jour des données en temps réèl
    this.pariService.updateParisLoggIn.subscribe((ok: boolean) => {
      if (ok) {
        this.getParisAndBracket();
      }
    });

    this.pariService.updateListeTableauxPariables.subscribe(
      (tableauxPariablesResponse: TableauInterface[]) => {
        if (tableauxPariablesResponse !== null) {
          this.tableauxPariables.forEach(
            (tableauPariable: PariableTableauInterface, index: number) => {
              let indexSearchTableau = tableauxPariablesResponse.findIndex(
                (tableauPariableResponse: TableauInterface) =>
                  tableauPariable.tableau._id === tableauPariableResponse._id
              );
              if (indexSearchTableau !== -1) {
                tableauPariable.tableau =
                  tableauxPariablesResponse[indexSearchTableau];
              } else {
                delete this.tableauxPariables[index];
              }
            }
          );

          this.tableauxPariables = this.tableauxPariables.filter(
            (tableaupariableToClean: PariableTableauInterface) =>
              !!tableaupariableToClean
          );
          this.pariService.initScoreParTableau(this.tableauxPariables);
        }
      }
    );

    this.pariService.updateInfoParisJoueur.subscribe(
      (infosParisJoueur: InfosParisJoueurInterface) => {
        if (infosParisJoueur) {
          this.infosParisJoueur = infosParisJoueur;
        }
      }
    );

    this.pariService.addPariToListeParisMatches.subscribe(
      (pariToAdd: PariInterface) => {
        if (pariToAdd) {
          this.infosParisJoueur.paris.push(pariToAdd);
          this.pariService.updateListeParisMatches.next(
            this.infosParisJoueur.paris
          );
        }
      }
    );

    this.pariService.deletePariToListeParisMatches.subscribe(
      (pariToDelete: PariInterface) => {
        if (pariToDelete) {
          this.infosParisJoueur.paris = this.infosParisJoueur.paris.filter(
            (pari: PariInterface) =>
              JSON.stringify(pari) !== JSON.stringify(pariToDelete)
          );
          this.pariService.updateListeParisMatches.next(
            this.infosParisJoueur.paris
          );
        }
      }
    );

    this.pariService.updateScorePariJoueur.subscribe(
      (resultatParisJoueur: ResultatPariJoueur) => {
        if (resultatParisJoueur) {
          this.resultatParisJoueur = resultatParisJoueur;
        }
      }
    );
  }

  getParisAndBracket(): void {
    this.pariService
      .getAllParisJoueur(this.accountService.getParieur()._id)
      .subscribe((infosParisJoueur: InfosParisJoueurInterface) => {
        this.infosParisJoueur = infosParisJoueur;
      });
  }

  getNomParieur(): string {
    return this.accountService.getParieur().nom;
  }

  getIdParieur(): string {
    return this.accountService.getParieur()._id;
  }

  logout(): void {
    this.accountService.logoutParieur();
  }

  isParieurLoggedIn(): boolean {
    return !!this.accountService.getParieur();
  }

  updateVainqueur(event: MatSelectChange): void {
    this.pariService
      .parierVainqueur(this.accountService.getParieur()._id, event.value)
      .subscribe(
        (result) => {
          this.notifyService.notifyUser(
            result.message,
            this.snackBar,
            'success',
            'OK'
          );
        },
        (err) =>
          this.notifyService.notifyUser(err.error, this.snackBar, 'error', 'OK')
      );
  }

  getNgModelVainqueur(): string | null {
    return this.infosParisJoueur.id_prono_vainqueur
      ? this.infosParisJoueur.id_prono_vainqueur._id
      : null;
  }

  openDetails(): void {
    this.dialog.open(DetailsParisComponent, {
      width: '100%',
      data: {
        resultatPariJoueur: this.resultatParisJoueur,
      },
    });
  }
}
