const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

const target1 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber(sejour.totals?.TRY || 0)}</div>
                              <div>EUR: {formatNumber(sejour.totals?.EUR || 0)}</div>
                              <div>USD: {formatNumber(sejour.totals?.USD || 0)}</div>
                              <div>GBP: {formatNumber((sejour as any).totals?.GBP || 0)}</div>
                            </div>
                          </td>`;

const replace1 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              {(() => {
                                const tryAmt = sejour.totals?.TRY || 0;
                                const eurAmt = sejour.totals?.EUR || 0;
                                const usdAmt = sejour.totals?.USD || 0;
                                const gbpAmt = (sejour as any).totals?.GBP || 0;
                                const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                                if (!hasAny) return <div className="text-gray-400">-</div>;
                                return (
                                  <>
                                    {!!tryAmt && <div>TRY: {formatNumber(tryAmt)}</div>}
                                    {!!eurAmt && <div>EUR: {formatNumber(eurAmt)}</div>}
                                    {!!usdAmt && <div>USD: {formatNumber(usdAmt)}</div>}
                                    {!!gbpAmt && <div>GBP: {formatNumber(gbpAmt)}</div>}
                                  </>
                                );
                              })()}
                            </div>
                          </td>`;

const target2 = `                                              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                        <div className="text-xs">
                          <div>TRY: {formatNumber(sejour.costs?.TRY || 0)}</div>
                          <div>EUR: {formatNumber(sejour.costs?.EUR || 0)}</div>
                          <div>USD: {formatNumber(sejour.costs?.USD || 0)}</div>
                          <div>GBP: {formatNumber((sejour as any).costs?.GBP || 0)}</div>
                        </div>
                      </td>`;

const replace2 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              {(() => {
                                const tryAmt = sejour.costs?.TRY || 0;
                                const eurAmt = sejour.costs?.EUR || 0;
                                const usdAmt = sejour.costs?.USD || 0;
                                const gbpAmt = (sejour as any).costs?.GBP || 0;
                                const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                                if (!hasAny) return <div className="text-gray-400">-</div>;
                                return (
                                  <>
                                    {!!tryAmt && <div>TRY: {formatNumber(tryAmt)}</div>}
                                    {!!eurAmt && <div>EUR: {formatNumber(eurAmt)}</div>}
                                    {!!usdAmt && <div>USD: {formatNumber(usdAmt)}</div>}
                                    {!!gbpAmt && <div>GBP: {formatNumber(gbpAmt)}</div>}
                                  </>
                                );
                              })()}
                            </div>
                          </td>`;

const target3 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0)}</div>
                              <div>EUR: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0)}</div>
                              <div>USD: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0)}</div>
                              <div>GBP: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0)}</div>
                            </div>
                          </td>`;

const replace3 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              {(() => {
                                const tryAmt = sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0;
                                const eurAmt = sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0;
                                const usdAmt = sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0;
                                const gbpAmt = sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0;
                                const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                                if (!hasAny) return <div className="text-gray-400">-</div>;
                                return (
                                  <>
                                    {!!tryAmt && <div>TRY: {formatNumber(tryAmt)}</div>}
                                    {!!eurAmt && <div>EUR: {formatNumber(eurAmt)}</div>}
                                    {!!usdAmt && <div>USD: {formatNumber(usdAmt)}</div>}
                                    {!!gbpAmt && <div>GBP: {formatNumber(gbpAmt)}</div>}
                                  </>
                                );
                              })()}
                            </div>
                          </td>`;

const target4 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber((sejour.totals?.TRY || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0))}</div>
                              <div>EUR: {formatNumber((sejour.totals?.EUR || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0))}</div>
                              <div>USD: {formatNumber((sejour.totals?.USD || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0))}</div>
                              <div>GBP: {formatNumber(((sejour as any).totals?.GBP || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0))}</div>
                            </div>
                    </td>`;

const replace4 = `                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              {(() => {
                                const tryAmt = (sejour.totals?.TRY || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0);
                                const eurAmt = (sejour.totals?.EUR || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0);
                                const usdAmt = (sejour.totals?.USD || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0);
                                const gbpAmt = ((sejour as any).totals?.GBP || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0);
                                const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                                if (!hasAny) return <div className="text-gray-400">-</div>;
                                return (
                                  <>
                                    {!!tryAmt && <div>TRY: {formatNumber(tryAmt)}</div>}
                                    {!!eurAmt && <div>EUR: {formatNumber(eurAmt)}</div>}
                                    {!!usdAmt && <div>USD: {formatNumber(usdAmt)}</div>}
                                    {!!gbpAmt && <div>GBP: {formatNumber(gbpAmt)}</div>}
                                  </>
                                );
                              })()}
                            </div>
                          </td>`;

let replaced = 0;
if (content.includes(target1)) { content = content.replace(target1, replace1); replaced++; }
if (content.includes(target2)) { content = content.replace(target2, replace2); replaced++; }
if (content.includes(target3)) { content = content.replace(target3, replace3); replaced++; }
if (content.includes(target4)) { content = content.replace(target4, replace4); replaced++; }

console.log("Replaced:", replaced);

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
