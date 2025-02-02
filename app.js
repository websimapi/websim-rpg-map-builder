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

  const generateTexture = async () => {
    if (!texturePrompt.trim()) return;

    const fullPrompt = `RPG Tile Based Texture ${texturePrompt} RPG Tile Based Texture`;
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
          await room.collection('texture').create({
            url,
            prompt: texturePrompt
          });

          setTexturePrompt('');
        } catch (error) {
          console.error('Error saving texture:', error);
        }

        // Cleanup
        currentImg.remove();
      }
    }, 100);
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
        <div className="grid-size-controls">
          Width: 
          <input 
            type="number" 
            value={gridSize.width} 
            onChange={e => setGridSize(prev => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
            min="1"
          />
          Height: 
          <input 
            type="number" 
            value={gridSize.height} 
            onChange={e => setGridSize(prev => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
            min="1"
          />
        </div>

        <div className="texture-generator">
          <input
            type="text"
            value={texturePrompt}
            onChange={e => setTexturePrompt(e.target.value)}
            placeholder="Enter texture description..."
          />
          <button onClick={generateTexture}>Generate Texture</button>
        </div>

        <div className="texture-bank">
          {textures.map(texture => (
            <div
              key={texture.id}
              className={`texture ${selectedTexture?.id === texture.id ? 'selected' : ''}`}
              style={{ backgroundImage: `url(${texture.url})` }}
              onClick={() => setSelectedTexture(texture)}
            />
          ))}
        </div>
      </div>

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
              onClick={() => handleCellClick(x, y)}
              onContextMenu={(e) => handleRightClick(e, x, y)}
            />
          ))
        )}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));