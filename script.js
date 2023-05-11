// Variables
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');
var linePoints = [];
var canvasState = [];
var redoCanvasState = [];

var toolMode = 'draw';
var toolColorMode = 'single';
var toolSize = 20;
var toolShape = 'circle';
var toolColor = '#6bcbe4';
var toolColor2 = '#e5dd93';     // secondary colour used for double colour setting
var undoButton = document.querySelector( '[data-action=undo]' );
var redoButton = document.querySelector( '[data-action=redo]');

// Event Listeners
canvas.addEventListener('mousedown', draw);         // mouse events
window.addEventListener('mouseup', stop);
canvas.addEventListener( 'touchstart', draw );      // touch events
window.addEventListener( 'touchend', stop );
window.addEventListener('resize', resizeCanvas);    // canvas size

document.querySelector('#colors').addEventListener('click', selectTool);
document.querySelector('#brush-size').addEventListener('click', selectTool);
document.querySelector('#brush-shape').addEventListener('click', selectTool);
document.querySelector('#double-colors').addEventListener('click', selectTool);
document.querySelector('#clear').addEventListener('click', selectTool);
document.querySelector('#undoredo').addEventListener('click', undoredo);

// Default Brush Settings
context.strokeStyle = '#6bcbe4';
context.lineWidth = 20;

// Background Image
var canvasnum = parent.document.URL.substring(parent.document.URL.length - 1, parent.document.URL.length);
var canvasbg = document.getElementById('canvas');

switch(canvasnum) {
    case '2':
        canvasbg.style.backgroundImage = "url('images/painting1.png')";
        break;
    case '3':
        canvasbg.style.backgroundImage = "url('images/painting2.png')";
        break;
    case '4':
        canvasbg.style.backgroundImage = "url('images/painting3.png')";
        break;
    default:
        canvasbg.style.backgroundColor = "white";
}

// Functions - Drawing and Canvas
resizeCanvas();

function draw(e) {
    // testing query strings
    // var testvar = parent.document.URL.substring(parent.document.URL.length - 1, parent.document.URL.length);
    // console.log(testvar);

    redoCanvasState = [];
    redoButton.classList.add('disabled');
    
    if ( e.which === 1 || e.type === 'touchstart' || e.type === 'touchmove' ) {
        window.addEventListener( 'mousemove', draw );
        window.addEventListener( 'touchmove', draw );
        var mouseX = e.pageX - canvas.offsetLeft;
        var mouseY = e.pageY - canvas.offsetTop;
        var mouseDrag = e.type === 'mousemove';
        
        if ( e.type === 'touchstart' || e.type === 'touchmove' ) { 
            mouseX = e.touches[0].pageX - canvas.offsetLeft;
            mouseY = e.touches[0].pageY - canvas.offsetTop;
            mouseDrag = e.type === 'touchmove'; 
        }
        
        if ( e.type === 'mousedown' || e.type === 'touchstart' ) saveState();
        
        linePoints.push( { x: mouseX, y: mouseY, drag: mouseDrag, width: toolSize, color:   toolColor, color2: toolColor2 } );
        updateCanvas();
    }
}

function stop(e) {
	if ( e.which === 1 || e.type === 'touchend' ) {
        window.removeEventListener( 'mousemove', draw );
        window.removeEventListener( 'touchmove', draw );
    }
}

function saveState() {
    canvasState.unshift( context.getImageData( 0, 0, canvas.width, canvas.height ) );
    linePoints = [];
    if ( canvasState.length > 25 ) canvasState.length = 25;
    undoButton.classList.remove('disabled');
}

function updateCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData( canvasState[ 0 ], 0, 0 );
	renderLine();
}

function renderLine() {
	for ( var i = 0, length = linePoints.length; i < length; i++ ) {
        // Making lines dotted. Spacing between dots changes depending on brush size.
        if(toolSize <= 20) {
                context.setLineDash([1, 50]);
            } else if (toolSize <= 30) {
                context.setLineDash([1, 70]);
            } else {
                context.setLineDash([1, 100]);
            }
        
        if(toolShape == 'circle') {
            if ( !linePoints[i].drag ) {
                context.lineJoin = 'round';
                context.lineCap = 'round';
                context.beginPath();
                context.lineWidth = linePoints[i].width;
                context.strokeStyle = linePoints[i].color;
                context.moveTo( linePoints[i].x, linePoints[i].y );
                context.lineTo( linePoints[i].x + 0.5, linePoints[i].y + 0.5 );
            } else {
                context.lineTo( linePoints[i].x, linePoints[i].y );
            }
            
        } else if (toolShape == 'square'){
            if ( !linePoints[i].drag ) {
                context.lineJoin = 'miter';
                context.lineCap = 'square';
                context.beginPath();
                context.lineWidth = linePoints[i].width;
                context.strokeStyle = linePoints[i].color;
                context.moveTo( linePoints[i].x, linePoints[i].y );
                context.lineTo( linePoints[i].x, linePoints[i].y );
            } else {
                context.lineTo( linePoints[i].x + 0.5, linePoints[i].y + 0.5);
            }

        } else if (toolShape == 'triangle') {
            context.setLineDash([]);            // Reverts back to solid lines
            context.lineWidth = 1;
            context.strokeStyle = linePoints[i].color;
            drawTriangle(linePoints[i].x, linePoints[i].y, toolSize, toolColor);  
        }
    }
	context.stroke();
    
    // Double color
    if(toolColorMode === 'double') {
        for ( var i = 0, length = linePoints.length; i < length; i++ ) {
            if (toolShape == 'triangle') {
                context.strokeStyle = linePoints[i].color2;
                drawTriangle(linePoints[i].x + toolSize * 1.1, linePoints[i].y + toolSize * 1.1, toolSize, toolColor2)
                
            } else {
                if ( !linePoints[i].drag ) {
                    context.beginPath();
                    context.strokeStyle = linePoints[i].color2;
                    context.moveTo( linePoints[i].x + toolSize * 1.1, linePoints[i].y + toolSize * 1.1);
                    context.lineTo( linePoints[i].x + toolSize * 1.1 + 0.5, linePoints[i].y + toolSize * 1.1 + 0.5);    // Spacing between the two dots changes with brush size
                } else {
                    context.lineTo( linePoints[i].x + toolSize * 1.1, linePoints[i].y + toolSize * 1.1);
                }
            }
            
        }
        context.stroke();
    }
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if (canvasState.length)updateCanvas();
}

function clearCanvas() {
    context.clearRect( 0, 0, canvas.width, canvas.height );
    canvasState.length = 0;
    undoButton.classList.add('disabled');
}

// Functions - Tools and Buttons
function selectTool(e) {
    if ( e.target === e.currentTarget ) return;
    if ( !e.target.dataset.action ) highlightButton( e.target );

    toolSize = e.target.dataset.size || toolSize;
    toolMode = e.target.dataset.mode || toolMode;
    toolShape = e.target.dataset.shape || toolShape;
    toolColor = e.target.dataset.color || toolColor;
    toolColor2 = e.target.dataset.color2 || toolColor2;
    toolColorMode = e.target.dataset.colormode || toolColorMode;
    
    if (e.target.dataset.action == 'clear') clearCanvas();
    if (e.target.dataset.action == 'undo') undoredo();

}

function highlightButton(button) {
    var buttons = button.parentNode.querySelectorAll( 'img' );
    buttons.forEach( function( element ){ element.classList.remove( 'active' ) } );
    button.classList.add( 'active' );
}

function undoredo(e) {
    
    if (e.target.dataset.action == 'undo') {        
        redoCanvasState.unshift(canvasState[0]);
        context.putImageData(canvasState.shift(), 0, 0);

        if (!canvasState.length) undoButton.classList.add('disabled');
        if (redoCanvasState.length) redoButton.classList.remove('disabled');
            
        // console.log('undo clicked');
        // console.log('canvasstate length: ' + canvasState.length);
        // console.log('redocanvasstate length: ' + redoCanvasState.length);
        
    } else if (e.target.dataset.action == 'redo') {
        
        if (redoCanvasState.length) {
            undoButton.classList.remove('disabled');
            canvasState.unshift(redoCanvasState.shift());
            updateCanvas();
        }
        
        if (!redoCanvasState.length) redoButton.classList.add('disabled');
        
        // console.log('redo clicked');
        // console.log('canvasstate length: ' + canvasState.length);
        // console.log('redocanvasstate length: ' + redoCanvasState.length);
    }
    
}

function drawTriangle(x, y, size, color) {
    var length = 20;
    
    switch (size) {
        case '20':
            length = 20;
            break;
        case '30':
            length = 40;
            break;
        case '50':
            length = 60;
            break;
    }

    context.save();
    context.translate(x, y);
    context.beginPath();
    for (var i = 2; i--;) {
        context.lineTo(0, length);
        context.translate(0, length);
        context.rotate(120*Math.PI/180);
    }
    
    context.lineTo(0, length);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.stroke();
    context.restore();
}
