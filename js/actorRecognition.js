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
var imgSelector = $("#snapshotPictureFileSelector")[0];
var uploadButton = $("#openFileButton")[0];
var imgPreview = $("#uploadedImage")[0];
var pageheader = $("#page-header")[0];
var imageFile;
// User uploaded the snapshot
imgSelector.addEventListener("change", function () {
    imageFile = imgSelector.files[0];
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
    imgPreview.setAttribute('src', ev.target.result);
}
;
// Simple function to replace actors names with links to IMDB search
function createLinkToIMDB(actorName) {
    return '<a href="http://www.imdb.com/search/name?name=' + actorName + '" target="_blank">' + actorName + '</a>';
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
            // Fill the array with identifyed actors' data.
            recognizedActorsData = [];
            data.categories[0].detail.celebrities.forEach(function (element) {
                recognizedActorsData.push(new ActorData(element.name, element.faceRectangle.left, element.faceRectangle.top, element.faceRectangle.width, element.faceRectangle.height));
            });
            // Form a linguistic-friendly list of actors found (one, two or several).            
            pageheader.innerHTML = createLinkToIMDB(recognizedActorsData[0].name); //recognizedActorsData[0].name;
            if (recognizedActorsData.length > 1) {
                for (var i = 1; i < recognizedActorsData.length - 1; i++) {
                    pageheader.innerHTML += ", " + createLinkToIMDB(recognizedActorsData[i].name);
                }
                pageheader.innerHTML += " and " + createLinkToIMDB(recognizedActorsData[recognizedActorsData.length - 1].name);
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
