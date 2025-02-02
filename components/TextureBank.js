const TextureBank = ({ textures, selectedTexture, onTextureSelect }) => {
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
};