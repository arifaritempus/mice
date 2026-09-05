const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

const targetAdd = `  const handleAccommodationAdd = useCallback(`;

const replacementAdd = `  const handleAccommodationReorder = useCallback(async (sourceId: string, targetId: string) => {
    const sourceIndex = accommodationItems.findIndex(it => (it.id || it.hotel_id) === sourceId);
    const targetIndex = accommodationItems.findIndex(it => (it.id || it.hotel_id) === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const newItems = [...accommodationItems];
    const [draggedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    setAccommodationItems(newItems);
    await saveAccommodationItems(newItems);
  }, [accommodationItems, saveAccommodationItems]);

  const handleAccommodationAdd = useCallback(`;

if (code.includes(targetAdd)) {
    code = code.replace(targetAdd, replacementAdd);
    fs.writeFileSync('src/app/projects/[id]/page.tsx', code);
    console.log("Added handleAccommodationReorder to page.tsx");
} else {
    console.log("Could not find targetAdd in page.tsx");
}
