var elements = Array.from(document.getElementsByTagName('*'))

//var blockedList = ["Harvey Weinstein", "Mr. Weinstein", "Weinstein"]

chrome.storage.sync.get({list: []}, function(result) {
    var blockedList = result.list ? result.list : [];
    elements.forEach((node) => {
        Array.from(node.childNodes).forEach(checkText(blockedList))
    })
});

function checkText(blockedList) {
    return function(blockedList, childNode) {
        if(childNode.nodeType == 3 && childNode.nodeValue) {
            scan(childNode, blockedList)
        }
    }.bind(this, blockedList)
}

function match(text, blockedList) {
    var regEx = new RegExp(blockedList.join("|"), 'i')
    return text.match(regEx);
}

function createSpan(node, obj) {
    var newNode = document.createElement('span')
    newNode.style.color = 'transparent'
    newNode.style.textShadow = "0 0 0.6em black"
    newNode.textContent = obj[0]
    return newNode
}

function createNodeWithText(node, text) {
    var newNode = node.cloneNode()
    newNode.textContent = text
    return newNode
}

function updateDOM(originalNode, newNodeArray) {
    newNodeArray.forEach(newNode => {
        originalNode.parentElement.insertBefore(newNode, originalNode)
    })
    originalNode.parentElement.removeChild(originalNode)
}

function update(node, matchObject) {
    var firstHalfNode = createNodeWithText(node, matchObject.input.substr(0, matchObject.index))
    var newNode = createSpan(node, matchObject)
    var secondHalfNode = createNodeWithText(node, matchObject.input.substr(matchObject.index + matchObject[0].length, matchObject.input.length - 1))

    updateDOM(node, [firstHalfNode, newNode, secondHalfNode])
}

function scan(node, blockedList) {
    let text = node.nodeValue;
    let scannedText = match(text, blockedList);
    scannedText ? update(node, scannedText) : null
}

