'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Palette,
  Sliders,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Phone,
  Mail,
  MapPin,
  Clock,
  Languages,
  Eye,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface MessSettingsViewProps {
  tenantSlug: string;
}

export function MessSettingsView({ tenantSlug }: MessSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'operational' | 'privacy'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    coverImage: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    timezone: 'Asia/Dhaka',
    preferredLanguage: 'en',
    themeColor: 'emerald',
    publicWebsiteEnabled: true,
    showMenuOnHomepage: true,
    customTagline: '',
    defaultBillingPeriod: 'CALENDAR_MONTH',
    currency: 'BDT',
    enableRentalModule: true,
    enableMealModule: true,
    enableBazarModule: true,
    notifyOnNewExpense: true,
    notifyOnPaymentReceived: true,
    notifyOnMealCutoff: true,
    memberDirectoryVisibility: 'MEMBERS_ONLY',
    contactVisibility: 'PUBLIC',
    rentalVisibility: 'PUBLIC',
    emergencyContactVisibility: 'ADMINS_ONLY',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/mess/${tenantSlug}/settings`);
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        if (data.success && data.data) {
          const s = data.data;
          setFormData({
            name: s.name || '',
            slug: s.slug || tenantSlug,
            description: s.description || '',
            logo: s.logo || '',
            coverImage: s.coverImage || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            city: s.city || '',
            timezone: s.timezone || 'Asia/Dhaka',
            preferredLanguage: s.preferredLanguage || 'en',
            themeColor: s.themeColor || 'emerald',
            publicWebsiteEnabled: s.publicWebsiteEnabled !== false,
            showMenuOnHomepage: s.showMenuOnHomepage !== false,
            customTagline: s.customTagline || '',
            defaultBillingPeriod: s.defaultBillingPeriod || 'CALENDAR_MONTH',
            currency: s.currency || 'BDT',
            enableRentalModule: s.enableRentalModule !== false,
            enableMealModule: s.enableMealModule !== false,
            enableBazarModule: s.enableBazarModule !== false,
            notifyOnNewExpense: s.notifyOnNewExpense !== false,
            notifyOnPaymentReceived: s.notifyOnPaymentReceived !== false,
            notifyOnMealCutoff: s.notifyOnMealCutoff !== false,
            memberDirectoryVisibility: s.memberDirectoryVisibility || 'MEMBERS_ONLY',
            contactVisibility: s.contactVisibility || 'PUBLIC',
            rentalVisibility: s.rentalVisibility || 'PUBLIC',
            emergencyContactVisibility: s.emergencyContactVisibility || 'ADMINS_ONLY',
          });
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading mess configuration');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [tenantSlug]);

  const handleSaveTab = async (section: 'general' | 'appearance' | 'operational' | 'privacy') => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      let endpoint = `/api/v1/mess/${tenantSlug}/settings/${section}`;
      let payload: any = {};

      if (section === 'general') {
        payload = {
          name: formData.name,
          description: formData.description,
          logo: formData.logo,
          coverImage: formData.coverImage,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          timezone: formData.timezone,
          preferredLanguage: formData.preferredLanguage,
        };
      } else if (section === 'appearance') {
        payload = {
          themeColor: formData.themeColor,
          publicWebsiteEnabled: formData.publicWebsiteEnabled,
          showMenuOnHomepage: formData.showMenuOnHomepage,
          customTagline: formData.customTagline,
        };
      } else if (section === 'operational') {
        payload = {
          defaultBillingPeriod: formData.defaultBillingPeriod,
          currency: formData.currency,
          enableRentalModule: formData.enableRentalModule,
          enableMealModule: formData.enableMealModule,
          enableBazarModule: formData.enableBazarModule,
          notifyOnNewExpense: formData.notifyOnNewExpense,
          notifyOnPaymentReceived: formData.notifyOnPaymentReceived,
          notifyOnMealCutoff: formData.notifyOnMealCutoff,
        };
      } else if (section === 'privacy') {
        payload = {
          memberDirectoryVisibility: formData.memberDirectoryVisibility,
          contactVisibility: formData.contactVisibility,
          rentalVisibility: formData.rentalVisibility,
          emergencyContactVisibility: formData.emergencyContactVisibility,
        };
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save configuration');
      }

      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const isBn = formData.preferredLanguage === 'bn';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isBn ? 'মেস সেটিংস লোড হচ্ছে...' : 'Loading mess settings and configurations...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {isBn ? 'মেস সেটিংস ও পছন্দসমূহ' : 'Mess Settings & Configuration'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isBn
              ? 'সাধারণ তথ্য, ব্র্যান্ডিং, অপারেশনাল নিয়ম এবং ডেটা গোপনীয়তা নিয়ন্ত্রণ করুন।'
              : 'Configure general profile, appearance, operational rules, and privacy controls for your mess.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Globe className="h-3.5 w-3.5" />
            {formData.slug}.messmate.com
          </span>
        </div>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'general'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Building className="h-4 w-4" />
          {isBn ? 'সাধারণ প্রোফাইল' : 'General'}
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'appearance'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          {isBn ? 'চেহারা ও ব্র্যান্ডিং' : 'Appearance'}
        </button>
        <button
          onClick={() => setActiveTab('operational')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'operational'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          {isBn ? 'অপারেশনাল নিয়ম' : 'Operational'}
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'privacy'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          {isBn ? 'গোপনীয়তা ও দৃশ্যমানতা' : 'Privacy & Visibility'}
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {isBn ? 'মেসের সাধারণ পরিচিতি' : 'General Mess Profile'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isBn
                ? 'আপনার মেসের নাম, যোগাযোগ এবং অফিসিয়াল লোকেশন আপডেট করুন।'
                : 'Manage primary identity, communication channels, and location details.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'মেসের নাম *' : 'Mess Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'মেস সাবডোমেন (ফিক্সড)' : 'Mess Subdomain (Fixed)'}
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.slug}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isBn
                  ? 'সাবডোমেন পরিবর্তন করতে প্ল্যাটফর্ম অ্যাডমিনের সাথে যোগাযোগ করুন।'
                  : 'Subdomains are reserved. Contact Super Admin to request custom domain mapping.'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'সংক্ষিপ্ত বিবরণ / ট্যাগলাইন' : 'Description / About the Mess'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isBn ? 'মেসের অবস্থান ও সুবিধা সম্পর্কে লিখুন...' : 'Brief overview of facilities and atmosphere...'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'অফিসিয়াল ফোন নম্বর' : 'Contact Phone'}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+8801700000000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'অফিসিয়াল ইমেইল' : 'Contact Email'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@messmate.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'ঠিকানা' : 'Street Address'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House 12, Road 4, Sector 7"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'শহর / জেলা' : 'City / District'}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Dhaka"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'টাইমজোন' : 'Timezone'}
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'পছন্দের ভাষা' : 'Preferred Language'}
              </label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English (Default)</option>
                <option value="bn">বাংলা (Bangla)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => handleSaveTab('general')}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isBn ? 'সাধারণ তথ্য সংরক্ষণ করুন' : 'Save General Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE & BRANDING */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {isBn ? 'চেহারা ও ব্র্যান্ডিং সেটিংস' : 'Appearance & Branding'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isBn
                ? 'লোগো, কভার ফটো এবং মেসের পোর্টালের থিম কালার কাস্টমাইজ করুন।'
                : 'Customize theme colors, public portal visibility, and logo branding.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                {isBn ? 'থিম কালার সিলেক্ট করুন' : 'Theme Accent Color'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
                  { id: 'blue', label: 'Blue', bg: 'bg-blue-600' },
                  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                  { id: 'teal', label: 'Teal', bg: 'bg-teal-600' },
                  { id: 'purple', label: 'Purple', bg: 'bg-purple-600' },
                  { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, themeColor: color.id })}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.themeColor === color.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-foreground'
                        : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${color.bg}`} />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'লোগো ইমেজ লিঙ্ক (URL)' : 'Logo Image URL'}
              </label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {isBn ? 'বর্গাকার পিএনজি বা জেপিজি ইমেজ ব্যবহার করুন।' : 'Square PNG or SVG with transparent background recommended.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'কভার ফটো লিঙ্ক (URL)' : 'Cover Photo URL'}
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {isBn ? 'পাবলিক পেজের ব্যানারে প্রদর্শিত হবে।' : 'Displayed at the top of your public mess portal.'}
              </p>
            </div>

            <div className="md:col-span-2 space-y-4 pt-2 border-t border-border">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {isBn ? 'পাবলিক ওয়েবসাইট সক্ষম রাখুন' : 'Enable Public Website'}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {isBn
                      ? 'ভিজিটররা আপনার মেসের বিবরণ ও রুম রেন্টাল পেজ দেখতে পারবেন।'
                      : 'Allows external visitors to view your public landing page, amenities, and vacant bed listings.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.publicWebsiteEnabled}
                  onChange={(e) => setFormData({ ...formData, publicWebsiteEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {isBn ? 'হোমপেজে ডাইনিং মেনু প্রদর্শন করুন' : 'Show Today\'s Menu on Portal'}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {isBn
                      ? 'আজকের ব্রেকফাস্ট, লাঞ্চ এবং ডিনারের মেনু সদস্যরা বাইরে থেকেও দেখতে পারবেন।'
                      : 'Display today\'s daily meal log on the mess homepage.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showMenuOnHomepage}
                  onChange={(e) => setFormData({ ...formData, showMenuOnHomepage: e.target.checked })}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => handleSaveTab('appearance')}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isBn ? 'ব্র্যান্ডিং তথ্য সংরক্ষণ করুন' : 'Save Appearance Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL DEFAULTS */}
      {activeTab === 'operational' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              {isBn ? 'অপারেশনাল ও মডিউল সেটিংস' : 'Operational Defaults & Modules'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isBn
                ? 'বিলিং সাইকেল, সক্রিয় ফিচার মডিউল এবং নোটিফিকেশন অগ্রাধিকার নির্ধারণ করুন।'
                : 'Configure default billing intervals, active modules, and automated notifications.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'ডিফল্ট বিলিং সাইকেল' : 'Default Billing Period'}
              </label>
              <select
                value={formData.defaultBillingPeriod}
                onChange={(e) => setFormData({ ...formData, defaultBillingPeriod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CALENDAR_MONTH">Calendar Month (1st to 30th/31st)</option>
                <option value="MID_MONTH">Mid Month (15th to 14th)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                {isBn ? 'অফিসিয়াল মুদ্রা' : 'Currency'}
              </label>
              <input
                type="text"
                value={formData.currency}
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {isBn ? 'বাংলাদেশি টাকা (BDT) এ সকল হিসাব পরিচালিত হয়।' : 'Bangladeshi Taka (BDT) integer poisha math is enforced platform-wide.'}
              </p>
            </div>

            <div className="md:col-span-2 space-y-3 pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {isBn ? 'সক্রিয় ফিচার মডিউল' : 'Active Feature Modules'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableMealModule}
                    onChange={(e) => setFormData({ ...formData, enableMealModule: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{isBn ? 'মিল ম্যানেজমেন্ট' : 'Meals Module'}</span>
                    <span className="text-[11px] text-muted-foreground">{isBn ? 'ডাইনিং ও মিল হিসাব' : 'Daily sheets & rates'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableBazarModule}
                    onChange={(e) => setFormData({ ...formData, enableBazarModule: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{isBn ? 'বাজার ও খরচ' : 'Bazar & Expenses'}</span>
                    <span className="text-[11px] text-muted-foreground">{isBn ? 'বাজার শিডিউল ও ভাউচার' : 'Grocery tracking'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableRentalModule}
                    onChange={(e) => setFormData({ ...formData, enableRentalModule: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{isBn ? 'রুম রেন্টাল' : 'Rental Listings'}</span>
                    <span className="text-[11px] text-muted-foreground">{isBn ? 'ফাঁকা সিট বিজ্ঞাপন' : 'Guest space rentals'}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3 pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                {isBn ? 'অটোমেটিক নোটিফিকেশন' : 'Notification Preferences'}
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-xs font-medium text-foreground">
                    {isBn ? 'নতুন বাজার খরচ এন্ট্রি হলে নোটিফিকেশন পাঠান' : 'Notify members when new grocery expenses are submitted'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnNewExpense}
                    onChange={(e) => setFormData({ ...formData, notifyOnNewExpense: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-xs font-medium text-foreground">
                    {isBn ? 'পেমেন্ট ভেরিফাই বা কনফার্ম হলে নোটিফিকেশন পাঠান' : 'Notify members upon payment confirmation or receipt approval'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnPaymentReceived}
                    onChange={(e) => setFormData({ ...formData, notifyOnPaymentReceived: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-xs font-medium text-foreground">
                    {isBn ? 'মিল অফ কাটঅফ সময়ের ৩০ মিনিট আগে রিমাইন্ডার দিন' : 'Send meal-off cutoff reminder 30 minutes before evening deadline'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnMealCutoff}
                    onChange={(e) => setFormData({ ...formData, notifyOnMealCutoff: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => handleSaveTab('operational')}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isBn ? 'অপারেশনাল নিয়ম সংরক্ষণ করুন' : 'Save Operational Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY & VISIBILITY */}
      {activeTab === 'privacy' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isBn ? 'তথ্য সুরক্ষা ও দৃশ্যমানতা পলিসি' : 'Privacy & Visibility Governance'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isBn
                ? 'সদস্যদের ব্যক্তিগত তথ্য, ফোন নম্বর এবং ডিরেক্টরি উন্মুক্ততার সীমা নির্ধারণ করুন।'
                : 'Configure access controls and data visibility bounds across public visitors and residents.'}
            </p>
          </div>

          {/* Privacy Security Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {isBn ? 'জরুরি যোগাযোগ ডেটা পলিসি (আবশ্যিক)' : 'Mandatory Privacy Policy for Emergency Contacts:'}
              </p>
              <p>
                {isBn
                  ? 'সদস্যদের জরুরি যোগাযোগের নাম বা ফোন নম্বর কখনোই সাধারণ পাবলিকদের কাছে উন্মুক্ত করা যাবে না। এটি কেবল দায়িত্বপ্রাপ্ত অ্যাডমিন বা সংশ্লিষ্ট সদস্যের মধ্যে সীমাবদ্ধ।'
                  : 'Emergency contact information and private national identity documents are restricted to Mess Administrators and cannot be exposed publicly.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'সদস্য ডিরেক্টরি দৃশ্যমানতা' : 'Member Directory Visibility'}
              </label>
              <select
                value={formData.memberDirectoryVisibility}
                onChange={(e) => setFormData({ ...formData, memberDirectoryVisibility: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MEMBERS_ONLY">Members Only (Recommended)</option>
                <option value="PRIVATE">Admins Only (Strict Privacy)</option>
                <option value="PUBLIC">Public Website Roster</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'সদস্য ফোন নম্বর দৃশ্যমানতা' : 'Member Contact Visibility'}
              </label>
              <select
                value={formData.contactVisibility}
                onChange={(e) => setFormData({ ...formData, contactVisibility: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PUBLIC">Public & Resident Directory</option>
                <option value="MEMBERS_ONLY">Registered Mess Residents Only</option>
                <option value="PRIVATE">Admins Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {isBn ? 'রেন্টাল লিস্টিং দৃশ্যমানতা' : 'Rental Listing Visibility'}
              </label>
              <select
                value={formData.rentalVisibility}
                onChange={(e) => setFormData({ ...formData, rentalVisibility: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PUBLIC">Public (Published on MessMate & Search)</option>
                <option value="PRIVATE">Internal / Unlisted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Lock className="h-3.5 w-3.5" />
                {isBn ? 'জরুরি যোগাযোগ দৃশ্যমানতা (সংরক্ষিত)' : 'Emergency Contact Visibility (Restricted)'}
              </label>
              <select
                value={formData.emergencyContactVisibility}
                onChange={(e) => setFormData({ ...formData, emergencyContactVisibility: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="ADMINS_ONLY">Admins Only (High Security Standard)</option>
                <option value="PRIVATE">Strictly Private (Personal Log Only)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => handleSaveTab('privacy')}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isBn ? 'গোপনীয়তা পলিসি সংরক্ষণ করুন' : 'Save Privacy Controls'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
