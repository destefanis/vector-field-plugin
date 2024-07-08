figma.showUI(__html__, { width: 952, height: 600 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-svg') {
    createSvgNode(msg.svg, msg.width, msg.height, msg.backgroundColor);
  } else if (msg.type === 'request-vector-selection') {
    requestVectorSelection();
  }
};

function sendFrameInfo(frame) {
  let backgroundColor = null;
  if (frame.fills && frame.fills.length > 0 && frame.fills[0].type === 'SOLID') {
    const color = frame.fills[0].color;
    backgroundColor = `#${Math.round(color.r * 255).toString(16).padStart(2, '0')}${Math.round(color.g * 255).toString(16).padStart(2, '0')}${Math.round(color.b * 255).toString(16).padStart(2, '0')}`;
  }
  figma.ui.postMessage({
    type: 'frame-selected',
    width: frame.width,
    height: frame.height,
    backgroundColor: backgroundColor
  });
}

async function sendVectorInfo(vector) {
  try {
    const svgString = await vector.exportAsync({ format: 'SVG_STRING' });
    console.log("Exported SVG string:", svgString); // Log the exported SVG string
    figma.ui.postMessage({
      type: 'vector-selected',
      svg: svgString,
      width: vector.width,
      height: vector.height
    });
  } catch (error) {
    console.error('Error exporting vector:', error);
    figma.ui.postMessage({
      type: 'vector-selection-error',
      message: 'Failed to process the selected vector'
    });
  }
}

function requestVectorSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && (selection[0].type === 'VECTOR' || selection[0].type === 'SHAPE' || selection[0].type === 'BOOLEAN_OPERATION')) {
    sendVectorInfo(selection[0]);
  } else {
    figma.ui.postMessage({
      type: 'vector-selection-error',
      message: 'Please select a single vector, shape, or boolean operation'
    });
  }
}

// Send initial frame or vector info if one is selected
const selection = figma.currentPage.selection;
if (selection.length === 1) {
  if (selection[0].type === 'FRAME') {
    sendFrameInfo(selection[0]);
  } else if (selection[0].type === 'VECTOR') {
    sendVectorInfo(selection[0]);
  }
} else {
  figma.ui.postMessage({ type: 'no-frame-selected' });
}

figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    if (selection[0].type === 'FRAME') {
      sendFrameInfo(selection[0]);
    } else if (selection[0].type === 'VECTOR') {
      sendVectorInfo(selection[0]);
    }
  } else {
    figma.ui.postMessage({ type: 'no-frame-selected' });
  }
});

// Function to create SVG node in Figma
function createSvgNode(svgString, width, height, backgroundColor) {
  console.log('Creating SVG node with:', { width, height, backgroundColor });

  // Create a new node from the SVG string
  const node = figma.createNodeFromSvg(svgString);

  // Set the size of the node
  if (width && height) {
    node.resize(width, height);
  }

  // Set the background color if provided
  if (backgroundColor) {
    const [r, g, b] = backgroundColor.match(/\w\w/g).map(x => parseInt(x, 16) / 255);
    node.fills = [{ type: 'SOLID', color: { r, g, b } }];
  }

  // Get the selected nodes
  const selection = figma.currentPage.selection;

  if (selection.length > 0) {
    // Append the SVG node to the first selected node
    selection[0].appendChild(node);
  } else {
    // If no node is selected, find a non-overlapping position
    const { x, y } = findNonOverlappingPosition(node);
    node.x = x;
    node.y = y;
    figma.currentPage.appendChild(node);
    // Select the newly created node
    figma.currentPage.selection = [node];
  }

  // Zoom into the newly created node
  figma.viewport.scrollAndZoomIntoView([node]);

  console.log('SVG node created successfully');
}

// Function to find a non-overlapping position
function findNonOverlappingPosition(node) {
  const PADDING = 20;
  const nodes = figma.currentPage.children;

  // Initial position
  let x = PADDING;
  let y = PADDING;

  // Function to check if the proposed position overlaps with existing nodes
  const doesOverlap = (x, y, width, height) => {
    return nodes.some(existingNode => {
      const ex = existingNode.x;
      const ey = existingNode.y;
      const ew = existingNode.width;
      const eh = existingNode.height;

      return !(x + width < ex || x > ex + ew || y + height < ey || y > ey + eh);
    });
  };

  // Check for a non-overlapping position
  while (doesOverlap(x, y, node.width, node.height)) {
    x += PADDING + node.width;

    if (x + node.width > figma.viewport.bounds.width) {
      x = PADDING;
      y += PADDING + node.height;
    }
  }

  return { x, y };
}
