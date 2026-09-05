const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', 'utf8');

const target = `              return <tr 
                key={item.id || index} 
                className={\`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors \${permEdit && (!compIsLocked || isSuperAdmin) ? 'cursor-pointer' : ''}\`}`;

const replacement = `              return <tr 
                key={item.id || index} 
                draggable={!compIsLocked && permEdit && editingAccommodationIndex === null}
                onDragStart={(e) => handleDragStart(e, item.id || item.hotel_id)}
                onDragOver={allowDrop}
                onDrop={(e) => handleDrop(e, item.id || item.hotel_id)}
                className={\`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors \${permEdit && (!compIsLocked || isSuperAdmin) ? 'cursor-pointer' : ''}\`}`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/app/projects/[id]/AccommodationTabOptimized.tsx', code);
    console.log("Updated TR successfully");
} else {
    console.log("Could not find TR in AccommodationTabOptimized");
}
