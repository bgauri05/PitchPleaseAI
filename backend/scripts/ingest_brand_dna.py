import asyncio

from app.services.brand_memory import add_brand_guideline

sample_brand_dna = """
BrandSetu Fintech – Official Brand Style Guide
================================================

TONE & VOICE
------------
Tone: Disruptive but highly professional. We challenge the status quo of traditional
banking without sacrificing credibility. Every word should feel bold yet trustworthy.

Writing Style:
- Use short, punchy sentences for impact. Follow with one deeper explanatory sentence.
- Preferred vocabulary: "zero-fee architecture", "frictionless", "founder-first",
  "transparent infrastructure", "capital efficiency".
- Avoid jargon-heavy banking terms like "leveraging synergies" or "holistic solutions".
- Never use emojis on LinkedIn or any formal communication channel.
- On Twitter/X, emojis are permitted but limited to one per post, used sparingly.

MESSAGING PILLARS
-----------------
1. Zero-Fee Architecture: Always mention our zero-fee architecture when discussing
   pricing or competitive positioning. This is our single strongest differentiator.
2. Speed & Simplicity: Onboarding in under 5 minutes. Payments settle in real time.
3. Founder-First Philosophy: Every feature is built around the Indian founder's workflow.
4. Regulatory Trust: We are RBI-compliant and SEBI-registered. Mention this when
   speaking to investors or enterprise clients.

TARGET AUDIENCE
---------------
Primary: Indian startup founders (Seed to Series B), aged 25–40, based in Tier-1 cities
(Bangalore, Mumbai, Delhi-NCR). They are technically literate, time-poor, and deeply
skeptical of legacy banking friction.

Secondary: CFOs and finance leads at growth-stage startups who prioritize automation
and real-time financial visibility.

Audience Pain Points to Address:
- Hidden fees from traditional banks eroding runway.
- Slow wire transfers blocking vendor payments.
- Lack of API-first banking for product integration.

CONTENT GUIDELINES BY CHANNEL
------------------------------
LinkedIn:
- Formal, insight-driven. No emojis. Post length: 150–300 words.
- Lead with a bold contrarian claim. End with a clear CTA or question.
- Hashtags: max 3, always include #IndianStartups or #StartupIndia.

Twitter/X:
- Punchy, under 280 characters. One emoji maximum.
- Threads are encouraged for product launches or thought leadership.

Blog / Long-Form:
- SEO-optimised. Target keywords: "zero-fee business account India",
  "startup banking India", "RBI-compliant neobank".
- Always open with a founder pain-point story before presenting the solution.

BRAND COLOURS & VISUAL LANGUAGE (for copy context)
---------------------------------------------------
Primary: Electric Indigo (#4B0082) — conveys trust, ambition, and technology.
Secondary: Signal Green (#00FF7F) — conveys speed and financial health.
Copy written alongside visuals should complement these associations: ambition,
speed, and reliability.

THINGS WE NEVER SAY
--------------------
- "We're like Paytm but..." (avoid all incumbent comparisons)
- "Best-in-class" (overused, meaningless)
- "Disrupting the industry" without specific proof points
- Any claim around guaranteed returns — strictly prohibited for compliance reasons.
"""

metadata = {
    "source": "onboarding_doc",
    "brand": "BrandSetu_Fintech",
}


async def main() -> None:
    print("[BrandSetu] Starting Brand DNA ingestion into Supabase vector store...")

    await add_brand_guideline(sample_brand_dna, metadata)

    print("[BrandSetu] Brand DNA successfully ingested. RAG pipeline is ready.")


if __name__ == "__main__":
    asyncio.run(main())
