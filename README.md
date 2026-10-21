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

# GPT Image Hub Prompt Dataset

286 attributed prompt records from [GPT Image Hub](https://www.gptimagehub.com/), captured 2026-10-21. Browse, adapt, and use complete image prompts with preserved source links. This snapshot includes prompt text and metadata; previews remain on the source websites.

- [Browse the library](https://www.gptimagehub.com/)
- [Live dataset and methodology](https://www.gptimagehub.com/prompt-dataset-methodology)
- [Current public dataset manifest](https://www.gptimagehub.com/datasets/prompts-manifest.json)
- [API documentation](https://www.gptimagehub.com/api-docs)

## Contents and selection

Each JSONL line contains a title, complete prompt text, category, tags, model hint, canonical page, author, original source, source collection, and license. The model hint describes the template; it is not a claim that every output has been tested with that model. Languages follow the stored prompt text. The split name `train` is the Hub viewer's loading convention, not a train/test benchmark.

Only records explicitly marked CC BY 4.0 with an author and original source URL are included. 303 other public records are excluded from this redistribution. Records are not deduplicated across source collections. Categories reflect editorial review; metadata has been normalized for this export.

## Attribution and license

Prompt text and source metadata are adapted from:

- [Evolink's awesome-gpt-image-2-prompts](https://github.com/BarryYin/awesome-gpt-image-2-prompts), [CC BY 4.0 license](https://github.com/BarryYin/awesome-gpt-image-2-prompts/blob/main/LICENSE), copyright 2026 Evolink.
- [YouMind OpenLab's awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2), [CC BY 4.0 license](https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE), copyright 2026 YouMind OpenLab.

Original authors and source URLs are retained per record. GPT Image Hub contributes organization, corrections, and export metadata. Reuse requires attribution and an indication of changes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Third-party names and media remain subject to their own rights; this repository does not redistribute image files or claim endorsement by the source authors.

## Load

```python
import json
from pathlib import Path
prompts = [json.loads(line) for line in Path("data/prompts.jsonl").read_text().splitlines()]
print(prompts[0]["prompt_text"])
```

## MCP access

The public remote MCP endpoint is `https://www.gptimagehub.com/mcp` (Streamable HTTP). Search prompts, retrieve a full prompt, and list categories without an API key. Generation requires a separate authenticated workflow and credits; public discovery does not grant generation access.

```json
{"mcpServers":{"gptimagehub":{"url":"https://www.gptimagehub.com/mcp"}}}
```

## 中文说明

这是 GPT Image Hub 的带署名提示词快照，共 286 条。每条保留原作者、原帖、上游合集和许可链接；正文可直接用于检索与改写。仅分发来源已标注 CC BY 4.0 的条目，没有明确许可的其他条目未包含在内。数据不是去重后的评测集，模型字段是模板推荐值。最新分类和内容以官网为准。

如需更正内容或署名，请通过 [官网联系方式](https://www.gptimagehub.com/about) 联系维护者，并提供具体 slug 和来源链接。

## Official MCP Registry

Published as `io.github.jqy-yo/gptimagehub`, version `1.0.0`. [Registry record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.jqy-yo%2Fgptimagehub). The public remote endpoint responds to initialization and tool discovery.

## Help review translations

Native speakers of Japanese, Korean, German, French, Spanish, and Brazilian Portuguese can review the proposed copy in [translation-review](translation-review). These drafts have received AI review and automated checks; native-speaker sign-off is still pending. See [CONTRIBUTING.md](CONTRIBUTING.md) for the review format.
