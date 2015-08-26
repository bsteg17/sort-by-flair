// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */

function getCurrentTabJsonUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
 
    var url = tab.url.split('?')[0]+".json";

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.json should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.


}



function getHiddenComments(stats, hiddenCommentIds, callback) {

	numLoaded = 0;

	hiddenCommentIds.forEach( function (commentId, i) {
	
		var url = "https://www.reddit.com/api/info.json?id=t1_"+commentId;

		var x = new XMLHttpRequest();
  
  		x.open('GET', url);
  		x.responseType = 'json';
  		x.onload = function() {
    
    		var response = x.response;
    		comment = response.data.children[0];
    		adjustTeamCount(comment);
    		
    		if (numLoaded == hiddenCommentIds.length - 1) {
				callback(stats);
			}
			numLoaded += 1;
  		};
  		x.send();
	});
}



function getComments(url, callback, errorCallback) {
  
  var x = new XMLHttpRequest();
  
  x.open('GET', url);
  x.responseType = 'json';
  x.onload = function() {
    
    var response = x.response;
    if (!response) {
      errorCallback('No response from Reddit!');
      return;
    }
    var comments = response[1].data.children;
    
    callback(comments);
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

function storeComments(comments, callback) {
	stats = {};
	hiddenCommentIds = [];

	if (comments == null) {
		addComment('no comments');
		return;
	}

	//iterate through all comments and capture the ones with the sought-after flair
	comments.forEach(function(comment, i, comments) {
		traverseComments(comment, 0, []);
	});
	console.log(stats);
	callback(stats, hiddenCommentIds);
}

function adjustTeamCount(comment) {
	//can't call toUpperCase on a null value
	if (comment.data.author_flair_text == null) {
		comment.data.author_flair_text = "NONE";
	}

	team = comment.data.author_flair_text.toUpperCase();
	if (stats.hasOwnProperty(team)) {
		stats[team]["teamKarma"] += comment.data.score;
		stats[team]["commentCount"] += 1;
	} 
	else { 
		stats[team] = {};
		stats[team]["teamKarma"] = comment.data.score;
		stats[team]["commentCount"] = 1;
	}
	console.log(JSON.parse(JSON.stringify(team)));;
	console.log(JSON.parse(JSON.stringify(stats)));;
}

function traverseComments(comment, level, ancestors) {
	
	if (comment.kind == "more") {
			comment.data.children.forEach( function (id, i) {
				hiddenCommentIds.push(id);
			});
			return;
	}

	adjustTeamCount(comment);
	
	//for each direct reply to the current comment...
	if (comment.data.replies != "") {
		comment.data.replies.data.children.forEach(function (reply, i) {
			//...the program recursively searches more comments
			traverseComments(reply, level + 1, ancestors);
		});
	}
}

$(document).ready(function() { 
	getCurrentTabJsonUrl(function(url) {
	getComments(url, function(comments) {
	storeComments(comments, function(stats, hiddenCommentIds) {
	getHiddenComments(stats, hiddenCommentIds, function(stats) {

      //add average karma/comment to dataset
      for (team in stats) {
      	stats[team]["average"] = (stats[team]["teamKarma"]/stats[team]["commentCount"]).toFixed(1); //display to 1 decimal place
      }
      drawGraph(stats, "countGraph", "pie", "commentCount");
      drawGraph(stats, "totalScoreGraph", "pie", "teamKarma");
      drawGraph(stats, "averageScoreGraph", "pie", "average");
	});
	});

        });

	},
	function(errorMessage) {
		addComment('Cannot display comments. ' + errorMessage);
	})
});

$("#count-graph-select").change(function() {
   graphShape = $(this).val();
   drawGraph(stats, "countGraph", graphShape, "commentCount");
});

var charts = {};

function drawGraph(stats, graphID, graphShape, graphCategory) {
	data = formatData(stats, graphCategory, graphShape);
	console.log(data);
	var options = OPTIONS[graphShape];
	var ctx = document.getElementById(graphID).getContext("2d");
	if (charts.hasOwnProperty(graphID)) {
		charts[graphID].destroy();
	}
	if (graphShape == "pie") {
        charts[graphID] = new Chart(ctx).Doughnut(data,options);
	} else if (graphShape == "bar") {
        charts[graphID] = new Chart(ctx).Bar(data,options);
	} else if (graphShape == "radar") {
        charts[graphID] = new Chart(ctx).Radar(data,options);
	} else if (graphShape == "polar") {
        charts[graphID] = new Chart(ctx).PolarArea(data,options);
	}
}

function formatData(stats, category, graphShape) {
	if (graphShape == "pie") {
	    var formatted = [];
	    for (var team in stats) {
	        if (stats.hasOwnProperty(team) && TEAMCOLORS.hasOwnProperty(team)){
	    	    formatted.push({});
	    		if (stats[team] != "NFL") {
	    		   formatted[formatted.length - 1]["label"] = capFirstChar(team);
	    		} else {
                   formatted[formatted.length - 1]["label"] = team;
	    	    }
	    		formatted[formatted.length - 1]["value"] = stats[team][category];
	    		formatted[formatted.length - 1]["color"] = TEAMCOLORS[team];
	        }
	    }
	} else if (graphShape == "bar") {
	    var formatted = {"labels":[], "value":0, "fillColor":"", "datasets":[]};
	    for (var team in stats) {
	        if (stats.hasOwnProperty(team) && TEAMCOLORS.hasOwnProperty(team)){
	    		if (stats[team] == "NFL") {
	    			console.log(formatted["labels"]);
	    		   formatted["labels"].push(team);
	    		} else {
                   formatted["labels"].push(capFirstChar(team));
	    	    }
	    	    dataset = {};
	    	    dataset["value"] = stats[team][category];
	    		dataset["fillColor"] = TEAMCOLORS[team];
	    		formatted["datasets"].push(dataset);
	        }
	    }
	}
	return formatted;
}

function capFirstChar(str) {
   return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
