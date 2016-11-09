// Defaults settings
var settings = {
    baseUrl     : 'js/',                // Relative url to worker with trailing slash
    ppi         : 254,                  // Pixel Per Inch (25.4 ppi == 1 ppm)
    smoothing   : false,                // Smoothing the input image ?
    contrast    : 0,                    // Image contrast [-255 to +255]
    brightness  : 0,                    // Image brightness [-255 to +255]
    gamma       : 0,                    // Image gamma correction [0.01 to 7.99]
    grayscale   : 'luma',               // Graysale algorithm [average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
    shadesOfGray: 256,                  // Number of shades of gray [2-256]
    beamSize    : 0.1,                  // Beam size in millimeters
    beamRange   : { min: 0, max: 1 },   // Beam power range (Firmware value)
    beamPower   : { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange
    feedRate    : 1500,                 // Feed rate in mm/min (F value)
    feedUnit    : 'mm/min',             // Feed rate unit [mm/min, mm/sec]
    overscan    : 0,                    // Overscan in millimeters
    trimLine    : true,                 // Trim trailing white pixels
    joinPixel   : true,                 // Join consecutive pixels with same intensity
    burnWhite   : true,                 // [true = G1 S0 | false = G0] on inner white pixels
    verboseG    : false,                // Output verbose GCode (print each commands)
    diagonal    : false,                // Go diagonally (increase the distance between points)
    precision   : { X: 2, Y: 2, S: 4 }, // Number of decimals for each commands
    offsets     : { X: 0, Y: 0 },       // Global coordinates offsets
    accept      : ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
    onError   : onError,
    onFile    : onFile,
    onImage   : onImage,
    onCanvas  : onCanvas,
    onGCode   : onGCode,
    onDone    : onDone
};

// Get stored settings or set defaults
var storeVersion = 1;
var store        = localStorage.getItem('rasterizer');

if (store) {
    store = JSON.parse(store);

    if (! store.storeVersion || store.storeVersion < storeVersion) {
        localStorage.removeItem('rasterizer');
        store = null;
    }
    else {
        for (var prop in store) {
            settings[prop] = store[prop];
        }
    }
}

// -----------------------------------------------------------------------------

// Create rasterizer instance
var rasterizer = new lw.Rasterizer(settings);

// Store rasterizer settings
function storeSettings() {
    localStorage.setItem('rasterizer', JSON.stringify({
        ppi         : rasterizer.settings.ppi,
        smoothing   : rasterizer.settings.smoothing,
        contrast    : rasterizer.settings.contrast,
        brightness  : rasterizer.settings.brightness,
        gamma       : rasterizer.settings.gamma,
        grayscale   : rasterizer.settings.grayscale,
        shadesOfGray: rasterizer.settings.shadesOfGray,
        beamSize    : rasterizer.settings.beamSize,
        beamPower   : rasterizer.settings.beamPower,
        beamRange   : rasterizer.settings.beamRange,
        feedRate    : rasterizer.settings.feedRate,
        feedUnit    : rasterizer.settings.feedUnit,
        overscan    : rasterizer.settings.overscan,
        trimLine    : rasterizer.settings.trimLine,
        joinPixel   : rasterizer.settings.joinPixel,
        burnWhite   : rasterizer.settings.burnWhite,
        verboseG    : rasterizer.settings.verboseG,
        diagonal    : rasterizer.settings.diagonal,
        offsets     : rasterizer.settings.offsets,
        storeVersion: storeVersion
    }));
};

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
}

// -----------------------------------------------------------------------------

// UI elements
var ppiInput          = document.querySelector('#ppiInput');
var fileInput         = document.querySelector('#fileInput');
var beamSizeInput     = document.querySelector('#beamSizeInput');
var smoothingCheckbox = document.querySelector('#smoothingCheckbox');
var contrastInput     = document.querySelector('#contrastInput');
var contrastValue     = document.querySelector('#contrastValue');
var brightnessInput   = document.querySelector('#brightnessInput');
var brightnessValue   = document.querySelector('#brightnessValue');
var gammaInput        = document.querySelector('#gammaInput');
var gammaValue        = document.querySelector('#gammaValue');
var grayscaleSelect   = document.querySelector('#grayscaleSelect');
var shadesOfGrayInput = document.querySelector('#shadesOfGrayInput');
var beamPowerMinInput = document.querySelector('#beamPowerMinInput');
var beamPowerMaxInput = document.querySelector('#beamPowerMaxInput');
var beamRangeMinInput = document.querySelector('#beamRangeMinInput');
var beamRangeMaxInput = document.querySelector('#beamRangeMaxInput');
var feedRateInput     = document.querySelector('#feedRateInput');
var feedUnitInput     = document.querySelector('#feedUnitInput');
var overscanInput     = document.querySelector('#overscanInput');
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
var offsetsXInput     = document.querySelector('#offsetsXInput');
var offsetsYInput     = document.querySelector('#offsetsYInput');

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

var tooltip  = document.querySelector('#tooltip');
var tooltips = document.querySelectorAll('#sidebar li');

// Set defaults values
ppiInput.value                = rasterizer.settings.ppi;
beamSizeInput.value           = rasterizer.settings.beamSize;
smoothingCheckbox.checked     = rasterizer.settings.smoothing;
contrastInput.value           = rasterizer.settings.contrast;
contrastValue.innerHTML       = rasterizer.settings.contrast;
brightnessInput.value         = rasterizer.settings.brightness;
brightnessValue.innerHTML     = rasterizer.settings.brightness;
gammaInput.value              = rasterizer.settings.gamma;
gammaValue.innerHTML          = rasterizer.settings.gamma;
grayscaleSelect.value         = rasterizer.settings.grayscale;
shadesOfGrayInput.value       = rasterizer.settings.shadesOfGray;
trimLineCheckbox.checked      = rasterizer.settings.trimLine;
joinPixelCheckbox.checked     = rasterizer.settings.joinPixel;
burnWhiteCheckbox.checked     = rasterizer.settings.burnWhite;
verboseGCheckbox.checked      = rasterizer.settings.verboseG;
diagonalCheckbox.checked      = rasterizer.settings.diagonal;
beamPowerMinInput.value       = rasterizer.settings.beamPower.min;
beamPowerMaxInput.value       = rasterizer.settings.beamPower.max;
beamRangeMinInput.value       = rasterizer.settings.beamRange.min;
beamRangeMaxInput.value       = rasterizer.settings.beamRange.max;
offsetsXInput.value           = rasterizer.settings.offsets.X;
offsetsYInput.value           = rasterizer.settings.offsets.Y;
feedRateInput.value           = rasterizer.settings.feedRate;
feedUnitInput.value           = rasterizer.settings.feedUnit;
overscanInput.value           = rasterizer.settings.overscan;
fileInput.accept              = rasterizer.settings.accept.join(', ');
//fileInput.title               = fileInput.accept;
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
    rasterizer.settings.contrast      = Number(contrastInput.value);
    rasterizer.settings.brightness    = Number(brightnessInput.value);
    rasterizer.settings.gamma         = Number(gammaInput.value);
    rasterizer.settings.grayscale     = String(grayscaleSelect.value);
    rasterizer.settings.shadesOfGray  = Number(shadesOfGrayInput.value);
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
    rasterizer.settings.offsets.X     = Number(offsetsXInput.value);
    rasterizer.settings.offsets.Y     = Number(offsetsYInput.value);
    rasterizer.settings.feedRate      = Number(feedRateInput.value);
    rasterizer.settings.feedUnit      = String(feedUnitInput.value);
    rasterizer.settings.overscan      = Number(overscanInput.value);
    storeSettings();
}

function refreshSliders() {
    contrastValue.innerHTML   = contrastInput.value;
    brightnessValue.innerHTML = brightnessInput.value;
    gammaValue.innerHTML      = gammaInput.value;
}

function refreshFeedRate() {
    if (rasterizer.settings.feedUnit === 'mm/sec') {
        feedRateInput.value *= 60;
    }
    else {
        feedRateInput.value /= 60;
    }

    refreshSettings();
}

function refresh() {
    refreshSliders();
    refreshSettings();

    if (rasterizer.image) {
        rasterizer.loadImage(rasterizer.image);
    }
}

// UI actions
ppiInput.addEventListener(         'change', refresh, false);
beamSizeInput.addEventListener(    'change', refresh, false);
smoothingCheckbox.addEventListener('change', refresh, false);
contrastInput.addEventListener(    'change', refresh, false);
brightnessInput.addEventListener(  'change', refresh, false);
gammaInput.addEventListener(       'change', refresh, false);
grayscaleSelect.addEventListener(  'change', refresh, false);
shadesOfGrayInput.addEventListener('change', refresh, false);
trimLineCheckbox.addEventListener( 'change', refresh, false);
joinPixelCheckbox.addEventListener('change', refresh, false);
burnWhiteCheckbox.addEventListener('change', refresh, false);
verboseGCheckbox.addEventListener( 'change', refresh, false);
diagonalCheckbox.addEventListener( 'change', refresh, false);
contrastInput.addEventListener(    'input' , refreshSliders, false);
brightnessInput.addEventListener(  'input' , refreshSliders, false);
gammaInput.addEventListener(       'input' , refreshSliders, false);
beamPowerMinInput.addEventListener('change', refreshSettings, false);
beamPowerMaxInput.addEventListener('change', refreshSettings, false);
beamRangeMinInput.addEventListener('change', refreshSettings, false);
beamRangeMaxInput.addEventListener('change', refreshSettings, false);
offsetsXInput.addEventListener(    'change', refreshSettings, false);
offsetsYInput.addEventListener(    'change', refreshSettings, false);
feedRateInput.addEventListener(    'change', refreshSettings, false);
feedUnitInput.addEventListener(    'change', refreshFeedRate, false);
overscanInput.addEventListener(    'change', refreshSettings, false);

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

for (var i = 0; i < tooltips.length; i++) {
    tooltips[i].addEventListener('mouseover', function(e) {
        var tip = this.querySelector('.tooltip');

        if (tip) {
            var html = tip.innerHTML;

            if (! html.length) {
                html = lw.rasterizer.getTooltip(tip.getAttribute('name'), true);
                tip.innerHTML = html;
            }

            tooltip.style.top     = this.getBoundingClientRect().top + 'px';
            tooltip.innerHTML     = html;
            tooltip.style.display = 'block';
        }
    });

    tooltips[i].addEventListener('mouseout', function(e) {
        var tip = this.querySelector('.tooltip');

        if (tip) {
            tooltip.style.display = 'none';
        }
    });
}

// -----------------------------------------------------------------------------

function filesize(bytes, decimals, binary) {
    if (bytes === 0) return '0 Byte';
    var k = binary ? 1024 : 1000;
    var d = decimals === undefined ? 2 : decimals;
    var s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(d)) + ' ' + s[i];
}
