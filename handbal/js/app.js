var date = new Date();
var currentDate = date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear()

var teams = { // when the game starts, this object is always configured correctly
	team1 : {
		name : "Team 1",
		players : [
/* 			{ id : 1, name : "", playerNumber : null, position : "BENCH" } */
		]
	},
	team2 : {
		name : "Team 2",
		players : [
/* 			{ id : 1, name : "", playerNumber : null, position : "BENCH" } */		
		]
	}
}

var match = { // this object has to be made at the end of the game, to store in the local storage
	id : null, // I don't think I need an id for this application, not sure tho 
	date : currentDate,
	team1 : {
		name : teams.team1.name,
		goals : [
/* 			{ time : secs-1, pos : "LH", playerNumber : 6, shotSpot : "LB" } */
		],
		assists : [
/* 			{ playerNr : 6 } */
		],
		misses : [
/* 			{ time : secs-1, pos : "LH", playerNumber : 6, shotSpot : "LB" } */
		],
		technicalFouls : [
/* 			{ playerNumber : 6, sort : "walk-foul" } */
		],
		penalties : [
/* 			{ playerNumber : 6, sort : "twomins", time : null } */
		],
		players : null
	},
	team2 : {
		name : teams.team2.name,
		goals : [],
		assists : [],
		misses : [],
		technicalFouls : [],
		penalties : [],
		players : null
	}
}

var obj;
var team1Button = $(".team1-button"); // put the switch buttons in a variable
var team2Button = $(".team2-button"); // put the switch buttons in a variable

var STOP = true, // variables for the timer
	gameEnded = false,
	secs = 0,
	maxMins = 0.5/* localStorage.periodDuration */, 	// just for the demo
	maxSecs = maxMins * 60,								// just for the demo
	currentSeconds = 0,
	currentMinutes = 0,
	currentPeriod = 1;

var periods = null,
	periodDuration = null;
	
var playerNr = null,
	pos = null;
	
var twoMinsTeam1 = [],
	twoMinsTeam2 = []; 
	
var team = null;

$(document).ready(function(){
	
	document.ontouchmove = function(event){ // to prevent scrolling on iPad
	    event.preventDefault();
	}
		
	$("a").hammer().on("tap", function(e){ // disable the default action of an a element. And go to the right url in a custom way so the app doesn't open safari
		e.preventDefault();
		window.location.href = $(this)[0].href; // href from the current clicked a element	
	});
	
	if(localStorage.teams == undefined || localStorage.teams == "") {
		localStorage.teams = JSON.stringify(teams);
	}
	teams = JSON.parse(localStorage.teams);
	
	fillHtmlValues(document.body.id);
	
	// To switch in the teams tab
	$(".team-switch div").hammer().on("tap", function() {
		$(".team-switch div").removeClass("active");
		$(this).addClass("active");
		fillHtmlValues(document.body.id);
		getNames();
		getJerseys();
	});
	
	// to change the team names
	$(".change-team-wrapper div").hammer().on("tap", function() {
		if($(".team1-button").hasClass("active")){
			$(".team1-button")[0].innerHTML = $(".change-team-wrapper input")[0].value;
			teams.team1.name = $(".change-team-wrapper input")[0].value;
		} else if($(".team2-button").hasClass("active")){
			$(".team2-button")[0].innerHTML = $(".change-team-wrapper input")[0].value;
			teams.team2.name = $(".change-team-wrapper input")[0].value;
		}
		save("teams", teams); // first parameter is the localStorage object in which it has to be saved, second parameter is the actual object
	});
	
	// add player
	$(".player-list input").focusout(function(){ // when focus is not on the element anymore, update the whole teams object		
		
		if($(this).hasClass("player-number") == true) { // if selected input is a player-number-input, put the number into the jersey
			var pp = this.parentElement.attributes[0].value; 	// player position
			var pn = this.value;								// player number
			
			for(var i=0; i<7; i++){ // loop through the jerseys and put the number in the correct jersey
				if($(".handball-court-half div")[i].id == pp) {
					$(".handball-court-half div")[i].innerText = pn;					
				}
			}
		}
		
		if(teams.team1.players.length < 15){ 
			if(team1Button.hasClass("active") == true) {
				teams.team1.players = [];
			} else if(team2Button.hasClass("active") == true) {
				teams.team2.players = [];
			}
			
			for(var i=0; i<$(".player-list .player-name").length; i++){ // loop through all the players to set new values in the players object
				var playerName = $(".player-list .player-name")[i].value;
				var playerNumber = $(".player-list .player-number")[i].value;
				var playerPosition = $(".player-list .player-number")[i].parentElement.attributes[0].value;
				
				if(team1Button.hasClass("active") == true) {
					teams.team1.players.push({ name : playerName, playerNumber : playerNumber, position : playerPosition });
				} else if(team2Button.hasClass("active") == true) {
					teams.team2.players.push({ name : playerName, playerNumber : playerNumber, position : playerPosition });
				}	
				save("teams", teams);
			}
		} 
				
	});
	
	$("#main .right a:first-of-type").on("click", getMatchSettings); // this function sets the matchduration and the amount of periods
	
	
	// ------------------- Match page ------------------- //
	
	$(".start-game").hammer().on("tap", function(){
		if(gameEnded == true) { 
			return;	
		} else { 
			if(STOP == true) { 
				STOP = false; 
				timer();
			}
		}		
	});
	
	$(".stop-game").hammer().on("tap", function(){
		STOP = true;
		isTiming = false;
	});
	
	$(".jersey").hammer().on("tap", function() {
		$(".action").css({"display" : "none"});
		$(".event-menu").fadeIn("fast");
		$(".option").fadeIn("fast");
		if($(this)[0].parentElement.className == "left") {
			playerNr = $(this)[0].innerHTML; // this is for the tap on the jersey, to hold track over which player is selected.
			pos = $(this).attr("data-pos");
			team = "team1";
		} else if($(this)[0].parentElement.className == "right") {
			pos = $(this)[0].innerHTML; // this is for the tap on the jersey, to hold track over which player is selected.	
			team = "team2";
		}
	});
	
	$(".option").hammer().on("tap",function(){
		switch($(this)[0].id){
			case "goal":
				shotSpot();
				if(team == "team1") {
					$(".area").attr("data-playerNr", playerNr);		// put the playerNr in the data-attributes of the area's for the shotspot.	
				}
				$(".area").attr("data-pos", pos);				// put the pos in the data-attributes of the area's for the shotspot.
				$(".area").attr("data-action", "goal");
				break;
			case "assist":
				if(team == "team1") {
					assist(playerNr);
				} else if(team == "team2") {
					assist(pos);
				} 
				break;
			case "miss":
				shotSpot();
				$(".area").attr("data-action", "miss");
				break;
			case "technical-foul":
				pickFoul();
				$(".technical-foul div").attr("data-playerNr", playerNr);
				break;
			case "penalty":
				pickPenalty();
				$(".penalties div").attr("data-playerNr", playerNr);
				break;
		}
	});
	
	$(".go-back").hammer().on("tap", function(){ $(".event-menu").fadeOut("fast") });
	
	$(".area").hammer().on("tap", goal);
	$(".area").hammer().on("tap", miss);

	$(".foul").hammer().on("tap", foul);

	$(".penalty").hammer().on("tap", penalty);
	
	
});

function fillHtmlValues(page) {
	
	switch(page) {
    case "home":
        // do something
        break;
    
    case "new-game":
        teamNameTabs();        
        changeTeamNameInput();
        getNames();
        getJerseys();
        break;
	
	case "match": 
        getJerseys();
		getTeamNames();
		timer();
		$(".jersey").draggable({
			distance : 10,
			revert : true,
			revertDuration : 0
		});
		
		$(".jersey").droppable({
			drop: function(event, ui) {
				var firstNumber = $(ui.draggable)[0].innerHTML;
				var secondNumber = $(this)[0].innerHTML;
				$(ui.draggable)[0].innerHTML = secondNumber;
				$(this)[0].innerHTML = firstNumber;
			}
		});
        break;
	}
}

function teamNameTabs() {

	if(teams.team1.name != null && teams.team1.name != "") { // sets the team tab value for team 1 to the one in the local database.
    	team1Button.html(teams.team1.name);  
    } else {
     	team1Button.html("Team 1");   
    }
    
    if(teams.team2.name != null && teams.team2.name != "") { // sets the team tab value for team 2 to the one in the local database.
    	team2Button.html(teams.team2.name);  
    } else {
     	team2Button.html("Team 2");   
    }

}

function changeTeamNameInput() {
	
	if(team1Button.hasClass("active") == true) {
        if(teams.team1.name != "") { // sets the team tab value for team 2 to the one in the local database.
	    	$(".change-team-name")[0].value = teams.team1.name;  
        } else {
	     	$(".change-team-name")[0].value = "Team 1";  
        }
    }
    
    if(team2Button.hasClass("active") == true) {
        if(teams.team2.name != "") { // sets the team tab value for team 2 to the one in the local database.
	    	$(".change-team-name")[0].value = teams.team2.name;  
        } else {
	     	$(".change-team-name")[0].value = "Team 1";  
        }
    }

}

function getNames() {
	if(team1Button.hasClass("active") == true) { 
        for(var i=0; i<$(".player-list .player-name").length; i++){ // loop through all the inputs and fill them with the localstorage values
	        if(teams.team1.players[i] != undefined){
		        $(".player-list .player-name")[i].value = teams.team1.players[i].name;
		        $(".player-list .player-number")[i].value = teams.team1.players[i].playerNumber;	        		        
	        } else {
     		    $(".player-list .player-name")[i].value = "";
		        $(".player-list .player-number")[i].value = "";
	        }
        }
    } else if(team2Button.hasClass("active") == true) { 
        for(var i=0; i<$(".player-list .player-name").length; i++){ // loop through all the inputs and fill them with the localstorage values
	        if(teams.team2.players[i] != undefined){
		        $(".player-list .player-name")[i].value = teams.team2.players[i].name;
		        $(".player-list .player-number")[i].value = teams.team2.players[i].playerNumber;	        		        
	        } else {
		        $(".player-list .player-name")[i].value = "";
		        $(".player-list .player-number")[i].value = "";
	        }
		}
    }
}

function getJerseys() {
	
	if($("#new-game").length > 0) { // if new game page
		
		for(var j=0; j<teams.team1.players.length; j++) { // clear all shirts first.
			if(mapPos == teams.team1.players[j].position) { // if the mapPos is equal to the players position, fill the jersey
				$(".handball-court-half div")[j].innerText = "";
			}
		}
		
		for(var i=0; i<$(".handball-court-half div").length; i++) { // loop through all the jerseys
			var mapPos = $(".handball-court-half div")[i].id; // put the positions per jersey in the mapPos
			
			if(team1Button.hasClass("active") == true) {
				for(var j=0; j<teams.team1.players.length; j++) {
					if(mapPos == teams.team1.players[j].position) { // if the mapPos is equal to the players position, fill the jersey
						$(".handball-court-half div")[j].innerText = teams.team1.players[j].playerNumber;
					}
				}
			} else if (team2Button.hasClass("active") == true) {
				for(var j=0; j<teams.team2.players.length; j++) {
					if(mapPos == teams.team2.players[j].position) { // if the mapPos is equal to the players position, fill the jersey
						$(".handball-court-half div")[j].innerText = teams.team2.players[j].playerNumber;
					}
				}	
			}
		}
					
	} 
	
	if($("#match").length > 0) { // if new match page
		for(var i=0; i<$(".handball-court .left div").length; i++) { // loop through all the jerseys of team 1
			$(".handball-court .left div")[i].innerText = teams.team1.players[i].playerNumber; // put all the numbers from the players into the jerseys.																														
		}		
	}
}

function getMatchSettings() {
	periods = $(".game-periods")[0].value;
	periodDuration = $(".period-duration")[0].value;
	localStorage.periods = periods;
	localStorage.periodDuration = periodDuration;
}

function getTeamNames() {
	$(".game-info .left h4").html(teams.team1.name);
	$(".game-info .right h4").html(teams.team2.name);
}

function timer() {
	if(STOP == false){
		currentMinutes = Math.floor(secs / 60); 
		currentSeconds = secs % 60; // gives the current seconds, apart from the minutes.
		if(currentSeconds <= 9) currentSeconds = "0" + currentSeconds;
		if(currentMinutes <= 9) currentMinutes = "0" + currentMinutes;
		secs++;
		$(".time h4").html(currentMinutes + ":" + currentSeconds); //Set the element id you need the time put into.
		if(secs !== maxSecs + 1) {
			setTimeout('timer()',1000);
		} else {
			endPeriod();
		}
	}
}

function endPeriod() {
	if(currentPeriod == 1) {
		STOP = true;
		$("#main").append("<div class='end-period-wrapper'><div class='end-period'><h4>De eerste helft is afgelopen!</h4><span>Klik op de knop hieronder om verder te gaan.</span><div>Ga naar de tweede helft.</div></div></div>");
		currentPeriod++;
		$(".end-period div").hammer().on("tap", function() {
			$(".end-period-wrapper").fadeOut("fast", function() { $(this).remove(); });
			$(".time span").html("PERIODE " + currentPeriod);
			secs = 0;
			$(".time h4").html("00:00"); //Set the element time element on 0 again, for the second half.
		});
	} else if(currentPeriod == 2) {
		gameEnded = true;
		endGame();
		$("#main").append("<div class='end-period-wrapper'><div class='end-period'><h4>De wedstrijd is afgelopen!</h4><span>Klik op de knop hieronder om verder te gaan.</span><a href='https://basariaansz.nl/handbal/results.html'><div>Ga naar het overzicht.</div></a></div></div>");
		localStorage.matchID = "last";
	} 
}

function save(key, value) { // key is the localStorage object in which it has to be saved, value is the actual object that has to be saved
	obj = JSON.stringify(value); // save the object that has to be saved in the obj variable and stringify it
	localStorage.setItem(key, obj); // set the JSONstring in the localstorage
}

function shotSpot() {
	$(".option").fadeOut("fast", function (){
		$(".goal").fadeIn("fast");		
	});
}

function goal(e){
	if($(e.currentTarget).attr("data-action") == "goal"){
		$(".event-menu").fadeOut("fast");
		var shotSpot = $(e.currentTarget).attr("data-spot");
		var pos = $(e.currentTarget).attr("data-pos");
		if(currentPeriod == 2) { // if we're in the second half, we have to add the first half's seconds to the current seconds
			var totalSecs = secs + 30 /* (JSON.parse(localStorage.periodDuration) * 60) */; 
		} else { 
			var totalSecs = secs; 
		}
		if(team == "team1") {
			var playerNr = $(e.currentTarget).attr("data-playerNr");
			match.team1.goals.push({ time : totalSecs, playerNumber : playerNr, pos : pos, shotSpot : shotSpot });
			var totalGoalsTeam1 = match.team1.goals.length;
			$(".score-team1").html(totalGoalsTeam1);
		} else if(team == "team2") {
			match.team2.goals.push({ time : totalSecs, pos : pos, shotSpot : shotSpot });
			var totalGoalsTeam2 = match.team2.goals.length;
			$(".score-team2").html(totalGoalsTeam2);
		}
	}
}

function miss(e){
	if($(e.currentTarget).attr("data-action") == "miss"){
		$(".event-menu").fadeOut("fast");
		var shotSpot = $(e.currentTarget).attr("data-spot");
		var pos = $(e.currentTarget).attr("data-pos");
		if(currentPeriod == 2) { // if we're in the second half, we have to add the first half's seconds to the current seconds
			var totalSecs = secs + 3 /* (JSON.parse(localStorage.periodDuration) * 60) */; 
		} else { 
			var totalSecs = secs; 
		}
		if(team == "team1") {
			var playerNr = $(e.currentTarget).attr("data-playerNr");
			match.team1.misses.push({ time : totalSecs, playerNumber : playerNr, pos : pos, shotSpot : shotSpot });
		} else if(team == "team2") {
			match.team2.misses.push({ time : totalSecs, pos : pos, shotSpot : shotSpot });
		}
	}
}

function assist(playerNrOrPos) { // or pos, in case of selected a jersey of team 2
	$(".event-menu").fadeOut("fast");
	if(team == "team1") {
		match.team1.assists.push(playerNrOrPos);	
	} else if(team == "team2") {
		match.team2.assists.push(playerNrOrPos);	
	}
}

function pickFoul() {
	$(".option").fadeOut("fast", function (){
		$(".technical-foul").fadeIn("fast");		
	});
}

function foul(e){
	var sort = null;
	switch(e.currentTarget.id) {
		case "pass-foul":
			sort = "pass-foul";
			break;
		case "walk-foul":
			sort = "walk-foul";
			break;
		case "circle-foul":
			sort = "circle-foul";
			break;
	}
	$(".event-menu").fadeOut("fast");
	var playerNr = $(e.currentTarget).attr("data-playerNr");
	match.team1.technicalFouls.push({ playerNumber : playerNr, sort : sort });
}

function pickPenalty(){
	$(".option").fadeOut("fast", function (){
		$(".penalties").fadeIn("fast");		
	});
}

function penalty(e) {
	$(".event-menu").fadeOut("fast");
	var playerNr = $(e.currentTarget).attr("data-playerNr");
	if(currentPeriod == 2) { // if we're in the second half, we have to add the first half's seconds to the current seconds
		var totalSecs = secs + (JSON.parse(localStorage.periodDuration) * 60); 
	} else { 
		var totalSecs = secs; 
	}
	var sort = null;
	switch(e.currentTarget.id) {
		case "yell":
			sort = "yell";
			break;
		case "red":
			sort = "red";
			break;
		case "twomins":
			sort = "twomins";
			break;
	}
	match.team1.penalties.push({ playerNumber : playerNr, sort : sort, time : totalSecs-1 });
}

function endGame() {
	match.team1.name = teams.team1.name;
	match.team2.name = teams.team2.name;
	match.team1.players = teams.team1.players;
	match.id = date.getTime();
	
	if(localStorage.matches == undefined || localStorage.matches == "") {
		localStorage.matches = JSON.stringify([]);
	}
	var matches = JSON.parse(localStorage.matches);
	matches.push(match);
	save("matches", matches);
	
}



