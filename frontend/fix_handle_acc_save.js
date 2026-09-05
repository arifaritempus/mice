const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

const target = `        // Promise zinciriyle arkaplanda çalışmasını sağla, async bekleme (UI kitlenmez)
        if (isUUID) {
          projectAccommodationItemsService.update(updatedItem.id, payload)
            .then(() => toast.success("Satır kaydedildi", { id: 'acc-save' }))
            .catch(console.error);
        } else {
          projectAccommodationItemsService.create(payload as any)
            .then((created) => {
               setAccommodationItems((prev: any[]) => prev.map(it => it.id === updatedItem.id ? { ...it, id: created.id } : it));
               toast.success("Yeni satır eklendi", { id: 'acc-save' });
            })
            .catch(console.error);
        }`;

const replacement = `        // Eğer yeni satırsa ve araya eklenmişse sıralamanın bozulmaması için tüm listeyi kaydet
        if (isNewAccommodationItem || !isUUID) {
           saveAccommodationItems(updatedItems).then(() => {
              toast.success("Yeni satır eklendi ve sıralama korundu", { id: 'acc-save' });
           }).catch(console.error);
        } else {
          // Promise zinciriyle arkaplanda çalışmasını sağla, async bekleme (UI kitlenmez)
          projectAccommodationItemsService.update(updatedItem.id, payload)
            .then(() => toast.success("Satır kaydedildi", { id: 'acc-save' }))
            .catch(console.error);
        }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/app/projects/[id]/page.tsx', code);
    console.log("Fixed handleAccommodationSave");
} else {
    console.log("Could not find target in page.tsx");
}
