import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";

const rows = (await readFile(new URL("../data/prompts.jsonl", import.meta.url), "utf8")).trim().split("\n").map(JSON.parse);
const { examples } = JSON.parse(await readFile(new URL("../data/generated-examples.json", import.meta.url), "utf8"));
const labels = {
  "portrait-photography": "Portrait & Photography · 人像摄影",
  "poster-illustration": "Poster & Illustration · 海报插画",
  "ui-ux-design": "UI / UX Design · 界面设计",
  "logo-branding": "Logo & Branding · 品牌设计",
  "product-ecommerce": "Product & E-commerce · 商品电商",
  "character-design": "Character Design · 角色设计",
  "game-asset": "Game Assets · 游戏素材",
  "social-media": "Social Media · 社交媒体",
  infographic: "Infographics · 信息图",
  cinematic: "Cinematic · 电影感画面",
  "3d-render": "3D Render · 三维渲染",
  "anime-manga": "Anime & Manga · 动漫",
  "concept-art": "Concept Art · 概念艺术",
  other: "Other · 其他",
};
const html = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const url = value => {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") throw new Error(`Unexpected URL: ${value}`);
  return html(parsed.href);
};
const image = (entry, generated) => generated ? entry.image_url : entry.example_image_urls[0] ?? entry.cover_image_url;
function card(entry, generated = false) {
  const preview = image(entry, generated);
  const kind = generated || entry.example_image_urls.length ? "Generated example · 新生成示例" : "Source cover · 原始封面";
  return `<td width="33%" valign="top" align="center"><a href="${url(entry.canonical_url)}"><img src="${url(preview)}" width="260" alt="${html(entry.title)}"></a><br><strong><a href="${url(entry.canonical_url)}">${html(entry.title)}</a></strong><br><sub>${kind}</sub><br><sub>Template: <a href="${url(entry.source_url ?? entry.canonical_url)}">${html(entry.source_author || "GPT Image Hub")}</a></sub><br><a href="${url(entry.canonical_url)}">View / use prompt · 查看模板</a></td>`;
}
function grid(entries, generated = false) {
  const result = ["<table>"];
  for (let i = 0; i < entries.length; i += 3) result.push("<tr>", ...entries.slice(i, i + 3).map(entry => card(entry, generated)), "</tr>");
  return [...result, "</table>"].join("\n");
}
const groups = Object.entries(labels).map(([slug, title]) => ({ slug, title, rows: rows.filter(row => row.category === slug) })).filter(group => group.rows.length);
const categories = groups.map(group => `| [${group.title}](${group.slug}.md) | ${group.rows.length} |`).join("\n");
await mkdir(new URL("../gallery/", import.meta.url), { recursive: true });
for (const group of groups) {
  await writeFile(new URL(`../gallery/${group.slug}.md`, import.meta.url), `# ${group.title}\n\n[All categories · 全部分类](README.md) · [Website · 官网](https://www.gptimagehub.com/)\n\n${group.rows.length} templates with previews. Click an image or title to read and use the complete prompt.\n\n图片来自模板原封面或标注的新生成示例。点击图片可打开对应模板，保留作者与原帖链接。\n\n${grid(group.rows)}\n\nPrompt text: CC BY 4.0 with per-record attribution. Linked images have separate rights; this repository does not relicense them. Generated examples illustrate composition and style, not a verified output model.\n`);
}
await writeFile(new URL("../gallery/README.md", import.meta.url), `# Browse ${rows.length} illustrated prompts · 图文模板目录\n\n[Back to project · 项目首页](../README.md) · [Browse on the website · 官网图库](https://www.gptimagehub.com/) · [20 generated examples · 新生成示例](generated-examples.md)\n\nEvery text record has a preview image and a link to its full template. Images are loaded from the public CDN; original template attribution is preserved.\n\n| Category · 分类 | Templates · 数量 |\n|---|---:|\n${categories}\n`);
await writeFile(new URL("../gallery/generated-examples.md", import.meta.url), `# 20 generated examples · 新生成示例\n\n[Back to project · 项目首页](../README.md) · [${rows.length} illustrated templates · 图文模板目录](README.md)\n\nCreated for GPT Image Hub with the built-in image tool. These examples illustrate composition and style; the tool does not disclose its underlying model identifier. Template authors and original posts are linked under each image.\n\n这 20 张由本站使用内置工具重新生成，覆盖 13 个分类，点击图片可查看对应模板。其中 6 条模板属于本仓库的 ${rows.length} 条许可明确的文本数据；其余仅展示图片和官网链接，未在数据集中追加许可不明的提示词正文。\n\n${grid(examples, true)}\n\nLinked images are external previews with separate rights. They are not original-author images or proof that a particular model produced these results.\n`);
const featuredSlugs = ["agi2-100-luxury-miniature-dubai-city-model", "agi2-35-anime-campers-in-a-winter-tent", "agi2-76-stormy-tropical-city-with-rooftop-plane", "agi2p-27-portrait-photography-musician-leaving-bodega-night-cinematic-portrait", "agi2-112-luxury-amber-perfume-ad", "agi2-26-handwritten-realistic-letter"];
const featured = featuredSlugs.map(slug => rows.find(row => row.slug === slug));
if (featured.some(row => !row)) throw new Error("Featured prompt missing from the dataset");
// The open-source collection (data/open-source, written by the import pipeline's export-repo.mjs) has its own galleries.
const ossDir = new URL("../data/open-source/", import.meta.url);
const ossRows = (await Promise.all((await readdir(ossDir)).filter(name => name.endsWith(".jsonl")).sort()
  .map(async name => (await readFile(new URL(name, ossDir), "utf8")).trim().split("\n").map(JSON.parse)))).flat();
const collectionName = value => new URL(value).pathname.slice(1);
function ossCard(entry) {
  return `<td width="33%" valign="top" align="center"><a href="${url(entry.canonical_url)}"><img src="${url(entry.cover_image_url)}" width="260" alt="${html(entry.title)}"></a><br><strong><a href="${url(entry.canonical_url)}">${html(entry.title)}</a></strong><br><sub>Cover generated by GPT Image Hub · 本站生成封面</sub><br><sub>Based on <a href="${url(entry.source_collection)}">${html(collectionName(entry.source_collection))}</a> (${html(entry.license)})</sub><br><a href="${url(entry.canonical_url)}">View / use prompt · 查看模板</a></td>`;
}
const ossFeaturedSlugs = ["dramatic-japanese-butadon-food-poster", "banana-robot-toy-product-shot", "retro-footage-of-japanese-suburb", "future-software-engineers-in-2050", "wuxia-mmorpg-gameplay-screenshot", "anime-girl-in-spring-tatami-room"];
const ossFeatured = ossFeaturedSlugs.map(slug => ossRows.find(row => row.slug === slug));
if (ossFeatured.some(row => !row)) throw new Error("Featured open-source prompt missing from data/open-source");
const featuredCells = [...ossFeatured.map(ossCard), ...featured.slice(0, 3).map(entry => card(entry))];
const featuredGrid = ["<table>", ...Array.from({ length: Math.ceil(featuredCells.length / 3) }, (_, i) => ["<tr>", ...featuredCells.slice(i * 3, i * 3 + 3), "</tr>"]).flat(), "</table>"].join("\n");
const total = rows.length + ossRows.length;
const n = value => value.toLocaleString("en");
const categoryRows = Object.entries(labels).map(([slug, title]) => {
  const oss = ossRows.filter(row => row.category === slug).length;
  const own = rows.filter(row => row.category === slug).length;
  const links = [oss && `[Open-source · 开源合集](gallery/open-source/${slug}.md)`, own && `[Attributed · 署名快照](gallery/${slug}.md)`].filter(Boolean).join(" · ");
  return { title, count: oss + own, line: `| [${title}](https://www.gptimagehub.com/library/category/${slug}) | ${n(oss + own)} | ${links} |` };
}).filter(row => row.count).sort((a, b) => b.count - a.count);
const ossLicenses = Object.entries(Object.groupBy(ossRows, row => row.source_collection))
  .sort((a, b) => b[1].length - a[1].length)
  .map(([collection, list]) => `- [${collectionName(collection)}](${collection}) · ${list[0].license} · ${n(list.length)} records`).join("\n");

await writeFile(new URL("../README.md", import.meta.url), `# GPT Image Hub Prompts · 图像提示词模板库

**${n(total)} image prompt templates with previews. Complete prompts in English, Japanese and Chinese; titles, descriptions and tags in 18 languages.**

${n(total)} 个带配图的图像提示词模板：完整提示词有英文、日文、中文三个版本，标题、描述和标签覆盖 18 种语言。按分类看图，点开即可复制使用，也可以在官网直接生成。

[**Open GPT Image Hub · 打开官网**](https://www.gptimagehub.com/) · [**Browse by category · 按分类看图**](#browse-by-category--按分类浏览) · [**Data and licenses · 数据与许可**](#data--数据) · [**MCP**](#mcp-access)

## Featured · 精选

${featuredGrid}

Every image opens the template on the website. Open-source collection covers were newly generated by GPT Image Hub from each prompt; the last three are generated examples for the attributed snapshot.

## Browse by category · 按分类浏览

| Category · 分类 | Templates · 数量 | Galleries · 图集 |
|---|---:|---|
${categoryRows.map(row => row.line).join("\n")}

Each gallery shows a sample with previews; every record is in the data files below and on the website.

## Data · 数据

| Dataset · 数据集 | Records · 条数 | License · 许可 | Files · 文件 |
|---|---:|---|---|
| Open-source collection · 开源合集 | ${n(ossRows.length)} | MIT or CC BY 4.0, per record | [data/open-source/](data/open-source/README.md) |
| Attributed snapshot · 署名快照 | ${n(rows.length)} | CC BY 4.0 | [data/prompts.jsonl](data/prompts.jsonl) · [manifest.json](manifest.json) |

**Open-source collection.** Templates based on MIT and CC BY 4.0 GitHub collections, rewritten and reorganized in English with Japanese and Chinese versions, given new titles, descriptions, tags and 18-language translations, and illustrated with newly generated covers. Fields: \`slug\`, \`title\`, \`description\`, \`prompt_text\`, \`prompt_text_ja\`, \`prompt_text_zh\`, \`category\`, \`tags\`, \`model_hint\`, \`aspect_ratio\`, \`canonical_url\`, \`source_collection\`, \`license\`, \`cover_image_url\`, \`translations\`. Files are split by category ([list](data/open-source/README.md)).

**Attributed snapshot.** ${rows.length} CC BY 4.0 records with the original author and post kept per record, captured 2026-10-21. Fields: title, full prompt text, category, tags, model hint, canonical page, author, source URL and collection, license, \`cover_image_url\`, \`example_image_urls\`. Also on [Hugging Face](https://huggingface.co/datasets/jqyyyy/gptimagehub-prompts) ([dataset card](DATASET_CARD.md)).

Image URLs point to the public CDN, so cloning the repository does not download image binaries. Model hints describe templates, not a verified output model.

\`\`\`python
import json
from pathlib import Path

prompts = [json.loads(line) for path in sorted(Path("data/open-source").glob("*.jsonl"))
           for line in path.read_text().splitlines()]
prompts += [json.loads(line) for line in Path("data/prompts.jsonl").read_text().splitlines()]
print(len(prompts), prompts[0]["title"], prompts[0]["cover_image_url"])
\`\`\`

More: [live dataset methodology](https://www.gptimagehub.com/prompt-dataset-methodology) · [API documentation](https://www.gptimagehub.com/api-docs)

## Attribution and license · 署名与许可

Each record keeps the license of its source. Linked images and third-party names have separate rights and are not relicensed. No endorsement is implied.

**Open-source collection** (upstream notices in [LICENSES/](LICENSES/), changes described in [data/open-source/README.md](data/open-source/README.md)):

${ossLicenses}

**Attributed snapshot**, adapted from:

- [Evolink's awesome-gpt-image-2-prompts](https://github.com/BarryYin/awesome-gpt-image-2-prompts), [CC BY 4.0 license](https://github.com/BarryYin/awesome-gpt-image-2-prompts/blob/main/LICENSE), copyright 2026 Evolink.
- [YouMind OpenLab's awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2), [CC BY 4.0 license](https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE), copyright 2026 YouMind OpenLab.

Original authors and source URLs are retained per record. GPT Image Hub contributes organization, corrections, export metadata and newly generated illustrative previews. Reuse of the prompt text requires attribution and indication of changes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Newly generated previews are not original-author works.

如需更正、署名或下架，请提供 slug 和原始来源，[提交 issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) 或通过 [官网联系方式](https://www.gptimagehub.com/about) 联系维护者。

## MCP access

Official MCP Registry: [\`io.github.jqy-yo/gptimagehub\`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Search prompts, retrieve full templates and list categories without an API key using Streamable HTTP:

\`\`\`json
{"mcpServers":{"gptimagehub":{"url":"https://www.gptimagehub.com/mcp"}}}
\`\`\`

Generation requires a separate authenticated workflow and credits. Public discovery does not grant generation access.

## Help review translations

Native speakers of Japanese, Korean, German, French, Spanish, and Brazilian Portuguese can review the proposed copy in [translation-review](translation-review). The drafts have received AI review and automated checks; native-speaker sign-off is still pending. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Rebuild galleries

Run \`node scripts/build-gallery.mjs\` after updating either dataset or the generated example index. It renders the attributed snapshot's galleries and this README from the data files; the open-source galleries come from the import pipeline. It only renders Markdown and does not call an image generation service.
`);
console.log(`Built ${groups.length} category galleries for ${rows.length} prompts and ${examples.length} generated examples.`);
