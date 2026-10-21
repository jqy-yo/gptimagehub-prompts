---
pretty_name: GPT Image Hub Attributed Prompt Library
license: cc-by-4.0
language:
  - en
  - zh
  - ja
size_categories:
  - n<1K
task_categories:
  - text-to-image
tags:
  - image-prompts
  - prompt-library
  - gpt-image
  - mcp
configs:
  - config_name: default
    data_files:
      - split: train
        path: data/prompts.jsonl
---

# GPT Image Hub Attributed Prompt Library

286 attributed prompt records with full text, source links and external preview image URLs. The `cover_image_url` and `example_image_urls` fields link to images hosted by GPT Image Hub; image rights are separate from the CC BY 4.0 prompt text license.

See [README.md](README.md) for galleries, attribution and usage. This card is prepared for Hugging Face; no Hugging Face dataset has been published.
