const TextureGenerator = ({ texturePrompt, setTexturePrompt, onGenerate }) => {
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
};