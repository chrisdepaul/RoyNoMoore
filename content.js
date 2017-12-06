const GENERIC_IDENTIFIER = "Someone"
const BLOCKLIST_TYPE = "SYNC"

/*  
 *  loadBlockList
 *  @param type: 'SYNC' or 'TEST'
 */
function loadBlockList(type) {
    return new Promise((resolve, reject) => {
        if(type === 'SYNC') {
            chrome.storage.sync.get({list: []}, function(result) {
                var blockedList = result.list ? result.list : [];
                resolve(blockedList)
            })
        } else {
            resolve(["Harvey Weinstein", "Pamela Anderson"])
        }
    })
}

/*  
 *  createTreeWalker
 *  @param root node, NodeFilter Type, Filter Function
 */
function createTreeWalker(rootNode, type, filter) {
    return document.createTreeWalker(rootNode, type, {acceptNode: filter} );
}

/*  
 *  treeWalkerFilter
 *  @param node
 */
function treeWalkerFilter(node) {
    // Logic to determine whether to accept, reject or skip node
    // In this case, only accept nodes that have content
    // other than whitespace
    if ( node.tagName != "script" && ! /^\s*$/.test(node.data) ) {
        return NodeFilter.FILTER_ACCEPT;
    }
}

/*  
 *  loadDocumentTitle
 */
function loadDocumentTitleNode() {
    return document.head.getElementsByTagName('title')[0];
}

/*  
 *  scanner - a closure for scanning text
 *  return array of match objects
 */
var scanner = (function() {
    regex = null

    return {
        setBlockedList: function(blockedList) {
            regex = new RegExp(blockedList.join("|"), 'gi')
        },
        scan: function(text) {
            var matches = [];
            var match = regex.exec(text);

            while (match != null) {
                matches.push(match);
                match = regex.exec(text);
            }
            return matches
        }
    }
})()

/*  
 *  updateTitle - Send message to background.js to change title
 *  @param - array of match objects
 */
function updateTitle(matchObjectArray) {
    let originalTitle = matchObjectArray[0].input
    let matchedWordsRegExp = new RegExp(matchObjectArray.map(match => match[0]).join("|"), 'i')
    let newTitle = originalTitle.replace(matchedWordsRegExp, GENERIC_IDENTIFIER)

    chrome.runtime.sendMessage({newTitle: newTitle}, function(response) {});
}

var treeWalker = createTreeWalker(document.body, NodeFilter.SHOW_TEXT, treeWalkerFilter)
var documentTitleNode = loadDocumentTitleNode()

loadBlockList(BLOCKLIST_TYPE)
    .then((blockedList) => {

        // Initialize scanner
        scanner.setBlockedList(blockedList)

        // Scan & Update Title
        let scannedTitle = scanner.scan(documentTitleNode.text)
        if(scannedTitle.length > 0) updateTitle(scannedTitle)

        // Scan & Update Tree
        // THIS CODE COULD BE MADE MORE EFFICIENT
        while(node = treeWalker.nextNode()){
            let scannedNode = scanner.scan(node.nodeValue)
            if(scannedNode.length > 0) {
                let i = 0
                scannedNode.forEach(matchObject => {
                    node.parentNode.insertBefore(document.createTextNode(matchObject.input.substr(i, matchObject.index - i)), node);
                    var word = node.parentNode.insertBefore(document.createElement('span'), node);
                    word.appendChild(document.createTextNode(matchObject[0]));
                    word.style.color = 'transparent'
                    word.style.textShadow = "0 0 0.6em black"
                    i = matchObject.index + matchObject[0].length
                    node.nodeValue = matchObject.input.substr(matchObject.index + matchObject[0].length, matchObject.input.length - 1)
                })
            }
        } 
    })
