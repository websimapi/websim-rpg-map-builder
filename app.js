const room = new WebsimSocket();

function App() {
  const [gridSize, setGridSize] = React.useState({ width: 10, height: 10 });
  const [texturePrompt, setTexturePrompt] = React.useState('');
  const [selectedTexture, setSelectedTexture] = React.useState(null);
  const [grid, setGrid] = React.useState({});
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  // Get textures from the database
  const textures = React.useSyncExternalStore(
    room.collection('texture').subscribe,
    room.collection('texture').getList
  );

  const generateTexture = async () => {
    if (!texturePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const fullPrompt = `RPG Tile Based Texture ${texturePrompt} RPG Tile Based Texture`;
    const imgId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create temporary image element
      const img = document.createElement('img');
      img.id = imgId;
      img.alt = fullPrompt;
      img.src = fullPrompt;
      img.style.display = 'none';
      document.body.appendChild(img);

      // Wait for the AI to generate and replace the src
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Texture generation timed out'));
        }, 30000); // 30 second timeout

        const checkImage = setInterval(async () => {
          const currentImg = document.getElementById(imgId);
          if (currentImg && currentImg.src !== fullPrompt) {
            clearInterval(checkImage);
            clearTimeout(timeout);
            resolve(currentImg);
          }
        }, 100);
      });

      const currentImg = document.getElementById(imgId);
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
      console.error('Error generating texture:', error);
      alert('Failed to generate texture. Please try again.');
    } finally {
      setIsGenerating(false);
      document.getElementById(imgId)?.remove();
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

  const handleGridSizeChange = (dimension, value) => {
    const newValue = Math.max(1, Math.min(50, parseInt(value) || 1));
    setGridSize(prev => ({ ...prev, [dimension]: newValue }));
  };

  return (
    <div>
      <div className="controls">
        <div className="grid-size-controls">
          <label>
            Width:
            <input 
              type="number"
              value={gridSize.width}
              onChange={e => handleGridSizeChange('width', e.target.value)}
              min="1"
              max="50"
            />
          </label>
          <label>
            Height:
            <input 
              type="number"
              value={gridSize.height}
              onChange={e => handleGridSizeChange('height', e.target.value)}
              min="1"
              max="50"
            />
          </label>
        </div>

        <div className="texture-generator">
          <input
            type="text"
            value={texturePrompt}
            onChange={e => setTexturePrompt(e.target.value)}
            placeholder="Enter texture description... (e.g., grass, stone wall, water)"
            disabled={isGenerating}
          />
          <button 
            onClick={generateTexture}
            disabled={isGenerating}
            className={isGenerating ? 'loading' : ''}
          >
            {isGenerating ? 'Generating...' : 'Generate Texture'}
          </button>
        </div>

        <div className="texture-bank">
          {textures.map(texture => (
            <div
              key={texture.id}
              className={`texture ${selectedTexture?.id === texture.id ? 'selected' : ''}`}
              style={{ backgroundImage: `url(${texture.url})` }}
              onClick={() => setSelectedTexture(texture)}
              title={texture.prompt}
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