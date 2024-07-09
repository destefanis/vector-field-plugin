import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '../styles/ui.css';
import { NumberInput, Select, Slider, Checkbox, Button, ColorInput } from '@mantine/core';

const App = () => {
  const [rows, setRows] = useState(20);
  const [columns, setColumns] = useState(20);
  const [fieldType, setFieldType] = useState('magnetic');
  const [direction, setDirection] = useState(0);
  const [intensity, setIntensity] = useState(1);
  const [shape, setShape] = useState('line');
  const [spiral, setSpiral] = useState(true);
  const [spiralIntensity, setSpiralIntensity] = useState(0.1);
  const [gradientType, setGradientType] = useState('none');
  const [shapeSize, setShapeSize] = useState(1);
  const [vectorScale, setVectorScale] = useState(1);
  const [lineThickness, setLineThickness] = useState(1);
  const [spacing, setSpacing] = useState(1);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [field, setField] = useState([]);
  const [fillParent, setFillParent] = useState(true);

  const [frameWidth, setFrameWidth] = useState(600);
  const [frameHeight, setFrameHeight] = useState(600);
  const [actualFrameWidth, setActualFrameWidth] = useState(600);
  const [actualFrameHeight, setActualFrameHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState('#1e1e1e');
  const [shapeColor, setShapeColor] = useState('#ffffff');
  const [customShape, setCustomShape] = useState(null);
  const [customShapeViewBox, setCustomShapeViewBox] = useState(null);
  const [customShapeSize, setCustomShapeSize] = useState(1);
  const [isWaitingForVectorSelection, setIsWaitingForVectorSelection] = useState(false);

  const svgRef = useRef(null);

  const generateField = useCallback((rows, columns, type, direction, intensity, spiral, spiralIntensity, spacing, xOffsetPercent, yOffsetPercent) => {
    const newField = [];
    const cellWidth = frameWidth / (columns - 1);
    const cellHeight = frameHeight / (rows - 1);
    const centerX = frameWidth / 2;
    const centerY = frameHeight / 2;
    const seed = Math.random();

    const xOffset = (xOffsetPercent / 100) * frameWidth;
    const yOffset = (yOffsetPercent / 100) * frameHeight;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        let vectorAngle = 0, length = 5;
        const posX = x * cellWidth * spacing;
        const posY = y * cellHeight * spacing;
        const dx = posX - centerX + xOffset;
        const dy = posY - centerY + yOffset;
        const r = Math.sqrt(dx * dx + dy * dy);

        switch (type) {
          case 'fluid':
            vectorAngle = (Math.sin((posX + xOffset) * 0.05 + seed) + Math.cos((posY + yOffset) * 0.05 + seed)) * Math.PI + direction * Math.PI / 180;
            length = 5 + Math.sin((posX + xOffset) * 0.01 + (posY + yOffset) * 0.01 + seed) * 2 * intensity;
            break;
          case 'magnetic':
            vectorAngle = Math.atan2(dy, dx) + Math.PI / 2 + direction * Math.PI / 180;
            length = 5 + r * 0.02 * intensity;
            break;
          case 'electric':
            vectorAngle = Math.atan2(dy, dx) + direction * Math.PI / 180;
            length = (10 - Math.min(r * 0.03, 8)) * intensity;
            break;
          case 'vortex':
            vectorAngle = Math.atan2(dy, dx) + Math.PI / 2 + direction * Math.PI / 180;
            length = (5 + Math.min(r * 0.05, 10)) * intensity;
            break;
          case 'sink':
            vectorAngle = Math.atan2(dy, dx) + Math.PI + direction * Math.PI / 180;
            length = (10 - Math.min(r * 0.05, 9)) * intensity;
            break;
          case 'source':
            vectorAngle = Math.atan2(dy, dx) + direction * Math.PI / 180;
            length = (10 - Math.min(r * 0.05, 9)) * intensity;
            break;
          case 'saddle':
            vectorAngle = Math.atan2(dy * dy - dx * dx, 2 * dx * dy) + direction * Math.PI / 180;
            length = Math.min(Math.sqrt(Math.abs(dx * dx - dy * dy)) * 0.1, 10) * intensity;
            break;
          case 'wind':
            vectorAngle = direction * Math.PI / 180 + Math.sin((posY + yOffset) * 0.1 + seed) * 0.5;
            length = (5 + Math.cos((posX + xOffset) * 0.1 + seed) * 2) * intensity;
            break;
          default:
            console.warn(`Unknown field type: ${type}`);
        }

        if (spiral) {
          const spiralAngle = Math.atan2(dy, dx) + r * spiralIntensity * 0.1;
          vectorAngle = (vectorAngle + spiralAngle) / 2;
        }

        newField.push({ x: posX, y: posY, angle: vectorAngle, length, r });
      }
    }
    return newField;
  }, [frameWidth, frameHeight]);

  const updateFrameDimensions = useCallback((width, height) => {
    if (fillParent) {
      const aspectRatio = width / height;
      let scaledWidth, scaledHeight;

      if (aspectRatio > 1) {
        scaledWidth = 600;
        scaledHeight = 600 / aspectRatio;
      } else {
        scaledHeight = 600;
        scaledWidth = 600 * aspectRatio;
      }

      setFrameWidth(scaledWidth);
      setFrameHeight(scaledHeight);
    } else {
      setFrameWidth(600);
      setFrameHeight(600);
    }
  }, [fillParent]);

  const getComplementaryColor = useCallback((hexColor) => {
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = (h + 0.5) % 1;
    l = l > 0.5 ? Math.max(0, l - 0.5) : Math.min(1, l + 0.5);
    s = Math.min(1, s + 0.3);

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);

    return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const newField = generateField(rows, columns, fieldType, direction, intensity, spiral, spiralIntensity, spacing, xOffset, yOffset);
    setField(newField);
  }, [rows, columns, fieldType, direction, intensity, spiral, spiralIntensity, spacing, xOffset, yOffset, generateField]);

  useEffect(() => {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === "frame-selected") {
        const { width, height, backgroundColor } = message;
        setActualFrameWidth(width);
        setActualFrameHeight(height);
        updateFrameDimensions(width, height);
        if (backgroundColor) {
          setBackgroundColor(backgroundColor);
          const complementaryColor = getComplementaryColor(backgroundColor);
          setShapeColor(complementaryColor);
        }
      } else if (message.type === "vector-selected") {
        if (message.svg) {
          parseSvgString(message.svg);
        } else {
          console.error('Received vector-selected message without SVG data');
        }
      } else if (message.type === "vector-selection-error") {
        setIsWaitingForVectorSelection(false);
        console.error(message.message);
        // You might want to show this error message to the user
      } else if (message.type === "no-frame-selected") {
        setActualFrameWidth(600);
        setActualFrameHeight(600);
        updateFrameDimensions(600, 600);
        setBackgroundColor('#1e1e1e');
        setShapeColor('#ffffff');
      }
    };
  }, [updateFrameDimensions, getComplementaryColor]);

  const parseSvgString = (svgString) => {
    console.log("Received SVG string:", svgString); // Log the received SVG string

    if (!svgString || typeof svgString !== 'string') {
      console.error('Invalid SVG string received:', svgString);
      return;
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      console.error('Error parsing SVG:', parserError.textContent);
      return;
    }

    const svgElement = svgDoc.querySelector('svg');

    if (svgElement) {
      const viewBox = svgElement.getAttribute('viewBox');
      setCustomShapeViewBox(viewBox);

      const paths = Array.from(svgElement.querySelectorAll('path')).map(path => ({
        d: path.getAttribute('d'),
        fill: path.getAttribute('fill') || 'none',
        stroke: path.getAttribute('stroke') || 'none',
        strokeWidth: path.getAttribute('stroke-width') || '1'
      }));

      setCustomShape(paths);
      setShape('custom');
      setIsWaitingForVectorSelection(false);
    } else {
      console.error('No SVG element found in the parsed document');
    }
  };

  useEffect(() => {
    updateFrameDimensions(actualFrameWidth, actualFrameHeight);
  }, [fillParent, actualFrameWidth, actualFrameHeight, updateFrameDimensions]);

  useEffect(() => {
    console.log('Frame dimensions updated:', { actualFrameWidth, actualFrameHeight });
  }, [actualFrameWidth, actualFrameHeight]);

  const getGradientOpacity = useCallback((vector) => {
    const { x, y, r } = vector;
    const maxR = Math.sqrt(frameWidth * frameWidth / 4 + frameHeight * frameHeight / 4);
    switch (gradientType) {
      case 'radial':
        return 1 - r / maxR;
      case 'angular':
        return (Math.atan2(y - frameHeight / 2, x - frameWidth / 2) + Math.PI) / (2 * Math.PI);
      case 'wave':
        return (Math.sin(r * 0.1) + 1) / 2;
      default:
        return 1;
    }
  }, [gradientType, frameWidth, frameHeight]);

  const renderVector = useCallback((vector, index) => {
    const scaledLength = vector.length * vectorScale;
    const endX = vector.x + Math.cos(vector.angle) * scaledLength;
    const endY = vector.y + Math.sin(vector.angle) * scaledLength;
    const opacity = getGradientOpacity(vector);
    const color = `${shapeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

    if (shape === 'custom' && customShape && customShapeViewBox) {
      const [, , vbWidth, vbHeight] = customShapeViewBox.split(' ').map(Number);
      const aspectRatio = vbWidth / vbHeight;

      // Calculate base size relative to the current frame dimensions
      const cellSize = Math.min(frameWidth / columns, frameHeight / rows);
      const baseSize = cellSize * shapeSize;

      // Maintain aspect ratio while fitting within baseSize
      let scaledWidth, scaledHeight;
      if (aspectRatio > 1) {
        scaledWidth = baseSize;
        scaledHeight = baseSize / aspectRatio;
      } else {
        scaledHeight = baseSize;
        scaledWidth = baseSize * aspectRatio;
      }

      return (
        <g key={index} transform={`translate(${endX - scaledWidth / 2}, ${endY - scaledHeight / 2}) rotate(${vector.angle * 180 / Math.PI})`}>
          <svg
            viewBox={customShapeViewBox}
            width={scaledWidth}
            height={scaledHeight}
            style={{ overflow: 'visible' }}
          >
            {customShape.map((path, pathIndex) => (
              <path
                key={pathIndex}
                d={path.d}
                fill={path.fill === 'none' ? 'none' : color}
                stroke={path.stroke === 'none' ? 'none' : color}
                strokeWidth={path.strokeWidth}
              />
            ))}
          </svg>
        </g>
      );
    }

    switch (shape) {
      case 'line':
        return (
          <line
            key={index}
            x1={vector.x}
            y1={vector.y}
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth={lineThickness}
          />
        );
      case 'dot':
        return (
          <circle
            key={index}
            cx={endX}
            cy={endY}
            r={shapeSize}
            fill={color}
          />
        );
      case 'arrow':
        const arrowSize = 2 * shapeSize;
        const angle = Math.atan2(endY - vector.y, endX - vector.x);
        return (
          <g key={index}>
            <line
              x1={vector.x}
              y1={vector.y}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={lineThickness}
            />
            <path
              d={`M ${endX} ${endY} L ${endX - arrowSize * Math.cos(angle - Math.PI / 6)} ${endY - arrowSize * Math.sin(angle - Math.PI / 6)} L ${endX - arrowSize * Math.cos(angle + Math.PI / 6)} ${endY - arrowSize * Math.sin(angle + Math.PI / 6)} Z`}
              fill={color}
            />
          </g>
        );
      case 'triangle':
        const triangleSize = 3 * shapeSize;
        return (
          <path
            key={index}
            d={`M ${endX} ${endY} 
               L ${endX - triangleSize * Math.cos(vector.angle - Math.PI / 6)} ${endY - triangleSize * Math.sin(vector.angle - Math.PI / 6)} 
               L ${endX - triangleSize * Math.cos(vector.angle + Math.PI / 6)} ${endY - triangleSize * Math.sin(vector.angle + Math.PI / 6)} 
               Z`}
            fill={color}
          />
        );
      default:
        return null;
    }
  }, [shape, shapeSize, vectorScale, lineThickness, getGradientOpacity, shapeColor, customShape, customShapeViewBox, customShapeSize]);

  const handleShapeChange = (value) => {
    setShape(value);
    if (value === 'custom') {
      setIsWaitingForVectorSelection(true);
      parent.postMessage({ pluginMessage: { type: 'request-vector-selection' } }, '*');
    }
  };

  const renderControl = (label, value, setValue, min, max, step, unit = '', disabled = false) => (
    <div>
      <label>
        {label}: <span className="value-span">{value.toFixed(2)}</span> <span className="unit-span">{unit}</span>
      </label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={setValue}
        disabled={disabled}
      />
    </div>
  );

  const resetState = () => {
    setRows(20);
    setColumns(20);
    setFieldType('magnetic');
    setDirection(0);
    setIntensity(1);
    setShape('line');
    setSpiral(true);
    setSpiralIntensity(0.1);
    setGradientType('none');
    setShapeSize(1);
    setVectorScale(1);
    setLineThickness(1);
    setSpacing(1);
    setXOffset(0);
    setYOffset(0);
    setFillParent(true);
    setCustomShape(null);
    setIsWaitingForVectorSelection(false);
  };

  const sendSvgToFigma = () => {
    if (svgRef.current) {
      const svgElement = svgRef.current.cloneNode(true);
      const scaleX = actualFrameWidth / frameWidth;
      const scaleY = actualFrameHeight / frameHeight;

      // Set the viewBox to match the original preview dimensions
      svgElement.setAttribute('viewBox', `0 0 ${frameWidth} ${frameHeight}`);
      svgElement.setAttribute('width', actualFrameWidth);
      svgElement.setAttribute('height', actualFrameHeight);

      // Function to apply scaling to elements
      const applyScaling = (element) => {
        const isCustomShape = element.tagName.toLowerCase() === 'g' && element.querySelector('svg');

        if (isCustomShape) {
          // For custom shapes, we don't apply scaling here
          // Instead, we'll send the original dimensions and scale factor to Figma
        } else if (element.tagName.toLowerCase() === 'circle') {
          const cx = parseFloat(element.getAttribute('cx')) * scaleX;
          const cy = parseFloat(element.getAttribute('cy')) * scaleY;
          element.setAttribute('cx', cx);
          element.setAttribute('cy', cy);
          // Keep the radius constant to maintain relative size
          // element.setAttribute('r', parseFloat(element.getAttribute('r')));
        } else if (element.tagName.toLowerCase() === 'path') {
          // For path elements, we need to scale the 'd' attribute
          const d = element.getAttribute('d');
          const scaledD = d.replace(/[\d.]+/g, (match) => {
            const num = parseFloat(match);
            return isNaN(num) ? match : (num * ((d.indexOf(match) % 2 === 0) ? scaleX : scaleY)).toFixed(4);
          });
          element.setAttribute('d', scaledD);
        }

        // Recursively apply scaling to child elements, but not for custom shapes
        if (!isCustomShape) {
          Array.from(element.children).forEach(applyScaling);
        }
      };

      // Apply scaling to all immediate children of the root SVG
      Array.from(svgElement.children).forEach(applyScaling);

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const cleanedSvgData = svgData.replace(/xmlns="[^"]*"/, '');

      console.log('Sending data to Figma:', {
        svg: cleanedSvgData,
        width: actualFrameWidth,
        height: actualFrameHeight,
        backgroundColor,
        frameWidth,
        frameHeight,
        scaleX,
        scaleY
      });

      parent.postMessage({
        pluginMessage: {
          type: 'create-svg',
          svg: cleanedSvgData,
          width: actualFrameWidth,
          height: actualFrameHeight,
          backgroundColor: backgroundColor,
          scaleX: scaleX,
          scaleY: scaleY,
          isCustomShape: shape === 'custom'
        },
      }, '*');
    } else {
      console.error('SVG ref is null');
    }
  };

  return (
    <MantineProvider defaultColorScheme="light">
      <div className="app">
        <div className="preview" style={{ width: 600, height: 600, margin: '0 auto', position: 'relative' }}>
          <svg
            ref={svgRef}
            width={frameWidth}
            height={frameHeight}
            viewBox={`0 0 ${frameWidth} ${frameHeight}`}
            style={{
              backgroundColor: backgroundColor,
              display: 'block',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {field && field.length > 0 ? field.map((vector, index) => renderVector(vector, index)) : null}
          </svg>
        </div>
        <div className="form">
          <div className="fields">
            <Select
              label="Field Type"
              value={fieldType}
              onChange={setFieldType}
              withScrollArea={false}
              data={[
                { value: 'magnetic', label: 'Magnetic Field' },
                { value: 'fluid', label: 'Fluid Flow' },
                { value: 'electric', label: 'Electric Field' },
                { value: 'vortex', label: 'Vortex' },
                { value: 'sink', label: 'Sink' },
                { value: 'source', label: 'Source' },
                { value: 'saddle', label: 'Saddle Point' },
                { value: 'wind', label: 'Wind Flow' },
              ]}
            />

            <Select
              label="Shape"
              value={shape}
              onChange={handleShapeChange}
              withScrollArea={false}
              data={[
                { value: 'line', label: 'Lines' },
                { value: 'dot', label: 'Dots' },
                { value: 'arrow', label: 'Arrows' },
                { value: 'triangle', label: 'Triangles' },
                { value: 'custom', label: isWaitingForVectorSelection ? 'Select a vector in Figma' : 'Custom Shape' },
              ]}
            />

            <Select
              label="Gradient Type"
              value={gradientType}
              onChange={setGradientType}
              withScrollArea={false}
              data={[
                { value: 'none', label: 'None' },
                { value: 'radial', label: 'Radial Gradient' },
                { value: 'angular', label: 'Angular Gradient' },
                { value: 'wave', label: 'Wave Gradient' },
              ]}
            />

            <div className="counter-wrapper">
              <NumberInput
                label="Rows"
                value={rows}
                onChange={(val) => setRows(Math.max(2, val))}
              />
              <NumberInput
                label="Columns"
                value={columns}
                onChange={(val) => setColumns(Math.max(2, val))}
              />
            </div>

            <ColorInput
              label="Shape Color"
              value={shapeColor}
              onChange={setShapeColor}
              placeholder="Pick a color"
            />

            {renderControl("X Offset", xOffset, setXOffset, -50, 50, 1, "%")}
            {renderControl("Y Offset", yOffset, setYOffset, -50, 50, 1, "%")}
            {renderControl("Field Rotation", direction, setDirection, 0, 360, 1, "°")}
            <Checkbox
              label="Additional spiral"
              checked={spiral}
              onChange={(event) => setSpiral(event.currentTarget.checked)}
            />

            {renderControl("Spiral Intensity", spiralIntensity, setSpiralIntensity, 0, 1, 0.1, "", !spiral)}
            {renderControl("Field Strength", intensity, setIntensity, 0.1, 2, 0.1, "x")}
            {renderControl("Line Length", vectorScale, setVectorScale, 0.1, 12, 0.1, "x")}
            {renderControl("Line Thickness", lineThickness, setLineThickness, 0.1, 12, 0.1, "px", shape === 'dot' || shape === 'triangle')}
            {renderControl("Vector Spacing", spacing, setSpacing, 0.5, 2, 0.1, "x")}
            {renderControl("Shape Size", shapeSize, setShapeSize, 0.1, 10, 0.1, "x", shape === 'line')}
            <Checkbox
              label="Fill parent frame"
              checked={fillParent}
              onChange={(event) => setFillParent(event.currentTarget.checked)}
            />
          </div>
          <div className="button-wrapper">
            <Button
              className="secondary-button"
              onClick={resetState}
            >
              Reset
            </Button>
            <Button
              onClick={sendSvgToFigma}
            >
              Send to Figma
            </Button>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
};

export default App;