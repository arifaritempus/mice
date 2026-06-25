const fs = require('fs');

let content = `
                  onChange={({ target: { value } }) => {
                    const newMonth = months.indexOf(value);
                    if (customHeaderCount === 1) {
                      if (newMonth === 0) {
                        changeYear(date.getFullYear() - 1);
                        setTimeout(() => changeMonth(11), 0);
                      } else {
                        changeYear(date.getFullYear());
                        setTimeout(() => changeMonth(newMonth - 1), 0);
                      }
                    } else {
                      changeMonth(newMonth);
                    }
                  }}
`;
console.log("Looks fine");
