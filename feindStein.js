const reqURI = "https://eastus2.api.cognitive.microsoft.com/vision/v1.0/analyze?details=Celebrities"
var pattern = null

function feindStein(url, scanner){
  return new Promise((resolve, reject)=>{
    let reqHeaders = new Headers({
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
    })
    let reqConfig = { method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({"url":url})
    }
    let req = new Request(reqURI, reqConfig)
    fetch(req).then( (x) => {
      return x.json()
    }).then( (x) => {
      var people = x.categories.filter(result => result.name.indexOf('people_') == 0 )
      var steins = null
      if(people.length > 0 && people[0].detail && people[0].detail.celebrities) {
        steins = people[0].detail.celebrities.filter( el => scanner.match(el.name) )
      }
      
      resolve( {"faces": steins} )
    }).catch( (err)=> {
      console.error(err)
      reject(err)
    })
  })
}

function replaceFaces(img, faces){
    let c = document.createElement('canvas')
    c.height = img.height
    c.width = img.width
    img.parentElement.insertBefore(c, img)
    ctx = c.getContext("2d")
    ctx.drawImage(img,0,0)
    faces.forEach((face) =>{
        //ellipse(ctx, face.faceRectangle)
        blurFace(ctx, img, face.faceRectangle)
    })
    img.parentElement.removeChild(img)
}

function blurFace(context, sourceImage, rect) {
  /*
  var dynamicCanvas = document.createElement('canvas')
  dynamicCanvas.height = rect.height
  dynamicCanvas.width = rect.width

  var dynamicContext = dynamicCanvas.getContext('2d')
  //dynamicContext.drawImage(sourceImage, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height)
  dynamicContext.beginPath();
  dynamicContext.lineWidth="6";
  dynamicContext.strokeStyle="red";
  dynamicContext.rect(rect.left, rect.top, rect. width, rect.height)
  dynamicContext.stroke();
  */

  //dynamicContext.rect(rect.left, rect.top, rect. width, rect.height)
  

  //dynamicContext.filter = 'blur(14px)'

  //context.drawImage(dynamicCanvas, rect.left, rect.top)
  //context.drawImage(dynamicContext.canvas, 0, 0)




  var c2 = document.createElement('canvas')
  let heightAdjust = 1.8
  let widthAdjust = 1.4
  c2.height = rect.height * heightAdjust
  c2.width = rect.width * widthAdjust
  var ctx2 = c2.getContext('2d')
  ctx2.filter =`blur(${rect.width/10}px)`
  //ctx2.invert = 100%
  ctx2.drawImage(sourceImage, 
                rect.left - ((widthAdjust - 1)/2)*c2.width, 
                rect.top - ((heightAdjust - 1)/2)*c2.height, 
                c2.width, 
                c2.height, 
                0, 
                0, 
                c2.width, 
                c2.height)

  //i.parentElement.insertBefore(c2, i)

  context.drawImage(c2, 
                  rect.left - ((widthAdjust - 1)/2)*c2.width, 
                  rect.top - ((heightAdjust - 1)/2)*c2.height)



}

function ellipse(context, rect){
  cx = rect.left + 0.5 * rect.width
  cy = rect.top + 0.5 * rect.height
  rx = rect.width * 0.6
  ry = rect.height

  // var pattern = context.createPattern(patternImage, 'repeat')
  var grd = context.createRadialGradient(cx,cy,0,cx,cy,ry);
  grd.addColorStop(0,'rgba(10, 10, 10, 1)');
  grd.addColorStop(0.5,'rgba(100, 100, 100, 1)');
  grd.addColorStop(0.9,'rgba(255, 255, 255, 0)');

  context.save()
  context.beginPath()

  context.translate(cx-rx, cy-ry)
  context.scale(rx, ry)
  context.arc(1, 1, 1, 0, 2 * Math.PI, false)

  context.restore()
  //context.fillStyle = pattern
  context.fillStyle = grd
  context.fill()
}

