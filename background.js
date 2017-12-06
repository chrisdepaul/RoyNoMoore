chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
	if(details.frameId == 0) {
		console.log("Message sent to tab " + details.tabId)
		chrome.tabs.sendMessage(details.tabId, {message: "onDOMContentLoaded"}, {}, function(response) {});
	}
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    chrome.tabs.executeScript(sender.tab.id, {code: `document.title = '${request.newTitle}'`});
    
});