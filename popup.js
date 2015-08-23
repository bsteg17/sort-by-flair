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


};


<<<<<<< HEAD
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
=======
function getHiddenComment(commentId) {
	
		var url = "https://www.reddit.com/api/info.json?id=t1_"+commentId;

		var oReq = new XMLHttpRequest();
		oReq.addEventListener('load', reqListener);
		oReq.open("get", url);
		oReq.responseType = 'json';
		oReq.send();

		function reqListener () {
	  	  comment = this.response.data.children[0];
	  	  adjustTeamCount(comment);
		}
>>>>>>> 424617e36696ff1f237a1f23d830596032115fb2
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
<<<<<<< HEAD
	console.log(stats);
	callback(stats, hiddenCommentIds);
=======

	callback(stats);
>>>>>>> 424617e36696ff1f237a1f23d830596032115fb2
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
				getHiddenComment(id);
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
		console.log("here");
		drawGraph(formatData(stats));
	});
	})
});

	},
	function(errorMessage) {
		addComment('Cannot display comments. ' + errorMessage);
	})
    });

function drawGraph(stats) {
	console.log("drawGraph");
	var options = {
    	//Boolean - Whether we should show a stroke on each segment
    	segmentShowStroke : true,
	
    	//String - The colour of each segment stroke
    	segmentStrokeColor : "#fff",
	
    	//Number - The width of each segment stroke
    	segmentStrokeWidth : 2,
	
    	//Number - The percentage of the chart that we cut out of the middle
    	percentageInnerCutout : 50, // This is 0 for Pie charts
	
    	//Number - Amount of animation steps
    	animationSteps : 100,
	
    	//String - Animation easing effect
    	animationEasing : "easeOutBounce",
	
    	//Boolean - Whether we animate the rotation of the Doughnut
    	animateRotate : true,
	
    	//Boolean - Whether we animate scaling the Doughnut from the centre
    	animateScale : false,
	
    	//String - A legend template
    	legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

	}
	var ctx = document.getElementById("graph").getContext("2d");
	var myDoughnutChart = new Chart(ctx).Doughnut(stats,options);
}

function formatData(stats) {
	console.log("formatData");
	var formatted = [];
	for (var team in stats) {
		formatted.push({value: 0});
		formatted[formatted.length - 1]["value"] = team.commentCount;
		formatted[formatted.length - 1]["color"] = "Red";
	}
	return formatted;
}
