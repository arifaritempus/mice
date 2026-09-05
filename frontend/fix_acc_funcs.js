const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', 'utf8');

const funcs = `
  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragStart = (e: React.DragEvent, id: string) => { 
      e.dataTransfer.setData("row_id", id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("row_id");
      if (sourceId && sourceId !== targetId && handleAccommodationReorder) {
          handleAccommodationReorder(sourceId, targetId);
      }
  };
`;

const returnIndex = code.indexOf('return (');
if (returnIndex !== -1 && !code.includes('const allowDrop')) {
    code = code.slice(0, returnIndex) + funcs + code.slice(returnIndex);
    fs.writeFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', code);
    console.log("Added functions");
} else {
    console.log("Already added or could not find");
}
