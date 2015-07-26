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

function getCommentsByFlair(flair, comments, callback) {
	filtered_comments = [];

	//iterate through all comments and capture the ones with the sought-after flair
	comments.forEach(function(comment, i, comments) {
		if (comment.data.author_flair_text != null) {
			if (comment.data.author_flair_text.toUpperCase() == flair.toUpperCase()){
				console.log(comment.data.body);
				filtered_comments.push(comment.data.body);
			}
		}
	});
	if (filtered_comments.length == 0) {
		addComment('Couldn\'t find any '+flair+' comments. Sorry!');
		return;
	}
	callback(filtered_comments);
}

	
function addComment(statusText) {
  document.getElementById('comments').innerHTML += "<p>"+statusText+"</p>";
}

function clearComments() {
  document.getElementById('comments').innerHTML = "";
}

document.addEventListener('DOMContentLoaded', function() {
     document.getElementById("sort-button").addEventListener('click', onSortClick);
});

function onSortClick() {
 	clearComments();       
	getCurrentTabJsonUrl(function(url) {
	flair = document.getElementById("flair-input").value;
	getComments(url, function(comments) {
	getCommentsByFlair(flair, comments, function(filtered_comments) {
	  	for (var i = 0; i < filtered_comments.length; i++) {
			addComment(filtered_comments[i]+"\n");
		}
	}),
	function(errorMessage) {
		addComment('Cannot display comments. ' + errorMessage);
	};
        });
        });
}
