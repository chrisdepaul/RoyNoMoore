document.body.onload = function() {
	getNames().then(updateNames)
}

document.getElementById("set").onclick = function() {
	clearList(document.getElementById("recommendations"))
  	var d = document.getElementById("text")
  	var name = d.value;
  	d.value = ""
  	addName(name).then(() => {
  		var recommendations = getRecommendations(name)
		setRecommendations(recommendations)
  	})
}

// Listen for changes to list
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		var storageChange = changes[key];
		updateNames(storageChange.newValue)
	}
});

function addName(name) {
	return new Promise((resolve, reject) => {
		console.log("Add Name: " + name)
		chrome.storage.sync.get({list: []}, function(result) {
			var names = result.list ? result.list : [];
			names.push(name)
			chrome.storage.sync.set({list: names}, function() {
				resolve()
			});
		});
	})
}

function updateNames(names) {
	var namesList = document.getElementById("names")
	clearList(namesList)
	if(names && names.length > 0) {
		names.forEach((name, i) => {
			var nameElement = document.createElement('div')
			var deleteSpan = document.createElement('span')
			deleteSpan.className = "delete"
			deleteSpan.id = i
			deleteSpan.innerText = "X"

			deleteSpan.onclick = function(e){
				removeName(e.target.id)
			}

			nameElement.append(deleteSpan)

			nameElement.className = "name"
			var text = document.createTextNode(` ${name}`)
			nameElement.append(text)
			namesList.append(nameElement)
		})
	} else {
		var nameElement = document.createElement('div')
		nameElement.innerText = "Empty"
		nameElement.className = "empty"
		namesList.append(nameElement)
	}
}

function getRecommendations(name) {
	var nameElements = name.split(' ')
	var recommendations = []
	// Last Name
	if(nameElements.length > 0) {
		var lastName = nameElements[nameElements.length - 1]
		recommendations.push(lastName)
		recommendations.push("Mr. " + lastName)
		recommendations.push("Mrs. " + lastName)
		recommendations.push("Ms. " + lastName)
	}
	return recommendations
}

function setRecommendations(recommendations) {
	if(recommendations.length > 0) {
		var d = document.getElementById("recommendations")
		recommendations.forEach((reco, i) => {
			if(i == 0) {
				var opening = document.createElement('span')
				opening.className = "recommendation-opening"
				opening.innerText = "Include these variations? "
				d.append(opening)
			}
			var newReco = document.createElement('span')
			newReco.className = "recommendation"
			newReco.id = `reco-${i + 1}`
			newReco.onclick = function(e){
				removeRecommendation(e.target.id)
				addName(e.target.innerText)
			}
			
			newReco.innerText = reco

			d.append(newReco)

			if(i != recommendations.length - 1) {
				var spacer = document.createTextNode(', ')
				d.append(spacer)
			}

		})
	}
}

function removeRecommendation(id) {
	var recommendation = document.getElementById(id)
	if(recommendation.nextSibling) {
		recommendation.parentNode.removeChild(recommendation.nextSibling)
	} else if(recommendation.previousSibling) {
		recommendation.parentNode.removeChild(recommendation.previousSibling)
	}
	recommendation.parentNode.removeChild(recommendation)
}


function removeName(id) {
	chrome.storage.sync.get({list: []}, function(result) {
		var names = result.list ? result.list : [];
		names.splice(id, 1)
		chrome.storage.sync.set({list: names}, function() {});
	});
}

function clearList(list) {
	while (list.hasChildNodes()) {
	    list.removeChild(list.lastChild);
	}
}

function getNames(){
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get({list: []}, function(result) {
		  	var names = result.list ? result.list : [];
		  	resolve(names)
		});
	})
}

