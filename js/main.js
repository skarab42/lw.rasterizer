// Defaults settings
var settings = {
    baseUrl  : 'js/',                // Relative url to worker
    ppi      : 254,                  // Pixel Per Inch (25.4 ppi == 1 ppm)
    smoothing: false,                // Smoothing the input image ?
    beamSize : 0.1,                  // Beam size in millimeters
    beamRange: { min: 0, max: 1 },   // Beam power range (Firmware value)
    beamPower: { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange
    feedRate : 1500,                 // Feed rate in mm/min (F value)
    trimLine : true,                 // Trim trailing white pixels
    joinPixel: false,                // Join consecutive pixels with same intensity
    burnWhite: true,                 // [true = G1 S0 | false = G0] on inner white pixels
    verboseG : true,                 // Output verbose GCode (print each commands)
    diagonal : false,                // Go diagonally (increase the distance between pixels)
    precision: { X: 2, Y: 2, S: 4 }, // Number of decimals for each commands
    accept   : ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
    onError  : onError,
    onFile   : onFile,
    onImage  : onImage,
    onCanvas : onCanvas,
    onGCode  : onGCode,
    onDone   : onDone
};

// Get stored settings or set defaults
var store = localStorage.getItem('rasterizer');

if (store) {
    store = JSON.parse(store);

    for (var prop in store) {
        settings[prop] = store[prop];
    }
}

// -----------------------------------------------------------------------------

// Create rasterizer instance
var rasterizer = new lw.Rasterizer(settings);

// Store rasterizer settings
function storeSettings() {
    localStorage.setItem('rasterizer', JSON.stringify({
        ppi      : rasterizer.settings.ppi,
        smoothing: rasterizer.settings.smoothing,
        beamSize : rasterizer.settings.beamSize,
        beamPower: rasterizer.settings.beamPower,
        beamRange: rasterizer.settings.beamRange,
        feedRate : rasterizer.settings.feedRate,
        trimLine : rasterizer.settings.trimLine,
        joinPixel: rasterizer.settings.joinPixel,
        burnWhite: rasterizer.settings.burnWhite,
        verboseG : rasterizer.settings.verboseG,
        diagonal : rasterizer.settings.diagonal
    }));
}

// Rasterizer callbacks
function onError(message) {
    alert(message);
    console.error('onError:', message);
    rasterizeButton.style.display = 'block';
}

function onFile(file) {
    //console.info('onFile:', file);
    var weight               = filesize(file.size, 2, true).split(' ');
    fileName.innerHTML       = file.name;
    fileWeight.innerHTML     = weight[0];
    fileWeightUnit.innerHTML = weight[1];
}

function onImage(image) {
    //console.info('onImage:', image);
    rasterizeButton.style.display = 'block';
    fileInfo.style.display        = 'block';
    noFile.style.display          = 'none';
    jobProgress.style.display     = 'none';
    downloadButton.style.display  = 'none';
    showButton.style.display      = 'none';
    imageWidth.innerHTML          = image.width;
    imageHeight.innerHTML         = image.height;
    imageRealWidth.innerHTML      = (this.imageSize.width * this.settings.beamSize).toFixed(2);
    imageRealHeight.innerHTML     = (this.imageSize.height * this.settings.beamSize).toFixed(2);
}

function onCanvas(canvas) {
    //console.info('onCanvas:', canvas);
    canvasWrapper.style.width = rasterizer.imageSize.width + 'px';

    while(canvasWrapper.firstChild){
        canvasWrapper.removeChild(canvasWrapper.firstChild);
    }

    var x, y, l;

    for (y = 0, yl = canvas.length; y < yl; y++) {
        l = canvas[y];

        for (x = 0, xl = l.length; x < xl; x++) {
            canvasWrapper.appendChild(l[x]);
        }
    }
}

var gCodeArray = [];

function onGCode(gcode) {
    //console.info('onGCode:', gcode);
    jobPercent.innerHTML = gcode.percent;
    gCodeArray.push(gcode.text);
}

var gCodeFile = null;

function onDone() {
    //console.info('onDone');
    jobPercent.innerHTML          = 100;
    jobTime.innerHTML             = (this.time / 1000).toFixed(2);
    rasterizeButton.style.display = 'block';
    downloadButton.style.display  = 'inline-block';
    showButton.style.display      = 'inline-block';
    jobDone.style.display         = 'inline-block';
    //jobProgress.style.display     = 'none';
    //gCodeText.innerHTML           = gcode;
    //gCodeWrapper.style.display    = 'block';
}

// -----------------------------------------------------------------------------

// UI elements
var ppiInput          = document.querySelector('#ppiInput');
var fileInput         = document.querySelector('#fileInput');
var beamSizeInput     = document.querySelector('#beamSizeInput');
var smoothingCheckbox = document.querySelector('#smoothingCheckbox');
var beamPowerMinInput = document.querySelector('#beamPowerMinInput');
var beamPowerMaxInput = document.querySelector('#beamPowerMaxInput');
var beamRangeMinInput = document.querySelector('#beamRangeMinInput');
var beamRangeMaxInput = document.querySelector('#beamRangeMaxInput');
var feedRateInput     = document.querySelector('#feedRateInput');
var rasterizeButton   = document.querySelector('#rasterizeButton');
var canvasWrapper     = document.querySelector('#canvasWrapper');
var downloadButton    = document.querySelector('#downloadButton');
var showButton        = document.querySelector('#showButton');
var closeButton       = document.querySelector('#closeButton');
var gCodeWrapper      = document.querySelector('#gCodeWrapper');
var gCodeText         = document.querySelector('#gCodeText');
var noFile            = document.querySelector('#noFile');
var trimLineCheckbox  = document.querySelector('#trimLineCheckbox');
var joinPixelCheckbox = document.querySelector('#joinPixelCheckbox');
var burnWhiteCheckbox = document.querySelector('#burnWhiteCheckbox');
var verboseGCheckbox  = document.querySelector('#verboseGCheckbox');
var diagonalCheckbox  = document.querySelector('#diagonalCheckbox');

var fileInfo        = document.querySelector('#fileInfo');
var fileName        = fileInfo.querySelector('.name');
var fileWeight      = fileInfo.querySelector('.weight');
var fileWeightUnit  = fileInfo.querySelector('.weightUnit');
var imageWidth      = fileInfo.querySelector('.width');
var imageHeight     = fileInfo.querySelector('.height');
var imageRealWidth  = fileInfo.querySelector('.realWidth');
var imageRealHeight = fileInfo.querySelector('.realHeight');
var jobProgress     = fileInfo.querySelector('.jobProgress');
var jobPercent      = jobProgress.querySelector('.jobPercent');
var jobDone         = fileInfo.querySelector('.jobDone');
var jobTime         = jobDone.querySelector('.jobTime');

// Set defaults values
ppiInput.value                = rasterizer.settings.ppi;
beamSizeInput.value           = rasterizer.settings.beamSize;
smoothingCheckbox.checked     = rasterizer.settings.smoothing;
trimLineCheckbox.checked      = rasterizer.settings.trimLine;
joinPixelCheckbox.checked     = rasterizer.settings.joinPixel;
burnWhiteCheckbox.checked     = rasterizer.settings.burnWhite;
verboseGCheckbox.checked      = rasterizer.settings.verboseG;
diagonalCheckbox.checked      = rasterizer.settings.diagonal;
beamPowerMinInput.value       = rasterizer.settings.beamPower.min;
beamPowerMaxInput.value       = rasterizer.settings.beamPower.max;
beamRangeMinInput.value       = rasterizer.settings.beamRange.min;
beamRangeMaxInput.value       = rasterizer.settings.beamRange.max;
feedRateInput.value           = rasterizer.settings.feedRate;
fileInput.accept              = rasterizer.settings.accept.join(', ');
fileInput.title               = fileInput.accept;
fileInfo.style.display        = 'none';
rasterizeButton.style.display = 'none';
downloadButton.style.display  = 'none';
showButton.style.display      = 'none';
gCodeWrapper.style.display    = 'none';
jobDone.style.display         = 'none';

// UI callbacks
function refreshSettings() {
    rasterizer.settings.ppi           = Number(ppiInput.value);
    rasterizer.settings.smoothing     = Boolean(smoothingCheckbox.checked);
    rasterizer.settings.trimLine      = Boolean(trimLineCheckbox.checked);
    rasterizer.settings.joinPixel     = Boolean(joinPixelCheckbox.checked);
    rasterizer.settings.burnWhite     = Boolean(burnWhiteCheckbox.checked);
    rasterizer.settings.verboseG      = Boolean(verboseGCheckbox.checked);
    rasterizer.settings.diagonal      = Boolean(diagonalCheckbox.checked);
    rasterizer.settings.beamSize      = Number(beamSizeInput.value);
    rasterizer.settings.beamPower.min = Number(beamPowerMinInput.value);
    rasterizer.settings.beamPower.max = Number(beamPowerMaxInput.value);
    rasterizer.settings.beamRange.min = Number(beamRangeMinInput.value);
    rasterizer.settings.beamRange.max = Number(beamRangeMaxInput.value);
    rasterizer.settings.feedRate      = Number(feedRateInput.value);
    storeSettings();
}

function refresh() {
    refreshSettings();

    if (rasterizer.image) {
        rasterizer.loadImage(rasterizer.image);
    }
}

// UI actions
ppiInput.addEventListener('change'         , refresh, false);
beamSizeInput.addEventListener('change'    , refresh, false);
smoothingCheckbox.addEventListener('change', refresh, false);
trimLineCheckbox.addEventListener('change' , refresh, false);
joinPixelCheckbox.addEventListener('change', refresh, false);
burnWhiteCheckbox.addEventListener('change', refresh, false);
verboseGCheckbox.addEventListener('change' , refresh, false);
diagonalCheckbox.addEventListener('change' , refresh, false);
beamPowerMinInput.addEventListener('change', refreshSettings, false);
beamPowerMaxInput.addEventListener('change', refreshSettings, false);
beamRangeMinInput.addEventListener('change', refreshSettings, false);
beamRangeMaxInput.addEventListener('change', refreshSettings, false);
feedRateInput.addEventListener('change'    , refreshSettings, false);

fileInput.addEventListener('change', function(e) {
    if (fileInput.files.length) {
        rasterizer.loadFile(fileInput.files[0]);
    }
    fileInput.value = null;
}, false);

rasterizeButton.addEventListener('click', function(e) {
    e.preventDefault();
    gCodeArray                    = [];
    gCodeFile                     = null;
    gCodeWrapper.style.display    = 'none';
    gCodeText.innerHTML           = '';
    rasterizeButton.style.display = 'none';
    downloadButton.style.display  = 'none';
    jobDone.style.display         = 'none';
    showButton.style.display      = 'none';
    jobProgress.style.display     = 'inline-block';
    jobPercent.innerHTML          = '0';
    rasterizer.rasterize();
}, false);



downloadButton.addEventListener('click', function(e) {
    var gcode = gCodeArray.join('\n');
    gCodeFile = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
    saveAs(gCodeFile, fileName.innerHTML + '.gcode');
});

showButton.addEventListener('click', function(e) {
    gCodeText.innerHTML        = gCodeArray.join('\n');
    gCodeWrapper.style.display = 'block';
});

closeButton.addEventListener('click', function(e) {
    gCodeWrapper.style.display = 'none';
});

// -----------------------------------------------------------------------------

function filesize(bytes, decimals, binary) {
    if (bytes === 0) return '0 Byte';
    var k = binary ? 1024 : 1000;
    var d = decimals === undefined ? 2 : decimals;
    var s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(d)) + ' ' + s[i];
}
