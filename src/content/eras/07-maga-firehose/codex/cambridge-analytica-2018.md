---
id: cambridge-analytica-2018
title: "Cambridge Analytica — 87 Million Profiles"
era: maga-firehose
techniques: [troll-farm, alternative-facts]
sources:
  - url: https://en.wikipedia.org/wiki/Facebook%E2%80%93Cambridge_Analytica_data_scandal
    label: "Wikipedia: Facebook–Cambridge Analytica data scandal"
  - url: https://www.nytimes.com/2018/03/17/us/politics/cambridge-analytica-trump-campaign.html
    label: "NYT: How Trump Consultants Exploited Facebook Data of Millions (Mar 17, 2018)"
  - url: https://www.theguardian.com/news/series/cambridge-analytica-files
    label: "The Guardian: The Cambridge Analytica Files"
unlock_trigger:
  type: generator_owned
  generator: deploy-troll-farm
  count: 1
---

**Cambridge Analytica** was a London-based political consulting firm — an offshoot of the older **SCL Group** — that built and operated psychometric targeting tools for political campaigns. **Steve Bannon** chaired its U.S. board; **Robert Mercer**, the hedge-fund billionaire and Breitbart funder, provided most of its U.S. funding; the **Trump 2016 campaign** retained it.

The dataset that powered its U.S. work was harvested through a personality-quiz Facebook app called **"thisisyourdigitallife,"** developed by Cambridge University researcher **Aleksandr Kogan**. The app's terms-of-service, at the time, allowed it not only to collect data on the 270,000 users who installed it, but on **each of their Facebook friends**. The friend-graph expansion produced a dataset of approximately **87 million Facebook profiles**.

The personality-profiling math — built on the **OCEAN/"Big Five"** personality model from academic psychology — produced individualized predictions for which messages would emotionally land with which voters:

- **High-neuroticism, high-conscientiousness voters** received messages framed around fear and order (immigration, crime).
- **High-openness voters** received messages framed around values and identity.
- **Low-conscientiousness, low-agreeableness voters** received messages framed around grievance and disruption.

The targeting was paired with a **dark-ad** infrastructure on Facebook: ads visible only to the targeted user, leaving no public record of what was being said to whom. Estimates of total Cambridge Analytica–served ads in the 2016 cycle range from **3.5 to 5 billion impressions**.

What broke the story:

- **March 2018**: Whistleblower **Christopher Wylie**, a former Cambridge Analytica employee, provided documents and on-camera interviews to *The Guardian* and *The New York Times*.
- **March 17, 2018**: Coordinated NYT/Guardian/Channel 4 publication. Facebook's stock dropped ~7% in two days.
- **April 2018**: Mark Zuckerberg testified before Congress over two days.
- **May 2018**: Cambridge Analytica filed for insolvency.
- **July 2019**: Facebook reached a **$5 billion FTC settlement** over privacy violations connected to the case — the largest U.S. consumer-privacy fine in history at the time.

The two structural lessons that survived the firm:

1. **The "personality model + microtargeting" capability did not require Cambridge Analytica**; it required the *data*. Facebook (now Meta) still holds equivalent or richer profiles for ~3 billion users. Any campaign with budget access to that targeting layer can perform the same play, more sophisticated and at larger scale, today.
2. **Dark ads are still the dominant format**. Public-record political-ad transparency rules vary by country; the United States has no federal requirement for ad-by-ad transparency in social-media political advertising. The Cambridge Analytica case did not change this.

The IRA codex entry covers state-sponsored troll-farm volume; this entry covers what happens when **a campaign-aligned commercial firm** acquires comparable targeting capabilities. The 2016 campaign deployed both. The two together is the model.
