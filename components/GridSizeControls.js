const GridSizeControls = ({ gridSize, onSizeChange }) => {
  const handleChange = (dimension, value) => {
    onSizeChange(prev => ({ ...prev, [dimension]: parseInt(value) || 1 }));
  };

  return (
    <div className="grid-size-controls">
      Width: 
      <input 
        type="number" 
        value={gridSize.width} 
        onChange={e => handleChange('width', e.target.value)}
        min="1"
      />
      Height: 
      <input 
        type="number" 
        value={gridSize.height} 
        onChange={e => handleChange('height', e.target.value)}
        min="1"
      />
    </div>
  );
};