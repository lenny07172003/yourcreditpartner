/**
 * Partner-facing email templates.
 * All templates return { subject, body } where body is markdown
 * that gets rendered through markdownToHtml() + wrapInLayout().
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

// ============================================================
// FLOW 1: WELCOME SERIES (5 emails)
// ============================================================

export const WELCOME_SERIES = [
  {
    step: 0,
    dayOffset: 0,
    subject: (name: string) => `Welcome to YourCreditPartner, ${name}!`,
    body: (p: { firstName: string; partnerSlug: string }) =>
      `Hi ${p.firstName},

Welcome to the YourCreditPartner family! You're now set up to earn commissions by referring clients who need credit repair.

**Here's how it works in 3 simple steps:**

1. You refer a client through your dashboard or unique link
2. We repair their credit with our proven process
3. You earn 15-35% commission on every closed deal

**Your unique referral link:**
${APP_URL}/refer/${p.partnerSlug}

Share this with anyone who needs credit help — friends, family, clients, anyone.

[Go to Your Dashboard](${APP_URL}/dashboard)

We're excited to have you on board. Let's build something great together.

Best,
The YourCreditPartner Team`,
  },
  {
    step: 1,
    dayOffset: 1,
    subject: (name: string) => `Your first referral = your first commission, ${name}`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Submitting your first referral takes less than 60 seconds:

1. Click "Submit a Referral" on your dashboard
2. Enter your client's name, email, and phone
3. Hit submit — we handle everything from there

Your client gets a **free credit consultation** (no charge to them, no charge to you). If they sign up, you earn a commission.

It's that simple.

[Submit Your First Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    step: 2,
    dayOffset: 3,
    subject: (name: string) => `The 3-minute referral trick top partners use, ${name}`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Our top-earning partners all do the same thing:

**At the end of every client meeting, they ask one question:**

*"By the way — have you checked your credit recently? If there's anything holding you back, I know a team that can help for free."*

That's it. One sentence. Three seconds.

Most people say "actually, yeah" — because 80% of Americans have at least one error on their credit report.

You're not selling anything. You're offering a free resource. And when they sign up, you earn a commission.

Try it in your next 5 client conversations and see what happens.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    step: 3,
    dayOffset: 5,
    subject: (name: string) => `How our commission tiers work (you'll want to know this), ${name}`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Here's how our tiered commission structure works — and why it's designed to reward you more as you grow:

**Starter (1-9 closes/month)** → 15% commission
Example: 5 closes × $200 avg = **$150/month**

**Producer (10-24 closes/month)** → 20% commission
Example: 15 closes × $200 avg = **$600/month**

**Top Tier (25-39 closes/month)** → 25% commission
Example: 30 closes × $200 avg = **$1,500/month**

**Elite (40+ closes/month)** → 35% commission
Example: 45 closes × $200 avg = **$3,150/month**

**The best part?** It's **retroactive**. When you cross a tier threshold, ALL your closes that month recalculate at the higher rate.

So if you're at 9 closes and land one more — all 10 jump from 15% to 20%.

[Check Your Current Tier](${APP_URL}/dashboard)

Best,
The YourCreditPartner Team`,
  },
  {
    step: 4,
    dayOffset: 7,
    subject: (name: string) => `Quick question, ${name}: have you submitted your first referral yet?`,
    body: (p: { firstName: string; partnerSlug: string }) =>
      `Hi ${p.firstName},

It's been a week since you joined — just checking in.

If you haven't submitted your first referral yet, no pressure. But here's a reminder of how easy it is:

- **Option 1:** Submit through your dashboard → [Submit Referral](${APP_URL}/dashboard/submit)
- **Option 2:** Share your link and let the client fill in their own info → ${APP_URL}/refer/${p.partnerSlug}

Either way, the client gets a free consultation and you're on your way to your first commission.

Questions? Just reply to this email.

Best,
The YourCreditPartner Team`,
  },
];

// ============================================================
// FLOW 2: REFERRAL NUDGES (4 rotating variations)
// ============================================================

export const NUDGE_VARIATIONS = [
  {
    subject: (name: string) => `${name}, got any clients this week?`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Think about the last 5 client conversations you had — did any of them mention credit challenges? A denied loan? A low score?

If so, you're sitting on a commission. It takes 60 seconds to refer them.

[Submit a Referral Now](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    subject: (name: string) => `60 seconds. That's all it takes, ${name}.`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

One referral. 60 seconds of your time.

Your client gets free credit help. You earn a commission. Everyone wins.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    subject: (name: string) => `Don't leave money on the table, ${name}`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Your top competitors are already referring their clients for credit repair. They're earning extra income while strengthening their client relationships.

Every client you don't refer is money left on the table.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    subject: (name: string) => `Quick math for you, ${name}`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Let's do some quick math:

- **3 referrals/month** × $200 avg commission = **$7,200/year**
- **5 referrals/month** × $200 avg commission = **$12,000/year**
- **10 referrals/month** × $200 avg commission = **$24,000/year** (at Producer tier)

That's passive income on top of what you already earn.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
];

// ============================================================
// FLOW 3: CREDIT TIPS TO SHARE (12 rotating topics)
// ============================================================

export const CREDIT_TIPS = [
  {
    title: "5 Things Killing Your Client's Credit Score",
    subject: "Share this with your clients: 5 hidden credit killers",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Here's a tip you can share with your clients — it positions you as a trusted advisor and opens the door to a referral:

**5 Things Killing Your Client's Credit Score (That They Don't Know About):**

1. **Late payments on forgotten accounts** — even a $15 gym membership in collections
2. **High credit utilization** — using more than 30% of available credit
3. **Closing old accounts** — hurts their average age of credit
4. **Multiple hard inquiries** — rate shopping without knowing the rules
5. **Identity errors** — wrong accounts, duplicate entries, mixed files

**Forward this to a client** and add: *"If any of these sound familiar, I know a team that fixes this for free. Want me to connect you?"*

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "How to Read a Credit Report in 5 Minutes",
    subject: "Share this with your clients: credit report reading guide",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Here's something your clients will thank you for:

**How to Read a Credit Report in 5 Minutes:**

- **Personal info section** — check for wrong names, addresses, or SSN variants
- **Accounts section** — look for accounts they don't recognize
- **Payment history** — any late payments that shouldn't be there?
- **Inquiries** — hard pulls they didn't authorize
- **Collections** — debts they already paid or don't owe

**Pro tip for your clients:** They can pull free reports at annualcreditreport.com

If they find anything wrong — that's where we come in.

[Refer a Client](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "The 30% Rule",
    subject: "Share this with your clients: the 30% credit rule",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Quick tip to share with your clients:

**The 30% Rule:** Credit utilization (how much of their credit limit they're using) makes up 30% of their credit score.

Tell your clients: *"Keep your balances below 30% of your limit on each card. Below 10% is even better."*

**Example:** $10,000 credit limit → keep balance under $3,000 (ideally under $1,000)

Most people don't know this. Sharing it makes you the expert they trust.

And if their credit needs more help than tips can fix → [Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "How a 100-Point Improvement Saves $50K",
    subject: "Share this with your clients: the $50K credit gap",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Here's a stat that gets people's attention:

**A 100-point credit score improvement can save your client $50,000+ on a 30-year mortgage.**

- 620 score → 6.5% rate → $455K total on a $300K loan
- 720 score → 5.5% rate → $405K total on a $300K loan
- **That's a $50,000 difference.**

Share this with any client thinking about buying a home, refinancing, or getting a car loan. The math speaks for itself.

[Refer a Client for Free Credit Repair](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Credit Repair Timeline",
    subject: "Share this: how long does credit repair actually take?",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

The #1 question clients ask: "How long does this take?"

**Typical credit repair timeline:**

- **30 days** — first round of disputes filed, some quick deletions
- **60 days** — most inaccurate items removed or corrected
- **90 days** — significant score improvement (avg 50-100+ points)
- **6 months** — comprehensive cleanup complete

Set expectations right and your clients will stick with the process. We handle everything — they just check in periodically.

Got someone who needs this? [Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "3 Credit Myths",
    subject: "Share this: 3 credit myths your clients believe",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

**3 Credit Myths Your Clients Believe (And The Truth):**

**Myth 1:** "Checking my credit lowers my score"
**Truth:** Soft inquiries (checking your own) have zero impact.

**Myth 2:** "I need to carry a balance to build credit"
**Truth:** Pay in full every month. Utilization resets monthly.

**Myth 3:** "Paying off collections fixes my score"
**Truth:** It depends on the scoring model. Sometimes it actually hurts. Professional help matters here.

Share these with your network — it's the kind of value that builds trust and opens referral conversations.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Why Paying Off Collections Can Hurt",
    subject: "Share this: the collections payment trap",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

This one surprises people:

**Paying off a collection account can actually LOWER a credit score.**

Why? Under older FICO models, paying a collection resets the "date of last activity" — making a 5-year-old debt look brand new.

**The right move:** Get professional help to negotiate a "pay for delete" or dispute the item entirely.

This is exactly why we exist. Your clients shouldn't navigate this alone.

[Refer a Client](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Authorized User Strategy",
    subject: "Share this: the authorized user credit boost",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

**The Authorized User Strategy** is one of the fastest legal ways to boost a credit score:

1. Find a family member or trusted person with a credit card that has:
   - Low utilization (under 10%)
   - Long history (5+ years)
   - Perfect payment record
2. Get added as an authorized user
3. Their positive history appears on your report

**Important:** The client doesn't even need the physical card. They just benefit from the account history.

Share this with clients who need a quick boost while we work on removing negatives.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Hard vs Soft Inquiries",
    subject: "Share this: hard vs soft credit inquiries explained",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Your clients need to know the difference:

**Hard Inquiry (hurts score):**
- Applying for a credit card, loan, or mortgage
- Stays on report for 2 years
- Can drop score 5-10 points each

**Soft Inquiry (no impact):**
- Checking your own credit
- Pre-approval offers
- Background checks
- Credit monitoring services

**Pro tip:** When rate shopping (mortgages, auto loans), multiple inquiries within 14-45 days count as ONE inquiry.

[Refer a Client](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Dispute Letters vs Professional Repair",
    subject: "Share this: DIY disputes vs professional credit repair",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Clients sometimes ask: "Can't I just dispute things myself?"

**DIY Disputes:**
- Free (just your time)
- Limited knowledge of consumer protection laws
- Bureaus often reject generic dispute letters
- No leverage against creditors
- Time-consuming (months of back-and-forth)

**Professional Credit Repair:**
- Experts in FCRA, FDCPA, and state consumer laws
- Custom dispute strategies per item
- Direct creditor negotiation
- Ongoing monitoring and follow-up
- Results in 60-90 days

It's like doing your own taxes vs hiring a CPA. You *can* do it yourself, but the results are different.

[Refer a Client](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Best Time to Refer",
    subject: "The best time to refer a client (hint: it's now)",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

When's the best time to refer a client for credit repair?

**Right now.** Here's why:

- Credit repair takes 60-90 days for results
- If your client needs a mortgage in 6 months, they need to start NOW
- Spring buying season starts earlier than people think
- Interest rates reward higher scores — every month of delay costs them money

Don't wait for the "perfect moment." If a client mentions credit, refer them immediately.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
  {
    title: "Credit Repair + Your Industry",
    subject: "How credit repair makes YOU more money",
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Credit repair isn't just a referral commission — it's a **client retention strategy.**

When you help a client fix their credit:
- **MLOs:** They qualify for better rates → they close with YOU
- **Realtors:** They become homebuyers → you earn the sale
- **Auto dealers:** They get approved → you move inventory
- **Insurance agents:** Better credit = lower premiums → easier renewals
- **Financial advisors:** Healthier finances → more assets to manage

You're not just earning a commission. You're building a pipeline of qualified, loyal clients.

[Submit a Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },
];

// ============================================================
// FLOW 4: MILESTONE CELEBRATIONS
// ============================================================

export const MILESTONES = {
  firstReferral: {
    subject: (name: string) => `You did it, ${name}! Your first referral is in`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

Your first referral just hit our system. You're officially in the game!

Here's what happens next:
1. We reach out to your client and schedule a free consultation
2. If they sign up, you earn a commission
3. You can track everything on your dashboard

You've taken the hardest step — the first one. Keep them coming!

[View Your Dashboard](${APP_URL}/dashboard)

Best,
The YourCreditPartner Team`,
  },

  firstClose: {
    subject: (name: string, amount: string) => `Your first commission just hit: ${amount}, ${name}!`,
    body: (p: { firstName: string; amount: string }) =>
      `Hi ${p.firstName},

Your first commission has been recorded: **${p.amount}**

It's currently in "pending" status (30-day refund window). Once that passes, it moves to "earned" and then "payable."

This is just the beginning. Imagine 10, 20, 50 of these per month.

[View Your Commissions](${APP_URL}/dashboard/commissions)

Best,
The YourCreditPartner Team`,
  },

  tierUp: {
    subject: (name: string, tierName: string, rate: string) =>
      `Congrats ${name}! You just unlocked ${tierName} (${rate})`,
    body: (p: { firstName: string; tierName: string; rate: string; closesThisMonth: number }) =>
      `Hi ${p.firstName},

You just crossed into **${p.tierName}** tier!

Your new commission rate: **${p.rate}** — and it's retroactive. All **${p.closesThisMonth} closes** this month are now calculated at the higher rate.

Keep pushing — the next tier is even better.

[View Your Dashboard](${APP_URL}/dashboard)

Best,
The YourCreditPartner Team`,
  },

  tenCloses: {
    subject: (name: string) => `10 closes and counting, ${name}!`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

10 lifetime closes! You're building real, recurring income through credit repair referrals.

Most partners never get past 3. You're in a different league.

Keep the momentum going — your clients need you and your bank account will thank you.

[Submit Another Referral](${APP_URL}/dashboard/submit)

Best,
The YourCreditPartner Team`,
  },

  twentyFiveCloses: {
    subject: (name: string) => `25 closes — you're in the top 10%, ${name}!`,
    body: (p: { firstName: string }) =>
      `Hi ${p.firstName},

**25 lifetime closes.** You're officially in the top 10% of all YourCreditPartner affiliates.

You've proven that this works. Now it's about scaling:
- Share your link on social media
- Mention credit repair in every client meeting
- Refer colleagues who could also earn (you earn 5% of their commissions!)

[Invite a Colleague to Partner](${APP_URL}/apply)

Best,
The YourCreditPartner Team`,
  },

  payoutSent: {
    subject: (name: string, amount: string) => `${amount} just hit your Zelle, ${name}`,
    body: (p: { firstName: string; amount: string; commissionCount: number }) =>
      `Hi ${p.firstName},

**${p.amount}** has been sent to your Zelle for **${p.commissionCount} commission${p.commissionCount !== 1 ? "s" : ""}**.

You should see it in your account within minutes.

[View Payout Details](${APP_URL}/dashboard/commissions)

Best,
The YourCreditPartner Team`,
  },
};

// ============================================================
// FLOW 5: MONTHLY DIGEST
// ============================================================

export const MONTHLY_DIGEST = {
  subject: (name: string, month: string) => `Your ${month} recap, ${name}`,
  body: (p: {
    firstName: string;
    month: string;
    closeCount: number;
    tierName: string;
    rate: string;
    earningsMtd: string;
    earningsAllTime: string;
    closesToNextTier: number | null;
    nextTierName: string | null;
  }) => {
    let tierProgress = "";
    if (p.closesToNextTier && p.nextTierName) {
      tierProgress = `\n**${p.closesToNextTier} more close${p.closesToNextTier !== 1 ? "s" : ""}** to reach **${p.nextTierName}** and unlock a higher rate.\n`;
    } else {
      tierProgress = "\nYou're at the **highest tier** — incredible work.\n";
    }

    return `Hi ${p.firstName},

Here's your **${p.month}** performance recap:

- **Closes this month:** ${p.closeCount}
- **Current tier:** ${p.tierName} (${p.rate})
- **Earnings this month:** ${p.earningsMtd}
- **All-time earnings:** ${p.earningsAllTime}
${tierProgress}
Let's make next month even bigger.

[Go to Dashboard](${APP_URL}/dashboard)

Best,
The YourCreditPartner Team`;
  },
};

// ============================================================
// FLOW 6: REFER-A-PARTNER
// ============================================================

export const REFER_A_PARTNER = {
  subject: (name: string) => `${name}, know someone who'd benefit from partnering with us?`,
  body: (p: { firstName: string; partnerSlug: string }) =>
    `Hi ${p.firstName},

You've seen how this works — easy referrals, real commissions.

**Know a colleague, coworker, or friend who'd also benefit?**

When they sign up through your link and start earning, **you earn 5% of every commission they make** — for as long as you're both active.

That's free money on top of your own referrals.

**Your partner referral link:**
${APP_URL}/apply?ref=${p.partnerSlug}

Share it with:
- Fellow ${"{"}industry{"}"} professionals in your network
- Coworkers who interact with clients daily
- Friends in real estate, mortgage, insurance, auto, or finance

The more partners you bring in, the more passive income you build.

[Share Your Partner Link](${APP_URL}/apply?ref=${p.partnerSlug})

Best,
The YourCreditPartner Team`,
};
