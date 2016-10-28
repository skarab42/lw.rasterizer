// Canvas data grid
var settings, canvas;

// Last commands values
var lastCommands = { G: null, X: null, Y: null, S: null };

// -----------------------------------------------------------------------------

// Get a pixel power value from the canvas data grid
function mapPixelPower(value) {
    return value * (settings.beamPower.max - settings.beamPower.min)
                 + settings.beamPower.min;
}

// Get a pixel power value from the canvas data grid
function getPixelPower(x, y, noMap) {
    if (x < 0 || x >= settings.imageSize.width) {
        throw new Error('Out of range: x = ' + x);
    }

    if (y < 0 || y >= settings.imageSize.height) {
        throw new Error('Out of range: y = ' + y);
    }

    // Target canvas data
    var gx   = parseInt(x / settings.bufferSize);
    var gy   = parseInt(y / settings.bufferSize);
    var data = canvas[gy][gx];

    // Adjuste x/y values
    gx && (x -= settings.bufferSize * gx);
    gy && (y -= settings.bufferSize * gy);

    // Pixel index
    var i = (y * (settings.imageSize.width * 4)) + (x * 4);

    // Gray value
    // http://www.tannerhelland.com/3643/grayscale-image-algorithm-vb6/
    //s = (data[i] * 0.2989) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
    //var gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    //
    // // Reverse value [0 = black - 255 = white] => [0 = white - 255 = black]
    // gray = 255 - gray;
    //
    // // Scale value [0 - 255] => [0 - 1]
    // gray = gray / 255;
    //
    // return gray;

    var S = (255 - (data[i] + data[i + 1] + data[i + 2]) / 3) / 255;

    return noMap ? S : mapPixelPower(S);
}

// -----------------------------------------------------------------------------

// Find colored pixels range
function getPixelsRange(y, width) {
    var start = null;
    var end   = null;

    for (var x = 0; x <= width; x++) {
        if (start === null && getPixelPower(x, y, true)) {
            start = x;
        }

        if (end === null && getPixelPower((width - x), y, true)) {
            end = (width - x);
        }

        if (start !== null && end !== null) {
            break;
        }
    }

    return { start: start, end: end, length: end - start };
}

// -----------------------------------------------------------------------------

// Compute and return a X/Y/S value
function GVal(name, values) {
    if (values[name] !== undefined) {
        var X = values[name].toFixed(2);
        if (X !== lastCommands[name]) {
            lastCommands[name] = X;
            return name + X;
        }
    }
}

// Compute and return a GCode line
function G(g, values) {
    // Commands
    var commands = [];
    var value    = null;

    // G command
    if (settings.verboseG || g !== lastCommands.G) {
        commands.push('G' + g);
        lastCommands.G = g;
    }

    // X/Y/S commands
    for (var name in values) {
        value = GVal(name, values);
        value && commands.push(value);
    }

    // Return the commands line as string
    return commands.join(' ');
}

// -----------------------------------------------------------------------------

// Process canvas grid
function rasterize() {
    // Vars...
    var x, rx, X, y, Y, s, S, S2, text, range, lastG;

    var beam    = settings.beamSize;
    var offset  = beam * 1000 / 2000;
    var width   = settings.imageSize.width - 1;
    var height  = settings.imageSize.height - 1;
    var reverse = true;

    function moveTo(x) {
        // Set first pixel position
        X  = (x * beam) + offset;

        // Get pixel power
        S = getPixelPower(x, y);

        // Skip if next pixel has the same intensity
        if (settings.joinPixel) {
            try {
                // Get pixel power
                S2 = getPixelPower(reverse ? x - 1 : x + 1, y);

                // Same intensity
                if (S === S2) {
                    // Go to next pixel
                    x = reverse ? x - 1 : x + 1;
                    return;
                }
            }
            catch (e) { /* End of line */ }
        }

        if (! settings.burnWhite && S === 0) {
            // Move to pixel
            text.push(G(0, { X: X }));
        }
        else {
            // Burn pixel
            text.push(G(1, { X: X, S: S }));
        }
    }

    function horizontalScan() {
        // For each image line
        for (y = height; y >= 0; y--) {
            // Reset gcode text
            text = [];

            // Reverse line
            reverse = !reverse;

            // Get non white pixels range
            if (settings.trimLine) {
                range = getPixelsRange(y, width);

                // Skip empty line
                if (! range.length) {
                    continue;
                }
            }
            else {
                range = { start: 0, end: width, length: width };
            }

            // Debug...
            //console.log(range);

            // First pixel position
            rx = range.start;

            // Set first pixel position
            X  = reverse ? (rx + range.length) : rx;
            X  = (X * beam) + offset;
            Y  = ((height - y) * beam) + offset;

            // Go to start of the line
            text.push(G(0, { X: X, Y: Y }));

            // For each pixel on the range
            if (reverse) {
                for (x = range.end; x >= range.start; x--) {
                    moveTo(x);
                }
            }
            else {
                for (x = range.start; x <= range.end; x++) {
                    moveTo(x);
                }
            }

            // Post the gcode pixel line
            postMessage({ type: 'gcode', data: { line: y, text: text.join('\n') } });
        }
    }
    function diagonalScan() {
        var $grid = [];
        var $h     = 4;
        var $w     = 5;
        var $count = 1;

        for ($i = 0; $i <= $w + $h; $i++) {
            var $index = Math.min($i, $w);
            var $row   = Math.max(1, ($i - ($w + 1) + 2));

            while ($index != 0 && $row <= $h) {
                if (! $grid[$row]) {
                    $grid[$row] = [];
                }
                $grid[$row][$index] = $count;
                console.log($row, $index, $count);
                $count++;
                $index--;
                $row++;
            }
        }

        console.log($grid);
    }

    if (settings.diagonal) {
        diagonalScan();
    }
    else {
        horizontalScan();
    }

    postMessage({ type: 'done' });
}

// -----------------------------------------------------------------------------

// On message received
self.onmessage = function(event) {
    var message = event.data;

    if (typeof message === 'string') {
        message = JSON.parse(event.data);
    }

    // On canvas data
    if (message.type === 'cell') {
        //console.log(message.data);

        if (! canvas[message.y]) {
            canvas[message.y] = [];
        }

        canvas[message.y][message.x] = message.data;
    }

    // On all canvas sent
    else if (message.type === 'done') {
        var width  = (settings.imageSize.width * settings.beamSize).toFixed(2);
        var height = (settings.imageSize.height * settings.beamSize).toFixed(2);
        var min    = (settings.beamPower.min * 100).toFixed(0);
        var max    = (settings.beamPower.max * 100).toFixed(0);
        var text   = [
            '; Generated by Rasterizer.js (alpha)',
            '; Size       : ' + width + ' x ' + height + ' mm',
            '; Resolution : ' + settings.ppm + ' PPM - ' + settings.ppi + ' PPI',
            '; Beam size  : ' + settings.beamSize + ' mm',
            '; Beam power : ' + min + '% to ' + max + '%',
            '; Feed rate  : ' + settings.feedRate + ' mm/min',
            '',
            'G0 F' + settings.feedRate,
            'G1 F' + settings.feedRate,
            ''
        ];
        postMessage({ type: 'gcode', data: { text: text.join('\n') } });
        rasterize();
    }

    // Init rasteriser
    else if (message.type === 'init') {
        settings = message.data;
        canvas   = [];
    }
};
