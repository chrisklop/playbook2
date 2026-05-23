---
id: stanford-llm-fake-news
title: "When LLM-Generated Disinformation Becomes Undetectable"
era: synthetic-reality
techniques: [llm-disinformation]
sources:
  - url: https://hai.stanford.edu/news/llms-and-misinformation-experiment-foreign-influence
    label: "Stanford HAI: LLMs and misinformation experiment"
  - url: https://www.science.org/doi/10.1126/sciadv.adh1850
    label: "Science Advances: AI-generated disinformation can be more persuasive than human-written"
  - url: https://arxiv.org/abs/2305.13568
    label: "arXiv: Evaluating LLM-generated disinformation persuasiveness"
unlock_trigger:
  type: generator_owned
  generator: bespoke-disinfo-llm
  count: 1
---

A **2023 study published in *Science Advances*** by Spitale, Biller-Andorno, and Germani at the University of Zurich asked **697 English-speaking participants** to evaluate the truthfulness and source-quality of short factual claims on hot-button topics (vaccines, climate, COVID-19). The claims were drawn from two pools:

1. **Human-written tweets** — half true, half false — pulled from real social-media activity.
2. **GPT-3-generated tweets** — half true, half false — produced by prompting GPT-3 to write either an accurate or a misleading statement.

The headline findings:

- **Participants were better at identifying disinformation when it was human-written than when it was LLM-written.** The model's outputs were rated as more credible — including the false ones.
- **LLM-generated *true* content was also rated as more credible than human-written *true* content**, so this is not purely about the model being persuasively dishonest. It's about the model being persuasively *plausible* across the truth spectrum.
- **Detection effort had no measurable effect.** Participants who actively tried to identify AI-generated content scored at chance.

A complementary Stanford HAI experiment focused specifically on **foreign-influence operations**. Researchers generated fake political messages in the style of Russia's Internet Research Agency, both with human writers and with GPT-3, and showed them to U.S. survey respondents. The LLM-generated messages were rated as **slightly more persuasive** than the originals.

The mechanical implication: the **detection-by-style** approach that powered most platform-level disinformation defense during the 2017–2022 troll-farm era no longer reliably works. The IRA's signature errors — non-native phrasings, repeated tropes, telltale time-of-day posting patterns — were artifacts of using human operators in St. Petersburg. An LLM doesn't make those errors. It produces idiomatic English in any quantity at any time.

What still works: **provenance-based detection** (cryptographic signing of legitimate content), **behavioral analysis** (coordinated account activity patterns), and **fact-level checking** (verifying specific claims). None of these scale to the volume of content the new tooling can produce.

This is the most underappreciated finding of the early LLM era. The economics of disinformation have shifted not because the lies are bigger, but because the cost of producing **persuasive, indistinguishable-from-human** content has collapsed.
