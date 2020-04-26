const randStreetView = require('random-streetview');
const apiKey = require('./auth');
let game;

function init() {
    initGame();
    initMap();
    initResize();
    startRound();
}

function startRound() {
    if (game.round === game.maxRounds - 1) {
        location.reload();
    }

    game.round++;
    game.rounds.push({});
    generateRandomStreetView()
        .then(() => $('.results-overview').addClass('hide'));
}

function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

function getDistanceLabel(dist) {
    if (dist > 1) {
        return `${roundToTwo(dist)} km`;
    }

    return `${roundToTwo(dist * 1000)} m`;
}

function setScoreLabels() {
    const table = $('#results-table');
    table.empty();

    const head = $('<tr>');
    table.append(head);

    const round = $('<th>');
    round.text('Round');
    head.append(round);

    const accuracy = $('<th>');
    accuracy.text('Accuracy');
    head.append(accuracy);

    const score = $('<th>');
    score.text('Score');
    head.append(score);
    
    for (let i = 0; i < game.maxRounds; i++) {
        const row = $('<tr>');
        const roundCell = $('<td>');
        const accuracyCell = $('<td>');
        const scoreCell = $('<td>');

        roundCell.text(i + 1);
        if (game.rounds[i]) {
            accuracyCell.text(getDistanceLabel(game.rounds[i].accuracy));
            scoreCell.text(game.rounds[i].score);
        } else {
            accuracyCell.text('-');
            scoreCell.text('-');
        }

        row.append(roundCell);
        row.append(accuracyCell);
        row.append(scoreCell);
        table.append(row);
    }

    const totalRow = $('<tr>');
    table.append(totalRow);
    totalRow.append($('<td>'));

    const totalAccuracy = game.rounds.reduce((total, next) => total + next.accuracy, 0);
    const avgAccuracy = roundToTwo(totalAccuracy / game.rounds.length)
    const totalAccuracyCell = $('<td>');
    totalAccuracyCell.text(`${avgAccuracy} km avg`);
    totalRow.append(totalAccuracyCell);

    const totalScore = game.rounds.reduce((total, next) => total + next.score, 0);
    const totalScoreCell = $('<td>');
    totalScoreCell.text(`${totalScore} total`);
    totalRow.append(totalScoreCell);
}

function setGuessMarker(location) {
    const currentRound = game.rounds[game.round];
    if (currentRound.guessMarker) {
        currentRound.guessMarker.setMap(null);
        currentRound.guessMarker = null;
    }

    currentRound.guessMarker = new google.maps.Marker({
        map: game.guessMap,
        animation: google.maps.Animation.DROP,
        position: location,
        icon: {
            url: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+ (game.round + 1) +'|FF776B|000000',
        }
    });
}

function makeGuess() {
    const currentRound = game.rounds[game.round];

    if (!currentRound.guessMarker) {
        return;
    }

    const actualMarker = new google.maps.Marker({
        map: game.resultsMap,
        animation: google.maps.Animation.DROP,
        position: game.streetViewMap.streetView.location.latLng,
        icon: {
            url: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+ (game.round + 1) +'|1098F7|000000',
        }
    });
    currentRound.actualMarker = actualMarker;
    currentRound.guessMarker.setMap(game.resultsMap);

    currentRound.guessLine = new google.maps.Polyline({
        path: [currentRound.guessMarker.getPosition(), currentRound.actualMarker.getPosition()],
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: .5,
        strokeWeight: 3
    });

    currentRound.guessLine.setMap(game.resultsMap);

    const dist = haversine_distance(currentRound.guessMarker, currentRound.actualMarker);
    currentRound.accuracy = dist;
    currentRound.score = Math.round(dist < 3000 ? (((1/30) * dist - 100) ** 2) : 0);
    setScoreLabels();

    $('.results-overview').removeClass('hide');
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(currentRound.guessMarker.getPosition());
    bounds.extend(actualMarker.getPosition());
    game.resultsMap.fitBounds(bounds);
}

function generateRandomStreetView() {
    return randStreetView.default.getRandomLocation()
    .then(pos => {
        let panorama = new google.maps.StreetViewPanorama(
            document.getElementById('street-view-map'), {
            position: { lat: pos[0], lng: pos[1] },
            pov: {
                heading: 34,
                pitch: 10
            },
            addressControl: false,
            fullscreenControl: false,
            enableCloseButton: false,
            panControl: false,
            showRoadLabels: false,
            motionTracking: false,
            motionTrackingControl: false,
            zoomControl: false
        });
        game.streetViewMap.setStreetView(panorama);
        return pos;
    });
}

function initGame() {
    game = null;
    game = {
        maxRounds: 5,
        round: -1,
        rounds: []
    };

    $('#make-guess-button').click((event) => makeGuess(event));
    $('#next-round-button').click(() => {
        startRound();
    });
}

function initResize() {
    interact('.guess-area')
        .resizable({
            edges: {
                top: true,
                right: true,
                bottom: false,
                left: false
            },
            listeners: {
                move(event) {
                    const target = event.target;
                    var x = (parseFloat(target.getAttribute('data-x')) || 0);
                    var y = (parseFloat(target.getAttribute('data-y')) || 0);

                    // update the element's style
                    target.style.width = event.rect.width + 'px';
                    target.style.height = event.rect.height + 'px';

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            }
        });
}

function initMap() {
    randStreetView.default.setParameters({
        google: google,
        polygon: false
    });

    var initCenter = { lat: 30.2672, lng: -97.7431 };

    game.streetViewMap = new google.maps.Map(document.getElementById('street-view-map'), {
        center: initCenter,
        zoom: 14,
        zoomControl:false
    });

    game.guessMap = new google.maps.Map(document.getElementById('guess-map'), {
        zoom: 2,
        center: initCenter,
        draggableCursor: 'default',
        draggingCursor: 'default',

        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false
    });

    game.guessMap.addListener('click', (e) => setGuessMarker(e.latLng));

    game.resultsMap = new google.maps.Map(document.getElementById('results-map'), {
        zoom: 4,
        center: initCenter,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false
    });
}

function haversine_distance(mk1, mk2) {
    var R = 6371.071; // Radius of the Earth in miles
    var rlat1 = mk1.position.lat() * (Math.PI/180); // Convert degrees to radians
    var rlat2 = mk2.position.lat() * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (mk2.position.lng()-mk1.position.lng()) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    return d;
  }

window.init = init;

const mapsScript = $('<script>');
mapsScript.attr('async');
mapsScript.attr('defer');
mapsScript.attr('src', `https://maps.googleapis.com/maps/api/js?key=${apiKey}&=geometry&callback=init`);
$('body').append(mapsScript);