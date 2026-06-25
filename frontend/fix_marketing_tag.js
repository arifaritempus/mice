const fs = require('fs');
let content = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

content = content.replace(
`        />
      )}
    </div>
  );
}`,
`        />
      )}
      </div>
    </div>
  );
}`);

fs.writeFileSync('src/app/marketing/page.tsx', content, 'utf8');
console.log("Fixed tag");
