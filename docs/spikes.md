# Week 0 spikes (23 Oct 2026)

Short experiments run before building features, to prove each external service works on a free plan.

| Spike | Result | Decision |
|---|---|---|
| Supabase connection | ✅ PostgreSQL 17 (Tokyo, `ap-northeast-1`) through the session pooler; `/api/v1/health` returns `database: up` | Use the session pooler URL; Render service in Singapore (closest free region) |
| Groq keys (4) | ✅ all valid | Rotate with `KeyPool` |
| Groq model | ⚠️ `llama-3.3-70b-versatile` is no longer offered. Available: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` | Stylist: **`openai/gpt-oss-120b`**; product tagging: **`openai/gpt-oss-20b`** |
| Groq tool calling | ✅ 4 tool calls + final answer in **3.8 s**; budget split sensibly across pieces | The final answer must come through a `submitOutfit` tool. Without it, the model invented a tool named "JSON" and the call failed |
| Stylist grounding | ⚠️ The model called a *mint* kurta "soft pink" in its reason | Tool results must include real colour, fabric and occasion tags so reasons stay accurate; reasons are shown as suggestions, product data comes from our DB |
| Gemini keys (5) | ✅ all authenticate; text works (newer models only) | Keep for optional text tasks |
| Gemini image models | ❌ Key 1: "project denied access". Keys 2–5: **free-tier quota for image models is 0** ("check your plan and billing") | Gemini try-on needs billing, so it is **not free**. It stays an optional provider behind the same interface |
| Hugging Face token | ✅ account `raheemxd` | |
| HF try-on Spaces | ✅ Running: `yisol/IDM-VTON` (ZeroGPU A10G), `levihsu/OOTDiffusion`, `franciszzj/Leffa`, `Kwai-Kolors/Kolors-Virtual-Try-On` | |
| IDM-VTON try-on | ✅ **24.8 s**, very good quality with a real Generation kurta (print, colours and identity kept) | **Primary try-on provider.** Limitation: long kurtas are shortened to top length; compare Leffa and OOTDiffusion for full-length eastern wear in week 5 |
| Stripe restricted key | ✅ Created and expired a PKR test Checkout Session; can read webhook endpoints and refunds | Use as `STRIPE_SECRET_KEY`; currency PKR |
| Brand feeds | ✅ 12 brands answered at least once: Limelight, Gul Ahmed, Bonanza Satrangi, Alkaram, Sana Safinaz, Maria B, Cross Stitch, Zara Shahjahan, Generation, Outfitters, Breakout, Junaid Jamshed. ❌ Khaadi (SSL), Sapphire and Agha Noor (404) | Shopify rate-limits by IP: sync **one brand at a time with pauses, retries and back-off**. Product types differ per brand ("RTW", "Eastern Top", "Unstitched Printed"), so Groq tagging also maps them to our categories. Some prices look scaled (Sana Safinaz `730000.00`); the sync must sanity-check prices |
| Cloudinary | ⏳ Waiting for the numeric API key | |
