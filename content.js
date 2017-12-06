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
function blockTitle(matchObjectArray) {
    let originalTitle = matchObjectArray[0].input
    let matchedWordsRegExp = new RegExp(matchObjectArray.map(match => match[0]).join("|"), 'i')
    let newTitle = originalTitle.replace(matchedWordsRegExp, GENERIC_IDENTIFIER)

    chrome.runtime.sendMessage({newTitle: newTitle}, function(response) {});
}

/*  
 *  block - Block the matching word
 *  @param - node, matching word
 *  @return - last index
 */
function blockText(node, matchObject, i) {
    //Start of String, before Blocked Word
    var preTextNode = document.createTextNode(matchObject.input.substr(i, matchObject.index - i))
    node.parentNode.insertBefore(preTextNode, node);

    // Wrap Blocked Word in Span
    var word = node.parentNode.insertBefore(document.createElement('span'), node);
    word.appendChild(document.createTextNode(matchObject[0]));

    // Set Style
    word.style.color = 'transparent'
    word.style.textShadow = "0 0 0.6em black"

    // Update i to end of current string
    i = matchObject.index + matchObject[0].length

    // Update current node value to string after blocked word
    node.nodeValue = matchObject.input.substr(i, matchObject.input.length - 1)

    return i
}

/*
 *  Run Extension
 */
var treeWalker = createTreeWalker(document.body, NodeFilter.SHOW_TEXT, treeWalkerFilter)
var documentTitleNode = loadDocumentTitleNode()

loadBlockList(BLOCKLIST_TYPE).then((blockedList) => {
    // Initialize scanner
    scanner.setBlockedList(blockedList)

    // Scan & Update Title
    let scannedTitle = scanner.scan(documentTitleNode.text)
    if(scannedTitle.length > 0) blockTitle(scannedTitle)

    // Scan & Update Tree
    while(node = treeWalker.nextNode()){
        let scannedNode = scanner.scan(node.nodeValue)
        if(scannedNode.length > 0) {
            let i = 0
            scannedNode.forEach(matchObject => {
                i = blockText(node, matchObject, i)
            }) 
        }
    } 
})
