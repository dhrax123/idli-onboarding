import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, ExternalLink, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Select, Spinner, Textarea } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { createSession, type NewSessionInput } from '@/lib/agency-api'
import { INDUSTRIES } from '@/lib/options'
import { onboardingLink } from '@/lib/supabase'
import { copyText, friendlyError } from '@/lib/utils'

const EMPTY: NewSessionInput = { company_name: '', project_name: '', contact_name: '', email: '', phone: '', industry: '', notes: '', welcome_message: '' }

export function shareMessage(company: string, contact: string | null | undefined, link: string) {
  const hi = contact ? `Hi ${contact.split(' ')[0]}` : `Hi ${company} team`
  return `${hi}! Excited to start working together.\n\nHere's your Idli Studios onboarding link. It takes about 15 minutes, saves as you go, and lets you play with fonts, colours and layouts for your new website:\n\n${link}`
}

export function ShareButtons({ company, contact, email, phone, link }: { company: string; contact?: string | null; email?: string | null; phone?: string | null; link: string }) {
  const msg = shareMessage(company, contact, link)
  const wa = `https://wa.me/${(phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  const mail = `mailto:${email ?? ''}?subject=${encodeURIComponent(`Your ${company} onboarding · Idli Studios`)}&body=${encodeURIComponent(msg)}`
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => copyText(link, 'Link copied')}><Copy /> Copy link</Button>
      <Button size="sm" variant="outline" asChild><a href={wa} target="_blank" rel="noreferrer noopener"><MessageCircle /> WhatsApp</a></Button>
      <Button size="sm" variant="outline" asChild><a href={mail}><Mail /> Email</a></Button>
      <Button size="sm" variant="ghost" asChild><a href={link} target="_blank" rel="noreferrer noopener"><ExternalLink /> Open</a></Button>
    </div>
  )
}

export function NewSessionDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewSessionInput>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ id: string; link: string } | null>(null)
  const navigate = useNavigate()
  const set = (patch: Partial<NewSessionInput>) => setForm((f) => ({ ...f, ...patch }))

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) setTimeout(() => { setCreated(null); setForm(EMPTY) }, 200)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim() || !form.project_name.trim()) return
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }
    setBusy(true)
    try {
      const res = await createSession(form)
      setCreated({ id: res.id, link: onboardingLink(res.slug, res.public_token) })
      onCreated()
    } catch (err) {
      toast.error('Could not create onboarding', { description: friendlyError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent title={created ? 'Onboarding link ready' : 'New client onboarding'} description={created ? 'Share this private link with your client. No account needed.' : 'Creates a client and a unique, private onboarding link.'}>
        {created ? (
          <div className="flex flex-col gap-5 px-6 py-6">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success text-white"><Check className="size-4" /></span>
              <code className="min-w-0 flex-1 break-all text-[13px]">{created.link}</code>
            </div>
            <ShareButtons company={form.company_name} contact={form.contact_name} email={form.email} phone={form.phone} link={created.link} />
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button variant="outline" onClick={() => close(false)}>Done</Button>
              <Button onClick={() => { close(false); navigate(`/dashboard/sessions/${created.id}`) }}>View client</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5 px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" htmlFor="ns-company">
                <Input id="ns-company" required maxLength={160} value={form.company_name} onChange={(e) => set({ company_name: e.target.value })} placeholder="Acme Coffee Co." />
              </Field>
              <Field label="Project name" htmlFor="ns-project">
                <Input id="ns-project" required maxLength={160} value={form.project_name} onChange={(e) => set({ project_name: e.target.value })} placeholder="Website redesign" />
              </Field>
              <Field label="Contact person" htmlFor="ns-contact" optional>
                <Input id="ns-contact" maxLength={160} value={form.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
              </Field>
              <Field label="Industry" htmlFor="ns-industry" optional>
                <Select id="ns-industry" value={form.industry} onChange={(e) => set({ industry: e.target.value })}>
                  <option value="">—</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </Select>
              </Field>
              <Field label="Email" htmlFor="ns-email" optional>
                <Input id="ns-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </Field>
              <Field label="Phone / WhatsApp" htmlFor="ns-phone" optional>
                <Input id="ns-phone" type="tel" maxLength={40} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
            </div>
            <Field label="Personal welcome message" htmlFor="ns-welcome" optional hint="Shown on the client’s welcome screen. Leave blank for the default.">
              <Textarea id="ns-welcome" rows={2} maxLength={1000} value={form.welcome_message} onChange={(e) => set({ welcome_message: e.target.value })} />
            </Field>
            <Field label="Internal notes" htmlFor="ns-notes" optional hint="Only visible to the team.">
              <Textarea id="ns-notes" rows={2} maxLength={4000} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button type="submit" disabled={busy || !form.company_name.trim() || !form.project_name.trim()}>
                {busy && <Spinner />} Create link
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
