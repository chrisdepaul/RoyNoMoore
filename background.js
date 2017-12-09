/*
 *	Listen for onDOMContentLoaded Event and send message if it's for Frame ID 0
 */

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
	console.log("onBeforeNavigate")
	console.log(details)
})

chrome.webNavigation.onCommitted.addListener(function(details) {
	console.log("onCommitted")
	console.log(details)
})

chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
	console.log("onDOMContentLoaded")
	console.log(details)
	if(details.frameId == 0) {
		//console.log("Message sent to tab " + details.tabId)
		chrome.tabs.sendMessage(details.tabId, {message: "onDOMContentLoaded"}, {}, function(response) {});
	}
})

chrome.webNavigation.onCompleted.addListener(function(details) {
	console.log("onCompleted")
	console.log(details)
})

chrome.webNavigation.onErrorOccurred.addListener(function(details) {
	console.log("onErrorOccurred")
	console.log(details)
})

chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details) {
	console.log("onCreatedNavigationTarget")
	console.log(details)
})

chrome.webNavigation.onReferenceFragmentUpdated.addListener(function(details) {
	console.log("onReferenceFragmentUpdated")
	console.log(details)
})

chrome.webNavigation.onTabReplaced.addListener(function(details) {
	console.log("onTabReplaced")
	console.log(details)
})

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
	console.log("onHistoryStateUpdated")
	console.log(details)
})


/*
 *	Update Header Title
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    chrome.tabs.executeScript(sender.tab.id, {code: `document.title = '${request.newTitle}'`});
});

