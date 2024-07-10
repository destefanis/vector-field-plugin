figma.showUI(__html__, { width: 860, height: 600 });

let lastSelectedFrame = null;

figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-svg') {
    createSvgNode(msg.svg, msg.width, msg.height, msg.backgroundColor, msg.isCustomShape);
  } else if (msg.type === 'request-vector-selection') {
    requestVectorSelection();
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
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
    console.log("Exported SVG string:", svgString);
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

function updateSelectedFrame() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'FRAME') {
    lastSelectedFrame = selection[0];
    sendFrameInfo(lastSelectedFrame);
  } else {
    lastSelectedFrame = null;
    figma.ui.postMessage({ type: 'no-frame-selected' });
  }
}

// Initial selection check
updateSelectedFrame();

figma.on('selectionchange', () => {
  updateSelectedFrame();
  
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'VECTOR') {
    sendVectorInfo(selection[0]);
  }
});

function createSvgNode(svgString, width, height, backgroundColor, isCustomShape) {
  console.log('Creating SVG node with:', { width, height, backgroundColor });

  const node = figma.createNodeFromSvg(svgString);
  node.name = "Vector Field Generator";

  if (width && height) {
    node.resize(width, height);
  }

  if (backgroundColor) {
    const [r, g, b] = backgroundColor.match(/\w\w/g).map(x => parseInt(x, 16) / 255);
    node.fills = [{ type: 'SOLID', color: { r, g, b } }];
  }

  // Check if a frame is currently selected
  const currentSelection = figma.currentPage.selection;
  const selectedFrame = currentSelection.length === 1 && currentSelection[0].type === 'FRAME' ? currentSelection[0] : null;

  if (selectedFrame) {
    selectedFrame.appendChild(node);
  } else if (lastSelectedFrame) {
    lastSelectedFrame.appendChild(node);
  } else {
    const { x, y } = findNonOverlappingPosition(node);
    node.x = x;
    node.y = y;
    figma.currentPage.appendChild(node);
  }

  figma.currentPage.selection = [node];

  // Recursive function to process all children
  function processNode(node) {
    if (node.type === 'FRAME') {
      node.fills = [];
      node.clipsContent = false;
    }

    if ('children' in node) {
      node.children.forEach(child => processNode(child));
    }
  }

  // Process all children of the main SVG node
  if (isCustomShape) {
    processNode(node);
  }

  figma.viewport.scrollAndZoomIntoView([node]);
}

function findNonOverlappingPosition(node) {
  const PADDING = 20;
  const nodes = figma.currentPage.children;

  let x = PADDING;
  let y = PADDING;

  const doesOverlap = (x, y, width, height) => {
    return nodes.some(existingNode => {
      const ex = existingNode.x;
      const ey = existingNode.y;
      const ew = existingNode.width;
      const eh = existingNode.height;

      return !(x + width < ex || x > ex + ew || y + height < ey || y > ey + eh);
    });
  };

  while (doesOverlap(x, y, node.width, node.height)) {
    x += PADDING + node.width;

    if (x + node.width > figma.viewport.bounds.width) {
      x = PADDING;
      y += PADDING + node.height;
    }
  }

  return { x, y };
}