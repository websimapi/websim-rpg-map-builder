const Grid = ({ gridSize, grid, onCellClick, onCellRightClick }) => {
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
};