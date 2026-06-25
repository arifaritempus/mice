const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const regex = /\{\/\* ROW 3: HOTEL & SUPPLIER ANALYSIS \*\/\}[\s\S]*?\{\/\* ROW 4: HR & OPERATIONAL FLOW \*\/\}/m;

const newRows = `{/* ROW 3: HOTEL & EFFICIENCY ANALYSIS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          {/* Top Hotels */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="cyan">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Hotel size={18} className="text-cyan-400" /> Otel Bazlı Ciro
                Analizi
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                En Yüksek Cirolu 10 Otel
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.hotelData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => \`\${(v / 1000000).toFixed(1)}M\`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Bar
                      dataKey="Satış"
                      fill="#06b6d4"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {m.hotelData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Project Efficiency */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="emerald">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" /> Proje Verimliliği
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                En Yüksek Cirolu MICE Projeleri
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.projectEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => \`\${(v / 1000000).toFixed(1)}M\`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Bar
                      dataKey="Ciro"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {m.projectEfficiencyData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Sejour Efficiency */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Hotel size={18} className="text-blue-400" /> Sejour Verimliliği
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Konfirme Sejour Rezervasyonları
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.sejourEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => \`\${(v / 100000).toFixed(1)}K\`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Bar
                      dataKey="Ciro"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {m.sejourEfficiencyData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 4: TRANSPORT & SUPPLIERS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          {/* Airlines */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="amber">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Plane size={16} className="text-amber-400" /> Havayolu Dağılımı
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.airlineData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                    >
                      {m.airlineData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Vehicles */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="fuchsia">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Bus size={16} className="text-fuchsia-400" /> Araç Tipi Kullanımı
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.vehicleData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {m.vehicleData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[(index + 3) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Transfer Suppliers */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="rose">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Building2 size={16} className="text-rose-400" /> Transfer Tedarikçi Dağılımı
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.transferSupplierData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {m.transferSupplierData.map((entry: any, index: number) => (
                        <Cell
                          key={\`cell-\${index}\`}
                          fill={COLORS[(index + 5) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 5: OPERATIONAL FLOW */}`;

pageContent = pageContent.replace(regex, newRows);

// Remove HR Chart from ROW 5
const hrRegex = /\{\/\* ROW 4: HR & OPERATIONAL FLOW \*\/\}([\s\S]*?)\{\/\* HR \*\/\}([\s\S]*?)\{\/\* Operational Flow \*\/\}/m;

// Wait, the HR regex shouldn't use ROW 4 since I replaced it with ROW 5.
// Ah, the first replace actually Replaced "ROW 4: HR & OPERATIONAL FLOW" text!
// So ROW 5 text doesn't exist yet, I just appended it.
fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Replaced ROW 3 and ROW 4");
