const express = require('express')
const router = express.Router()
const Tableau = require('../model/Tableau')
const Poule = require('../model/Poule')
const mongoose = require('mongoose')

const NB_MATCHES_ROUND = { "4": 8, "3": 4, "2": 2, "1": 2 }
const ORDRE_HUITIEME = [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2]
const ORDRE_QUART = [1, 8, 5, 4, 3, 6, 7, 2]
const ORDRE_DEMI = [1, 4, 3, 2]

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// GET BRACKET OF SPECIFIC TABLEAU
router.route("/:tableau").get(function(req, res) {
  Tableau.find({tableau: req.params.tableau}).populate('tableau').populate({
    path: 'matches.joueurs._id',
    populate: { path: 'joueurs' }
  }).sort({round: 'desc'}).then(matches => res.status(200).json({rounds: matches})).catch(err => res.send(err))
});

// Push player into a specific match
async function setPlayerSpecificMatch(id_round, id_match, id_player, tableau){
  await Tableau.updateOne(
    {
      round: id_round,
      tableau: tableau,
      "matches.id": id_match
    },
    {
      $push: {
        "matches.$[match].joueurs": {
          _id: id_player,
          winner: false
        }
      }
    },
    {
      arrayFilters: [
        { "match.id": id_match }
      ]
    }
  )
}

// SET WINNER
router.route("/edit/:tableau/round/:id_round/match/:id_match").put(async function(req, res) {
  // On définie :
  // - le joueur cliqué comme gagnant
  // - le match comme "terminé"
  await Tableau.updateOne(
    {
      round: req.params.id_round,
      tableau: req.params.tableau,
      "matches.id": req.params.id_match
    },
    {
      $set: {
        "matches.$[match].joueurs.$[joueur].winner": true
      }
    },
    {
      arrayFilters: [
        { "match.id": req.params.id_match },
        { "joueur._id": req.body.winnerId }
      ]
    }
  ).catch(err => res.status(500).json({error: err}))

  // Pour tous les matches sauf la finale, le gagnant évolue au prochain match
  if (Number(req.params.id_round) !== 1){
    // On définie :
    // - le joueur gagnant dans le prochain match
    // - les perdants des demies vont en match pour la 3ème place

    let idNextMatch = req.params.id_match
    if (idNextMatch % 2 !== 0) idNextMatch++
    idNextMatch = idNextMatch/2
    let idNextRound = req.params.id_round
    idNextRound--

    try {
      await setPlayerSpecificMatch(idNextRound, idNextMatch, req.body.winnerId, req.params.tableau)
    } catch(err) {
      res.status(500).json({error: err})
    }
  }

  // S'il s'agit des demies-finale, on assigne les perdants en petite finale
  if (Number(req.params.id_round) === 2 ){
    try {
      await setPlayerSpecificMatch(1, 2, req.body.looserId, req.params.tableau)
    } catch(err) {
      res.status(500).json({error: err})
    }
  }

  res.status(200).json({message: "No error"})
});

// GENERATE BRACKET
router.route("/generate/:tableau").put(async function(req, res) {
  // On supprime tous les matches
  await Tableau.deleteMany({ tableau: req.params.tableau})

  let poules = await Poule.find({type: req.params.tableau})

  // On calcule combien de rounds sont nécessaires en fonction du nombre de joueurs qualifiés / binômes
  let count = 0, nbRounds, rankingOrder
  if (req.body.format === 'simple') poules.forEach(poule => count += poule.joueurs.length)
  else count = poules.length

  if (count >= 9){
    nbRounds = 4
    rankingOrder = ORDRE_HUITIEME
  }
  else if (count >= 5){
    nbRounds = 3
    rankingOrder = ORDRE_QUART
  }
  else{
    nbRounds = 2
    rankingOrder = ORDRE_DEMI
  }

  try {
    // On initialise tous les matches du bracket
    for (let i = nbRounds; i > 0; i--) {
      let matches = []
      for (let j = 1; j <= NB_MATCHES_ROUND[i]; j++) {
        matches.push({
          id: j,
          round: i,
          joueurs: []
        })
      }

      // On créé le document de la rencontre
      const tableau = new Tableau({
        _id: new mongoose.Types.ObjectId(),
        type: (i !== 1 ? 'Winnerbracket' : 'Final'),
        objectRef: (req.body.format === 'double' ? 'Poules' : 'Joueurs'),
        tableau: req.params.tableau,
        round: i,
        matches: matches
      })
      await tableau.save()
    }

    let qualified = [], id_match = 1

    // On créé la liste des joueur/poules qualifiés
    if (req.body.format === 'simple') {
      for (let i = 0; i < poules.length; i++) {
        qualified = qualified.concat(poules[i].joueurs.slice(0, 2))
      }
    } else qualified = shuffle(poules.map(poule => poule._id)) // On mélange les binômes aléatoirement

    // On assigne les matches aux joueurs/poules
    for (let i = 0; i < qualified.length; i++) { // TODO POUR QUART ET DEMI
      await setPlayerSpecificMatch(nbRounds, id_match, qualified[(req.body.format === 'simple' ? rankingOrder[i]-1 : i)], req.params.tableau).catch(err => res.status(500).json({error: err}))
      if (i % 2 && i !== 0) id_match ++ // On incrémente le n° du match tous les 2 joueurs
    }

    res.status(200).json({message: "No error"})
  } catch(err) {
    res.status(500).json({error: err})
  }
});

module.exports = router
