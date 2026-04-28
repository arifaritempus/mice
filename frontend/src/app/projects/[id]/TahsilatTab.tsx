'use client';

import React, { useCallback } from 'react';

interface TahsilatTabProps {
  projectId: string;
  salesTotals: {
    totalByCurrency: Record<string, number>;
    totalTRY: number;
  };
  collectionPlans: any[];
  setCollectionPlans: React.Dispatch<React.SetStateAction<any[]>>;
  editingPlanIndex: number | null;
  setEditingPlanIndex: (index: number | null) => void;
  tempPlanItem: any;
  setTempPlanItem: (item: any) => void;
  planAmountInput: string;
  setPlanAmountInput: (value: string) => void;
  planTotalTRYInput: string;
  setPlanTotalTRYInput: (value: string) => void;
  collections: any[];
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  editingCollectionIndex: number | null;
  setEditingCollectionIndex: (index: number | null) => void;
  tempCollectionItem: any;
  setTempCollectionItem: (item: any) => void;
  collectionAmountInput: string;
  setCollectionAmountInput: (value: string) => void;
  collectionTotalTRYInput: string;
  setCollectionTotalTRYInput: (value: string) => void;
  handlePlanSave: (item: any) => Promise<any>;
  handlePlanCancel: () => void;
  handlePlanDelete: (item: any) => Promise<void>;
  handleCollectionSave: (item: any) => Promise<any>;
  handleCollectionCancel: () => void;
  handleCollectionDelete: (item: any) => Promise<void>;
  formatNumber: (value: number) => string;
  formatNumberForDisplay: (value: number | string) => string;
  formatNumberForInput: (value: number | string) => string;
  cleanInputValue: (value: string) => number;
  formatDateForDisplay: (date: string) => string;
  formatTRY: (value: number) => string;
  paymentPlanByCurrency: Record<string, number>;
  paidByCurrency: Record<string, number>;
  paymentSummary: {
    planTRY: number;
    paidTRY: number;
    balanceTRY: number;
  };
  planByCurrency: Record<string, number>;
  collectedByCurrency: Record<string, number>;
  balanceByCurrency: Record<string, number>;
  [key: string]: any;
}

export default function TahsilatTab(props: TahsilatTabProps) {
  const {
    projectId,
    salesTotals,
    collectionPlans,
    setCollectionPlans,
    editingPlanIndex,
    setEditingPlanIndex,
    tempPlanItem,
    setTempPlanItem,
    planAmountInput,
    setPlanAmountInput,
    planTotalTRYInput,
    setPlanTotalTRYInput,
    collections,
    setCollections,
    editingCollectionIndex,
    setEditingCollectionIndex,
    tempCollectionItem,
    setTempCollectionItem,
    collectionAmountInput,
    setCollectionAmountInput,
    collectionTotalTRYInput,
    setCollectionTotalTRYInput,
    handlePlanSave,
    handlePlanCancel,
    handlePlanDelete,
    handleCollectionSave,
    handleCollectionCancel,
    handleCollectionDelete,
    formatNumber,
    formatNumberForDisplay,
    formatNumberForInput,
    cleanInputValue,
    formatDateForDisplay,
    formatTRY,
    paymentPlanByCurrency,
    paidByCurrency,
    paymentSummary,
    planByCurrency,
    collectedByCurrency,
    balanceByCurrency,
  } = props;

  const resetPlanState = useCallback(() => {
    setEditingPlanIndex(null);
    setTempPlanItem(null);
    setPlanAmountInput('');
    setPlanTotalTRYInput('');
  }, [setEditingPlanIndex, setTempPlanItem, setPlanAmountInput, setPlanTotalTRYInput]);

  const resetCollectionState = useCallback(() => {
    setEditingCollectionIndex(null);
    setTempCollectionItem(null);
    setCollectionAmountInput('');
    setCollectionTotalTRYInput('');
  }, [setEditingCollectionIndex, setTempCollectionItem, setCollectionAmountInput, setCollectionTotalTRYInput]);

  const saveNewPlan = useCallback(async () => {
    if (!tempPlanItem) return;
    try {
      const saved = await handlePlanSave({ ...tempPlanItem, project_id: projectId });
      setCollectionPlans(prev => [...prev, saved]);
      resetPlanState();
    } catch (error: any) {
      console.error('Plan kaydedilirken hata:', error);
      alert('Plan kaydedilirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [handlePlanSave, projectId, resetPlanState, setCollectionPlans, tempPlanItem]);

  const saveExistingPlan = useCallback(async (index: number, base: any) => {
    const payload = { ...base, ...(tempPlanItem || {}) };
    try {
      const saved = await handlePlanSave({ ...payload, project_id: projectId });
      setCollectionPlans(prev => prev.map((p, i) => (i === index ? saved : p)));
      resetPlanState();
    } catch (error: any) {
      console.error('Plan güncellenirken hata:', error);
      alert('Plan güncellenirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [handlePlanSave, projectId, resetPlanState, setCollectionPlans, tempPlanItem]);

  const deletePlan = useCallback(async (index: number, plan: any) => {
    try {
      if (plan?.id) {
        await handlePlanDelete(plan);
      }
      setCollectionPlans(prev => prev.filter((_, i) => i !== index));
      if (editingPlanIndex === index) {
        resetPlanState();
      }
    } catch (error: any) {
      console.error('Plan silinirken hata:', error);
      alert('Plan silinirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [editingPlanIndex, handlePlanDelete, resetPlanState, setCollectionPlans]);

  const saveNewCollection = useCallback(async () => {
    if (!tempCollectionItem) return;
    try {
      const saved = await handleCollectionSave({ ...tempCollectionItem, project_id: projectId });
      setCollections(prev => [...prev, saved]);
      resetCollectionState();
    } catch (error: any) {
      console.error('Tahsilat kaydedilirken hata:', error);
      alert('Tahsilat kaydedilirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [handleCollectionSave, projectId, resetCollectionState, setCollections, tempCollectionItem]);

  const saveExistingCollection = useCallback(async (index: number, base: any) => {
    const payload = { ...base, ...(tempCollectionItem || {}) };
    try {
      const saved = await handleCollectionSave({ ...payload, project_id: projectId });
      setCollections(prev => prev.map((c, i) => (i === index ? saved : c)));
      resetCollectionState();
    } catch (error: any) {
      console.error('Tahsilat güncellenirken hata:', error);
      alert('Tahsilat güncellenirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [handleCollectionSave, projectId, resetCollectionState, setCollections, tempCollectionItem]);

  const deleteCollection = useCallback(async (index: number, collection: any) => {
    try {
      if (collection?.id) {
        await handleCollectionDelete(collection);
      }
      setCollections(prev => prev.filter((_, i) => i !== index));
      if (editingCollectionIndex === index) {
        resetCollectionState();
      }
    } catch (error: any) {
      console.error('Tahsilat silinirken hata:', error);
      alert('Tahsilat silinirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    }
  }, [editingCollectionIndex, handleCollectionDelete, resetCollectionState, setCollections]);

  return (
                <div className="space-y-4">
                  {/* Satış Genel Toplamları */}
                  <div className="bg-blue-600 dark:bg-blue-700 rounded-md p-3">
                    <div className="grid grid-cols-12 gap-2 text-white text-sm">
                      <div className="col-span-3 font-bold">Satış Genel Toplamları</div>
                      <div className="col-span-6 text-right font-bold">
                        {Object.entries(salesTotals.totalByCurrency).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(' + ')}
                    </div>
                      <div className="col-span-2 text-right font-bold">
                        {formatNumber(salesTotals.totalTRY)} TL
                    </div>
                      <div className="col-span-1"></div>
                    </div>
                  </div>

                  {/* Ödeme Planı (Sözleşme) */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ödeme Planı</h3>
                      <button onClick={() => {
                        const item = { date: '', collectionType: '', description: '', amount: 0, currency: 'TRY', exchangeRate: 1, totalTRY: 0 };
                        setTempPlanItem(item);
                        setEditingPlanIndex(collectionPlans.length);
                        setPlanAmountInput('');
                        setPlanTotalTRYInput('');
                      }} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Yeni Plan</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-fixed">
                        <colgroup><col className="w-32" /><col className="w-36" /><col /><col className="w-32" /><col className="w-20" /><col className="w-24" /><col className="w-32" /><col className="w-20" /></colgroup>
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TARİH</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TAHSİLAT TİPİ</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">AÇIKLAMA</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">TUTAR</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">DÖVİZ</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">KUR</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">TOPLAM TL</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">İŞLEMLER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {editingPlanIndex !== null && editingPlanIndex === collectionPlans.length && (
                            <tr>
                              <td className="px-2 py-2"><input type="date" value={tempPlanItem?.date || ''} onChange={(e)=>setTempPlanItem((p:any)=>({...p, date: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" /></td>
                              <td className="px-2 py-2">
                                <select value={tempPlanItem?.collectionType || ''} onChange={(e)=>setTempPlanItem((p:any)=>({...p, collectionType: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white">
                                  <option value="">Seçin</option>
                                  <option value="banka">Banka Havalesi</option>
                                  <option value="pos">Kredi Kartı / Pos</option>
                                  <option value="cek">Çek / Senet</option>
                                  <option value="nakit">Nakit</option>
                                </select>
                              </td>
                              <td className="px-2 py-2"><input type="text" value={tempPlanItem?.description || ''} onChange={(e)=>setTempPlanItem((p:any)=>({...p, description: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama"/></td>
                              <td className="px-2 py-2"><input type="text" value={planAmountInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setPlanAmountInput(raw); const amount=cleanInputValue(raw)||0; const rate=tempPlanItem?.exchangeRate||1; const cur=tempPlanItem?.currency||'TRY'; const tl=cur==='TRY'?amount:amount*rate; setTempPlanItem((p:any)=>({...p, amount, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onBlur={(e)=>{ const amount=cleanInputValue(e.target.value)||0; setPlanAmountInput(formatNumberForDisplay(amount)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                              <td className="px-2 py-2"><select value={tempPlanItem?.currency||'TRY'} onChange={(e)=>{ const cur=e.target.value; const amount=tempPlanItem?.amount||0; const rate=tempPlanItem?.exchangeRate||1; const tl=cur==='TRY'?amount:amount*rate; setTempPlanItem((p:any)=>({...p, currency: cur, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white"><option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></td>
                              <td className="px-2 py-2"><input type="number" step="0.0001" value={tempPlanItem?.exchangeRate||''} onChange={(e)=>{ const r=parseFloat(e.target.value)||0; const amount=tempPlanItem?.amount||0; const cur=tempPlanItem?.currency||'TRY'; const tl=cur==='TRY'?amount:amount*r; setTempPlanItem((p:any)=>({...p, exchangeRate:r, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00"/></td>
                              <td className="px-2 py-2"><input type="text" value={planTotalTRYInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setPlanTotalTRYInput(raw); const tl=cleanInputValue(raw)||0; const rate=tempPlanItem?.exchangeRate||1; const newAmount=rate>0? tl/rate : 0; setTempPlanItem((p:any)=>({...p, totalTRY: tl, amount: newAmount})); setPlanAmountInput(formatNumberForDisplay(newAmount)); }} onBlur={(e)=>{ const tl=cleanInputValue(e.target.value)||0; setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewPlan(); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                              <td className="px-2 py-2"><div className="flex gap-1 justify-center"><button onClick={saveNewPlan} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={resetPlanState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></td>
                            </tr>
                          )}
                          {collectionPlans.map((p, idx)=> (
                            editingPlanIndex === idx ? (
                              <tr key={p.id}>
                                <td className="px-2 py-2"><input type="date" value={tempPlanItem?.date ?? p.date} onChange={(e)=>setTempPlanItem((pp:any)=>({...pp, date: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" /></td>
                                <td className="px-2 py-2">
                                  <select value={(tempPlanItem?.collectionType ?? p.collectionType) || ''} onChange={(e)=>setTempPlanItem((pp:any)=>({...pp, collectionType: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white">
                                    <option value="">Seçin</option>
                                    <option value="banka">Banka Havalesi</option>
                                    <option value="pos">Kredi Kartı / Pos</option>
                                    <option value="cek">Çek / Senet</option>
                                    <option value="nakit">Nakit</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2"><input type="text" value={tempPlanItem?.description ?? p.description} onChange={(e)=>setTempPlanItem((pp:any)=>({...pp, description: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama"/></td>
                                <td className="px-2 py-2"><input type="text" value={planAmountInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setPlanAmountInput(raw); const amount=cleanInputValue(raw)||0; const rate=(tempPlanItem?.exchangeRate ?? p.exchangeRate) || 1; const cur=(tempPlanItem?.currency ?? p.currency) || 'TRY'; const tl=cur==='TRY'?amount:amount*rate; setTempPlanItem((pp:any)=>({...pp, amount, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onBlur={(e)=>{ const amount=cleanInputValue(e.target.value)||0; setPlanAmountInput(formatNumberForDisplay(amount)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                                <td className="px-2 py-2"><select value={tempPlanItem?.currency ?? p.currency} onChange={(e)=>{ const cur=e.target.value; const amount=(tempPlanItem?.amount ?? p.amount) || 0; const rate=(tempPlanItem?.exchangeRate ?? p.exchangeRate) || 1; const tl=cur==='TRY'?amount:amount*rate; setTempPlanItem((pp:any)=>({...pp, currency: cur, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white"><option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></td>
                                <td className="px-2 py-2"><input type="number" step="0.0001" value={tempPlanItem?.exchangeRate ?? p.exchangeRate} onChange={(e)=>{ const r=parseFloat(e.target.value)||0; const amount=(tempPlanItem?.amount ?? p.amount) || 0; const cur=(tempPlanItem?.currency ?? p.currency) || 'TRY'; const tl=cur==='TRY'?amount:amount*r; setTempPlanItem((pp:any)=>({...pp, exchangeRate:r, totalTRY: tl})); setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00"/></td>
                                <td className="px-2 py-2"><input type="text" value={planTotalTRYInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setPlanTotalTRYInput(raw); const tl=cleanInputValue(raw)||0; const rate=(tempPlanItem?.exchangeRate ?? p.exchangeRate) || 1; const newAmount=rate>0? tl/rate : 0; setTempPlanItem((pp:any)=>({...pp, totalTRY: tl, amount: newAmount})); setPlanAmountInput(formatNumberForDisplay(newAmount)); }} onBlur={(e)=>{ const tl=cleanInputValue(e.target.value)||0; setPlanTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingPlan(idx, p); } else if (e.key === 'Escape') { e.preventDefault(); resetPlanState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                                <td className="px-2 py-2"><div className="flex gap-1 justify-center"><button onClick={() => saveExistingPlan(idx, p)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={resetPlanState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></td>
                              </tr>
                            ) : (
                              <tr key={p.id}>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(p.date)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{p.collectionType === 'banka' ? 'Banka Havalesi' : p.collectionType === 'pos' ? 'Kredi Kartı / Pos' : p.collectionType === 'cek' ? 'Çek / Senet' : p.collectionType === 'nakit' ? 'Nakit' : '-'}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{p.description}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatNumberForDisplay(p.amount)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-center">{p.currency}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatTRY(p.exchangeRate||1)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatTRY(p.totalTRY||p.amount)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">
                                  <div className="flex gap-1 justify-center">
                                    <button 
                                      onClick={() => { 
                                        setEditingPlanIndex(idx); 
                                        setTempPlanItem({...p}); 
                                        setPlanAmountInput(formatNumberForDisplay(p.amount||0)); 
                                        setPlanTotalTRYInput(formatNumberForDisplay(p.totalTRY||0)); 
                                      }} 
                                      className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" 
                                      title="Düzenle"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => deletePlan(idx, p)} 
                                      className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" 
                                      title="Sil"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tahsilatlar */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tahsilatlar</h3>
                      <button onClick={() => {
                        const item = { date: '', collectionType: '', description: '', amount: 0, currency: 'TRY', exchangeRate: 1, totalTRY: 0 };
                        setTempCollectionItem(item);
                        setEditingCollectionIndex(collections.length);
                        setCollectionAmountInput('');
                        setCollectionTotalTRYInput('');
                      }} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Yeni Tahsilat</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-fixed">
                        <colgroup><col className="w-32" /><col className="w-36" /><col /><col className="w-32" /><col className="w-20" /><col className="w-24" /><col className="w-32" /><col className="w-20" /></colgroup>
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TARİH</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TAHSİLAT TİPİ</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">AÇIKLAMA</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">TUTAR</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">DÖVİZ</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">KUR</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">TOPLAM TL</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">İŞLEMLER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {editingCollectionIndex !== null && editingCollectionIndex === collections.length && (
                            <tr>
                              <td className="px-2 py-2"><input type="date" value={tempCollectionItem?.date || ''} onChange={(e)=>setTempCollectionItem((p:any)=>({...p, date: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" /></td>
                              <td className="px-2 py-2">
                                <select value={tempCollectionItem?.collectionType || ''} onChange={(e)=>setTempCollectionItem((p:any)=>({...p, collectionType: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white">
                                  <option value="">Seçin</option>
                                  <option value="banka">Banka Havalesi</option>
                                  <option value="pos">Kredi Kartı / Pos</option>
                                  <option value="cek">Çek / Senet</option>
                                  <option value="nakit">Nakit</option>
                                </select>
                              </td>
                              <td className="px-2 py-2"><input type="text" value={tempCollectionItem?.description || ''} onChange={(e)=>setTempCollectionItem((p:any)=>({...p, description: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama"/></td>
                              <td className="px-2 py-2"><input type="text" value={collectionAmountInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setCollectionAmountInput(raw); const amount=cleanInputValue(raw)||0; const rate=tempCollectionItem?.exchangeRate||1; const cur=tempCollectionItem?.currency||'TRY'; const tl=cur==='TRY'?amount:amount*rate; setTempCollectionItem((p:any)=>({...p, amount, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onBlur={(e)=>{ const amount=cleanInputValue(e.target.value)||0; setCollectionAmountInput(formatNumberForDisplay(amount)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                              <td className="px-2 py-2"><select value={tempCollectionItem?.currency||'TRY'} onChange={(e)=>{ const cur=e.target.value; const amount=tempCollectionItem?.amount||0; const rate=tempCollectionItem?.exchangeRate||1; const tl=cur==='TRY'?amount:amount*rate; setTempCollectionItem((p:any)=>({...p, currency: cur, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white"><option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></td>
                              <td className="px-2 py-2"><input type="number" step="0.0001" value={tempCollectionItem?.exchangeRate||''} onChange={(e)=>{ const r=parseFloat(e.target.value)||0; const amount=tempCollectionItem?.amount||0; const cur=tempCollectionItem?.currency||'TRY'; const tl=cur==='TRY'?amount:amount*r; setTempCollectionItem((p:any)=>({...p, exchangeRate:r, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00"/></td>
                              <td className="px-2 py-2"><input type="text" value={collectionTotalTRYInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setCollectionTotalTRYInput(raw); const tl=cleanInputValue(raw)||0; const rate=tempCollectionItem?.exchangeRate||1; const newAmount=rate>0? tl/rate : 0; setTempCollectionItem((p:any)=>({...p, totalTRY: tl, amount: newAmount})); setCollectionAmountInput(formatNumberForDisplay(newAmount)); }} onBlur={(e)=>{ const tl=cleanInputValue(e.target.value)||0; setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewCollection(); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                              <td className="px-2 py-2"><div className="flex gap-1 justify-center"><button onClick={saveNewCollection} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={resetCollectionState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></td>
                            </tr>
                          )}
                          {collections.map((c, idx)=> (
                            editingCollectionIndex === idx ? (
                              <tr key={c.id}>
                                <td className="px-2 py-2"><input type="date" value={tempCollectionItem?.date ?? c.date} onChange={(e)=>setTempCollectionItem((cc:any)=>({...cc, date: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" /></td>
                                <td className="px-2 py-2">
                                  <select value={(tempCollectionItem?.collectionType ?? c.collectionType) || ''} onChange={(e)=>setTempCollectionItem((cc:any)=>({...cc, collectionType: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white">
                                    <option value="">Seçin</option>
                                    <option value="banka">Banka Havalesi</option>
                                    <option value="pos">Kredi Kartı / Pos</option>
                                    <option value="cek">Çek / Senet</option>
                                    <option value="nakit">Nakit</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2"><input type="text" value={tempCollectionItem?.description ?? c.description} onChange={(e)=>setTempCollectionItem((cc:any)=>({...cc, description: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama"/></td>
                                <td className="px-2 py-2"><input type="text" value={collectionAmountInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setCollectionAmountInput(raw); const amount=cleanInputValue(raw)||0; const rate=(tempCollectionItem?.exchangeRate ?? c.exchangeRate) || 1; const cur=(tempCollectionItem?.currency ?? c.currency) || 'TRY'; const tl=cur==='TRY'?amount:amount*rate; setTempCollectionItem((cc:any)=>({...cc, amount, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onBlur={(e)=>{ const amount=cleanInputValue(e.target.value)||0; setCollectionAmountInput(formatNumberForDisplay(amount)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                                <td className="px-2 py-2"><select value={tempCollectionItem?.currency ?? c.currency} onChange={(e)=>{ const cur=e.target.value; const amount=(tempCollectionItem?.amount ?? c.amount) || 0; const rate=(tempCollectionItem?.exchangeRate ?? c.exchangeRate) || 1; const tl=cur==='TRY'?amount:amount*rate; setTempCollectionItem((cc:any)=>({...cc, currency: cur, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white"><option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></td>
                                <td className="px-2 py-2"><input type="number" step="0.0001" value={tempCollectionItem?.exchangeRate ?? c.exchangeRate} onChange={(e)=>{ const r=parseFloat(e.target.value)||0; const amount=(tempCollectionItem?.amount ?? c.amount) || 0; const cur=(tempCollectionItem?.currency ?? c.currency) || 'TRY'; const tl=cur==='TRY'?amount:amount*r; setTempCollectionItem((cc:any)=>({...cc, exchangeRate:r, totalTRY: tl})); setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00"/></td>
                                <td className="px-2 py-2"><input type="text" value={collectionTotalTRYInput} onChange={(e)=>{ const raw=e.target.value.replace(/[^0-9.,]/g,'').replace(/\./g,','); setCollectionTotalTRYInput(raw); const tl=cleanInputValue(raw)||0; const rate=(tempCollectionItem?.exchangeRate ?? c.exchangeRate) || 1; const newAmount=rate>0? tl/rate : 0; setTempCollectionItem((cc:any)=>({...cc, totalTRY: tl, amount: newAmount})); setCollectionAmountInput(formatNumberForDisplay(newAmount)); }} onBlur={(e)=>{ const tl=cleanInputValue(e.target.value)||0; setCollectionTotalTRYInput(formatNumberForDisplay(tl)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveExistingCollection(idx, c); } else if (e.key === 'Escape') { e.preventDefault(); resetCollectionState(); } }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal"/></td>
                                <td className="px-2 py-2"><div className="flex gap-1 justify-center"><button onClick={() => saveExistingCollection(idx, c)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={resetCollectionState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></td>
                              </tr>
                            ) : (
                              <tr key={c.id}>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(c.date)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{c.collectionType === 'banka' ? 'Banka Havalesi' : c.collectionType === 'pos' ? 'Kredi Kartı / Pos' : c.collectionType === 'cek' ? 'Çek / Senet' : c.collectionType === 'nakit' ? 'Nakit' : '-'}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">{c.description}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatNumberForDisplay(c.amount)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-center">{c.currency}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatTRY(c.exchangeRate||1)}</td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatTRY(c.totalTRY||c.amount)}</td>
                                <td className="px-2 py-2">
                                  <div className="flex gap-1 justify-center">
                                    <button 
                                      onClick={() => { 
                                        setEditingCollectionIndex(idx); 
                                        setTempCollectionItem({...c}); 
                                        setCollectionAmountInput(formatNumberForDisplay(c.amount||0)); 
                                        setCollectionTotalTRYInput(formatNumberForDisplay(c.totalTRY||0)); 
                                      }} 
                                      className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" 
                                      title="Düzenle"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => deleteCollection(idx, c)} 
                                      className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" 
                                      title="Sil"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bakiye Özeti (Döviz Bazında) */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mt-6 border border-emerald-100 dark:border-emerald-800/50">
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                      Bakiye Özeti (Döviz Bazında)
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-emerald-50/50 dark:bg-emerald-900/40 border-b border-emerald-100 dark:border-emerald-800/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-emerald-900 dark:text-emerald-100">DÖVİZ</th>
                              <th className="px-3 py-2 text-right font-bold text-emerald-900 dark:text-emerald-100">PLANLANAN</th>
                              <th className="px-3 py-2 text-right font-bold text-emerald-900 dark:text-emerald-100">TAHSİL EDİLEN</th>
                              <th className="px-3 py-2 text-right font-bold text-emerald-900 dark:text-emerald-100">BAKİYE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50 dark:divide-emerald-800/30">
                            {Array.from(new Set([...Object.keys(planByCurrency || {}), ...Object.keys(collectedByCurrency || {})])).map((cur) => {
                              const plan = planByCurrency?.[cur] || 0;
                              const collected = collectedByCurrency?.[cur] || 0;
                              const balance = balanceByCurrency?.[cur] || 0;
                              
                              return (
                                <tr key={cur} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white uppercase">{cur}</td>
                                  <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatNumberForDisplay(plan)}</td>
                                  <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatNumberForDisplay(collected)}</td>
                                  <td className={`px-3 py-2 text-right font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                    {formatNumberForDisplay(balance)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-emerald-50/30 dark:bg-emerald-900/30 border-t-2 border-emerald-100 dark:border-emerald-800/50">
                            <tr className="font-bold">
                              <td className="px-3 py-2 text-left text-emerald-900 dark:text-emerald-100">TOPLAM (TRY)</td>
                              <td className="px-3 py-2 text-right text-emerald-900 dark:text-emerald-100">{formatTRY(salesTotals.totalTRY)}</td>
                              <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">{formatTRY(Object.values(collections).reduce((sum, c) => sum + (c.totalTRY || 0), 0))}</td>
                              <td className={`px-3 py-2 text-right ${salesTotals.totalTRY - Object.values(collections).reduce((sum, c) => sum + (c.totalTRY || 0), 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-900 dark:text-emerald-100'}`}>
                                {formatTRY(salesTotals.totalTRY - Object.values(collections).reduce((sum, c) => sum + (c.totalTRY || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
  );
}
