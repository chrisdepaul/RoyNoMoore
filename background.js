chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    chrome.tabs.executeScript(sender.tab.id, {code: `document.title = '${request.newTitle}'`});
    
  });