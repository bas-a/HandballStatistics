var matches = JSON.parse(localStorage.matches); // all matches

$(document).ready(function(){
	
	makeLinks();
	
	$("a").hammer().on("tap", goToMatch); 
				
});

function makeLinks() {
	for(var i=0; i<matches.length; i++) {
		$("#main").append("<a href='https://basariaansz.nl/handbal/results.html' data-matchID='" + matches[i].id + "'><div class='block'><h2>" + matches[i].team1.name + " - " + matches[i].team2.name + "</h2></div></a>")
	}
}

function goToMatch(e) {
	e.preventDefault();
	localStorage.matchID = $(this)[0].attributes["data-matchID"].value;
	window.location.href = $(this)[0].href;
}