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


function getHiddenComment(commentId) {

	var url = "https://http://www.reddit.com/api/info.json?id=t1_"+commendId;

	var oReq = new XMLHttpRequest();
	oReq.addEventListener('load', reqListener);
	oReq.open("get", url, true);
	oReq.send();

	function reqListener () {
	  return this.responseText;
	}
}
/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */

function getComments(url, callback, errorCallback) {
  
  var x = new XMLHttpRequest();
  
  x.open('GET', url);
  x.responseType = 'json';
  x.onload = function() {
    // Parse and process the response from Google Image Search.
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

	if (comments == null) {
		addComment('no comments');
		return;
	}

	//iterate through all comments and capture the ones with the sought-after flair
	comments.forEach(function(comment, i, comments) {
		traverseComments(comment, 0, []);
	});
	
	callback(stats);
}

function traverseComments(comment, level, ancestors) {
	
	//initialize child values
	child = {};
	child.author = comment.data.author;
	child.text = comment.data.body;

	//if this comment was posted by someone with the flair we want to hear from, it is pushed to the list of flair-appropriate comments (the list to be displayed by the browser action)

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

	console.log(team);
	
	//for each direct reply to the current comment...
	if (comment.data.replies != "") {
		comment.data.replies.data.children.forEach(function (reply, i) {
			//...the program recursively searches more comments
			traverseComments(reply, level + 1, ancestors);
		});
	}

}

function clear() {
  document.getElementById('comments').innerHTML = "";
}

$(document).ready(function() {
    clear();       
	getCurrentTabJsonUrl(function(url) {
	getComments(url, function(comments) {
	storeComments(comments, function(stats) {
	  	console.log(stats);
	}),
	function(errorMessage) {
		addComment('Cannot display comments. ' + errorMessage);
	};
        });
        });
});