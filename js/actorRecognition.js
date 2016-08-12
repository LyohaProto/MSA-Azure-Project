// A class for storing all the useful data obtained from MS Cognitive Services API
var ActorData = (function () {
    function ActorData(actorName, frX, frY, frW, frH) {
        this.name = actorName;
        this.faceRectangleX = frX;
        this.faceRectangleY = frY;
        this.faceRectangleWidth = frW;
        this.faceRectangleHeight = frH;
    }
    return ActorData;
}());
// Array of all the actors who were recognized on the given photo
var recognizedActorsData = new Array();
// Bootstrap elements
var snapshotImageFileSelector = $("#snapshot-image-file-selector")[0];
var uploadImageButton = $("#upload-image-button")[0];
var uploadedImage = $("#uploaded-image")[0];
var uploadedImageContainer = $("#uploaded-image-container")[0];
var faceRectanglesLayer = $("#face-rectangles-layer")[0];
var uploadedImageLayer = $("#uploaded-image-layer")[0];
var pageheader = $("#page-header")[0];
//var linkToImdb : HTMLAnchorElement = <HTMLAnchorElement>$("#actor")[0];
var imageFile;
var imageScale = 1;
// User uploaded the snapshot
snapshotImageFileSelector.addEventListener("change", function () {
    imageFile = snapshotImageFileSelector.files[0];
    var reader = new FileReader();
    if (imageFile.name.match(/\.(jpg|jpeg|png)$/)) {
        if (imageFile) {
            reader.readAsDataURL(imageFile);
            reader.onloadend = imageIsSelected;
            pageheader.innerHTML = "Analyzing the image...";
            sentImageToProjectoxford(imageFile);
        }
        else {
            console.log("Invalid file");
        }
    }
    else {
        alert("Incorrect image.");
    }
});
// Display selected image
function imageIsSelected(ev) {
    // Assigning image element with uploaded image data
    uploadedImage.setAttribute('src', ev.target.result);
    // Updating the div that represents image layer
    uploadedImageLayer.style.top = "-" + uploadedImage.height.toString() + "px";
    // Clear old face rectangles (if any) and update the size of face rectangles layer div to match the uploaded image
    while (faceRectanglesLayer.firstChild) {
        faceRectanglesLayer.removeChild(faceRectanglesLayer.firstChild);
    }
    faceRectanglesLayer.style.height = uploadedImage.height.toString() + "px";
    //faceRectanglesLayer.style.width = uploadedImage.width.toString() + "px"; //TODO: Why it is Zero ?
    // Show the main container
    uploadedImageContainer.style.height = uploadedImage.height.toString() + "px";
    uploadedImageContainer.style.display = "block";
}
;
function addFaceRectangles() {
    // TODO: understand why I need to double inicialize height of faceRectanglesLayer (it becomes zero othervise)
    faceRectanglesLayer.style.height = uploadedImage.height.toString() + "px";
    faceRectanglesLayer.style.width = uploadedImage.width.toString() + "px";
    var id = 0;
    recognizedActorsData.forEach(function (element) {
        faceRectanglesLayer.innerHTML += '<div id="faceRectangle-' + id +
            '" style="position:absolute; left:' + (element.faceRectangleX / imageScale) +
            'px; top:' + (element.faceRectangleY / imageScale) +
            'px; width:' + (element.faceRectangleWidth / imageScale) +
            'px; height:' + (element.faceRectangleHeight / imageScale) +
            'px; border: 2px none red;  border-radius: 5px;">';
        // 'px; border: 2px solid red;  border-radius: 5px;" onmouseover="showFaceRectangle(' + id + ')">';           
        id++;
    });
}
// Simple function to replace actors names with links to IMDB search
function createLinkToIMDB(actorName, id) {
    return '<a class="actor" data-actor="' + id + '" href="http://www.imdb.com/search/name?name=' + actorName.replace(" ", "%20") + '" target="_blank" onmouseover="showFaceRectangle(' + id + ')" onmouseout="hideFaceRectangle(' + id + ')">' + actorName + '</a>';
}
function showFaceRectangle(id) {
    var faceRect = document.getElementById("faceRectangle-" + (id).toString());
    faceRect.style.borderStyle = "solid";
}
function hideFaceRectangle(id) {
    var faceRect = document.getElementById("faceRectangle-" + (id).toString());
    faceRect.style.borderStyle = "none";
}
// Here all the magic happens :)
function sentImageToProjectoxford(file) {
    $.ajax({
        url: "https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Faces&details=Celebrities",
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            // Don't steal my Subscription Key, please!
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "d78a6d8a8f6540e3868962b00c25f606");
        },
        type: "POST",
        data: file,
        processData: false
    })
        .done(function (data) {
        //TODO: Is it really needed here?
        //uploadButton.innerText = "Upload another snapshot";
        if (data.length != 0) {
            if (typeof data.categories[0].detail === 'undefined') {
                pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
                return;
            }
            else if (typeof data.categories[0].detail.celebrities === 'undefined' || data.categories[0].detail.celebrities.length === 0) {
                pageheader.innerHTML = "Unfortunately, we cannot identify any actors on this picture ¯\\_(ツ)_/¯<br>Try to upload another one.";
                return;
            }
            // Get the image scale
            // TODO: Get image height from client side
            imageScale = data.metadata.height / uploadedImage.height;
            // Fill the array with identifyed actors' data.
            recognizedActorsData = [];
            data.categories[0].detail.celebrities.forEach(function (element) {
                recognizedActorsData.push(new ActorData(element.name, element.faceRectangle.left, element.faceRectangle.top, element.faceRectangle.width, element.faceRectangle.height));
            });
            // Add face rectangles
            addFaceRectangles();
            // Form a linguistic-friendly list of actors found (one, two or several).            
            pageheader.innerHTML = createLinkToIMDB(recognizedActorsData[0].name, 0); //recognizedActorsData[0].name;
            if (recognizedActorsData.length > 1) {
                for (var i = 1; i < recognizedActorsData.length - 1; i++) {
                    pageheader.innerHTML += ", " + createLinkToIMDB(recognizedActorsData[i].name, i);
                }
                pageheader.innerHTML += " and " + createLinkToIMDB(recognizedActorsData[recognizedActorsData.length - 1].name, recognizedActorsData.length - 1);
            }
        }
        else {
            pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
        }
    })
        .fail(function (error) {
        pageheader.innerHTML = "Sorry, something went wrong. :( Try again in a bit?";
        console.log(error.getAllResponseHeaders());
    });
}
/* TODO: Add IMDB integration.
function GetDataFromIMDB(actorName): void {
    $.ajax({
        async: true,
        crossDomain: true,
        url: "https://moviesapi.com/m.php?t=" + actorName + "&y=&type=person&r=json",
        method: "POST",
        "headers": {
            "cache-control": "no-cache"
        }
    })
        .done(function (response) {
            console.log(response);
        })
        .fail(function (response) {
            pageheader.innerHTML = "IMDB error";
            console.log(response.getAllResponseHeaders());
        });
} */ 
