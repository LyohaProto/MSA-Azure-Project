// A class for storing all the useful data obtained from MS Cognitive Services API
class ActorData {
    name: string;
    faceRectangleX: number;
    faceRectangleY: number;
    faceRectangleWidth: number;
    faceRectangleHeight: number;
    constructor(actorName: string, frX: number, frY: number, frW: number, frH: number) {
        this.name = actorName;
        this.faceRectangleX = frX;
        this.faceRectangleY = frY;
        this.faceRectangleWidth = frW;
        this.faceRectangleHeight = frH;
    }
}
// Array of all the actors who were recognized on the given photo
var recognizedActorsData: Array<ActorData> = new Array<ActorData>();

// Bootstrap elements
var snapshotImageFileSelector: HTMLInputElement = <HTMLInputElement>$("#snapshot-image-file-selector")[0];
var uploadImageButton = $("#upload-image-button")[0];
var uploadedImage: HTMLImageElement = <HTMLImageElement>$("#uploaded-image")[0];
var uploadedImageContainer: HTMLDivElement = <HTMLDivElement>$("#uploaded-image-container")[0];
var faceRectanglesLayer: HTMLDivElement = <HTMLDivElement>$("#face-rectangles-layer")[0];
var uploadedImageLayer: HTMLDivElement = <HTMLDivElement>$("#uploaded-image-layer")[0];
var pageheader = $("#page-header")[0];

var imageFile;
var imageScale: number = 1;
var imageOriginalHeight: number;

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

            pageheader.innerHTML = "Analyzing the image..."
        } else {
            console.log("Invalid file");
        }
    } else {
        alert("Incorrect image.")
    }
});

// Display selected image
function imageIsSelected() {
    // Show "Working..." message
    $("#uploaded-image").loading({
        message: 'Working...'
    });

    // Show the main container
    uploadedImageContainer.style.display = "block";

    // Adjust sizes and positions of elements inside the main container, according to the size of the uploaded image
    UpdateUploadedImageContainerElements();

    // Send image to Microsoft Computer Vision server to recognize actors.
    sentImageToProjectoxford(imageFile);
};

// Adjust sizes and positions of elements inside the main container, according to the size of the uploaded image
function UpdateUploadedImageContainerElements() {
    // Adjust height of the main container
    uploadedImageContainer.style.height = `${uploadedImage.height}px`;

    // Updating the size of the div that represents image layer to stay behind the div that represents face rectangles layer
    uploadedImageLayer.style.top = `-${uploadedImage.height}px`;

    // Clear old face rectangles (if any) and adjust container's size
    while (faceRectanglesLayer.firstChild) {
        faceRectanglesLayer.removeChild(faceRectanglesLayer.firstChild);
    }
    faceRectanglesLayer.style.height = `${uploadedImage.height}px`;
    faceRectanglesLayer.style.width = `${uploadedImage.width}px`;
}

// Here all the magic happens :)
function sentImageToProjectoxford(file): void {
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

            if (data.length != 0) { // if server answered with some data
                if (typeof data.categories[0].detail === 'undefined') { // If nothing at all was recognized
                    pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
                    return;
                }
                else // If no actors was recognized
                    if (typeof data.categories[0].detail.celebrities === 'undefined' || data.categories[0].detail.celebrities.length === 0) {
                        pageheader.innerHTML = "Unfortunately, we cannot identify any actors on this picture ¯\\_(ツ)_/¯<br>Try to upload another one.";
                        return;
                    }

                // Get the image scale
                imageOriginalHeight = data.metadata.height;
                imageScale = imageOriginalHeight / uploadedImage.height;

                // Fill the array with identifyed actors' data.
                recognizedActorsData = [];
                data.categories[0].detail.celebrities.forEach(element => {
                    recognizedActorsData.push(new ActorData(element.name,
                        element.faceRectangle.left,
                        element.faceRectangle.top,
                        element.faceRectangle.width,
                        element.faceRectangle.height)
                    );
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

                // TODO: Add deeper IMDB integration.

            } else { // if server answered with no data
                pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
            }
        })
        .fail(function (error) {
            $("#uploaded-image").loading('stop');
            pageheader.innerHTML = "Connection error or the picture is too big.";
            console.log(error.getAllResponseHeaders());
        });
}

function addFaceRectangles() {
    var id: number = 0;
    recognizedActorsData.forEach(element => {
        faceRectanglesLayer.innerHTML += `<a href="http://www.imdb.com/search/name?name=${element.name.replace(" ", "%20")}" target="_blank">\
        <div class="div-face-rectangle" id="faceRectangle-${id}" \
        style="left: ${(element.faceRectangleX / imageScale).toFixed(0)}px; \
        top: ${(element.faceRectangleY / imageScale).toFixed(0)}px; \
        width: ${(element.faceRectangleWidth / imageScale).toFixed(0)}px; \
        height: ${(element.faceRectangleHeight / imageScale).toFixed(0)}px;" \
        onmouseover="highlightActorName(${id})" \
        onmouseout="dimActorName(${id})"></div></a>`;
        id++;
    });
}

// Simple function to replace actors names with links to IMDB search and add to each link a function to show face rectangle on mouseover.
function createLinkToIMDB(actorName: string, id: number): string {
    return `<a class="actor" id="actor-name-link-${id}" \
    href="http://www.imdb.com/search/name?name=${actorName.replace(" ", "%20")}" target="_blank" \
    onmouseover="showFaceRectangle(${id})" \
    onmouseout="hideFaceRectangle(${id})">\
    ${actorName}</a>`;
}

// The following 4 functions are initial solution to bound actors names to thrir faces.
// TODO: There must be a better solution.
function showFaceRectangle(id) {
    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "solid";
}

function hideFaceRectangle(id) {
    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "none";
}

function highlightActorName(id) {
    var actorNameLink: HTMLAnchorElement = <HTMLAnchorElement>document.getElementById(`actor-name-link-${id}`);
    actorNameLink.style.color = "darkgrey";
    actorNameLink.style.textDecoration = "underline";

    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "solid";
}

function dimActorName(id) {
    var actorNameLink: HTMLAnchorElement = <HTMLAnchorElement>document.getElementById(`actor-name-link-${id}`);
    // This trick resets CSS value back to default
    actorNameLink.style.color = "";
    actorNameLink.style.textDecoration = "";

    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "none";
}

// Resize the uploaded image and face rectangles in case of the user has changed the browser's size
window.addEventListener("resize", this.onResize);
function onResize(event: Event) {
    if (uploadedImageContainer.style.display == "block") {
        // Update the image container and layers with face rectangles.
        UpdateUploadedImageContainerElements();

        // Update image scale
        imageScale = imageOriginalHeight / uploadedImage.height;

        // Draw new, resized face rectangles.
        addFaceRectangles()
    }
}