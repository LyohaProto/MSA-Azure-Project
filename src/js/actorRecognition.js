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
var imageFile;
var imageScale = 1;
// User uploaded the snapshot
snapshotImageFileSelector.addEventListener("change", function () {
    imageFile = snapshotImageFileSelector.files[0];
    var reader = new FileReader();
    if (imageFile.name.match(/\.(jpg|jpeg|png)$/)) {
        if (imageFile) {
            reader.readAsDataURL(imageFile);
            // When user has selected the image and the browser has finished to read it.
            reader.onloadend = function () {
                uploadedImage.src = reader.result;
                uploadedImage.onload = function () {
                    imageIsSelected();
                };
            };
            pageheader.innerHTML = "Analyzing the image...";
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
function imageIsSelected() {
    // Show "Working..." message
    $("#uploaded-image").loading({
        message: 'Working...'
    });
    // Updating the size of the div that represents image layer to stay behind the div that represents face rectangles layer
    uploadedImageLayer.style.top = "-" + uploadedImage.height + "px";
    // Show the main container
    uploadedImageContainer.style.height = uploadedImage.height + "px";
    uploadedImageContainer.style.display = "block";
    // Clear old face rectangles (if any)
    while (faceRectanglesLayer.firstChild) {
        faceRectanglesLayer.removeChild(faceRectanglesLayer.firstChild);
    }
    // Update the size of face rectangles layer div to match the uploaded image
    faceRectanglesLayer.style.height = uploadedImage.height + "px";
    faceRectanglesLayer.style.width = uploadedImage.width + "px";
    // Send image to Microsoft Computer Vision server to recognize actors.
    sentImageToProjectoxford(imageFile);
}
;
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
        // The image processing is finished, hide the "Working.." message.
        $("#uploaded-image").loading('stop');
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
            pageheader.innerHTML = createLinkToIMDB(recognizedActorsData[0].name, 0);
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
        pageheader.innerHTML = "Connection error. Try to refresh the page.";
        console.log(error.getAllResponseHeaders());
    });
}
function addFaceRectangles() {
    var id = 0;
    recognizedActorsData.forEach(function (element) {
        faceRectanglesLayer.innerHTML += "<a href=\"http://www.imdb.com/search/name?name=" + element.name.replace(" ", "%20") + "\" target=\"_blank\">        <div class=\"div-face-rectangle\" id=\"faceRectangle-" + id + "\"         style=\"left: " + (element.faceRectangleX / imageScale).toFixed(0) + "px;         top: " + (element.faceRectangleY / imageScale).toFixed(0) + "px;         width: " + (element.faceRectangleWidth / imageScale).toFixed(0) + "px;         height: " + (element.faceRectangleHeight / imageScale).toFixed(0) + "px;\"         onmouseover=\"highlightActorName(" + id + ")\"         onmouseout=\"dimActorName(" + id + ")\"></div></a>";
        id++;
    });
}
// Simple function to replace actors names with links to IMDB search and add to each link a function to show face rectangle on mouseover.
function createLinkToIMDB(actorName, id) {
    return "<a class=\"actor\" id=\"actor-name-link-" + id + "\"     href=\"http://www.imdb.com/search/name?name=" + actorName.replace(" ", "%20") + "\" target=\"_blank\"     onmouseover=\"showFaceRectangle(" + id + ")\"     onmouseout=\"hideFaceRectangle(" + id + ")\">    " + actorName + "</a>";
}
// The following 4 functions are initial solution to bound actors names to thrir faces.
// TODO: There must be a better solution.
function showFaceRectangle(id) {
    var faceRect = document.getElementById("faceRectangle-" + id);
    faceRect.style.borderStyle = "solid";
}
function hideFaceRectangle(id) {
    var faceRect = document.getElementById("faceRectangle-" + id);
    faceRect.style.borderStyle = "none";
}
function highlightActorName(id) {
    var actorNameLink = document.getElementById("actor-name-link-" + id);
    actorNameLink.style.color = "darkgrey";
    actorNameLink.style.textDecoration = "underline";
    var faceRect = document.getElementById("faceRectangle-" + id);
    faceRect.style.borderStyle = "solid";
}
function dimActorName(id) {
    var actorNameLink = document.getElementById("actor-name-link-" + id);
    // This trick resets CSS value back to default
    actorNameLink.style.color = "";
    actorNameLink.style.textDecoration = "";
    var faceRect = document.getElementById("faceRectangle-" + id);
    faceRect.style.borderStyle = "none";
}
