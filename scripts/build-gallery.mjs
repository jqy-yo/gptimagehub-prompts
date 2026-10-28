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
const ossFeaturedSlugs = ["dramatic-japanese-butadon-food-poster", "banana-robot-toy-product-shot", "retro-footage-of-japanese-suburb", "future-software-engineers-in-2050", "wuxia-mmorpg-gameplay-screenshot", "anime-girl-in-spring-tatami-room"];
const ossFeatured = ossFeaturedSlugs.map(slug => ossRows.find(row => row.slug === slug));
if (ossFeatured.some(row => !row)) throw new Error("Featured open-source prompt missing from data/open-source");
const collectionName = value => new URL(value).pathname.slice(1);
const total = rows.length + ossRows.length;

// One README per language, each with a switcher line at the top; English is README.md so GitHub shows it by default.
const README_LANGUAGES = [
  { code: "en", file: "README.md", name: "English" },
  { code: "zh-CN", file: "README.zh-CN.md", name: "简体中文" },
  { code: "ja", file: "README.ja.md", name: "日本語" },
];
const CATEGORY_NAMES = {
  "portrait-photography": ["Portrait & Photography", "人像摄影", "ポートレート・写真"],
  "poster-illustration": ["Poster & Illustration", "海报插画", "ポスター・イラスト"],
  "ui-ux-design": ["UI / UX Design", "界面设计", "UI / UX デザイン"],
  "logo-branding": ["Logo & Branding", "品牌设计", "ロゴ・ブランディング"],
  "product-ecommerce": ["Product & E-commerce", "商品电商", "商品・EC"],
  "character-design": ["Character Design", "角色设计", "キャラクターデザイン"],
  "game-asset": ["Game Assets", "游戏素材", "ゲーム素材"],
  "social-media": ["Social Media", "社交媒体", "SNS"],
  infographic: ["Infographics", "信息图", "インフォグラフィック"],
  cinematic: ["Cinematic", "电影感画面", "シネマティック"],
  "3d-render": ["3D Render", "三维渲染", "3D レンダー"],
  "anime-manga": ["Anime & Manga", "动漫", "アニメ・マンガ"],
  "concept-art": ["Concept Art", "概念艺术", "コンセプトアート"],
  other: ["Other", "其他", "その他"],
};
const TEXT = {
  en: {
    tagline: n => `**${n} image prompt templates with previews.** Complete prompts in English, Japanese and Chinese; titles, descriptions and tags in 18 languages. Browse by category, copy a template, or generate it on the website.`,
    site: "Open GPT Image Hub", browse: "Browse by category", data: "Data and licenses",
    featured: "Featured", featuredNote: "Every image opens the template on the website. The first six covers were generated by GPT Image Hub from the open-source collection's prompts; the last three are generated examples for the attributed snapshot.",
    ossCover: "Cover generated by GPT Image Hub", basedOn: (c, l) => `Based on ${c} (${l})`, generated: "Generated example", template: "Template", view: "View and use the prompt",
    tableCategory: "Category", tableCount: "Templates", tableGalleries: "Galleries", ossGallery: "Open-source collection", ownGallery: "Attributed snapshot",
    galleryNote: "Each gallery shows a sample with previews; every record is in the data files below and on the website.",
    dataset: "Dataset", records: "Records", license: "License", files: "Files", ossName: "Open-source collection", ownName: "Attributed snapshot", perRecord: "MIT or CC BY 4.0, per record",
    ossAbout: "Templates based on MIT and CC BY 4.0 GitHub collections, rewritten and reorganized in English with Japanese and Chinese versions, given new titles, descriptions, tags and 18-language translations, and illustrated with newly generated covers. Files are split by category",
    ownAbout: n => `${n} CC BY 4.0 records with the original author and post kept per record, captured 2026-10-21. Also on`,
    fields: "Fields", fileList: "file list", cdn: "Image URLs point to the public CDN, so cloning the repository does not download image binaries. Model hints describe templates, not a verified output model.",
    more: "More", methodology: "Live dataset methodology", api: "API documentation",
    attribution: "Attribution and license",
    attributionIntro: "Each record keeps the license of its source. Linked images and third-party names have separate rights and are not relicensed. No endorsement is implied.",
    ossNotices: "upstream notices in [LICENSES/](LICENSES/), changes described in [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "adapted from", recordsWord: "records",
    ownTerms: "Original authors and source URLs are retained per record. GPT Image Hub contributes organization, corrections, export metadata and newly generated illustrative previews. Reuse of the prompt text requires attribution and indication of changes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Newly generated previews are not original-author works.",
    contact: "To correct a template, fix attribution or ask for removal, send the slug and the original source in an [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) or through the [website contact page](https://www.gptimagehub.com/about).",
    mcp: "MCP access",
    mcpIntro: "Official MCP Registry: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Search prompts, retrieve full templates and list categories without an API key using Streamable HTTP:",
    mcpNote: "Generation requires a separate authenticated workflow and credits. Public discovery does not grant generation access.",
    review: "Help review translations",
    reviewText: "Native speakers of Japanese, Korean, German, French, Spanish, and Brazilian Portuguese can review the proposed copy in [translation-review](translation-review). The drafts have received AI review and automated checks; native-speaker sign-off is still pending. See [CONTRIBUTING.md](CONTRIBUTING.md).",
    rebuild: "Rebuild galleries",
    rebuildText: "Run `node scripts/build-gallery.mjs` after updating either dataset or the generated example index. It renders the attributed snapshot's galleries and these READMEs from the data files; the open-source galleries come from the import pipeline. It only renders Markdown and does not call an image generation service.",
  },
  "zh-CN": {
    tagline: n => `**${n} 个带配图的图像提示词模板。** 完整提示词有英文、日文、中文三个版本，标题、描述和标签覆盖 18 种语言。按分类看图，复制模板直接用，也可以在官网一键生成。`,
    site: "打开 GPT Image Hub 官网", browse: "按分类浏览", data: "数据与许可",
    featured: "精选", featuredNote: "点击图片即可在官网打开对应模板。前 6 张封面由 GPT Image Hub 根据开源合集的提示词生成，后 3 张是署名快照的新生成示例。",
    ossCover: "本站生成的封面", basedOn: (c, l) => `来源：${c}（${l}）`, generated: "新生成示例", template: "模板作者", view: "查看并使用模板",
    tableCategory: "分类", tableCount: "模板数", tableGalleries: "图集", ossGallery: "开源合集", ownGallery: "署名快照",
    galleryNote: "每个图集展示一部分带预览图的模板，全部记录都在下方的数据文件和官网中。",
    dataset: "数据集", records: "条数", license: "许可", files: "文件", ossName: "开源合集", ownName: "署名快照", perRecord: "MIT 或 CC BY 4.0（按每条记录）",
    ossAbout: "基于 MIT 和 CC BY 4.0 许可的 GitHub 开源合集：提示词用英文重新编写整理，并配有日文和中文版本；标题、描述、标签为本站重写，翻译成 18 种语言；每条都重新生成了封面。文件按分类拆分",
    ownAbout: n => `${n} 条 CC BY 4.0 记录，每条保留原作者和原帖链接，快照日期 2026-10-21。同时发布在`,
    fields: "字段", fileList: "文件列表", cdn: "图片链接指向公开 CDN，克隆仓库不会下载图片文件。模型提示只说明模板面向的模型，不代表已验证的出图模型。",
    more: "更多", methodology: "数据集说明", api: "API 文档",
    attribution: "署名与许可",
    attributionIntro: "每条记录沿用其来源的许可。链接的图片和第三方名称另有权利，不在本仓库的许可范围内，也不代表任何背书。",
    ossNotices: "上游许可与版权声明见 [LICENSES/](LICENSES/)，修改说明见 [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "改编自", recordsWord: "条",
    ownTerms: "每条记录保留原作者和来源链接。GPT Image Hub 负责整理、更正、导出元数据并新生成示例图。再次使用提示词文本时，需要按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 署名并注明修改。新生成的示例图不是原作者作品。",
    contact: "如需更正模板、署名或下架，请附上 slug 和原始来源，[提交 issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) 或通过 [官网联系方式](https://www.gptimagehub.com/about) 联系维护者。",
    mcp: "MCP 接入",
    mcpIntro: "已收录于官方 MCP Registry：[`io.github.jqy-yo/gptimagehub`，v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)。无需 API key，通过 Streamable HTTP 即可搜索提示词、获取完整模板和分类列表：",
    mcpNote: "生成图片需要单独登录授权并消耗积分；公开检索不包含生成权限。",
    review: "参与翻译审校",
    reviewText: "欢迎日语、韩语、德语、法语、西班牙语和巴西葡萄牙语母语者审校 [translation-review](translation-review) 中的译文。这些译稿已经过 AI 审校和自动检查，还缺母语者确认。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。",
    rebuild: "重新生成图集",
    rebuildText: "更新任一数据集或生成示例索引后，运行 `node scripts/build-gallery.mjs`。它会根据数据文件生成署名快照的图集和这几份 README；开源合集的图集由导入流程生成。脚本只生成 Markdown，不会调用生图服务。",
  },
  ja: {
    tagline: n => `**プレビュー付きの画像プロンプトテンプレート ${n} 件。** 完全なプロンプトは英語・日本語・中国語の 3 言語、タイトル・説明・タグは 18 言語に対応。カテゴリから探してテンプレートをコピーするか、サイト上でそのまま生成できます。`,
    site: "GPT Image Hub を開く", browse: "カテゴリ別に見る", data: "データとライセンス",
    featured: "ピックアップ", featuredNote: "画像をクリックするとサイト上のテンプレートが開きます。最初の 6 枚はオープンソースコレクションのプロンプトから GPT Image Hub が生成したカバー、残りの 3 枚は帰属付きスナップショット用に新しく生成した作例です。",
    ossCover: "GPT Image Hub で生成したカバー", basedOn: (c, l) => `出典：${c}（${l}）`, generated: "新規生成の作例", template: "テンプレート作者", view: "プロンプトを見て使う",
    tableCategory: "カテゴリ", tableCount: "テンプレート数", tableGalleries: "ギャラリー", ossGallery: "オープンソースコレクション", ownGallery: "帰属付きスナップショット",
    galleryNote: "各ギャラリーではプレビュー付きの一部を紹介しています。すべてのレコードは下記のデータファイルとサイトにあります。",
    dataset: "データセット", records: "件数", license: "ライセンス", files: "ファイル", ossName: "オープンソースコレクション", ownName: "帰属付きスナップショット", perRecord: "MIT または CC BY 4.0（レコードごと）",
    ossAbout: "MIT / CC BY 4.0 ライセンスの GitHub コレクションをもとにしたテンプレート。プロンプトは英語で書き直して整理し、日本語版と中国語版を付けています。タイトル・説明・タグは新たに作成して 18 言語に翻訳し、カバー画像はすべて新しく生成しました。ファイルはカテゴリごとに分かれています",
    ownAbout: n => `原作者と元の投稿をレコードごとに残した CC BY 4.0 のレコード ${n} 件（2026-10-21 時点）。こちらでも公開しています：`,
    fields: "フィールド", fileList: "ファイル一覧", cdn: "画像 URL は公開 CDN を指しているため、リポジトリをクローンしても画像ファイルはダウンロードされません。モデルのヒントはテンプレートの想定モデルであり、出力を検証したモデルではありません。",
    more: "その他", methodology: "データセットの方法論", api: "API ドキュメント",
    attribution: "クレジットとライセンス",
    attributionIntro: "各レコードは出典のライセンスを引き継ぎます。リンク先の画像や第三者の名称には別の権利があり、このデータセットで再ライセンスされることはありません。推奨・提携を意味するものではありません。",
    ossNotices: "上流のライセンス表示は [LICENSES/](LICENSES/)、変更点は [data/open-source/README.md](data/open-source/README.md) を参照",
    ownAdapted: "以下をもとに作成", recordsWord: "件",
    ownTerms: "原作者と出典 URL はレコードごとに残しています。GPT Image Hub は整理、修正、エクスポート用メタデータ、新規生成の作例を加えています。プロンプト本文を再利用する場合は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) に従ってクレジットと変更点を明記してください。新規生成の作例は原作者の作品ではありません。",
    contact: "テンプレートの修正、クレジットの訂正、削除のご依頼は、slug と元の出典を添えて [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) または [サイトのお問い合わせ](https://www.gptimagehub.com/about) からご連絡ください。",
    mcp: "MCP での利用",
    mcpIntro: "公式 MCP Registry に登録済み：[`io.github.jqy-yo/gptimagehub`、v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)。API キー不要で、Streamable HTTP からプロンプト検索、テンプレート全文の取得、カテゴリ一覧の取得ができます：",
    mcpNote: "画像の生成には別途認証とクレジットが必要です。公開の検索機能に生成の権限は含まれません。",
    review: "翻訳レビューのお願い",
    reviewText: "日本語・韓国語・ドイツ語・フランス語・スペイン語・ブラジルポルトガル語のネイティブの方に、[translation-review](translation-review) の訳文のレビューをお願いしています。AI によるレビューと自動チェックは済んでいますが、ネイティブの確認がまだです。詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。",
    rebuild: "ギャラリーの再生成",
    rebuildText: "どちらかのデータセットや作例インデックスを更新したら `node scripts/build-gallery.mjs` を実行してください。データファイルから帰属付きスナップショットのギャラリーとこれらの README を生成します。オープンソースコレクションのギャラリーはインポート処理で作られます。Markdown を出力するだけで、画像生成サービスは呼び出しません。",
  },
};
// GitHub's heading anchors: lower case, punctuation dropped, spaces to hyphens.
const anchor = text => text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
const n = value => value.toLocaleString("en");

function readme({ code, file }, index) {
  const t = TEXT[code];
  // Open-source records carry translated titles; the attributed snapshot is English only.
  const title = (entry, oss) => (oss && entry.translations?.[code]?.title) || entry.title;
  const cell = (entry, oss) => `<td width="33%" valign="top" align="center"><a href="${url(entry.canonical_url)}"><img src="${url(oss ? entry.cover_image_url : image(entry, false))}" width="260" alt="${html(title(entry, oss))}"></a><br><strong><a href="${url(entry.canonical_url)}">${html(title(entry, oss))}</a></strong><br><sub>${oss
    ? `${t.ossCover}</sub><br><sub>${t.basedOn(`<a href="${url(entry.source_collection)}">${html(collectionName(entry.source_collection))}</a>`, html(entry.license))}`
    : `${t.generated}</sub><br><sub>${t.template}: <a href="${url(entry.source_url ?? entry.canonical_url)}">${html(entry.source_author || "GPT Image Hub")}</a>`}</sub><br><a href="${url(entry.canonical_url)}">${t.view}</a></td>`;
  const cells = [...ossFeatured.map(entry => cell(entry, true)), ...featured.slice(0, 3).map(entry => cell(entry, false))];
  const featuredGrid = ["<table>", ...Array.from({ length: Math.ceil(cells.length / 3) }, (_, i) => ["<tr>", ...cells.slice(i * 3, i * 3 + 3), "</tr>"]).flat(), "</table>"].join("\n");
  const categories = Object.entries(CATEGORY_NAMES).map(([slug, names]) => {
    const oss = ossRows.filter(row => row.category === slug).length;
    const own = rows.filter(row => row.category === slug).length;
    const links = [oss && `[${t.ossGallery}](gallery/open-source/${slug}.md)`, own && `[${t.ownGallery}](gallery/${slug}.md)`].filter(Boolean).join(" · ");
    return { count: oss + own, line: `| [${names[index]}](https://www.gptimagehub.com/${code === "en" ? "" : `${code}/`}library/category/${slug}) | ${n(oss + own)} | ${links} |` };
  }).filter(row => row.count).sort((a, b) => b.count - a.count);
  const ossLicenses = Object.entries(Object.groupBy(ossRows, row => row.source_collection)).sort((a, b) => b[1].length - a[1].length)
    .map(([collection, list]) => `- [${collectionName(collection)}](${collection}) · ${list[0].license} · ${n(list.length)} ${t.recordsWord}`).join("\n");
  const switcher = README_LANGUAGES.map(other => other.code === code ? `**${other.name}**` : `[${other.name}](${other.file})`).join(" | ");
  return `${switcher}

# GPT Image Hub Prompts

${t.tagline(n(total))}

[**${t.site}**](https://www.gptimagehub.com/${code === "en" ? "" : code}) · [**${t.browse}**](#${anchor(t.browse)}) · [**${t.data}**](#${anchor(t.data)}) · [**MCP**](#${anchor(t.mcp)})

## ${t.featured}

${featuredGrid}

${t.featuredNote}

## ${t.browse}

| ${t.tableCategory} | ${t.tableCount} | ${t.tableGalleries} |
|---|---:|---|
${categories.map(row => row.line).join("\n")}

${t.galleryNote}

## ${t.data}

| ${t.dataset} | ${t.records} | ${t.license} | ${t.files} |
|---|---:|---|---|
| ${t.ossName} | ${n(ossRows.length)} | ${t.perRecord} | [data/open-source/](data/open-source/README.md) |
| ${t.ownName} | ${n(rows.length)} | CC BY 4.0 | [data/prompts.jsonl](data/prompts.jsonl) · [manifest.json](manifest.json) |

**${t.ossName}.** ${t.ossAbout} ([${t.fileList}](data/open-source/README.md)). ${t.fields}: \`slug\`, \`title\`, \`description\`, \`prompt_text\`, \`prompt_text_ja\`, \`prompt_text_zh\`, \`category\`, \`tags\`, \`model_hint\`, \`aspect_ratio\`, \`canonical_url\`, \`source_collection\`, \`license\`, \`cover_image_url\`, \`translations\`.

**${t.ownName}.** ${t.ownAbout(rows.length)} [Hugging Face](https://huggingface.co/datasets/jqyyyy/gptimagehub-prompts) ([dataset card](DATASET_CARD.md)). ${t.fields}: \`slug\`, \`title\`, \`description\`, \`prompt_text\`, \`category\`, \`tags\`, \`model_hint\`, \`canonical_url\`, \`source_author\`, \`source_url\`, \`source_collection\`, \`license\`, \`cover_image_url\`, \`example_image_urls\`.

${t.cdn}

\`\`\`python
import json
from pathlib import Path

prompts = [json.loads(line) for path in sorted(Path("data/open-source").glob("*.jsonl"))
           for line in path.read_text().splitlines()]
prompts += [json.loads(line) for line in Path("data/prompts.jsonl").read_text().splitlines()]
print(len(prompts), prompts[0]["title"], prompts[0]["cover_image_url"])
\`\`\`

${t.more}: [${t.methodology}](https://www.gptimagehub.com/prompt-dataset-methodology) · [${t.api}](https://www.gptimagehub.com/api-docs)

## ${t.attribution}

${t.attributionIntro}

**${t.ossName}** (${t.ossNotices}):

${ossLicenses}

**${t.ownName}**, ${t.ownAdapted}:

- [Evolink's awesome-gpt-image-2-prompts](https://github.com/BarryYin/awesome-gpt-image-2-prompts), [CC BY 4.0](https://github.com/BarryYin/awesome-gpt-image-2-prompts/blob/main/LICENSE), copyright 2026 Evolink.
- [YouMind OpenLab's awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2), [CC BY 4.0](https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE), copyright 2026 YouMind OpenLab.

${t.ownTerms}

${t.contact}

## ${t.mcp}

${t.mcpIntro}

\`\`\`json
{"mcpServers":{"gptimagehub":{"url":"https://www.gptimagehub.com/mcp"}}}
\`\`\`

${t.mcpNote}

## ${t.review}

${t.reviewText}

## ${t.rebuild}

${t.rebuildText}
`;
}
for (const [index, language] of README_LANGUAGES.entries()) await writeFile(new URL(`../${language.file}`, import.meta.url), readme(language, index));
console.log(`Built ${groups.length} category galleries for ${rows.length} prompts, ${examples.length} generated examples and READMEs in ${README_LANGUAGES.length} languages.`);
