var matches = JSON.parse(localStorage.matches), // all matches
	m = null,				// last added match
	goals = null;						// all goals of that match

var data = [];
var goalsPerPlayer = [];						// declarate array for the goals per player
var playerNrs = [];								// declarate array for the number per player
var playerNames = [];							// declarate array for the names per player
var goalsPerMinute = [];
var minutes = [10,20,30,40,50,60];

var randomColorFactor = function(){ return Math.round(Math.random()*255)};
var randomColor = function() { return "rgba(" + randomColorFactor() + "," + randomColorFactor() + "," + randomColorFactor() + ", 0.5)"; }

$(document).ready(function(){
	
	var identifier = localStorage.matchID;
	
	if(identifier == "last" || identifier == undefined) {
		m = matches[matches.length-1];				// last added match
	} else {
		for(var i=0; i<matches.length; i++) {
			if(matches[i].id == identifier) {
				m = matches[i];
			}
		}
	}
	goals = m.team1.goals;	
	generatePie();
	generateBar();
	
});

function generatePie(){
	
	for(var i=0; i<m.team1.players.length; i++) { // get the data for the pie
		var playerName = m.team1.players[i].name;
		var playerNr = m.team1.players[i].playerNumber;
		var amountOfGoals = _.where(goals, { playerNumber : playerNr });
		var color = randomColor();
		goalsPerPlayer.push(amountOfGoals.length);
		playerNrs.push(playerNr);
		playerNames.push(playerName);
		data.push({
			value : amountOfGoals.length,
			color : color,
			highlight : color.replace("0.5", "0.8"),
			label : playerName
		});
	}
	
	var options = { // give the options to the chart
		responsive : true, // makes the chart bigger
	    segmentShowStroke : true, //Boolean - Whether we should show a stroke on each segment
	    segmentStrokeColor : "#fff", //String - The colour of each segment stroke
	    segmentStrokeWidth : 1, //Number - The width of each segment stroke
	    percentageInnerCutout : 0, //Number - The percentage of the chart that we cut out of the middle
	    animationEasing : "easeInOutCubic", //String - Animation easing effect
	    animateRotate : true, //Boolean - Whether we animate the rotation of the Doughnut
	    animateScale : false, //Boolean - Whether we animate scaling the Doughnut from the centre
	    legendTemplate : "<ul>" //String - A legend template
                  +"<% for (var i=0; i<data.length; i++) { %>"
                    +"<li <% if (i > 7) { %>class=\"right\"<% } %>>"
                    +"<div class=\"color\" style=\"background-color:<%=data[i].color%>\"></div>"
					+"<span><% if (data[i].label) { %><%= data[i].label %><% } %></span>"
                  +"</li>"
                +"<% } %>"
              +"</ul>"
	}

	var ctx = document.getElementById("pie").getContext("2d");
	var myPieChart = new Chart(ctx).Pie(data,options);
	var legend = myPieChart.generateLegend(); //then you just need to generate the legend
	$(".pie-legend").append(legend); //and append it to your page somewhere
}

function generateBar() {

	for(var i=0; i<minutes.length; i++) {
		
		var amountOfGoals = [];
		
		for(var j=0; j<goals.length; j++) {
			if(goals[j].time <= minutes[i] && goals[j].time > minutes[i] - 10) {
				amountOfGoals.push(goals[j]);
			}
		}
		goalsPerMinute.push(amountOfGoals.length);
	}
	
	
	var max_of_array = Math.max.apply(Math, goalsPerMinute);
	
	var barChartData = { 
		labels : minutes,
		datasets : [
			{
				fillColor : "rgba(0,30,129,0.5)",
				strokeColor : "rgba(220,220,220,0.8)",
				highlightFill: "rgba(20,55,155,0.65)",
				highlightStroke: "rgba(220,220,220,1)",
				data : goalsPerMinute
			}
		]
	};

	var ctx = document.getElementById("bar").getContext("2d");
	window.myBar = new Chart(ctx).Bar(barChartData, {
		responsive : true,
		scaleOverride : true,
        scaleSteps : 1,
        scaleStepWidth : max_of_array,
        scaleStartValue : 0, 
	    scaleBeginAtZero : true,
	    scaleShowGridLines : true,
	    scaleGridLineColor : "rgba(0,0,0,.05)"
	});

}


