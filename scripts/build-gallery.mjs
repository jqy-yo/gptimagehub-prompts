import { readFile, mkdir, writeFile } from "node:fs/promises";

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
await writeFile(new URL("../README.md", import.meta.url), `# GPT Image Hub\n\n**${rows.length} image prompt templates with previews, complete text, and source attribution.**\n\n带配图的提示词模板库：按分类看图，点击示例打开模板，直接改写和使用。\n\n[**Browse all ${rows.length} previews · 浏览全部配图模板**](gallery/README.md) · [**Open GPT Image Hub · 打开官网**](https://www.gptimagehub.com/) · [**20 generated examples · 新生成示例**](gallery/generated-examples.md)\n\n## Featured examples · 精选示例\n\n${grid(featured)}\n\nThese six examples were newly generated for GPT Image Hub with the built-in image tool. They illustrate composition and style; the tool does not disclose its model identifier. Each image opens the corresponding template.\n\n## Browse by category · 按分类浏览\n\n| Category · 分类 | Templates · 数量 |\n|---|---:|\n${groups.map(group => `| [${group.title}](gallery/${group.slug}.md) | ${group.rows.length} |`).join("\n")}\n\n## Dataset · 数据集\n\n- [JSONL: complete prompt text, metadata and image URLs](data/prompts.jsonl)\n- [Snapshot manifest and SHA-256](manifest.json)\n- [Live dataset methodology](https://www.gptimagehub.com/prompt-dataset-methodology)\n- [API documentation](https://www.gptimagehub.com/api-docs)\n- [Hugging Face dataset card](DATASET_CARD.md) — prepared for a future upload; no Hugging Face dataset is published.\n\nEach record includes a title, full prompt text, category, tags, model hint, canonical page, author, source collection, license, \`cover_image_url\`, and \`example_image_urls\`. All ${rows.length} records have a cover; six also have a newly generated example. The remaining source covers are labeled separately in the galleries. Image URLs point to the public CDN, so cloning the repository does not download image binaries.\n\nThe text snapshot was captured on 2026-10-21. Only attributed CC BY 4.0 records from the two source collections below are included; 303 other public records are excluded. Records are not deduplicated across collections. Model hints describe templates, not a verified output model.\n\n\`\`\`python\nimport json\nfrom pathlib import Path\nprompts = [json.loads(line) for line in Path("data/prompts.jsonl").read_text().splitlines()]\nprint(prompts[0]["prompt_text"])\nprint(prompts[0]["cover_image_url"])\n\`\`\`\n\n## Attribution and license · 署名与许可\n\nPrompt text and source metadata are adapted from:\n\n- [Evolink's awesome-gpt-image-2-prompts](https://github.com/BarryYin/awesome-gpt-image-2-prompts), [CC BY 4.0 license](https://github.com/BarryYin/awesome-gpt-image-2-prompts/blob/main/LICENSE), copyright 2026 Evolink.\n- [YouMind OpenLab's awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2), [CC BY 4.0 license](https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE), copyright 2026 YouMind OpenLab.\n\nOriginal authors and source URLs are retained per record. GPT Image Hub contributes organization, corrections, export metadata and newly generated illustrative previews. Reuse of the prompt text requires attribution and indication of changes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Linked images and third-party names have separate rights and are not relicensed by this dataset. Newly generated previews are not original-author works. No endorsement is implied.\n\n如需更正模板或署名，请提供 slug 和原始来源，通过 [官网联系方式](https://www.gptimagehub.com/about) 联系维护者。\n\n## MCP access\n\nOfficial MCP Registry: [\`io.github.jqy-yo/gptimagehub\`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Search prompts, retrieve full templates and list categories without an API key using Streamable HTTP:\n\n\`\`\`json\n{"mcpServers":{"gptimagehub":{"url":"https://www.gptimagehub.com/mcp"}}}\n\`\`\`\n\nGeneration requires a separate authenticated workflow and credits. Public discovery does not grant generation access.\n\n## Help review translations\n\nNative speakers of Japanese, Korean, German, French, Spanish, and Brazilian Portuguese can review the proposed copy in [translation-review](translation-review). The drafts have received AI review and automated checks; native-speaker sign-off is still pending. See [CONTRIBUTING.md](CONTRIBUTING.md).\n\n## Rebuild galleries\n\nRun \`node scripts/build-gallery.mjs\` after updating the public dataset or generated example index. This only renders Markdown; it does not call an image generation service.\n`);
console.log(`Built ${groups.length} category galleries for ${rows.length} prompts and ${examples.length} generated examples.`);
