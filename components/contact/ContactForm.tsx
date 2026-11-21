'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Mail, MapPin, PhoneCall } from 'lucide-react';
import {
  isContactFormValid,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormValues,
} from '@/lib/contact-validation';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

const INITIAL_VALUES: ContactFormValues = {
  fullName: '',
  email: '',
  phone: '',
  messType: 'student',
  memberCount: '12',
  subject: '',
  message: '',
};

export function ContactForm() {
  const { locale, t } = useLanguage();
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFormValues, boolean>>>({});
  const [submittedRecord, setSubmittedRecord] = useState<ContactFormValues | null>(null);

  const handleChange = <K extends keyof ContactFormValues>(
    field: K,
    nextVal: ContactFormValues[K]
  ) => {
    const updated = { ...values, [field]: nextVal };
    setValues(updated);
    if (touched[field]) {
      const nextErrors = validateContactForm(updated, locale);
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    }
  };

  const handleBlur = (field: keyof ContactFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const nextErrors = validateContactForm(values, locale);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateContactForm(values, locale);
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      messType: true,
      memberCount: true,
      subject: true,
      message: true,
    });

    if (!isContactFormValid(validationErrors)) {
      return;
    }

    setSubmittedRecord(values);
  };

  const handleReset = () => {
    setSubmittedRecord(null);
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
  };

  const inputBase =
    'mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#172B4D] placeholder:text-[#8898AA] focus:outline-none focus:ring-2 transition-colors';

  return (
    <div>
      <PageHero
        kicker={t.nav.contact}
        title={t.pages.contact.title}
        subtitle={t.pages.contact.subtitle}
      />

      <section className="bg-[#F8F9FE] py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Validated Form Left */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 argon-card-shadow">
              {submittedRecord ? (
                <div
                  role="status"
                  data-testid="contact-success-panel"
                  className="py-8 text-center space-y-4"
                >
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#172B4D]">
                    {t.pages.contact.successTitle}
                  </h2>
                  <p className="text-sm sm:text-base text-[#525F7F] max-w-md mx-auto leading-relaxed">
                    {t.pages.contact.successBody}
                  </p>
                  <div className="mx-auto max-w-md rounded-xl bg-[#F8F9FE] border border-slate-200 p-4 text-left text-xs text-[#525F7F] space-y-1">
                    <p>
                      <strong className="text-[#172B4D]">{t.pages.contact.fullName}:</strong>{' '}
                      {submittedRecord.fullName}
                    </p>
                    <p>
                      <strong className="text-[#172B4D]">{t.pages.contact.email}:</strong>{' '}
                      {submittedRecord.email}
                    </p>
                    <p>
                      <strong className="text-[#172B4D]">{t.pages.contact.subject}:</strong>{' '}
                      {submittedRecord.subject}
                    </p>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="md" onClick={handleReset}>
                      {t.pages.contact.sendAnother}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#172B4D]">
                      {t.pages.contact.formTitle}
                    </h2>
                    <p className="mt-1 text-sm text-[#525F7F]">
                      {t.pages.contact.formSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-fullname"
                        className="block text-sm font-semibold text-[#172B4D]"
                      >
                        {t.pages.contact.fullName}
                      </label>
                      <input
                        id="contact-fullname"
                        name="fullName"
                        type="text"
                        value={values.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={errors.fullName ? 'error-fullname' : undefined}
                        placeholder="Tanvir Hasan"
                        className={`${inputBase} ${
                          errors.fullName
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                        }`}
                      />
                      {errors.fullName && (
                        <p id="error-fullname" className="mt-1.5 text-xs font-medium text-rose-600">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold text-[#172B4D]"
                      >
                        {t.pages.contact.email}
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'error-email' : undefined}
                        placeholder="manager@residence.com"
                        className={`${inputBase} ${
                          errors.email
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                        }`}
                      />
                      {errors.email && (
                        <p id="error-email" className="mt-1.5 text-xs font-medium text-rose-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-sm font-semibold text-[#172B4D]"
                      >
                        {t.pages.contact.phone}
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={values.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'error-phone' : undefined}
                        placeholder="+880 1711-000000"
                        className={`${inputBase} ${
                          errors.phone
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                        }`}
                      />
                      {errors.phone && (
                        <p id="error-phone" className="mt-1.5 text-xs font-medium text-rose-600">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-mess-type"
                        className="block text-sm font-semibold text-[#172B4D]"
                      >
                        {t.pages.contact.messType}
                      </label>
                      <select
                        id="contact-mess-type"
                        name="messType"
                        value={values.messType}
                        onChange={(e) =>
                          handleChange(
                            'messType',
                            e.target.value as ContactFormValues['messType']
                          )
                        }
                        className={`${inputBase} border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25`}
                      >
                        <option value="student">{t.pages.contact.messTypes.student}</option>
                        <option value="bachelor">{t.pages.contact.messTypes.bachelor}</option>
                        <option value="job-holder">{t.pages.contact.messTypes['job-holder']}</option>
                        <option value="shared-apartment">
                          {t.pages.contact.messTypes['shared-apartment']}
                        </option>
                        <option value="multi-mess">{t.pages.contact.messTypes['multi-mess']}</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-members"
                        className="block text-sm font-semibold text-[#172B4D]"
                      >
                        {t.pages.contact.memberCount}
                      </label>
                      <input
                        id="contact-members"
                        name="memberCount"
                        type="number"
                        min={1}
                        max={500}
                        value={values.memberCount}
                        onChange={(e) => handleChange('memberCount', e.target.value)}
                        onBlur={() => handleBlur('memberCount')}
                        aria-invalid={Boolean(errors.memberCount)}
                        aria-describedby={errors.memberCount ? 'error-members' : undefined}
                        className={`${inputBase} font-mono tabular-nums ${
                          errors.memberCount
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                        }`}
                      />
                      {errors.memberCount && (
                        <p id="error-members" className="mt-1.5 text-xs font-medium text-rose-600">
                          {errors.memberCount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-sm font-semibold text-[#172B4D]"
                    >
                      {t.pages.contact.subject}
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      value={values.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      onBlur={() => handleBlur('subject')}
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? 'error-subject' : undefined}
                      placeholder={
                        locale === 'en'
                          ? 'Setting up MessMate for our 16-member student mess'
                          : 'আমাদের ১৬ সদস্যের মেসের জন্য সেটআপ সহায়তা'
                      }
                      className={`${inputBase} ${
                        errors.subject
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                      }`}
                    />
                    {errors.subject && (
                      <p id="error-subject" className="mt-1.5 text-xs font-medium text-rose-600">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-semibold text-[#172B4D]"
                    >
                      {t.pages.contact.message}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      value={values.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      onBlur={() => handleBlur('message')}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'error-message' : undefined}
                      placeholder={
                        locale === 'en'
                          ? 'Share your room structure, billing cycle, or demo questions...'
                          : 'আপনার রুম সংখ্যা, মিল সিস্টেম বা ডেমো সংক্রান্ত প্রশ্ন লিখুন...'
                      }
                      className={`${inputBase} ${
                        errors.message
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#324CDD] focus:ring-[#5E72E4]/25'
                      }`}
                    />
                    {errors.message && (
                      <p id="error-message" className="mt-1.5 text-xs font-medium text-rose-600">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                      {t.pages.contact.submitBtn}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Direct Channels Right */}
            <aside className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-5">
                <h2 className="text-lg font-bold text-[#172B4D]">
                  {t.pages.contact.channelsTitle}
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {locale === 'en' ? 'Email' : 'ইমেইল'}
                      </p>
                      <p className="text-[#525F7F]">hello@messmate.app · onboarding@messmate.app</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PhoneCall className="h-5 w-5 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {locale === 'en' ? 'Phone & WhatsApp Desk' : 'ফোন ও হোয়াটসঅ্যাপ ডেস্ক'}
                      </p>
                      <p className="font-mono tabular-nums text-[#525F7F]">+880 9612-884422</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {t.pages.contact.supportHoursLabel}
                      </p>
                      <p className="text-[#525F7F]">{t.pages.contact.supportHoursValue}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {t.pages.contact.officeLabel}
                      </p>
                      <p className="text-[#525F7F]">{t.pages.contact.officeValue}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#172B4D] p-6 text-white space-y-2">
                <p className="text-xs font-semibold text-[#7DD3FC]">
                  {t.pages.contact.responseLabel}
                </p>
                <p className="text-base font-bold text-white">
                  {t.pages.contact.responseValue}
                </p>
                <p className="text-xs text-slate-300 pt-2">
                  {t.faq.supportPrompt}{' '}
                  <Link href="/faq" className="text-[#7DD3FC] underline">
                    {t.faq.viewAllCta}
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  );
}
