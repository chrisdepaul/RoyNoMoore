const GENERIC_IDENTIFIER = "Someone"
const BLOCKLIST_TYPE = "SYNC"
const MIN_IMG_WIDTH = 75

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
    regexText = null
    regexImg = null

    function imgify(blockedList) {
        let chars = ["", "_", "%20", "-", "--", "__"]
        var blockedListImgify = []

        blockedList.forEach((word) => {
            if(/ /g.test(word)) {
                chars.forEach((char) => {
                    blockedListImgify.push(word.replace(/ /g, char))
                })
            } else {
                blockedListImgify.push(word)
            }
        })

        return blockedListImgify
    }

    function scan(regex, text) {
        var matches = [];
        var match = regex.exec(text);

        while (match != null) {
            matches.push(match);
            match = regex.exec(text);
        }
        return matches
    }

    return {
        setBlockedList: function(blockedList) {
            regexText = new RegExp(blockedList.join("|"), 'gi')
            regexImg = new RegExp(imgify(blockedList).join("|"), 'gi')
        },
        scanText: function(text) {
            return scan(regexText, text)
        },
        scanImageText: function(text) {
            return scan(regexImg, text)
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
 *  getSuspectImages 
 *  @param scanner
 */
 function getSuspectImages(scanner) {
    let highProbability = []
    let lowProbability = []

    // Filter Size
    Array.from(document.images).forEach((img) => {
        var altValue = img.attributes.alt ? img.attributes.alt.nodeValue : ""
        var srcValue = img.attributes.src ? img.attributes.src.nodeValue : ""
        var altScan = scanner.scanImageText(altValue)
        var srcScan = scanner.scanImageText(srcValue)

        if(altScan.length > 0 || srcScan.length > 0) {
            highProbability.push(img)
        } else {
            if(img.clientWidth >= MIN_IMG_WIDTH) {
                lowProbability.push(img)
            }
        }
    })

    return { highProbability, lowProbability }  
 }

 /*  
 *  blockImage - Block the image
 *  @param - node
 */
 function blockImage(node) {
    node.style.filter = "blur(13px)"
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
 *  Launch Blocker
 */
function launchBlocker(treeWalker, documentTitleNode, scanner) {
    // Scan & Update Title
    if(documentTitleNode) {
        let scannedTitle = scanner.scanText(documentTitleNode.text)
        if(scannedTitle.length > 0) blockTitle(scannedTitle)
    } else {
        console.log("Could not parse document.title...")
    }

    // Scan & Update Tree
    if(treeWalker) {
        while(node = treeWalker.nextNode()){
            let scannedNode = scanner.scanText(node.nodeValue)
            if(scannedNode.length > 0) {
                let i = 0
                scannedNode.forEach(matchObject => {
                    i = blockText(node, matchObject, i)
                }) 
            }
        } 
    } else {
        console.log("Could not parse DOM...")
    }

    // Scan Images
    var suspectImages = getSuspectImages(scanner)
    console.log(suspectImages)
    suspectImages.highProbability.forEach(node => {
        blockImage(node)
    })
}

/*
 *  Listen for Messages from background.js
 *  Notification when onDOMContentLoaded
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.message == "onDOMContentLoaded") {
        var treeWalker = createTreeWalker(document.body, NodeFilter.SHOW_TEXT, treeWalkerFilter)
        var documentTitleNode = loadDocumentTitleNode()
        // Load Block List
        loadBlockList(BLOCKLIST_TYPE).then((blockedList) => { 
            scanner.setBlockedList(blockedList)
            launchBlocker(treeWalker, documentTitleNode, scanner)
        })
    }
})