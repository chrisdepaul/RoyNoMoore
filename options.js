document.body.onload = function() {
	chrome.storage.sync.get({list: []}, function(result) {
	  	var names = result.list ? result.list : [];
	  	updateData(names)
	});
}

document.getElementById("set").onclick = function() {

  	var d = document.getElementById("text")
  	var name = d.value;
  	d.value = ""

  	chrome.storage.sync.get({list: []}, function(result) {
		var names = result.list ? result.list : [];
		names.push(name)
		chrome.storage.sync.set({list: names}, function() {
	        console.log("Saved a new array item");
	        updateData(names)
	    });
	});
}

document.getElementById("reset").onclick = function() {
  chrome.storage.sync.clear(function() {
    if (chrome.runtime.error) {
      console.log("Runtime error.");
    }
    updateData()
  });
}

function updateData(names) {
	console.log(names)
    document.getElementById("data").innerText = (names && names.length > 0) ? names.join(", ") : "Nobody"
}