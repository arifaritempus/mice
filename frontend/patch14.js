const fs = require('fs');
let content = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

content = content.replace(
  /async update\(id: string, project: Partial<Project>\): Promise<Project> {[\s\S]*?\.eq\('id', id\);/,
  `async update(id: string, project: Partial<Project>): Promise<Project> {
    const payload = { ...project, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();`
);

content = content.replace(
  /return { id, \.\.\.payload } as Project;/,
  `return data as Project;`
);

fs.writeFileSync('src/lib/supabaseService.ts', content);
console.log("projectsService.update patched");
