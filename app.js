const room = new WebsimSocket();

function App() {
  const [gridSize, setGridSize] = React.useState({ width: 10, height: 10 });
  const [texturePrompt, setTexturePrompt] = React.useState('');
  const [selectedTexture, setSelectedTexture] = React.useState(null);
  const [grid, setGrid] = React.useState({});
  
  // Get textures from the database
  const textures = React.useSyncExternalStore(
    room.collection('texture').subscribe,
    room.collection('texture').getList
  );

  const generateTextureFromPrompt = async (prompt, room) => {
    if (!prompt.trim()) return null;

    const fullPrompt = `RPG Tile Based Texture ${prompt} RPG Tile Based Texture`;
    const imgId = `img-${Date.now()}`;
    
    // Create temporary image element
    const img = document.createElement('img');
    img.id = imgId;
    img.alt = fullPrompt;
    img.src = fullPrompt;
    document.body.appendChild(img);

    // Wait for the AI to generate and replace the src
    const checkImage = setInterval(async () => {
      const currentImg = document.getElementById(imgId);
      if (currentImg && currentImg.src !== fullPrompt) {
        clearInterval(checkImage);
        
        try {
          // Upload to websim storage
          const blobResponse = await fetch(currentImg.src);
          const blob = await blobResponse.blob();
          const url = await websim.upload(blob);

          // Save to database
          const texture = await room.collection('texture').create({
            url,
            prompt: prompt
          });

          // Cleanup
          currentImg.remove();
          return texture;
        } catch (error) {
          console.error('Error saving texture:', error);
        }

        // Cleanup
        currentImg.remove();
      }
    }, 100);
  };

  const generateTexture = async () => {
    const texture = await generateTextureFromPrompt(texturePrompt, room);
    if (texture) {
      setTexturePrompt('');
    }
  };

  const handleCellClick = (x, y) => {
    if (!selectedTexture) return;

    setGrid(prev => ({
      ...prev,
      [`${x},${y}`]: selectedTexture
    }));
  };

  const handleRightClick = (e, x, y) => {
    e.preventDefault();
    setGrid(prev => {
      const newGrid = { ...prev };
      delete newGrid[`${x},${y}`];
      return newGrid;
    });
  };

  return (
    <div>
      <div className="controls">
        <GridSizeControls 
          gridSize={gridSize} 
          onSizeChange={setGridSize} 
        />
        <TextureGenerator 
          texturePrompt={texturePrompt}
          setTexturePrompt={setTexturePrompt}
          onGenerate={generateTexture}
        />
        <TextureBank 
          textures={textures}
          selectedTexture={selectedTexture}
          onTextureSelect={setSelectedTexture}
        />
      </div>

      <Grid 
        gridSize={gridSize}
        grid={grid}
        onCellClick={handleCellClick}
        onCellRightClick={handleRightClick}
      />
    </div>
  );
}

// Define GridSizeControls component
function GridSizeControls({ gridSize, onSizeChange }) {
  return (
    <div className="grid-size-controls">
      Width: 
      <input 
        type="number" 
        value={gridSize.width} 
        onChange={e => onSizeChange(prev => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
        min="1"
      />
      Height: 
      <input 
        type="number" 
        value={gridSize.height} 
        onChange={e => onSizeChange(prev => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
        min="1"
      />
    </div>
  );
}

// Define TextureGenerator component
function TextureGenerator({ texturePrompt, setTexturePrompt, onGenerate }) {
  return (
    <div className="texture-generator">
      <input
        type="text"
        value={texturePrompt}
        onChange={e => setTexturePrompt(e.target.value)}
        placeholder="Enter texture description..."
      />
      <button onClick={onGenerate}>Generate Texture</button>
    </div>
  );
}

// Define TextureBank component
function TextureBank({ textures, selectedTexture, onTextureSelect }) {
  return (
    <div className="texture-bank">
      {textures.map(texture => (
        <div
          key={texture.id}
          className={`texture ${selectedTexture?.id === texture.id ? 'selected' : ''}`}
          style={{ backgroundImage: `url(${texture.url})` }}
          onClick={() => onTextureSelect(texture)}
        />
      ))}
    </div>
  );
}

// Define Grid component
function Grid({ gridSize, grid, onCellClick, onCellRightClick }) {
  return (
    <div 
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${gridSize.width}, 50px)`
      }}
    >
      {Array.from({ length: gridSize.height }).map((_, y) =>
        Array.from({ length: gridSize.width }).map((_, x) => (
          <div
            key={`${x},${y}`}
            className="grid-cell"
            style={{
              backgroundImage: grid[`${x},${y}`] ? `url(${grid[`${x},${y}`].url})` : 'none'
            }}
            onClick={() => onCellClick(x, y)}
            onContextMenu={(e) => onCellRightClick(e, x, y)}
          />
        ))
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));