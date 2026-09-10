---
title: "Automated Topic Classification of Chat, Messaging and Forum"
date: 2026-09-10 09:00:00 +0000
description: Automated Topic Classification of Chat, Messaging and Forum
excerpt:  Darknet monitoring aims to identify information relevant to specific operational topics. Accurate channel classification reduces the volume analysts must review and makes subsequent monitoring more focused. It also imporve accuracy of automatic detection.
---

## Introduction; Classifying at scale

Darknet monitoring aims to identify information relevant to specific operational topics. Accurate channel classification reduces the volume analysts must review and makes subsequent monitoring more focused. It also imporve accuracy of automatic detection.

However, when dealing with forums, Telegram channels, or other messaging platforms, several problems appear quickly.

First, there is the volume of data. For darknet forums, there are already dozens of forums to classify; but for Telegram channels, the number can quickly reach hundreds of thousands.

A second issue is language. How can a analysts classify forums written in Polish, Farsi, Chinese, or other languages when their native language is French ? Additionnaly, on some channels, multiple languages are used between several actors.

Even when classification is performed in a familiar language, slang remains difficult. In some communities, users deliberately employ specialized vocabulary that is not present in standard language.

An example of such specialized vocabulary:

``` 
Need MQR

SBI CMP + MQR（High%） 🔥
SBI 3ID/4ID/5ID/6ID+MQR （High%） 🔥
Razorpay X + RBL + MQR （High%） 🔥
Equitasbank + MQR（High%） 🔥
RBL + MQR（High%） 🔥
KVB + MQR（High%） 🔥
Federal One + MQR 🔥
BOM + MQR 🔥
TMB + MQR 🔥
IDBI + MQR 🔥
DBS + MQR 🔥

If your bank isn't up there, you can send us a test.

ALL OF ABOVE ACC NEED URGENTLY

High Percentage
Highest Volume in the Market
Run Fast and Efficient
Stable Daily

Need a lot of SBI 3 (admin, maker, checker), daily volume 3-5cr. High percentage. Welcome to send brothers. Support!! 🔥
```

In this simple example, a user request for a State Bank of India (SBI) corporate account configured with 3 user roles:

- Admin: manages users, permissions, and settings.
- Maker: creates/initiates payments.
- Checker: reviews and approves payments before execution.
  Mentionning that he need, Merchant QR code (MQR) for transactions like UPI/Google Pay/PhonePe.

Prior work has demonstrated that automated Telegram classification is feasible. Roy et al.'s [DarkGram](https://www.usenix.org/system/files/usenixsecurity25-roy.pdf) analyzed 339 cybercriminal activity channels and 53,605 posts. Its BERT-based text classifier reported an average accuracy of 96% across five predefined categories. This result supports the use of a constrained label space rather than freely generated labels.

DarkGram nevertheless addresses a narrower setting: its seed channels were English-language channels with at least 10,000 followers, classification operated at post level, and the output space contained five broad categories. 

By contrast, our corpus consists of randomly selected channels without a language constraint. It therefore includes multilingual and mixed-language content, community slang, and heterogeneous topics. We classify channel-level samples using a finer cybersecurity taxonomy. DarkGram's reported accuracy is consequently not directly comparable with our metrics. Our work builds on the same general objective using open-weight LLMs, a more granular taxonomy, and cross-model validation.

Since Large Language Models has been trained on several corpus, our idea was to investigate LLMs capability to classify Telegram channels from a sufficient sample of their collected text. The remaining question was how to supervise the quality of the classification output. Since several LLMs were evaluated, we used their validation responses to derive a consensus between models.

## Hardware used

Experiments ran on an internal server with 224 Intel Xeon Platinum 8480+ CPU cores, approximately 2 TB RAM, and two NVIDIA GH100 H100L GPUs with 94 GB memory each. Ollama provided a common serving interface, allowing models to be switched without changing the evaluation pipeline.

Model architectures, parameter counts, quantization formats, and resource requirements differed substantially. Most models could be served on one H100, whereas some big models like `devstral-2:latest` required memory from both GPUs. Latency therefore reflects both model characteristics and resource allocation; it is not a hardware-only benchmark.

## Dataset

The dataset was built from Telegram channels collected continuously over several years using tools from our open-source [AIL Framework](https://github.com/ail-project/ail-framework). AIL provides collection, ingestion, indexing, and analysis capabilities for unstructured intelligence data, including Telegram and other chat sources.

For this experiment, we drew a random sample representing approximately 3% of the complete dataset available in June 2026. After preparation, the evaluation corpus contained 1,228 channels and 116,083 posts. No language filter was applied: the sample is multilingual and includes both single-language and mixed-language channels, as well as slang, transliterated text, and heterogeneous subject matter. 

Only textual content was evaluated. The channel name and description, message author names, message text, URLs, and textual references to attachments were retained when available, but images, audio, video, and attached-file contents were not analyzed. This scope isolates text-classification performance and avoids introducing model-dependent multimedia capabilities into the comparison.

## Initial work and iterative evaluation

The evaluation protocol was developed iteratively. Each run addressed limitations observed in the previous one: uncontrolled labels in the first run, taxonomy and output-format limitations in the second, then robustness and scale in the final run.

Assessing classification quality at scale required a reference against which model outputs could be compared. Because a manually annotated ground-truth dataset was not available, we designed a multi-model cross-validation protocol. Each model first proposed tags independently. The union of all proposed tags was then submitted to the participating models, which were asked to validate each tag against the original channel sample.

Validation decisions were aggregated into a consensus for each tag. This consensus served as an operational reference for measuring first-pass precision, consensus recall, overtagging, and disagreement between models. The approach does not replace human ground truth, but it provides a reproducible way to compare models while reducing dependence on any single classifier.

### Run 1: open-ended tagging

Models were initially asked to invent tags freely from channel content. This open-label approach proved unsuitable. Different models used synonyms, different levels of abstraction, and different wording for equivalent content. The result was a fragmented label space that could not be aggregated or compared reliably across channels. This also limited the models' ability to converge during validation.

``` 
- account_rentals
- account_sales
- account_sellings
- accountabilities
- accountants
- accountings
- accountmanagements
- accounts
- accountsellings
- accountsharing
```

***Example of diversity of a tag "account"***

![](/assets/images/blog/1.svg)
***example of diversity of tags cross-models and family for a given telegram channel***

Output handling created a second problem. Natural-language responses were not consistently machine-processable: models added explanations, Markdown, malformed values, or unexpected formatting. Although JSON output would normally reduce ambiguity, not every model supported reliable JSON responses through Ollama. Some returned invalid JSON or empty responses when structured output was requested.

```
# mistral-nemo:12b-instruct-2407-fp16
raw output:                                 
Based on the provided channel messages, here are the relevant tags from the allowed list:

- dark-web:motivation="marketplace-for-sale"
- dark-web:topic="finance"
- dark-web:topic="hacking"
```

***Random output of a mistral model reqired to response a JSON object***

The first run evaluated 28 candidate models able to run on ollama, the run was done on an initial 20 channel load. Models with fewer reports produced incomplete or unusable outputs during this preliminary stage.

| Model                                     | Reports evaluated |
| ----------------------------------------- | ----------------: |
| `qwen3.5:0.8b`                            |                20 |
| `qwen2.5vl:latest`                        |                20 |
| `ollama.com/library/llama3.1:latest`      |                20 |
| `ollama.com/library/llama3.1:70b`         |                20 |
| `mistral-small3.2:24b-instruct-2506-fp16` |                20 |
| `llama4:latest`                           |                20 |
| `deepseek-r1:32b`                         |                20 |
| `qwen3.5:2b`                              |                12 |
| `qwen3.5:4b`                              |                 4 |
| `mistral-nemo:12b-instruct-2407-fp16`     |                20 |
| `qwen3.5:9b`                              |                13 |
| `devstral-2:latest`                       |                20 |
| `qwen3.5:35b`                             |                17 |
| `qwen3-coder:latest`                      |                20 |
| `qwen3.5:122b`                            |                20 |
| `nemotron3:33b`                           |                20 |
| `granite4.1:30b`                          |                20 |
| `qwen3-coder-next:q4_K_M`                 |                20 |
| `deepseek-r1:8b`                          |                20 |
| `qwen3-coder-next:q8_0`                   |                20 |
| `gpt-oss:120b`                            |                20 |
| `qwen3.6:35b`                             |                16 |
| `qwen3.6:35b-a3b`                         |                17 |
| `qwen3.6:35b-a3b-bf16`                    |                19 |
| `nemotron-3-super:latest`                 |                20 |
| `igorls/gemma4-e4b-classifier:q8_0`       |                20 |
| `mistral-medium-3.5:latest`               |                20 |
| `gemma4:31b`                              |                20 |

This run showed that useful comparison required both a shared vocabulary and strict output validation.

This first run also highlighted the value of requiring justifications. Evidence-based explanations make weak or unsupported classifications easier to identify and provide a basis for systematic validation. This led to the central research question: which models produce the most relevant, evidence-supported tags while avoiding overtagging and spurious labels?

### Run 2: taxonomy-constrained tagging

The second run replaced free tags with a predefined taxonomy containing categories and subcategories. The first taxonomy evaluated was the existing MISP [dark-web taxonomy](https://raw.githubusercontent.com/MISP/misp-taxonomies/refs/heads/main/dark-web/machinetag.json). It was tested on 50 channels. Each model first classified a channel, then every proposed tag was challenged by the validation models. This made it possible to compare first-pass tagging quality, identify overtagging, and derive cross-model agreement.



A controlled taxonomy did not eliminate output failures. Recurring issues included:

- invalid or almost-valid taxonomy UUIDs;
- taxonomy identifiers returned instead of requested tag values;
- missing quotation marks or malformed machine-readable values;
- additional explanations around expected output;
- invalid JSON or empty responses;
- timeouts, incomplete responses, and ignored instructions.

For example, `devstral-2:latest` returned UUIDs and introduced a one-character error in the UUID associated with `anti-entity`:

```
# devstral-2:latest
elapsed_second_request: 25.00s

extremist,forensics,nationalist,pro-entity,threat-intelligence

raw output:
0ce3bbf3-b2b8-5508-a53e-9a9ad8c6ef42
15230a5d-8364-56ae-9d92-7c340e4097ab
255c1e12-cc19-50c0-920d-e478dad2d90a
ac3d1958-666a-5727-82d8-e11f3b05446b
6c577620-d930-5a54-956d-2f191bf4abae
e39587b0-1b4c-5279-b085-543d91822ffb
```

The valid taxonomy UUID ends in `46a`, not `46b`. This example shows that syntactically plausible output can still be semantically invalid.

The pipeline was therefore improved with explicit output constraints, extractable response formats, exact taxonomy matching, limited UUID correction, parsing checks, and a second validation step. Failures remained part of the measured results. Models unable to produce sufficiently stable outputs were excluded from the large-scale run.

### Run 3: large-scale evaluation

Constraining the label space improved comparability, but the existing dark-web taxonomy could not adequately describe the diversity of the sampled channels. It focused primarily on underground activities and lacked sufficient coverage for legitimate communities, general-interest content, technology, finance, geopolitics, media, and mixed-purpose channels. Continuing with it would have forced models either to omit relevant themes or to select labels that only partially matched the content.

We therefore created the broader MISP [content-classification taxonomy](https://raw.githubusercontent.com/MISP/misp-taxonomies/refs/heads/main/content-classification/machinetag.json). It organizes 75 controlled values under 11 thematic predicates: general content, technology, cybersecurity, cybercrime, markets, communities, digital content, finance, illegal markets, technical services, and geopolitics and hacktivism. Each value has a stable UUID, a human-readable label, and a definition supplied to the models in the prompt. This structure preserves machine-readable output while providing enough breadth and granularity to classify both malicious and non-malicious channels.

The final run applied the improved protocol and this content-classification taxonomy to 1,228 channel reports. Thirteen models that were sufficiently robust during preliminary testing were retained:

| Model                                     |
| ----------------------------------------- |
| `gemma4:31b`                              |
| `qwen3.5:122b`                            |
| `gemma4:e4b`                              |
| `igorls/gemma4-e4b-classifier:q8_0`       |
| `qwen3.6:35b`                             |
| `gemma4:12b`                              |
| `nemotron-3-super:latest`                 |
| `mistral-medium-3.5:latest`               |
| `gpt-oss:120b`                            |
| `deepseek-r1:32b`                         |
| `devstral-2:latest`                       |
| `mistral-small3.2:24b-instruct-2506-fp16` |
| `granite4.1:30b`                          |

This progression transformed an exploratory tagging experiment into a reproducible model evaluation: Run 1 exposed label variability, Run 2 introduced taxonomy-based tagging and validation, and Run 3 measured quality, robustness, and latency at scale.

## Final setup

Channel samples were prepared to contain approximately 10,000 tokens, with a target variation of ±10%. This normalization limits input-length effects when comparing models. Token counts remain tokenizer-dependent: different models may segment identical text differently.

Preprocessing used the `o200k_base` encoding from `tiktoken`, with a hard input limit of 10,000 tokens according to that encoding. This provides a reproducible reference count, not an exact native-token count for every model.

The evaluation used a multi-stage protocol:

1. each model proposed taxonomy tags from a channel sample;
2. proposed tags were submitted to validation models;
3. validation responses determined whether each tag was supported;
4. accepted tags were aggregated into an operational consensus;
5. initial predictions were compared with this consensus.

Failed reports were retained in quality metrics and assigned a score of zero. Missing model outputs were ignored only for the corresponding metric denominator.

Five complementary dimensions were measured:

- failure rate, combining initial tagging and correction/validation failures;
- contradiction rate, measuring proposed tags rejected during validation;
- consensus recall, measuring consensus tags found during initial tagging;
- tagging precision, measuring proposed tags confirmed as valid;
- F1 score, balancing precision and consensus recall.

Initial tagging and validation latency were also measured. In order to avoid bias in time measurement, the load of the model was not taken in consideration. For that we loaded the model ask a dummy question then we start the clock only after this initial dummy query.

### Results

Reports aggregated from the classification of 1,228 telegram channel. The corresponding channel samples contain 116,083 posts. Missing models are simply ignored when calculating the metric.

### Most failing model

This score measures which models most often failed to answer in time or returned invalid tagging/correction output. It counts both initial tagging errors. The score is `(initial tagging errors + correction errors) / (initial tagging attempts + correction attempts) * 100`. Higher is worse: models at the top failed most often.

| model                                   | reports | initial tagging errors | correction errors | total errors | attempts | score |
| --------------------------------------- | ------: | ---------------------: | ----------------: | -----------: | -------: | ----: |
| gemma4:12b                              |    1228 |                13/1228 |            3/1211 |           16 |     2439 | 0.66% |
| deepseek-r1:32b                         |    1228 |                 7/1228 |            1/1037 |            8 |     2265 | 0.35% |
| devstral-2:latest                       |    1228 |                 5/1228 |            0/1038 |            5 |     2266 | 0.22% |
| qwen3.6:35b                             |    1228 |                 4/1228 |            0/1142 |            4 |     2370 | 0.17% |
| nemotron-3-super:latest                 |    1228 |                 4/1228 |            0/1087 |            4 |     2315 | 0.17% |
| granite4.1:30b                          |    1228 |                 1/1228 |            2/1152 |            3 |     2380 | 0.13% |
| qwen3.5:122b                            |    1228 |                 3/1228 |            0/1214 |            3 |     2442 | 0.12% |
| gemma4:31b                              |    1228 |                 2/1228 |            0/1222 |            2 |     2450 | 0.08% |
| mistral-medium-3.5:latest               |    1228 |                 1/1228 |            0/1177 |            1 |     2405 | 0.04% |
| igorls/gemma4-e4b-classifier:q8_0       |    1228 |                 1/1228 |            0/1225 |            1 |     2453 | 0.04% |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 |                 0/1228 |            0/1209 |            0 |     2437 |  0.0% |
| gpt-oss:120b                            |    1228 |                 0/1228 |            0/1198 |            0 |     2426 |  0.0% |
| gemma4:e4b                              |    1228 |                 0/1228 |            0/1226 |            0 |     2454 |  0.0% |

Overall, all retained models were highly robust, with failure rates below 1%. 

### Most contradictory model

Cross-report contradiction rate. For each model, this averages the percentage of proposed tags later rejected during validation. Models that failed or did not produce usable tags are listed with a 100% score for that report and counted in `error reports`. Lower is better: the best score tends toward 0%.

| model                                   | reports | error reports |       sum | average | median |  min |    max |
| --------------------------------------- | ------: | ------------: | --------: | ------: | -----: | ---: | -----: |
| granite4.1:30b                          |    1228 |            78 | 69285.34% |  56.42% |  60.0% | 0.0% | 100.0% |
| devstral-2:latest                       |    1228 |           190 | 62089.82% |  50.56% |  50.0% | 0.0% | 100.0% |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 |            28 |  59563.8% |   48.5% |  50.0% | 0.0% | 100.0% |
| deepseek-r1:32b                         |    1228 |           205 | 43656.22% |  35.55% |  25.0% | 0.0% | 100.0% |
| mistral-medium-3.5:latest               |    1228 |            51 | 25121.19% |  20.46% | 16.67% | 0.0% | 100.0% |
| gpt-oss:120b                            |    1228 |            30 | 25074.55% |  20.42% | 16.67% | 0.0% | 100.0% |
| nemotron-3-super:latest                 |    1228 |           142 | 27327.17% |  22.25% |   0.0% | 0.0% | 100.0% |
| qwen3.6:35b                             |    1228 |            86 | 17405.34% |  14.17% |   0.0% | 0.0% | 100.0% |
| gemma4:12b                              |    1228 |            20 | 16885.12% |  13.75% |   0.0% | 0.0% | 100.0% |
| igorls/gemma4-e4b-classifier:q8_0       |    1228 |             3 | 13673.89% |  11.14% |   0.0% | 0.0% | 100.0% |
| gemma4:e4b                              |    1228 |             2 | 13044.78% |  10.62% |   0.0% | 0.0% | 100.0% |
| qwen3.5:122b                            |    1228 |            14 | 12534.24% |  10.21% |   0.0% | 0.0% | 100.0% |
| gemma4:31b                              |    1228 |             6 |  9170.75% |   7.47% |   0.0% | 0.0% | 100.0% |

![](/assets/images/blog/2.svg)

In this graph, triangles represent median values and circles represent average values.

In the following random example, Granite4 initially detected the following 4 tags:

* `credential-dumps: data-leaks`
* `fraud: scams`
* `money-laundering:cashin/out`
* `ponzy-financial gaian`

![](/assets/images/blog/3.svg)

However, when asked to validate these tags, the model rejected one of its own initial predictions:

```json
"credential-dumps-data-leaks": {
  "justification": "There are no mentions of stolen credentials, databases, or data breach disclosures.",
  "match": false
}
```

This illustrates a direct contradiction between the model's initial classification and its subsequent validation. Several models exhibited this form of instability: when asked only to return labels, they sometimes selected weakly supported tags that they later rejected when required to justify them against observable evidence. Requiring justifications therefore acts as a consistency check, not merely as explanatory output. The request for justification is done in a new session to not tamper the result with previous thought. This definitively almost double the processing time but increase the quality results.

### Best model for tagging consensus

This score measures how well each model finds the consensus tags across all reports. The consensus tags are the tags most approved by validation, so they are treated as the expected important tags for a report. For each report, the model score is the percentage of consensus tags found during the initial tagging pass. A high score means the model usually finds the tags that validators agree are important. This metric mainly measures recall against consensus; it does not primarily measure whether the model added extra tags. Failed reports count as 0% and are counted in `error reports`.

| model                                   | reports | error reports |       sum | average | median |  min |    max |
| --------------------------------------- | ------: | ------------: | --------: | ------: | -----: | ---: | -----: |
| gemma4:31b                              |    1228 |             6 | 88264.02% |  71.88% | 71.43% | 0.0% | 100.0% |
| qwen3.5:122b                            |    1228 |            14 | 76407.69% |  62.22% |  62.5% | 0.0% | 100.0% |
| gemma4:12b                              |    1228 |            20 |  76101.7% |  61.97% |  62.5% | 0.0% | 100.0% |
| igorls/gemma4-e4b-classifier:q8_0       |    1228 |             3 | 76100.16% |  61.97% |  60.0% | 0.0% | 100.0% |
| gpt-oss:120b                            |    1228 |            30 | 66361.66% |  54.04% |  50.0% | 0.0% | 100.0% |
| gemma4:e4b                              |    1228 |             2 |  64389.1% |  52.43% |  50.0% | 0.0% | 100.0% |
| qwen3.6:35b                             |    1228 |            86 | 61581.75% |  50.15% |  50.0% | 0.0% | 100.0% |
| mistral-medium-3.5:latest               |    1228 |            51 | 58538.85% |  47.67% |  50.0% | 0.0% | 100.0% |
| nemotron-3-super:latest                 |    1228 |           142 | 43105.67% |   35.1% | 33.33% | 0.0% | 100.0% |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 |            28 | 33578.84% |  27.34% |  25.0% | 0.0% | 100.0% |
| deepseek-r1:32b                         |    1228 |           205 | 32607.81% |  26.55% |  25.0% | 0.0% | 100.0% |
| granite4.1:30b                          |    1228 |            78 | 32290.26% |  26.29% |  25.0% | 0.0% | 100.0% |
| devstral-2:latest                       |    1228 |           190 |  26107.5% |  21.26% | 22.22% | 0.0% | 100.0% |

![](/assets/images/blog/4.svg)

### Best model that do not overtag

This score measures whether each model finds the right tags without adding too many wrong or useless tags. For each report, precision is `validated tags / proposed tags`, so it drops when the model proposes false or irrelevant tags. Recall is `consensus tags found / total consensus tags`, so it drops when the model misses important expected tags. The displayed score is F1: `2 * precision * recall / (precision + recall)`. This balances tag quality and tag coverage: a model ranks well only when it keeps high precision and high recall. Failed reports count as 0% and are counted in `error reports`.

| model                                   | reports | error reports |       sum | average | median |  min |    max |
| --------------------------------------- | ------: | ------------: | --------: | ------: | -----: | ---: | -----: |
| gemma4:31b                              |    1228 |             6 | 97115.54% |  79.08% |  80.0% | 0.0% | 100.0% |
| qwen3.5:122b                            |    1228 |            14 |  87287.6% |  71.08% | 73.69% | 0.0% | 100.0% |
| gemma4:12b                              |    1228 |            20 | 85060.39% |  69.27% | 72.72% | 0.0% | 100.0% |
| igorls/gemma4-e4b-classifier:q8_0       |    1228 |             3 | 87116.33% |  70.94% |  72.0% | 0.0% | 100.0% |
| gemma4:e4b                              |    1228 |             2 | 78248.62% |  63.72% | 66.67% | 0.0% | 100.0% |
| qwen3.6:35b                             |    1228 |            86 | 75338.55% |  61.35% | 66.67% | 0.0% | 100.0% |
| gpt-oss:120b                            |    1228 |            30 | 76082.63% |  61.96% | 63.16% | 0.0% | 100.0% |
| mistral-medium-3.5:latest               |    1228 |            51 | 70868.69% |  57.71% |  60.0% | 0.0% | 100.0% |
| nemotron-3-super:latest                 |    1228 |           142 | 56134.32% |  45.71% |  50.0% | 0.0% | 100.0% |
| deepseek-r1:32b                         |    1228 |           205 |  39643.9% |  32.28% | 33.33% | 0.0% | 100.0% |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 |            28 | 39004.08% |  31.76% | 32.43% | 0.0% | 100.0% |
| granite4.1:30b                          |    1228 |            78 | 37285.18% |  30.36% | 30.77% | 0.0% | 100.0% |
| devstral-2:latest                       |    1228 |           190 |  34585.3% |  28.16% | 30.77% | 0.0% | 85.72% |

![](/assets/images/blog/5.svg)


### Best model for tagging

This score measures how reliable each model's proposed tags are across all reports. For each report, the score is the percentage of the model's proposed tags that validation confirmed as true: `validated tags / proposed tags`. A high score means the model avoids false positives and usually proposes tags that validators accept. This is different from `Best model for tagging consensus`, which measures whether the model found the expected consensus tags. This metric does not care whether a tag is part of the consensus: a non-consensus tag is not penalized if validation confirms it as true. It is penalized if validation rejects it, or if it is not confirmed as true. Failed reports are kept in the table with a 0% score and counted in `error reports`.

| model                                   | reports | error reports |        sum | average | median |  min |    max |
| --------------------------------------- | ------: | ------------: | ---------: | ------: | -----: | ---: | -----: |
| gemma4:31b                              |    1228 |             6 | 113618.14% |  92.52% | 100.0% | 0.0% | 100.0% |
| qwen3.5:122b                            |    1228 |            14 | 109968.27% |  89.55% | 100.0% | 0.0% | 100.0% |
| gemma4:e4b                              |    1228 |             2 | 109401.18% |  89.09% | 100.0% | 0.0% | 100.0% |
| igorls/gemma4-e4b-classifier:q8_0       |    1228 |             3 | 108675.43% |   88.5% | 100.0% | 0.0% | 100.0% |
| qwen3.6:35b                             |    1228 |            86 | 105341.33% |  85.78% | 100.0% | 0.0% | 100.0% |
| gemma4:12b                              |    1228 |            20 | 105209.72% |  85.68% | 100.0% | 0.0% | 100.0% |
| nemotron-3-super:latest                 |    1228 |           142 |  93906.92% |  76.47% | 100.0% | 0.0% | 100.0% |
| mistral-medium-3.5:latest               |    1228 |            51 |  97678.81% |  79.54% | 83.33% | 0.0% | 100.0% |
| gpt-oss:120b                            |    1228 |            30 |  97525.45% |  79.42% | 83.33% | 0.0% | 100.0% |
| deepseek-r1:32b                         |    1228 |           205 |   66673.3% |  54.29% |  60.0% | 0.0% | 100.0% |
| devstral-2:latest                       |    1228 |           190 |  60710.18% |  49.44% |  50.0% | 0.0% | 100.0% |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 |            28 |  58199.77% |  47.39% |  50.0% | 0.0% | 100.0% |
| granite4.1:30b                          |    1228 |            78 |  52524.37% |  42.77% |  40.0% | 0.0% | 100.0% |

![](/assets/images/blog/6.svg)


### Detection time

Initial tagging latency. This aggregates `elapsed_second_request` from `classification.md` for each model and shows average, minimum, and maximum request time. Failed model outputs are not counted.

| model                                   | reports |       sum | average | median |    min |     max |
| --------------------------------------- | ------: | --------: | ------: | -----: | -----: | ------: |
| mistral-small3.2:24b-instruct-2506-fp16 |    1228 | 10099.54s |   8.22s |   7.6s |  1.03s |  88.58s |
| gpt-oss:120b                            |    1228 | 11209.34s |   9.13s |  8.73s |  1.56s |  51.41s |
| granite4.1:30b                          |    1227 | 13957.44s |  11.38s | 10.28s |  0.98s |  81.78s |
| gemma4:e4b                              |    1228 | 18003.37s |  14.66s | 12.94s |  1.79s |  51.67s |
| igorls/gemma4-e4b-classifier:q8_0       |    1227 |  21024.0s |  17.13s | 15.09s |  4.56s |   87.7s |
| nemotron-3-super:latest                 |    1224 | 28251.96s |  23.08s |  19.2s |  5.38s |  163.8s |
| devstral-2:latest                       |    1223 | 28817.15s |  23.56s | 21.23s |  2.29s | 228.98s |
| deepseek-r1:32b                         |    1221 | 34312.91s |   28.1s | 22.75s |  6.31s | 196.73s |
| mistral-medium-3.5:latest               |    1227 | 31854.21s |  25.96s | 24.18s |   3.2s | 229.92s |
| qwen3.6:35b                             |    1224 | 34395.08s |   28.1s | 26.46s |  7.65s |  85.45s |
| gemma4:12b                              |    1215 | 60486.05s |  49.78s | 46.75s | 10.18s | 132.62s |
| gemma4:31b                              |    1226 | 59551.09s |  48.57s | 46.86s |  15.7s | 123.06s |
| qwen3.5:122b                            |    1225 | 80532.59s |  65.74s | 64.91s | 22.96s | 117.49s |


![](/assets/images/blog/7.svg)

### Validation time

Validation latency. This aggregates `elapsed_second_request` from `validation.md` for each model and shows average, minimum, and maximum request time. Failed validation outputs are not counted.

| model                                   | reports |       sum | average | median |    min |     max |
| --------------------------------------- | ------: | --------: | ------: | -----: | -----: | ------: |
| gpt-oss:120b                            |    1198 | 16500.77s |  13.77s | 13.48s |  1.49s |  44.97s |
| igorls/gemma4-e4b-classifier:q8_0       |    1225 | 22154.78s |  18.09s | 17.85s |  5.35s |   81.2s |
| gemma4:e4b                              |    1226 | 24334.82s |  19.85s | 19.51s |  6.26s |  48.73s |
| mistral-small3.2:24b-instruct-2506-fp16 |    1209 | 26068.47s |  21.56s | 20.36s |  6.84s | 118.61s |
| granite4.1:30b                          |    1150 | 33812.38s |   29.4s | 27.26s |  3.87s | 152.02s |
| deepseek-r1:32b                         |    1036 | 32746.27s |  31.61s | 30.23s | 11.24s | 146.12s |
| gemma4:12b                              |    1208 | 43274.45s |  35.82s | 33.27s | 11.05s |  132.6s |
| qwen3.6:35b                             |    1142 | 41476.32s |  36.32s | 35.92s | 16.89s |  71.03s |
| nemotron-3-super:latest                 |    1087 |  56190.1s |  51.69s | 46.33s | 10.89s | 556.88s |
| qwen3.5:122b                            |    1214 |  69319.0s |   57.1s | 53.86s | 14.52s | 349.36s |
| gemma4:31b                              |    1222 | 68817.68s |  56.32s | 54.56s | 17.56s | 149.87s |
| devstral-2:latest                       |    1038 | 68552.81s |  66.04s |  61.9s | 25.37s | 334.14s |
| mistral-medium-3.5:latest               |    1177 | 99965.29s |  84.93s | 81.46s | 17.28s | 489.91s |

![](/assets/images/blog/8.svg)

## Discussion

The strongest result is the consistent performance of `gemma4:31b`. It combined high precision, high consensus recall, low failure count, and substantially better balanced quality than the other evaluated models.

The experiments also support a multi-model workflow. Initial tagging can prioritize a high-quality model, while faster models can be used for validation, cross-checking, or high-volume pre-filtering. Consensus provides a practical way to reduce dependence on a single model, although it is not equivalent to ground-truth annotation.

The evaluation further shows that output control is a core part of LLM classification. Prompting for a restricted format helps, but exact parsing, identifier validation, timeout handling, and correction logic remain necessary components of the system.

## Limitations

The consensus used in this study is model-derived rather than human-annotated. It can therefore reproduce shared model biases or taxonomy ambiguities. Consensus recall should be understood as agreement with the evaluation procedure, not as absolute classification accuracy.

The reports are also evaluated using collected text samples. Results may change with sample size, language distribution, channel topic, prompt design, model quantization, hardware, and inference configuration.

Finally, aggregate averages hide per-language and per-category differences. Future work should report stratified results, manually reviewed reference subsets, confidence calibration, and the cost of false positives versus false negatives.

## Future work

The experiments nevertheless produced a useful labeled dataset and a solid evaluation baseline. Future evaluations should include newly released open-weight models and rerun the benchmark regularly as model families, context handling, and quantization methods evolve. Future work will also investigate lightweight models and alternative approaches, including RoBERTa-based classifiers and more traditional machine-learning triage methods. These approaches may preserve much of the observed classification quality while reducing inference time and the cost of justification.

DarkGram's [dataset and framework](https://zenodo.org/records/14736880) are public, with source code available on [GitHub](https://github.com/SayakSR/DarkGram). They provide a useful external dataset and baseline for future evaluation of our taxonomy and lightweight classifiers.

## Conclusion

LLMs can support large-scale messaging-channel classification, but useful deployment requires more than selecting a model with a high average score. The system must combine a controlled taxonomy, structured outputs, automated validation, failure handling, and a strategy for managing disagreement.

In this evaluation, `gemma4:31b` provided the best overall balance between tag quality and robustness. Smaller or faster models remained useful for validation and high-throughput processing. The results suggest that an agent-style pipeline based on independent tagging and cross-validation is a viable approach for reducing manual exposure and scaling classification across heterogeneous communication channels.

However, LLM processing time remains the main operational limitation. Average initial-tagging latency ranged from 8.22 to 65.74 seconds per model and channel, while validation ranged from 13.77 to 84.93 seconds. For the best-performing model, `gemma4:31b`, initial tagging required 48.57 seconds on average and validation required another 56.32 seconds. Because the protocol queries multiple models and requests tag justifications, these delays accumulate rapidly across 1,228 channel reports.

The resulting quality is promising, but the current processing time is incompatible with real-time monitoring or frequent large-scale reclassification. A production system will require staged filtering, caching, asynchronous processing, fewer validation calls, or a lightweight first-pass classifier before invoking an LLM.

This initial allow us to publish an open source engine  API managing queuing and access.The code is available on github https://github.com/AIPITCH/topic-classifier

CIRCL operate one instance of (Topic Classifier)[https://hellsehen.circl.lu]. This services is offered on request. Access can be granted by contacting info@circl.lu.

## AIPITCH

AI-Powered Innovative Toolkit for Cybersecurity Hubs (AIPITCH) will provide a comprehensive set of practical, AI-powered tools for operational teams responsible for cyberdefence.

tThe project focuses especially on Security Operations Centres with national responsibility. Its integrated toolkit will also support teams protecting other constituencies—including enterprise SOCs—so they can strengthen key services, turn diverse signals into actionable intelligence and respond more effectively.
