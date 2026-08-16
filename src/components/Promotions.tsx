/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Promotion, Product } from '../types';
import { db } from '../utils/db';
import {
  Megaphone,
  PlusCircle,
  Share2,
  PhoneCall,
  Facebook,
  Copy,
  Trash2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>(() => db.getPromotions());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());

  // Tabs: "promos" | "create"
  const [activeTab, setActiveTab] = useState<'promos' | 'create'>('promos');

  // Form State
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(10);

  useEffect(() => {
    setPromotions(db.getPromotions());
    setProducts(db.getProducts());
  }, [activeTab]);

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pId => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoDesc.trim()) {
      alert('Promotion title and description are required.');
      return;
    }
    if (selectedProductIds.length === 0) {
      alert('Select at least 1 spare part for this campaign.');
      return;
    }

    db.addPromotion({
      title: promoTitle.trim(),
      description: promoDesc.trim(),
      product_ids: selectedProductIds,
      discount_percent: discountPercent
    });

    setPromoTitle('');
    setPromoDesc('');
    setSelectedProductIds([]);
    setDiscountPercent(10);
    setActiveTab('promos');
    alert('Promo flyer created successfully!');
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('Are you sure you want to delete this promotional flyer?')) {
      db.deletePromotion(id);
      setPromotions(db.getPromotions());
    }
  };

  // Generate marketing copy for Whatsapp / Facebook
  const getPromoText = (promo: Promotion) => {
    const promoProds = products.filter(p => promo.product_ids.includes(p.id));
    let text = `🔥 *${promo.title.toUpperCase()}* 🔥\n\n`;
    text += `⚡ _${promo.description}_\n\n`;
    text += `💥 *FEATURED SPARE PARTS SPECIAL OFFER:* 💥\n`;
    
    promoProds.forEach(p => {
      const orig = p.selling_price;
      const promoPrice = orig * (1 - promo.discount_percent / 100);
      text += `• *${p.part_name}*\n  _Fitment: ${p.compatibility}_\n  💵 Price: *LKR ${promoPrice.toLocaleString()}* (Save ${promo.discount_percent}%! was LKR ${orig.toLocaleString()})\n\n`;
    });

    text += `📞 *Order Now on WhatsApp / Call:* ${db.getSettings().shop_phone}\n`;
    text += `📍 *Visit shop at:* ${db.getSettings().shop_address}\n`;
    text += `Genuine parts. Quality Guaranteed. 👍🏼`;
    return text;
  };

  const handleCopyText = (promo: Promotion) => {
    const text = getPromoText(promo);
    navigator.clipboard.writeText(text);
    alert('Marketing campaign text copied to clipboard successfully!');
  };

  const handleWhatsAppShare = (promo: Promotion) => {
    const text = encodeURIComponent(getPromoText(promo));
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = (promo: Promotion) => {
    const text = getPromoText(promo);
    // Standard facebook copy-share helper advice
    navigator.clipboard.writeText(text);
    alert(`We have copied the campaign text for you! Open Facebook and paste this beautiful post format to share instantly.`);
    window.open('https://www.facebook.com/', '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" />
            WhatsApp Promotions & Sharing
          </h2>
          <p className="text-sm text-slate-500">Design customer promos, select auto spare parts, and share instantly on social channels</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'promos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Promotions Campaigns
          </button>
          <button
            onClick={() => setActiveTab('create')}
            id="create-promotion-tab"
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Create New Flyer
          </button>
        </div>
      </div>

      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
              No active promotions registered. Choose "Create New Flyer" above to generate a marketing post.
            </div>
          ) : (
            promotions.map(promo => {
              const promoProds = products.filter(p => promo.product_ids.includes(p.id));

              return (
                <div key={promo.id} className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-slate-950 text-sm leading-snug flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {promo.title}
                      </h3>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Delete Flyer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 italic font-medium">"{promo.description}"</p>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Promotional Spare Parts:</span>
                      <div className="space-y-1.5 text-xs">
                        {promoProds.map(p => {
                          const promoPrice = p.selling_price * (1 - promo.discount_percent / 100);
                          return (
                            <div key={p.id} className="flex justify-between items-center text-slate-700">
                              <span className="font-semibold truncate max-w-[180px]">{p.part_name}</span>
                              <span className="font-mono font-bold text-blue-700 text-[11px]">
                                LKR {promoPrice.toLocaleString()} ({promo.discount_percent}% Off)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">Created: {new Date(promo.created_at).toLocaleDateString()}</span>
                    
                    <div className="flex gap-1.5 text-xs font-bold">
                      <button
                        onClick={() => handleCopyText(promo)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 transition-colors"
                        title="Copy text flyer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Text
                      </button>
                      <button
                        onClick={() => handleWhatsAppShare(promo)}
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded flex items-center gap-1 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleFacebookShare(promo)}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center gap-1 transition-colors"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                        Facebook
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <form onSubmit={handleCreatePromo} className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base">Design Promotional Post campaign</h3>
            <p className="text-xs text-slate-500 mt-1">Select multiple spare parts, apply discounts, and generate WhatsApp flyers instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Brake Service Promo"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Promotion Campaign Discount (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Promotional Pitch Description *</label>
                <textarea
                  placeholder="e.g. Save massive amounts with our vehicle service and replacement part bundle discounts!"
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 h-24 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* SPARE PART SELECTOR LIST */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[300px]">
              <div className="bg-slate-100 p-2 border-b border-slate-200 font-bold text-slate-800 text-xs">
                Select Promotional Products
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 space-y-1">
                {products.map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelectProduct(p.id)}
                      className={`p-2 rounded cursor-pointer transition-all flex justify-between items-center text-xs ${
                        isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div>
                        <div>{p.part_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.item_code}</div>
                      </div>
                      <div className="font-mono">LKR {p.selling_price.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-lg transition-colors flex justify-center items-center gap-1.5 shadow"
          >
            <Megaphone className="w-4 h-4" />
            Save Promotional Flyer
          </button>
        </form>
      )}
    </div>
  );
}
