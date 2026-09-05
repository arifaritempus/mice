const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', 'utf8');

// Update Interface
const intTarget = `  handleAccommodationCopy: (id: string) => void;
  formatDateAccommodation: (dateValue: any) => string;`;
const intReplacement = `  handleAccommodationCopy: (id: string) => void;
  handleAccommodationReorder?: (sourceId: string, targetId: string) => void;
  formatDateAccommodation: (dateValue: any) => string;`;

if(code.includes(intTarget)) code = code.replace(intTarget, intReplacement);

// Update Props
const propsTarget = `  handleAccommodationCopy,
  formatDateAccommodation,`;
const propsReplacement = `  handleAccommodationCopy,
  handleAccommodationReorder,
  formatDateAccommodation,`;

if(code.includes(propsTarget)) code = code.replace(propsTarget, propsReplacement);

// Add Drag Events
const dragEvents = `
  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragStart = (e: React.DragEvent, id: string) => { 
      e.dataTransfer.setData("row_id", id);
      // Let's add some visual feedback later if needed
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("row_id");
      if (sourceId && sourceId !== targetId && handleAccommodationReorder) {
          handleAccommodationReorder(sourceId, targetId);
      }
  };
`;

// Insert dragEvents just before `return (`
const returnIndex = code.indexOf('return (');
if (returnIndex !== -1) {
    code = code.slice(0, returnIndex) + dragEvents + code.slice(returnIndex);
}

// Add draggable and drag events to the tr element
const trTarget = `                      <tr
                        key={item.id}
                        className={\`group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-v3-border/50 \${`;

const trReplacement = `                      <tr
                        key={item.id}
                        draggable={!item.isEditing && !compIsLocked}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={allowDrop}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className={\`group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-v3-border/50 \${!item.isEditing && !compIsLocked ? 'cursor-grab active:cursor-grabbing' : ''} \${`;

if(code.includes(trTarget)) code = code.replace(trTarget, trReplacement);
else console.log("Could not find trTarget in AccommodationTabOptimized");

fs.writeFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', code);
console.log("Updated AccommodationTabOptimized.tsx");
