const generateTextureFromPrompt = async (texturePrompt, room) => {
  if (!texturePrompt.trim()) return null;

  const fullPrompt = `RPG Tile Based Texture ${texturePrompt} RPG Tile Based Texture`;
  const imgId = `img-${Date.now()}`;
  
  // Create temporary image element
  const img = document.createElement('img');
  img.id = imgId;
  img.alt = fullPrompt;
  img.src = fullPrompt;
  document.body.appendChild(img);

  try {
    // Wait for the AI to generate and replace the src
    await new Promise((resolve, reject) => {
      const checkImage = setInterval(() => {
        const currentImg = document.getElementById(imgId);
        if (currentImg && currentImg.src !== fullPrompt) {
          clearInterval(checkImage);
          resolve(currentImg);
        }
      }, 100);
    });

    const currentImg = document.getElementById(imgId);
    const blobResponse = await fetch(currentImg.src);
    const blob = await blobResponse.blob();
    const url = await websim.upload(blob);

    // Save to database
    const texture = await room.collection('texture').create({
      url,
      prompt: texturePrompt
    });

    // Cleanup
    currentImg.remove();
    return texture;
  } catch (error) {
    console.error('Error generating texture:', error);
    return null;
  }
};