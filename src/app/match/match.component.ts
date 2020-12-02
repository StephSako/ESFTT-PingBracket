import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TournoiService } from '../Service/tournoi.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {

  @Input() match: any;
  @Output() updateBracket: EventEmitter<any> = new EventEmitter();
  nomTableau: string;

  constructor(private tournoiService: TournoiService, private router: Router) { }

  ngOnInit(): void {
    this.nomTableau = this.router.url.split('/').pop();
  }

  setWinner(match: any, winnerId: string): void{
    if (match.joueurs.length === 2 && (!match.joueurs[0].winner && !match.joueurs[1].winner)){
      this.tournoiService.edit(this.nomTableau, match.round, match.id, winnerId,
        (winnerId === match.joueurs[0].id._id ? match.joueurs[1].id._id : match.joueurs[0].id._id)).subscribe(() => {
        this.updateBracket.emit();
      });
    }
  }

  isClickable(match: any): string {
    return (match.joueurs.length === 2 && (!match.joueurs[0].winner && !match.joueurs[1].winner) ? 'clickable' : '');
  }

  getColor(match: any, joueur: any): string {
    if (match.joueurs.length < 2 || (!match.joueurs[0].winner && !match.joueurs[1].winner)) { return 'undefined'; }
    else if (match.joueurs.length === 2) { return (joueur.winner ? 'winner' : 'looser'); }
  }
}
